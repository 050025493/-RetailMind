from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
import joblib, os
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from datetime import datetime, timedelta

app = Flask(__name__)

MODEL_PATH = "demand_forecast_model.pkl"


# ---------- FEATURE ENGINEERING ----------
def create_features(df):
    df["month"] = df["date"].dt.month
    df["day_of_week"] = df["date"].dt.dayofweek
    df["day_of_year"] = df["date"].dt.dayofyear
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
    
    # Create multiple lag features and rolling mean
    for lag in [1, 3, 7, 14]:
        df[f"lag_{lag}"] = df["quantity_sold"].shift(lag)
    
    # Rolling average for past week
    df["rolling_mean_7"] = df["quantity_sold"].shift(1).rolling(window=7).mean()
    df = df.dropna().reset_index(drop=True)
    return df


# ---------- MODEL TRAINING ----------
def train_model(historical_data):
    df = pd.DataFrame(historical_data)
    if df.empty:
        raise ValueError("Empty historical data")

    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date")
    df = create_features(df)

    features = [col for col in df.columns if col not in ["date", "quantity_sold"]]
    X, y = df[features], df["quantity_sold"]

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, shuffle=False)

    # Hyperparameter tuning (light random search)
    param_dist = {
        "n_estimators": [100, 200, 300],
        "max_depth": [5, 10, 20, None],
        "min_samples_split": [2, 5, 10],
        "min_samples_leaf": [1, 2, 4],
        "bootstrap": [True, False],
    }

    model = RandomForestRegressor(random_state=42)
    search = RandomizedSearchCV(
        model,
        param_distributions=param_dist,
        n_iter=10,
        cv=3,
        scoring="neg_mean_absolute_error",
        n_jobs=-1,
        random_state=42,
    )
    search.fit(X_train, y_train)
    best_model = search.best_estimator_

    # Save model
    joblib.dump(best_model, MODEL_PATH)
    print("✅ Model trained and saved successfully.")
    return best_model


# ---------- FORECASTING ----------
def forecast_future(df, model, days_to_forecast=30):
    df = df.sort_values("date")
    df = create_features(df)
    features = [col for col in df.columns if col not in ["date", "quantity_sold"]]

    last_date = df["date"].max()
    predictions = []

    for i in range(1, days_to_forecast + 1):
        next_date = last_date + timedelta(days=i)
        temp_df = pd.DataFrame({"date": [next_date]})
        temp_df["month"] = next_date.month
        temp_df["day_of_week"] = next_date.dayofweek
        temp_df["day_of_year"] = next_date.timetuple().tm_yday
        temp_df["is_weekend"] = int(next_date.dayofweek >= 5)

        # Create lag features using previous data + predictions
        for lag in [1, 3, 7, 14]:
            if lag <= len(df):
                temp_df[f"lag_{lag}"] = df["quantity_sold"].iloc[-lag]
            else:
                temp_df[f"lag_{lag}"] = df["quantity_sold"].mean()

        temp_df["rolling_mean_7"] = df["quantity_sold"].iloc[-7:].mean()

        X_future = temp_df[features]
        pred = model.predict(X_future)[0]

        predictions.append({"date": next_date.strftime("%Y-%m-%d"), "predicted_quantity": round(pred, 2)})

        # Append prediction to df for next iteration’s lag
        new_row = {"date": next_date, "quantity_sold": pred}
        df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)

    return predictions


# ---------- API ROUTES ----------
@app.route("/train", methods=["POST"])
def train():
    try:
        data = request.get_json()
        historical_data = data.get("historical_data", [])
        if not historical_data:
            return jsonify({"success": False, "message": "No historical data provided."}), 400

        train_model(historical_data)
        return jsonify({"success": True, "message": "Model trained and saved successfully."})
    except Exception as e:
        print("Error in training:", e)
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/predict/demand", methods=["POST"])
def predict_demand():
    try:
        data = request.get_json()
        historical_data = data.get("historical_data", [])
        days_to_forecast = data.get("days_to_forecast", 30)

        if not historical_data:
            return jsonify({"success": False, "message": "No historical data provided."}), 400

        # Load existing model or train new one if missing
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
        else:
            model = train_model(historical_data)

        df = pd.DataFrame(historical_data)
        df["date"] = pd.to_datetime(df["date"])
        forecast = forecast_future(df, model, days_to_forecast)

        return jsonify({"success": True, "forecast": forecast})
    except Exception as e:
        print("Error during prediction:", e)
        return jsonify({"success": False, "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5001)
