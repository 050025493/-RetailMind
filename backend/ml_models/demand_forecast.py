import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import joblib
import json
from datetime import datetime, timedelta

class DemandForecastModel:
    def __init__(self):
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.label_encoders = {}
        self.is_trained = False
        
    def generate_historical_data(self, product_data):
        """Generate synthetic historical sales data for training"""
        historical_data = []
        
        for product in product_data:
            base_price = float(product['currentPrice'])
            base_demand = int(product['stockQuantity']) * 0.6  # Assume 60% turnover
            
            # Generate 90 days of historical data
            for days_ago in range(90, 0, -1):
                date = datetime.now() - timedelta(days=days_ago)
                
                # Add seasonality and trends
                day_of_week = date.weekday()
                week_of_month = (date.day - 1) // 7 + 1
                
                # Weekend boost
                weekend_factor = 1.3 if day_of_week >= 5 else 1.0
                
                # Month-end boost
                month_end_factor = 1.2 if date.day > 25 else 1.0
                
                # Price sensitivity
                price_variance = np.random.uniform(0.9, 1.1)
                current_price = base_price * price_variance
                price_factor = 1.0 - (price_variance - 1.0) * 0.5
                
                # Calculate demand
                demand = int(base_demand * weekend_factor * month_end_factor * price_factor * np.random.uniform(0.8, 1.2))
                
                historical_data.append({
                    'product_id': product['id'],
                    'product_name': product['name'],
                    'category': product['category'] or 'General',
                    'date': date.strftime('%Y-%m-%d'),
                    'day_of_week': day_of_week,
                    'week_of_month': week_of_month,
                    'month': date.month,
                    'price': current_price,
                    'base_price': base_price,
                    'stock_level': product['stockQuantity'],
                    'demand': demand
                })
        
        return pd.DataFrame(historical_data)
    
    def prepare_features(self, df):
        """Prepare features for the model"""
        # Encode categorical variables
        if 'category' in df.columns:
            if 'category' not in self.label_encoders:
                self.label_encoders['category'] = LabelEncoder()
                df['category_encoded'] = self.label_encoders['category'].fit_transform(df['category'])
            else:
                df['category_encoded'] = self.label_encoders['category'].transform(df['category'])
        
        # Select features
        feature_columns = [
            'day_of_week', 'week_of_month', 'month',
            'price', 'base_price', 'stock_level', 'category_encoded'
        ]
        
        X = df[feature_columns]
        y = df['demand'] if 'demand' in df.columns else None
        
        return X, y
    
    def train(self, product_data):
        """Train the model on historical data"""
        # Generate historical data
        historical_df = self.generate_historical_data(product_data)
        
        # Prepare features
        X, y = self.prepare_features(historical_df)
        
        # Train model
        self.model.fit(X, y)
        self.is_trained = True
        
        return {
            'status': 'success',
            'samples_trained': len(X),
            'features': X.columns.tolist()
        }
    
    def predict(self, product_data, days_ahead=30):
        """Predict demand for the next N days"""
        if not self.is_trained:
            raise Exception("Model not trained yet")
        
        predictions = []
        
        for product in product_data:
            product_predictions = []
            
            for day in range(1, days_ahead + 1):
                future_date = datetime.now() + timedelta(days=day)
                
                # Create feature vector
                features = pd.DataFrame([{
                    'day_of_week': future_date.weekday(),
                    'week_of_month': (future_date.day - 1) // 7 + 1,
                    'month': future_date.month,
                    'price': float(product['currentPrice']),
                    'base_price': float(product['currentPrice']),
                    'stock_level': int(product['stockQuantity']),
                    'category_encoded': self.label_encoders['category'].transform(
                        [product['category'] or 'General']
                    )[0]
                }])
                
                # Predict
                predicted_demand = int(self.model.predict(features)[0])
                
                # Add confidence intervals (±20%)
                confidence = 0.85
                lower_bound = int(predicted_demand * 0.8)
                upper_bound = int(predicted_demand * 1.2)
                
                product_predictions.append({
                    'date': future_date.strftime('%Y-%m-%d'),
                    'predicted_demand': max(0, predicted_demand),
                    'lower_bound': max(0, lower_bound),
                    'upper_bound': upper_bound,
                    'confidence': confidence
                })
            
            predictions.append({
                'product_id': product['id'],
                'product_name': product['name'],
                'category': product['category'] or 'General',
                'current_price': float(product['currentPrice']),
                'predictions': product_predictions
            })
        
        return predictions
    
    def save_model(self, filepath='demand_model.pkl'):
        """Save trained model"""
        joblib.dump({
            'model': self.model,
            'label_encoders': self.label_encoders,
            'is_trained': self.is_trained
        }, filepath)
    
    def load_model(self, filepath='demand_model.pkl'):
        """Load trained model"""
        data = joblib.load(filepath)
        self.model = data['model']
        self.label_encoders = data['label_encoders']
        self.is_trained = data['is_trained']

# Global model instance
forecast_model = DemandForecastModel()