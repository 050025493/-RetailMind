#!/usr/bin/env python3
# backend/ml_models/train_model.py

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
        data = json.loads(input_data)
        
        if 'training_data' not in data or not data['training_data']:
            raise ValueError("No training data provided")
        
        training_data = data['training_data']
        
        # Validate and clean training data
        cleaned_data = []
        for item in training_data:
            try:
                # Ensure all required fields exist and are not None
                if all(key in item and item[key] is not None for key in [
                    'current_price', 'cost_price', 'demand_forecast', 'optimal_price'
                ]):
                    # Convert to proper types
                    cleaned_item = {
                        'current_price': float(item['current_price']),
                        'cost_price': float(item['cost_price']),
                        'demand_forecast': float(item['demand_forecast']),
                        'optimal_price': float(item['optimal_price']),
                        'stock_level': int(item.get('stock_level', 100)),
                        'days_in_stock': int(item.get('days_in_stock', 30)),
                        'seasonality_index': float(item.get('seasonality_index', 1.0)),
                        'category_avg_price': float(item.get('category_avg_price', item['current_price'])),
                        'competitor_prices': [
                            float(p) for p in item.get('competitor_prices', [])
                            if p is not None
                        ] or [item['current_price']],
                        'historical_sales': [
                            float(s) for s in item.get('historical_sales', [])
                            if s is not None
                        ] or [100],
                        'revenue_generated': float(item.get('revenue_generated', 
                                                           item['optimal_price'] * item['demand_forecast']))
                    }
                    cleaned_data.append(cleaned_item)
            except (ValueError, KeyError, TypeError) as e:
                # Skip invalid items
                continue
        
        if len(cleaned_data) < 10:
            raise ValueError(f"Insufficient valid training samples. Need at least 10, got {len(cleaned_data)}")
        
        # Train model
        model = SmartPricingModel()
        result = model.train(cleaned_data)
        
        # Save model
        model_path = os.path.join(os.path.dirname(__file__), 'pricing_model.pkl')
        model.save_model(model_path)
        
        # Return success response
        response = {
            'status': 'success',
            'message': f'Model trained with {len(cleaned_data)} samples',
            'samples_processed': len(cleaned_data),
            'samples_skipped': len(training_data) - len(cleaned_data),
            'feature_importances': result.get('feature_importances', {})
        }
        
        print(json.dumps(response))
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