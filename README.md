RetailMind - AI-Powered Dynamic Pricing Platform
RetailMind is an intelligent pricing and inventory management platform that leverages machine learning, sentiment analysis, and competitive intelligence to help retailers optimize their pricing strategies in real-time.
🚀 Features
Core Capabilities

🤖 AI-Powered Smart Pricing: ML-driven price optimization using Random Forest and Bayesian Optimization
📊 Demand Forecasting: 30-day ahead predictions using ensemble ML models (Recursive + Direct forecasting)
👁️ Competitor Watch: Real-time competitor price tracking with AI-generated insights (Gemini 2.5)
🎯 Promo Impact Simulator: Sentiment-driven promotional campaign analysis with HuggingFace NLP
📈 What-If Scenarios: Business scenario modeling with AI analysis
⚙️ Auto-Pricing Rules: Automated price adjustments based on market conditions
🎤 Voice Query Interface: Natural language pricing queries powered by Gemini AI
📱 Multi-language Support: English and Hindi (हिंदी) interface

Technical Highlights

Advanced ML Pipeline: XGBoost regression models with feature engineering
Sentiment Analysis: HuggingFace Transformers for customer review analysis
Competitive Intelligence: Gemini AI for market analysis and pricing recommendations
Real-time Analytics: Live dashboard with revenue trends and category insights
Responsive Design: Modern UI with dark mode support




🛠️ Technology Stack
Backend

Node.js + Express.js - REST API server
PostgreSQL - Primary database
Sequelize - ORM for database management
Python Flask - ML model serving
scikit-learn + XGBoost - Machine learning
Gemini 2.5 Pro/Flash - AI analysis and insights
HuggingFace Transformers - Sentiment analysis

Frontend

React 18 + TypeScript - UI framework
Vite - Build tool
TailwindCSS - Styling
shadcn/ui - Component library
Recharts - Data visualization
Wouter - Routing
TanStack Query - Data fetching

ML/AI Services

Random Forest Regressor - Price optimization
Bayesian Optimization (scikit-optimize) - Hyperparameter tuning
Multi-Output Regression - 30-day demand forecasting
Gemini API - Competitive analysis, scenario planning
HuggingFace API - Customer sentiment analysis


📦 Installation
Prerequisites

Node.js 18+ and npm
Python 3.8+
PostgreSQL 12+
API keys for:

Google Gemini API
HuggingFace API (optional, has fallback)



1. Clone Repository
bashgit clone https://github.com/yourusername/retailmind.git
cd retailmind
2. Backend Setup
Install Node Dependencies
bashcd backend
npm install
Install Python Dependencies
bashcd ml_models
pip install flask pandas numpy scikit-learn xgboost scikit-optimize joblib
cd ..
Configure Environment
Create backend/.env:
env# Database
DATABASE_URL=postgresql://username:password@localhost:5432/retailmind

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here

# AI APIs
GEMINI_API_KEY=your_gemini_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key

# Server
PORT=4000
NODE_ENV=development
Initialize Database
bash# Start PostgreSQL service
# Then run migrations
npm run migrate
3. Frontend Setup
bashcd frontend
npm install
4. Start Services
Terminal 1: Python ML Server
bashcd backend/ml_models
python api.py
# Runs on http://localhost:5001
Terminal 2: Node.js Backend
bashcd backend
npm run dev
# Runs on http://localhost:4000
Terminal 3: React Frontend
bashcd frontend
npm run dev
# Runs on http://localhost:5173
```

---

**## 🎯 Quick Start Guide

### 1. Create an Account
- Navigate to http://localhost:5173/signup
- Register with your email and password

### 2. Seed Demo Data
- Go to **Dashboard**
- Click **"Import Demo Data"** (if available) or add products manually
- Demo data includes 5 products with 180 days of sales history

### 3. Generate Demand Forecast
- Navigate to **Demand Forecast** page
- Select a product
- Click **"Generate Forecast"**
- Wait for AI to analyze 30-day demand prediction

### 4. Get Smart Pricing Recommendations
- Go to **Smart Pricing** page
- ML model automatically analyzes:
  - Historical demand patterns
  - Competitor prices
  - Stock levels
  - Seasonality factors
- Review suggestions and apply price changes

### 5. Monitor Competitors
- Navigate to **Competitor Watch**
- Click **"Refresh"** to get AI-generated competitor prices
- View detailed analysis with market insights

### 6. Simulate Promotions
- Go to **Promo Simulator**
- Select product and discount parameters
- Run simulation to see:
  - Sentiment impact analysis
  - Revenue predictions
  - ROI calculations
- Export detailed PDF reports

---

## 📊 Core Features Deep Dive

### 1. Demand Forecasting

**Algorithm**: Ensemble-X (v6) - Combines two ML models:
- **Recursive Sprinter**: Iterative 1-day predictions (accurate for short-term)
- **Direct Marathoner**: Multi-output 30-day predictions (stable for long-term)
- **Blending Strategy**: Time-based fade (100% Sprinter → 100% Marathoner)

**Features Used**:
- Lag features (1, 3, 7, 14 days)
- Rolling statistics (mean, std)
- Exponential weighted moving average
- Seasonality (day of week, day of year)
- Trend index

**API Endpoint**: `POST /api/forecast/:productId`

### 2. Smart Pricing

**Algorithm**: Random Forest + Bayesian Optimization

**Input Features**:
- Current price & cost price
- Demand forecast
- Competitor pricing statistics
- Stock level & days in stock
- Price elasticity
- Category average price
- Seasonality index

**Optimization Objective**: Maximize revenue while considering:
- Minimum margin constraints (15%)
- Competitor positioning
- Demand elasticity effects

**API Endpoint**: `GET /api/pricing/suggestions`

### 3. Competitor Intelligence

**AI Engine**: Google Gemini 2.5 Flash

**Capabilities**:
- Generates realistic competitor prices based on product category
- Market trend analysis
- Pricing position assessment (overpriced/competitive/underpriced)
- Strategic recommendations with risk analysis

**Cooldown**: 30 minutes between refreshes per product

**API Endpoint**: `POST /api/competitors/:productId/refresh`

### 4. Promo Impact Simulator

**Sentiment Analysis**: HuggingFace `cardiffnlp/twitter-roberta-base-sentiment-latest`

**Calculation Model**:******
```
Demand Lift = Base Discount Impact × Sentiment Multiplier × Trend Multiplier
Revenue = Predicted Units × Discounted Price
ROI = (New Profit - Normal Profit) / Normal Profit × 100
Sentiment Impact:

Positive: 1.3x multiplier
Neutral: 1.0x multiplier
Negative: 0.7x multiplier

API Endpoint: POST /api/promo/simulate
5. What-If Scenarios
AI Engine: Google Gemini 2.5 Pro
Analysis Includes:

Executive summary
Key assumptions validation
Step-by-step reasoning
Sensitivity analysis
Risk assessment
Strategic recommendations

API Endpoint: POST /api/scenarios
6. Auto-Pricing Rules
Rule Engine: Condition-Action based system
Supported Conditions:

Demand increase/decrease (%)
Stock level thresholds
Competitor price differential

Supported Actions:

Increase/decrease price by % or fixed amount
Set specific price
Set target margin

Real-time Demand Tracking: Uses last 14 days of sales data
API Endpoint: POST /api/pricing-rules/apply

🔌 API Documentation
Authentication
All API requests (except /auth/*) require JWT token:
bashAuthorization: Bearer <your_jwt_token>
Key Endpoints
Products

GET /api/products - List all products
GET /api/products/:id - Get product details
POST /api/products - Create product
GET /api/products/:id/history - Get sales history

Forecasting

POST /api/forecast/:productId - Generate 30-day forecast
GET /api/forecast/:productId - Retrieve saved forecast

Pricing

GET /api/pricing/suggestions - Get ML pricing recommendations
POST /api/pricing/product/:productId/apply - Apply suggested price
POST /api/pricing/retrain - Retrain ML model with new data

Competitors

GET /api/competitors - Get all competitor status
POST /api/competitors/:productId/refresh - Refresh competitor prices
GET /api/competitors/:productId/analysis - Get AI analysis

Promo

POST /api/promo/simulate - Run promo simulation
GET /api/promo/sentiment/:productId - Get sentiment data
POST /api/promo/demo-reviews/:productId - Generate demo reviews
GET /api/promo/export-pdf/:simulationId - Export report

Scenarios

GET /api/scenarios - List all scenarios
POST /api/scenarios - Create new scenario
DELETE /api/scenarios/:id - Delete scenario


🧪 Testing
Manual Testing

Seed demo data: Use /api/import/seed-demo endpoint
Generate forecast: Select product and run forecast
Check pricing suggestions: Navigate to Smart Pricing
Test competitor refresh: Refresh prices (respects 30min cooldown)
Run promo simulation: Test with different discount levels

Sample cURL Requests
Login:
bashcurl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
Get Pricing Suggestions:
bashcurl http://localhost:4000/api/pricing/suggestions \
  -H "Authorization: Bearer YOUR_TOKEN"

📈 Performance Optimization
ML Model Caching

Trained models saved as .pkl files
Loaded once at startup, reused for predictions
Retrain only when new data available

Database Indexing
sql-- Key indexes for performance
CREATE INDEX idx_demand_data_product_date ON demand_data(product_id, date);
CREATE INDEX idx_products_user ON products(user_id, status);
CREATE INDEX idx_competitor_prices_product ON competitor_prices(product_id);
API Rate Limiting

Competitor refresh: 30-minute cooldown per product
Voice queries: No hard limit (Gemini handles rate limits)
Demand forecasting: Requires min 30 days of data


🔒 Security Features

JWT Authentication: 7-day token expiration
Password Hashing: bcrypt with salt rounds
SQL Injection Prevention: Sequelize ORM parameterized queries
XSS Protection: React auto-escapes user input
CORS Configuration: Restricted to frontend origin
Environment Variables: Sensitive keys in .env


🚀 Deployment
Production Checklist

Environment Variables

env   NODE_ENV=production
   DATABASE_URL=your_production_db_url
   JWT_SECRET=strong_random_secret
   GEMINI_API_KEY=production_key
   HUGGINGFACE_API_KEY=production_key

Database Setup

bash   # Run migrations
   npm run migrate
   # Create indexes
   psql -d retailmind -f db/indexes.sql

Build Frontend

bash   cd frontend
   npm run build
   # Serves from backend/public

Start Services

bash   # Use PM2 for process management
   pm2 start backend/src/server.js --name retailmind-api
   pm2 start backend/ml_models/api.py --name retailmind-ml --interpreter python3

Reverse Proxy (Nginx)

nginx   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:4000;
       }
       
       location /ml {
           proxy_pass http://localhost:5001;
       }
   }

🐛 Troubleshooting
Common Issues
Issue: "Models not trained" error

Solution: Run /api/forecast/:productId with POST to train demand model
For pricing: System auto-trains on first request with synthetic data

Issue: "Not enough data" for forecast

Solution: Need minimum 30 days of sales history
Use demo data seeder for testing

Issue: Gemini API 503 errors

Solution: Implements automatic retry with backoff (3 attempts)
Falls back to rule-based analysis if API fails

Issue: HuggingFace sentiment analysis fails

Solution: System falls back to keyword-based sentiment
Check HUGGINGFACE_API_KEY in .env

Issue: Competitor prices not updating

Solution: Check 30-minute cooldown period
Review last_competitor_refresh timestamp


📚 Learn More
ML Model Details

Demand Forecasting Documentation
Pricing Model Architecture

API Reference

Full API Documentation
Authentication Flow

Contributing

Contribution Guidelines
Code Style Guide


🤝 Contributing
We welcome contributions! Please see RetailMind.md for details.
Development Workflow

Fork the repository
Create feature branch (git checkout -b feature/AmazingFeature)
Commit changes (git commit -m 'Add AmazingFeature')
Push to branch (git push origin feature/AmazingFeature)
Open Pull Request




👥 Team
RetailMind - AI-Powered Pricing Intelligence Platform

Built with ❤️ using React, Node.js, Python, and cutting-edge AI


🔮 Roadmap
Q1 2025

 Multi-store support
 Advanced A/B testing for pricing
 Integration with Shopify/WooCommerce
 Mobile app (React Native)

Q2 2025

 Real-time competitor scraping
 Advanced inventory optimization
 Predictive maintenance for stock
 WhatsApp/SMS price alerts

Q3 2025

 Multi-currency support
 Regional pricing zones
 Custom ML model training UI
 API marketplace for integrations





⭐ Acknowledgments

Gemini API by Google - AI analysis and insights
HuggingFace - Sentiment analysis models
scikit-learn & XGBoost - ML foundations
shadcn/ui - Beautiful UI components
Recharts - Data visualization
