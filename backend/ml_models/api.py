from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
import joblib, os
from datetime import datetime, timedelta
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from xgboost import XGBRegressor
from sklearn.multioutput import MultiOutputRegressor # <-- Required for Direct model

app = Flask(__name__)

# --- We now have two models to save ---
MODEL_PATH_RECURSIVE = "recursive_sprinter_model.pkl"
MODEL_PATH_DIRECT = "direct_marathoner_model.pkl"
FORECAST_HORIZON = 30 # Define our 30-day target


# ---------- 1. FEATURE ENGINEERING (Unchanged from v4/v5) ----------
def create_features(df):
    """
    Create time-series features and the 'deviation' target.
    """
    df = df.copy()
    df["month"] = df["date"].dt.month
    df["day_of_week"] = df["date"].dt.dayofweek
    df["day_of_year"] = df["date"].dt.dayofyear
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
    df["sin_dayofyear"] = np.sin(2 * np.pi * df["day_of_year"] / 365)
    df["cos_dayofyear"] = np.cos(2 * np.pi * df["day_of_year"] / 365)
    df["time_index"] = np.arange(len(df))

    seasonal_avg_map = df.groupby("day_of_week")["quantity_sold"].mean()
    df["seasonal_avg"] = df["day_of_week"].map(seasonal_avg_map)
    
    df["quantity_sold_deviation"] = df["quantity_sold"] - df["seasonal_avg"]

    for lag in [1, 3, 7, 14]:
        df[f"lag_{lag}"] = df["quantity_sold"].shift(lag)

    for window in [3, 7, 14, 30]:
        df[f"rolling_mean_{window}"] = df["quantity_sold"].shift(1).rolling(window=window).mean()
        df[f"rolling_std_{window}"] = df["quantity_sold"].shift(1).rolling(window=window).std()

    df["ewm_mean_7"] = df["quantity_sold"].shift(1).ewm(span=7).mean()

    df = df.dropna().reset_index(drop=True)
    return df


# ---------- 2. MODEL A: RECURSIVE "SPRINTER" (v4) ----------
def train_recursive_model(df):
    """
    (v4 Logic) Trains a single model to predict Day+1's deviation.
    """
    print("--- Training Model A (Recursive Sprinter) ---")
    features = [
        col for col in df.columns if col not in [
            "date", "quantity_sold", "seasonal_avg", "quantity_sold_deviation"
        ]
    ]
    X = df[features]
    y = df["quantity_sold_deviation"] # Target is a single value

    # Using RandomizedSearch to find a good simple model
    param_dist = {
        "n_estimators": [300, 500, 800],
        "max_depth": [4, 6, 8],
        "learning_rate": [0.01, 0.05, 0.1]
    }
    model = XGBRegressor(objective="reg:squarederror", random_state=42, n_jobs=-1)
    search = RandomizedSearchCV(
        model, param_distributions=param_dist, n_iter=10, cv=3,
        scoring="neg_mean_absolute_error", n_jobs=-1, random_state=42,
    )
    search.fit(X, y)
    return search.best_estimator_

def forecast_recursive(df, model, days_to_forecast):
    """
    (v4 Logic) Predicts 30 days ahead using a recursive loop.
    """
    print("--- Running Model A (Recursive Sprinter) ---")
    historical_df_processed = create_features(df.copy())
    seasonal_anchors = historical_df_processed.groupby("day_of_week")["seasonal_avg"].first().to_dict()
    global_mean_anchor = historical_df_processed["seasonal_avg"].mean() 
    
    forecast_df = df.copy() # Use raw history to append to
    
    features = [
        col for col in historical_df_processed.columns if col not in [
            "date", "quantity_sold", "seasonal_avg", "quantity_sold_deviation"
        ]
    ]
    
    last_date = forecast_df["date"].max()
    predictions = []
    temp_df_mean = historical_df_processed[features].mean() # For filling NaNs

    for i in range(1, days_to_forecast + 1):
        next_date = last_date + timedelta(days=i)
        temp_df = pd.DataFrame({"date": [next_date]})
        next_day_of_week = next_date.dayofweek
        
        # Create features for the next day
        temp_df["month"] = next_date.month
        temp_df["day_of_week"] = next_day_of_week
        temp_df["day_of_year"] = next_date.timetuple().tm_yday
        temp_df["is_weekend"] = int(next_day_of_week >= 5)
        temp_df["sin_dayofyear"] = np.sin(2 * np.pi * temp_df["day_of_year"] / 365)
        temp_df["cos_dayofyear"] = np.cos(2 * np.pi * temp_df["day_of_year"] / 365)
        temp_df["time_index"] = len(forecast_df) + i
        for lag in [1, 3, 7, 14]:
            temp_df[f"lag_{lag}"] = forecast_df["quantity_sold"].iloc[-lag]
        for window in [3, 7, 14, 30]:
            temp_df[f"rolling_mean_{window}"] = forecast_df["quantity_sold"].iloc[-window:].mean()
            temp_df[f"rolling_std_{window}"] = forecast_df["quantity_sold"].iloc[-window:].std()
        temp_df["ewm_mean_7"] = forecast_df["quantity_sold"].ewm(span=7).mean().iloc[-1]
        temp_df = temp_df.fillna(temp_df_mean) 

        # Predict the deviation
        ml_pred_deviation = model.predict(temp_df[features])[0]

        # Re-compose the prediction
        seasonal_anchor_value = seasonal_anchors.get(next_day_of_week, global_mean_anchor)
        final_pred = max(0, seasonal_anchor_value + ml_pred_deviation) 

        predictions.append({
            "date": next_date.strftime("%Y-%m-%d"),
            "predicted_quantity": round(float(final_pred), 2)
        })
        
        # Append the new prediction for the *next* loop
        new_row = {"date": next_date, "quantity_sold": final_pred}
        forecast_df = pd.concat([forecast_df, pd.DataFrame([new_row])], ignore_index=True)

    return predictions


# ---------- 3. MODEL B: DIRECT "MARATHONER" (v5) ----------
def train_direct_model(df, forecast_horizon):
    """
    (v5 Logic) Trains a MultiOutput model to predict all 30 days at once.
    """
    print(f"--- Training Model B (Direct Marathoner) for {forecast_horizon} days ---")
    features = [
        col for col in df.columns if col not in [
            "date", "quantity_sold", "seasonal_avg", "quantity_sold_deviation"
        ]
    ]
    target = "quantity_sold_deviation"
    
    X_list, y_list = [], []
    
    # Sliding window to create 30-day targets
    for i in range(len(df) - forecast_horizon):
        X_list.append(df[features].iloc[i])
        y_list.append(df[target].iloc[i+1 : i+1+forecast_horizon].values)
    
    X = pd.DataFrame(X_list)
    y = np.array(y_list)
    
    print(f"Direct training data shape: X={X.shape}, y={y.shape}")

    # A strong base model
    base_model = XGBRegressor(
        objective="reg:squarederror", 
        random_state=42, n_estimators=500, learning_rate=0.05,
        max_depth=6, subsample=0.8, colsample_bytree=0.8, n_jobs=-1
    )
    
    # The wrapper that trains 30 models
    wrapper = MultiOutputRegressor(base_model, n_jobs=-1)
    
    print("Fitting MultiOutput Regressor... (This may take a minute)")
    wrapper.fit(X, y) 
    return wrapper

def forecast_direct(df_raw, model, days_to_forecast):
    """
    (v5 Logic) Predicts all 30 days in a single shot. No loop.
    """
    print("--- Running Model B (Direct Marathoner) ---")
    historical_df_processed = create_features(df_raw.copy())
    
    seasonal_anchors = historical_df_processed.groupby("day_of_week")["seasonal_avg"].first().to_dict()
    global_mean_anchor = historical_df_processed["seasonal_avg"].mean() 
    
    features = [
        col for col in historical_df_processed.columns if col not in [
            "date", "quantity_sold", "seasonal_avg", "quantity_sold_deviation"
        ]
    ]
    # Get features from the *last* day of history
    X_last = historical_df_processed[features].iloc[[-1]] 
    
    # Predict all 30 deviations at once
    predicted_deviations = model.predict(X_last)[0]

    predictions = []
    last_date = df_raw["date"].max()
    
    for i in range(days_to_forecast):
        next_date = last_date + timedelta(days=i+1)
        next_day_of_week = next_date.dayofweek
        
        seasonal_anchor_value = seasonal_anchors.get(next_day_of_week, global_mean_anchor)
        deviation = predicted_deviations[i]
        
        final_pred = max(0, seasonal_anchor_value + deviation) 

        predictions.append({
            "date": next_date.strftime("%Y-%m-%d"),
            "predicted_quantity": round(float(final_pred), 2)
        })

    return predictions


# ---------- 4. MODEL C: THE "ENSEMBLE-X" BLENDER (v6) ----------
def ensemble_forecasts(forecast_A, forecast_B):
    """
    (v6 Logic) Blends the two forecasts with a time-based fade.
    """
    print("--- Blending forecasts into Ensemble-X ---")
    final_ensembled_forecast = []
    days_to_forecast = len(forecast_A)

    for i in range(days_to_forecast):
        
        # Calculate the "fade"
        # At day 0 (i=0), trust_A = 1.0 (100%)
        # At day 29 (i=29), trust_A = ~0.0 (0%)
        trust_A = 1.0 - (i / (days_to_forecast - 1)) # Trust Sprinter less over time
        trust_B = 1.0 - trust_A # Trust Marathoner more over time

        pred_A = forecast_A[i]["predicted_quantity"]
        pred_B = forecast_B[i]["predicted_quantity"]

        # The final blended prediction
        final_pred = (pred_A * trust_A) + (pred_B * trust_B)

        final_ensembled_forecast.append({
            "date": forecast_A[i]["date"], # Dates are the same
            "predicted_quantity": round(float(final_pred), 2)
        })
    
    return final_ensembled_forecast


# ---------- 5. API ROUTES (MODIFIED) ----------
@app.route("/train", methods=["POST"])
def train():
    try:
        data = request.get_json()
        historical_data = data.get("historical_data", [])
        if not historical_data:
            return jsonify({"success": False, "message": "No historical data provided."}), 400

        df = pd.DataFrame(historical_data)
        df["date"] = pd.to_datetime(df["date"])
        df = df.sort_values("date")
        
        df_processed = create_features(df)
        
        if len(df_processed) < (FORECAST_HORIZON * 2):
             return jsonify({"success": False, "message": f"Not enough data. Need ~{FORECAST_HORIZON * 2} days, found {len(df_processed)}."}), 400

        # --- Train and save Model A (Recursive) ---
        model_recursive = train_recursive_model(df_processed)
        joblib.dump(model_recursive, MODEL_PATH_RECURSIVE)
        print(f"Model A saved to {MODEL_PATH_RECURSIVE}")

        # --- Train and save Model B (Direct) ---
        model_direct = train_direct_model(df_processed, forecast_horizon=FORECAST_HORIZON)
        joblib.dump(model_direct, MODEL_PATH_DIRECT)
        print(f"Model B saved to {MODEL_PATH_DIRECT}")
        
        return jsonify({"success": True, "message": "Ensemble-X (v6) models (Recursive + Direct) trained successfully."})
    
    except Exception as e:
        print("Error in training:", e)
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/predict/demand", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        historical_data = data.get("historical_data", [])
        days_to_forecast = data.get("days_to_forecast", FORECAST_HORIZON)

        if not historical_data:
            return jsonify({"success": False, "message": "No historical data provided."}), 400

        # --- Check if BOTH models are trained ---
        if not os.path.exists(MODEL_PATH_RECURSIVE) or not os.path.exists(MODEL_PATH_DIRECT):
             return jsonify({"success": False, "message": "Models not trained. Please call /train first."}), 400
        
        # --- Load both models ---
        model_A = joblib.load(MODEL_PATH_RECURSIVE)
        model_B = joblib.load(MODEL_PATH_DIRECT)
            
        df_raw = pd.DataFrame(historical_data)
        df_raw["date"] = pd.to_datetime(df_raw["date"])
        
        # --- Generate BOTH forecasts ---
        forecast_A = forecast_recursive(df_raw, model_A, days_to_forecast)
        forecast_B = forecast_direct(df_raw, model_B, days_to_forecast)
        
        # --- Blend them with the v6 logic ---
        final_forecast = ensemble_forecasts(forecast_A, forecast_B)

        return jsonify({
            "success": True,
            "algorithm": "Ensemble-X (v6: Recursive + Direct Blend)",
            "forecast": final_forecast
        })
    except Exception as e:
        print("Error during prediction:", e)
        return jsonify({"success": False, "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5001)