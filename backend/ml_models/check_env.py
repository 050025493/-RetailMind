print("Checking environment...")

import flask
import flask_cors
import numpy
import pandas
import sklearn
import joblib
import scipy

print("✅ All required libraries imported successfully!")
print(f"Flask: {flask.__version__}")
print(f"Numpy: {numpy.__version__}")
print(f"Pandas: {pandas.__version__}")
print(f"Scikit-learn: {sklearn.__version__}")
print(f"Scipy: {scipy.__version__}")
print(f"Joblib: {joblib.__version__}")
print("Environment check complete.")