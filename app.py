import os
import joblib
import pandas as pd
import warnings
from flask import Flask, render_template, request, jsonify

# Suppress sklearn warnings
warnings.filterwarnings('ignore', category=UserWarning)

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'breast_cancer_model_pipeline_clean.pkl')

pipeline_model = None
load_error_message = None

try:
    if os.path.exists(MODEL_PATH):
        loaded_artifact = joblib.load(MODEL_PATH)
        if isinstance(loaded_artifact, dict):
            pipeline_model = loaded_artifact.get('model') or loaded_artifact.get('pipeline')
        else:
            pipeline_model = loaded_artifact
        print(f"\n[DEBUG] Model loaded successfully from: {MODEL_PATH}\n")
    else:
        load_error_message = f"File not found at {MODEL_PATH}. Directory contains: {os.listdir(BASE_DIR)}"
        print(f"[ERROR] {load_error_message}")
except Exception as e:
    load_error_message = f"Unpickling exception: {str(e)}"
    print(f"[ERROR] {load_error_message}")
    pipeline_model = None


def parse_bool(val):
    if isinstance(val, bool):
        return val
    return str(val).strip().lower() in ['true', '1', 'yes']


def parse_blood_pressure(val):
    s_val = str(val).strip().lower()
    if s_val in ['normal', 'low', 'optimum']:
        return 120.0
    elif s_val in ['high', 'hypertension', 'elevated']:
        return 140.0
    try:
        return float(val)
    except (ValueError, TypeError):
        return 120.0


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/predict', methods=['POST'])
def run_model_inference():
    if pipeline_model is None or (callable(pipeline_model) and not hasattr(pipeline_model, 'predict')):
        return jsonify({
            'status': 'error', 
            'message': f'Model failed to load. Details: {load_error_message}'
        }), 500

    try:
        data = request.get_json() or {}

        input_data = {
            'Age': float(data.get('Age', 50)),
            'BMI': float(data.get('BMI', 25.0)),
            'Tumor_Size_cm': float(data.get('Tumor_Size_cm', 2.0)),
            'Blood_Pressure': parse_blood_pressure(data.get('Blood_Pressure', 120.0)),
            'Cholesterol': float(data.get('Cholesterol', 200.0)),
            'Exercise_Days_Per_Week': float(data.get('Exercise_Days_Per_Week', 3)),
            'Annual_Income_USD': float(data.get('Annual_Income_USD', 50000.0)),
            'Gender': str(data.get('Gender', 'Female')),
            'Family_History': parse_bool(data.get('Family_History')),
            'Smoking': parse_bool(data.get('Smoking')),
            'Alcohol_Consumption': parse_bool(data.get('Alcohol_Consumption')),
            'Physical_Activity': str(data.get('Physical_Activity', 'Moderate')),
            'Hormone_Therapy': parse_bool(data.get('Hormone_Therapy')),
            'Menopause_Status': str(data.get('Menopause_Status', 'Post')),
            'Genetic_Mutation': str(data.get('Genetic_Mutation', 'None')),
            'Lymph_Node_Involvement': str(data.get('Lymph_Node_Involvement', 'No')),
            'Diabetes': parse_bool(data.get('Diabetes')),
            'Breastfeeding_History': str(data.get('Breastfeeding_History', 'Yes'))
        }

        input_df = pd.DataFrame([input_data])

        prediction = int(pipeline_model.predict(input_df)[0])
        probability = float(pipeline_model.predict_proba(input_df)[0][1])

        return jsonify({
            'status': 'success',
            'prediction': prediction,
            'risk_score': round(probability * 100, 2),
            'risk_level': 'High Risk' if prediction == 1 else 'Low Risk'
        })

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400


if __name__ == '__main__':
    app.run(debug=True, port=5000)
