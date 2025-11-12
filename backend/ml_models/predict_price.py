#!/usr/bin/env python3
# backend/ml_models/predict_price.py

import sys
import json
import os
from pricing_model import SmartPricingModel

def main():
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        
        if not input_data:
            raise ValueError("No input data received")
        
        # Parse JSON input
        product_data = json.loads(input_data)
        
        # Validate required fields and set defaults for None values
        required_fields = ['current_price', 'cost_price', 'demand_forecast']
        for field in required_fields:
            if field not in product_data or product_data[field] is None:
                raise ValueError(f"Missing required field: {field}")
            # Ensure numeric values
            product_data[field] = float(product_data[field])
        
        # Set defaults for optional fields
        if 'competitor_prices' not in product_data or not product_data['competitor_prices']:
            product_data['competitor_prices'] = [product_data['current_price']]
        else:
            # Filter out None values and convert to float
            product_data['competitor_prices'] = [
                float(p) for p in product_data['competitor_prices'] 
                if p is not None
            ]
        
        if 'stock_level' not in product_data or product_data['stock_level'] is None:
            product_data['stock_level'] = 100
        else:
            product_data['stock_level'] = int(product_data['stock_level'])
        
        if 'days_in_stock' not in product_data or product_data['days_in_stock'] is None:
            product_data['days_in_stock'] = 30
        else:
            product_data['days_in_stock'] = int(product_data['days_in_stock'])
        
        if 'seasonality_index' not in product_data or product_data['seasonality_index'] is None:
            product_data['seasonality_index'] = 1.0
        else:
            product_data['seasonality_index'] = float(product_data['seasonality_index'])
        
        if 'category_avg_price' not in product_data or product_data['category_avg_price'] is None:
            product_data['category_avg_price'] = product_data['current_price']
        else:
            product_data['category_avg_price'] = float(product_data['category_avg_price'])
        
        if 'historical_sales' not in product_data or not product_data['historical_sales']:
            product_data['historical_sales'] = [100]
        else:
            product_data['historical_sales'] = [
                float(s) for s in product_data['historical_sales'] 
                if s is not None
            ]
        
        # Load or create model
        model = SmartPricingModel()
        model_path = os.path.join(os.path.dirname(__file__), 'pricing_model.pkl')
        
        if os.path.exists(model_path):
            model.load_model(model_path)
        else:
            # If model doesn't exist, generate training data and train
            from pricing_model import generate_synthetic_training_data
            training_data = generate_synthetic_training_data(1000)
            model.train(training_data)
            model.save_model(model_path)
        
        # Make prediction
        prediction = model.predict_price(product_data, use_bayesian=True)
        
        # Output result as JSON
        print(json.dumps(prediction))
        sys.exit(0)
        
    except json.JSONDecodeError as e:
        error_response = {
            "error": f"Invalid JSON input: {str(e)}",
            "type": "JSONDecodeError"
        }
        print(json.dumps(error_response), file=sys.stderr)
        sys.exit(1)
        
    except ValueError as e:
        error_response = {
            "error": str(e),
            "type": "ValueError"
        }
        print(json.dumps(error_response), file=sys.stderr)
        sys.exit(1)
        
    except Exception as e:
        error_response = {
            "error": str(e),
            "type": type(e).__name__
        }
        print(json.dumps(error_response), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()