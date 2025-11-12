import os
from pricing_model import SmartPricingModel, generate_synthetic_training_data

def main():
    print("Initializing pricing model...")
    
    # Generate synthetic training data
    print("Generating synthetic training data...")
    training_data = generate_synthetic_training_data(1000)
    
    # Create and train model
    print("Training model...")
    model = SmartPricingModel()
    result = model.train(training_data)
    
    print(f"Training completed: {result}")
    
    # Save model
    model_path = os.path.join(os.path.dirname(__file__), 'pricing_model.pkl')
    model.save_model(model_path)
    
    print(f"Model saved to: {model_path}")
    print("✅ Model initialization complete!")

if __name__ == "__main__":
    main()