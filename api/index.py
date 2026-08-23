import os
import joblib
import numpy as np
from flask import Flask, render_template, request, jsonify


# =========================================================
# PATH CONFIGURATION
# =========================================================

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))

TEMPLATE_DIR = os.path.join(PROJECT_ROOT, "templates")
STATIC_DIR = os.path.join(PROJECT_ROOT, "static")
MODEL_DIR = os.path.join(PROJECT_ROOT, "model")

MODEL_PATH = os.path.join(MODEL_DIR, "model.joblib")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.joblib")
FEATURES_PATH = os.path.join(MODEL_DIR, "feature_names.joblib")


# =========================================================
# FLASK APP
# =========================================================

app = Flask(
    __name__,
    template_folder=TEMPLATE_DIR,
    static_folder=STATIC_DIR
)


# =========================================================
# GLOBAL MODEL OBJECTS
# =========================================================

model = None
scaler = None
feature_names = []
load_errors = []


# =========================================================
# SAFE JOBLIB LOADER
# =========================================================

def safe_load(path, name):
    """
    Load a joblib file independently.

    This prevents one missing/corrupted file from causing
    every other model component to become unavailable.
    """
    try:
        if not os.path.exists(path):
            error = f"{name} not found: {path}"
            print(f"❌ {error}")
            load_errors.append(error)
            return None

        obj = joblib.load(path)

        print(f"✅ Loaded {name}: {path}")

        return obj

    except Exception as exc:
        error = f"{name} failed to load: {exc}"
        print(f"❌ {error}")
        load_errors.append(error)
        return None


# =========================================================
# LOAD MODEL COMPONENTS
# =========================================================

model = safe_load(MODEL_PATH, "model.joblib")
scaler = safe_load(SCALER_PATH, "scaler.joblib")
feature_names = safe_load(FEATURES_PATH, "feature_names.joblib")


# =========================================================
# NORMALIZE FEATURE NAMES
# =========================================================

if feature_names is not None:

    try:
        feature_names = list(feature_names)
        feature_names = [str(feature) for feature in feature_names]

    except Exception as exc:

        print(f"❌ Invalid feature_names format: {exc}")
        feature_names = []


# =========================================================
# FALLBACK: GET FEATURES FROM MODEL
# =========================================================

def recover_feature_names_from_model():
    """
    Try to recover feature names directly from a LightGBM model
    if feature_names.joblib could not be loaded.
    """

    global feature_names

    if feature_names:
        return

    if model is None:
        return

    try:

        # LightGBM sklearn API
        if hasattr(model, "booster_"):

            booster = model.booster_

            if hasattr(booster, "feature_name"):

                recovered = booster.feature_name()

                if recovered:
                    feature_names = list(recovered)
                    print(
                        f"✅ Recovered {len(feature_names)} "
                        "features directly from LightGBM model."
                    )
                    return

        # LightGBM Booster directly
        if hasattr(model, "feature_name"):

            recovered = model.feature_name()

            if recovered:
                feature_names = list(recovered)
                print(
                    f"✅ Recovered {len(feature_names)} "
                    "features from model."
                )
                return

        # Generic sklearn fallback
        if hasattr(model, "feature_names_in_"):

            recovered = model.feature_names_in_

            if recovered is not None:
                feature_names = list(recovered)
                print(
                    f"✅ Recovered {len(feature_names)} "
                    "features from feature_names_in_."
                )
                return

    except Exception as exc:

        error = f"Feature recovery failed: {exc}"
        print(f"❌ {error}")
        load_errors.append(error)


recover_feature_names_from_model()


# =========================================================
# FINAL STATUS
# =========================================================

print("=" * 60)
print("ONCOPREDICT INITIALIZATION")
print("=" * 60)
print(f"PROJECT_ROOT : {PROJECT_ROOT}")
print(f"MODEL_DIR    : {MODEL_DIR}")
print(f"Model loaded : {model is not None}")
print(f"Scaler loaded: {scaler is not None}")
print(f"Features     : {len(feature_names)}")
print(f"Model exists : {os.path.exists(MODEL_PATH)}")
print(f"Scaler exists: {os.path.exists(SCALER_PATH)}")
print(f"Features file: {os.path.exists(FEATURES_PATH)}")
print("=" * 60)


# =========================================================
# HOME
# =========================================================

@app.route("/")
def home():

    return render_template(
        "index.html",
        features=feature_names
    )


# =========================================================
# HEALTH CHECK
# =========================================================

@app.route("/api/health", methods=["GET"])
def health():

    return jsonify({
        "status": "ok",
        "model_loaded": model is not None,
        "scaler_loaded": scaler is not None,
        "feature_count": len(feature_names),
        "feature_names": feature_names,
        "model_exists": os.path.exists(MODEL_PATH),
        "scaler_exists": os.path.exists(SCALER_PATH),
        "features_file_exists": os.path.exists(FEATURES_PATH),
        "load_errors": load_errors
    })


# =========================================================
# FEATURE INFORMATION
# =========================================================

@app.route("/api/features", methods=["GET"])
def get_features():

    return jsonify({
        "status": "success",
        "count": len(feature_names),
        "features": feature_names
    })


# =========================================================
# PREDICTION API
# =========================================================

@app.route("/api/predict", methods=["POST"])
def predict():

    if model is None:
        return jsonify({
            "status": "error",
            "error": "Model files were not loaded on the server.",
            "details": load_errors
        }), 500

    if scaler is None:
        return jsonify({
            "status": "error",
            "error": "Scaler file was not loaded on the server.",
            "details": load_errors
        }), 500

    if not feature_names:
        return jsonify({
            "status": "error",
            "error": "Feature names are unavailable on the server.",
            "details": load_errors
        }), 500

    try:

        data = request.get_json(force=True)

        if not data:
            return jsonify({
                "status": "error",
                "error": "No data payload received."
            }), 400

        # =================================================
        # BUILD INPUT VECTOR
        # =================================================

        input_vector = []

        for feature in feature_names:

            value = data.get(feature, 0)

            try:
                input_vector.append(float(value))

            except (ValueError, TypeError):
                input_vector.append(0.0)

        # =================================================
        # NUMPY ARRAY
        # =================================================

        formatted_input = np.asarray(
            input_vector,
            dtype=float
        ).reshape(1, -1)

        # =================================================
        # SCALING
        # =================================================

        scaled_input = scaler.transform(formatted_input)

        # =================================================
        # MODEL PREDICTION
        # =================================================

        prediction = int(
            model.predict(scaled_input)[0]
        )

        probabilities = model.predict_proba(
            scaled_input
        )[0]

        # Assume class 1 = malignant
        if len(probabilities) > 1:
            malignant_prob = float(probabilities[1])
        else:
            malignant_prob = float(probabilities[0])

        # =================================================
        # RESULT
        # =================================================

        diagnosis = (
            "Malignant"
            if prediction == 1
            else "Benign"
        )

        risk_score = round(
            malignant_prob * 100,
            2
        )

        confidence = round(
            (
                malignant_prob
                if prediction == 1
                else 1 - malignant_prob
            ) * 100,
            2
        )

        return jsonify({
            "status": "success",
            "diagnosis": diagnosis,
            "risk_score": risk_score,
            "confidence": confidence
        }), 200

    except Exception as exc:

        print(f"❌ Prediction error: {exc}")

        return jsonify({
            "status": "error",
            "error": str(exc)
        }), 500


# =========================================================
# LOCAL DEVELOPMENT
# =========================================================

if __name__ == "__main__":

    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )
