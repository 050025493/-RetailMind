# backend/ml_services/pricing_model.py
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from skopt import gp_minimize
from skopt.space import Real
from skopt.utils import use_named_args
import joblib
import json
from datetime import datetime

class SmartPricingModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = [
            'current_price',
            'cost_price',
            'demand_forecast',
            'competitor_avg_price',
            'competitor_min_price',
            'competitor_max_price',
            'stock_level',
            'days_in_stock',
            'seasonality_index',
            'category_avg_price',
            'price_elasticity'
        ]
        
    def prepare_features(self, product_data):
        """
        Prepare feature vector from product data
        
        Expected product_data format:
        {
            'current_price': float,
            'cost_price': float,
            'demand_forecast': float,  # from your demand forecasting
            'competitor_prices': [float, float, ...],
            'stock_level': int,
            'days_in_stock': int,
            'seasonality_index': float,  # 0.5 to 1.5
            'category': str,
            'historical_sales': [float, float, ...]  # last 30 days
        }
        """
        
        # Calculate competitor statistics
        comp_prices = product_data.get('competitor_prices', [product_data['current_price']])
        competitor_avg = np.mean(comp_prices) if comp_prices else product_data['current_price']
        competitor_min = np.min(comp_prices) if comp_prices else product_data['current_price']
        competitor_max = np.max(comp_prices) if comp_prices else product_data['current_price']
        
        # Calculate price elasticity from historical data
        historical_sales = product_data.get('historical_sales', [100])
        price_elasticity = self._calculate_elasticity(historical_sales)
        
        # Get category average (you'll need to maintain this in your database)
        category_avg = product_data.get('category_avg_price', product_data['current_price'])
        
        features = {
            'current_price': product_data['current_price'],
            'cost_price': product_data['cost_price'],
            'demand_forecast': product_data['demand_forecast'],
            'competitor_avg_price': competitor_avg,
            'competitor_min_price': competitor_min,
            'competitor_max_price': competitor_max,
            'stock_level': product_data.get('stock_level', 100),
            'days_in_stock': product_data.get('days_in_stock', 30),
            'seasonality_index': product_data.get('seasonality_index', 1.0),
            'category_avg_price': category_avg,
            'price_elasticity': price_elasticity
        }
        
        return pd.DataFrame([features])[self.feature_names]
    
    def _calculate_elasticity(self, historical_sales):
        """Calculate price elasticity of demand from historical sales"""
        if len(historical_sales) < 2:
            return 1.0
        
        # Simple elasticity: % change in quantity / % change in price
        # Higher elasticity = more price sensitive
        sales_volatility = np.std(historical_sales) / (np.mean(historical_sales) + 1)
        return min(2.0, max(0.5, sales_volatility))
    
    def train(self, training_data):
        """
        Train the Random Forest model
        
        training_data: List of dicts with product data + 'optimal_price' and 'revenue_generated'
        """
        # Prepare features and targets
        X = []
        y = []
        
        for data in training_data:
            features = self.prepare_features(data)
            X.append(features.values[0])
            y.append(data['optimal_price'])
        
        X = np.array(X)
        y = np.array(y)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train Random Forest
        self.model = RandomForestRegressor(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        
        self.model.fit(X_scaled, y)
        
        # Calculate feature importances
        importances = dict(zip(self.feature_names, self.model.feature_importances_))
        
        return {
            'status': 'success',
            'n_samples': len(training_data),
            'feature_importances': importances
        }
    
    def predict_price(self, product_data, use_bayesian=True):
        """
        Predict optimal price for a product
        
        Returns:
        {
            'suggested_price': float,
            'price_range': {'min': float, 'max': float},
            'confidence': float (0-100),
            'reasoning': dict,
            'impact': dict
        }
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first or load a trained model.")
        
        # Prepare features
        features = self.prepare_features(product_data)
        X_scaled = self.scaler.transform(features.values)
        
        # Get base prediction from Random Forest
        base_prediction = self.model.predict(X_scaled)[0]
        
        # Get prediction interval from tree predictions
        tree_predictions = np.array([tree.predict(X_scaled)[0] for tree in self.model.estimators_])
        std_prediction = np.std(tree_predictions)
        
        # Apply constraints
        min_price = product_data['cost_price'] * 1.15  # Minimum 15% margin
        max_price = product_data['current_price'] * 1.5  # Max 50% increase
        
        if use_bayesian:
            # Use Bayesian Optimization to fine-tune
            optimal_price = self._bayesian_optimize(
                product_data,
                base_prediction,
                min_price,
                max_price
            )
        else:
            optimal_price = np.clip(base_prediction, min_price, max_price)
        
        # Calculate confidence based on prediction variance
        confidence = self._calculate_confidence(std_prediction, product_data)
        
        # Calculate price range (confidence interval)
        price_range = {
            'min': max(min_price, optimal_price - std_prediction),
            'max': min(max_price, optimal_price + std_prediction)
        }
        
        # Generate reasoning
        reasoning = self._generate_reasoning(product_data, optimal_price, features)
        
        # Calculate expected impact
        impact = self._calculate_impact(product_data, optimal_price)
        
        return {
            'suggested_price': round(optimal_price, 2),
            'price_range': {
                'min': round(price_range['min'], 2),
                'max': round(price_range['max'], 2)
            },
            'confidence': round(confidence, 1),
            'reasoning': reasoning,
            'impact': impact,
            'change_percentage': round(((optimal_price - product_data['current_price']) / product_data['current_price']) * 100, 2)
        }
    
    def _bayesian_optimize(self, product_data, initial_price, min_price, max_price):
        """Use Bayesian Optimization to fine-tune the price"""
        
        # Define the search space
        space = [Real(min_price, max_price, name='price')]
        
        # Define objective function (negative because we minimize)
        @use_named_args(space)
        def objective(price):
            # Estimate revenue = price × demand
            # Demand decreases with price increase (elasticity effect)
            elasticity = product_data.get('price_elasticity', 1.0)
            price_ratio = price / product_data['current_price']
            
            # Demand adjustment based on elasticity
            demand_multiplier = (2 - price_ratio) ** elasticity
            estimated_demand = product_data['demand_forecast'] * demand_multiplier
            
            # Revenue = price × demand
            revenue = price * estimated_demand
            
            # Penalty for being far from competitor prices
            comp_prices = product_data.get('competitor_prices', [product_data['current_price']])
            comp_avg = np.mean(comp_prices)
            competitor_penalty = abs(price - comp_avg) * 0.1
            
            return -(revenue - competitor_penalty)  # Negative because we minimize
        
        # Run optimization
        result = gp_minimize(
            objective,
            space,
            n_calls=20,
            random_state=42,
            noise=0.01
        )
        
        return result.x[0]
    
    def _calculate_confidence(self, std_prediction, product_data):
        """Calculate confidence score based on prediction variance and data quality"""
        
        # Lower variance = higher confidence
        variance_score = max(0, 100 - (std_prediction / product_data['current_price']) * 100)
        
        # More competitor data = higher confidence
        comp_count = len(product_data.get('competitor_prices', []))
        data_quality_score = min(100, comp_count * 20)
        
        # Historical data availability
        historical_score = min(100, len(product_data.get('historical_sales', [])) * 3)
        
        # Weighted average
        confidence = (variance_score * 0.5 + data_quality_score * 0.3 + historical_score * 0.2)
        
        return confidence
    
    def _generate_reasoning(self, product_data, suggested_price, features):
        """Generate human-readable reasoning for the price suggestion"""
        
        current = product_data['current_price']
        change_pct = ((suggested_price - current) / current) * 100
        
        reasons = []
        
        # Price vs competitors
        comp_avg = features['competitor_avg_price'].values[0]
        if suggested_price < comp_avg * 0.95:
            reasons.append("Competitive pricing advantage")
        elif suggested_price > comp_avg * 1.05:
            reasons.append("Premium positioning")
        else:
            reasons.append("Market-aligned pricing")
        
        # Demand consideration
        demand = product_data['demand_forecast']
        if demand > 100:
            reasons.append("High demand detected")
        elif demand < 50:
            reasons.append("Demand stimulation needed")
        
        # Stock level
        stock = product_data.get('stock_level', 100)
        if stock > 200:
            reasons.append("Clear excess inventory")
        elif stock < 50:
            reasons.append("Low stock - maximize margin")
        
        return {
            'primary': reasons[0] if reasons else "Optimal price point",
            'factors': reasons,
            'direction': "increase" if change_pct > 0 else "decrease" if change_pct < 0 else "maintain"
        }
    
    def _calculate_impact(self, product_data, suggested_price):
        """Calculate expected impact of price change"""
        
        current = product_data['current_price']
        demand = product_data['demand_forecast']
        elasticity = product_data.get('price_elasticity', 1.0)
        
        # Current revenue
        current_revenue = current * demand
        
        # Estimated new demand based on elasticity
        price_ratio = suggested_price / current
        demand_multiplier = (2 - price_ratio) ** elasticity
        new_demand = demand * demand_multiplier
        
        # New revenue
        new_revenue = suggested_price * new_demand
        
        # Profit calculation
        cost = product_data['cost_price']
        current_profit = (current - cost) * demand
        new_profit = (suggested_price - cost) * new_demand
        
        return {
            'revenue_change': round(new_revenue - current_revenue, 2),
            'revenue_change_pct': round(((new_revenue - current_revenue) / current_revenue) * 100, 2),
            'profit_change': round(new_profit - current_profit, 2),
            'estimated_units': round(new_demand, 0),
            'margin': round(((suggested_price - cost) / suggested_price) * 100, 2)
        }
    
    def save_model(self, filepath='pricing_model.pkl'):
        """Save trained model and scaler"""
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names
        }, filepath)
        return {'status': 'success', 'filepath': filepath}
    
    def load_model(self, filepath='pricing_model.pkl'):
        """Load trained model and scaler"""
        data = joblib.load(filepath)
        self.model = data['model']
        self.scaler = data['scaler']
        self.feature_names = data['feature_names']
        return {'status': 'success', 'filepath': filepath}


# Example usage and training data generation
def generate_synthetic_training_data(n_samples=1000):
    """Generate synthetic training data for initial model training"""
    np.random.seed(42)
    
    training_data = []
    
    for _ in range(n_samples):
        cost = np.random.uniform(100, 5000)
        base_price = cost * np.random.uniform(1.3, 2.5)
        
        # Simulate optimal price based on various factors
        demand = np.random.uniform(50, 500)
        comp_prices = base_price * np.random.uniform(0.8, 1.2, size=3)
        stock = np.random.randint(10, 500)
        
        # Optimal price logic
        if demand > 300 and stock < 100:
            optimal = base_price * 1.15  # High demand, low stock = increase
        elif demand < 100 and stock > 300:
            optimal = base_price * 0.85  # Low demand, high stock = decrease
        elif np.mean(comp_prices) < base_price * 0.9:
            optimal = np.mean(comp_prices) * 1.05  # Match competition
        else:
            optimal = base_price * np.random.uniform(0.95, 1.1)
        
        training_data.append({
            'current_price': base_price,
            'cost_price': cost,
            'demand_forecast': demand,
            'competitor_prices': comp_prices.tolist(),
            'stock_level': stock,
            'days_in_stock': np.random.randint(1, 90),
            'seasonality_index': np.random.uniform(0.8, 1.2),
            'category_avg_price': base_price * np.random.uniform(0.9, 1.1),
            'historical_sales': np.random.uniform(50, 200, size=30).tolist(),
            'optimal_price': optimal,
            'revenue_generated': optimal * demand
        })
    
    return training_data


if __name__ == "__main__":
    # Example: Train and test the model
    print("Generating synthetic training data...")
    training_data = generate_synthetic_training_data(1000)
    
    print("Training model...")
    model = SmartPricingModel()
    result = model.train(training_data)
    print(f"Training completed: {result}")
    
    # Save model
    model.save_model('pricing_model.pkl')
    print("Model saved!")
    
    # Test prediction
    print("\nTesting prediction...")
    test_product = {
        'current_price': 7469,
        'cost_price': 5000,
        'demand_forecast': 150,
        'competitor_prices': [6999, 7299, 7599],
        'stock_level': 200,
        'days_in_stock': 45,
        'seasonality_index': 1.1,
        'category_avg_price': 7200,
        'historical_sales': [140, 145, 138, 152, 149] * 6
    }
    
    prediction = model.predict_price(test_product, use_bayesian=True)
    print(json.dumps(prediction, indent=2))