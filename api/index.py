import os
import joblib
import numpy as np
from flask import Flask, render_template, request, jsonify

# Point template and static folders relative to this file's location in api/
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, '..'))

app = Flask(
    __name__,
    template_folder=os.path.join(PROJECT_ROOT, 'templates'),
    static_folder=os.path.join(PROJECT_ROOT, 'static')
)

MODEL_DIR = os.path.join(PROJECT_ROOT, 'model')
MODEL_PATH = os.path.join(MODEL_DIR, 'model.joblib')
SCALER_PATH = os.path.join(MODEL_DIR, 'scaler.joblib')
FEATURES_PATH = os.path.join(MODEL_DIR, 'feature_names.joblib')

try:
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    feature_names = joblib.load(FEATURES_PATH)
    print("✅ Model, Scaler, and Features loaded successfully!")
except Exception as e:
    print(f"❌ Load error: {e}")
    model, scaler, feature_names = None, None, []

@app.route('/')
def home():
    return render_template('index.html', features=feature_names)

@app.route('/api/predict', methods=['POST'])
def predict():
    if not model or not scaler:
        return jsonify({'status': 'error', 'error': f'Model files not loaded. Folder check: {os.path.exists(MODEL_DIR)}'}), 500

    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({'status': 'error', 'error': 'No data payload received'}), 400

        # Construct vector in exact column order required by the model
        input_vector = []
        for feature in feature_names:
            val = data.get(feature, 0)
            try:
                input_vector.append(float(val))
            except (ValueError, TypeError):
                input_vector.append(0.0)

        # Convert to numpy array & apply standard scaling
        formatted_input = np.array(input_vector).reshape(1, -1)
        scaled_input = scaler.transform(formatted_input)

        # Model Prediction
        prediction = int(model.predict(scaled_input)[0])
        probabilities = model.predict_proba(scaled_input)[0]
        malignant_prob = float(probabilities[1])

        diagnosis = 'Malignant' if prediction == 1 else 'Benign'
        risk_score = round(malignant_prob * 100, 2)
        confidence = round((malignant_prob if prediction == 1 else (1 - malignant_prob)) * 100, 2)

        return jsonify({
            'status': 'success',
            'diagnosis': diagnosis,
            'risk_score': risk_score,
            'confidence': confidence
        }), 200

    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

# Vercel entrypoint exposes 'app'
if __name__ == '__main__':
    app.run(debug=True, port=5000)
