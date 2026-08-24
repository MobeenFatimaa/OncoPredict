import os
import joblib
import numpy as np

from flask import Flask, render_template, request, jsonify, Response


# =========================================================
# PATH CONFIGURATION
# LOCAL + VERCEL COMPATIBLE
# =========================================================

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

# Possible locations of the model directory
candidate_model_dirs = [
    os.path.join(os.getcwd(), "model"),
    os.path.abspath(os.path.join(CURRENT_DIR, "..", "model")),
    os.path.join(CURRENT_DIR, "model"),
]

MODEL_DIR = None

for path in candidate_model_dirs:
    if os.path.isdir(path):
        MODEL_DIR = path
        break

# Final fallback
if MODEL_DIR is None:
    MODEL_DIR = candidate_model_dirs[0]


# =========================================================
# TEMPLATE + STATIC PATHS
# =========================================================

candidate_roots = [
    os.getcwd(),
    os.path.abspath(os.path.join(CURRENT_DIR, "..")),
    CURRENT_DIR,
]

TEMPLATE_DIR = next(
    (
        os.path.join(root, "templates")
        for root in candidate_roots
        if os.path.isdir(os.path.join(root, "templates"))
    ),
    "templates",
)

STATIC_DIR = next(
    (
        os.path.join(root, "static")
        for root in candidate_roots
        if os.path.isdir(os.path.join(root, "static"))
    ),
    "static",
)


# =========================================================
# MODEL FILE PATHS
# =========================================================

PROJECT_ROOT = os.path.dirname(MODEL_DIR)

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
# FAVICON
# =========================================================

@app.route("/favicon.ico")
def favicon():

    svg_data = """
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">

        <defs>
            <linearGradient
                id="grad"
                x1="0%"
                y1="100%"
                x2="100%"
                y2="0%"
            >
                <stop
                    offset="0%"
                    style="stop-color:#db2777;"
                />

                <stop
                    offset="100%"
                    style="stop-color:#f43f5e;"
                />
            </linearGradient>
        </defs>

        <rect
            width="64"
            height="64"
            rx="16"
            fill="url(#grad)"
        />

        <text
            x="50%"
            y="55%"
            dominant-baseline="middle"
            text-anchor="middle"
            fill="white"
            font-family="sans-serif"
            font-weight="800"
            font-size="32"
        >
            OP
        </text>

    </svg>
    """

    return Response(
        svg_data,
        mimetype="image/svg+xml"
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

    try:

        if not os.path.isfile(path):

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
# LOAD MODEL
# =========================================================

model = safe_load(
    MODEL_PATH,
    "model.joblib"
)


# =========================================================
# LOAD SCALER
# =========================================================

scaler = safe_load(
    SCALER_PATH,
    "scaler.joblib"
)


# =========================================================
# LOAD FEATURE NAMES
# =========================================================

feature_names = safe_load(
    FEATURES_PATH,
    "feature_names.joblib"
)


# =========================================================
# NORMALIZE FEATURE NAMES
# =========================================================

if feature_names is not None:

    try:

        # Convert numpy arrays / pandas indexes / tuples
        # into a normal Python list
        feature_names = list(feature_names)

        # Convert every feature name to string
        feature_names = [
            str(feature).strip()
            for feature in feature_names
        ]

        # Remove empty feature names
        feature_names = [
            feature
            for feature in feature_names
            if feature
        ]

    except Exception as exc:

        error = f"Invalid feature_names format: {exc}"

        print(f"❌ {error}")

        load_errors.append(error)

        feature_names = []


# =========================================================
# FALLBACK FEATURE RECOVERY
# FOR STANDARD SCIKIT-LEARN MODELS
# =========================================================

def recover_feature_names_from_model():

    global feature_names

    # Already available
    if feature_names:
        return

    # Model unavailable
    if model is None:
        return

    try:

        # -------------------------------------------------
        # Standard scikit-learn feature_names_in_
        # -------------------------------------------------

        if hasattr(model, "feature_names_in_"):

            recovered = model.feature_names_in_

            if recovered is not None:

                feature_names = [
                    str(feature).strip()
                    for feature in recovered
                ]

                print(
                    f"✅ Recovered "
                    f"{len(feature_names)} features "
                    f"from scikit-learn model."
                )

                return


        # -------------------------------------------------
        # Pipeline / estimator inside Pipeline
        # -------------------------------------------------

        if hasattr(model, "steps"):

            for _, estimator in reversed(model.steps):

                if hasattr(estimator, "feature_names_in_"):

                    recovered = estimator.feature_names_in_

                    if recovered is not None:

                        feature_names = [
                            str(feature).strip()
                            for feature in recovered
                        ]

                        print(
                            f"✅ Recovered "
                            f"{len(feature_names)} features "
                            f"from pipeline."
                        )

                        return


    except Exception as exc:

        error = f"Feature recovery failed: {exc}"

        print(f"❌ {error}")

        load_errors.append(error)


recover_feature_names_from_model()


# =========================================================
# DETERMINE EXPECTED FEATURE COUNT
# =========================================================

expected_feature_count = len(feature_names)

if model is not None:

    try:

        # Most sklearn classifiers
        if hasattr(model, "n_features_in_"):

            model_feature_count = int(
                model.n_features_in_
            )

            if expected_feature_count == 0:

                expected_feature_count = model_feature_count

            elif expected_feature_count != model_feature_count:

                error = (
                    "Feature count mismatch: "
                    f"feature_names.joblib contains "
                    f"{expected_feature_count} features, "
                    f"but model expects "
                    f"{model_feature_count}."
                )

                print(f"⚠️ {error}")

                load_errors.append(error)

    except Exception as exc:

        print(
            f"⚠️ Could not determine model feature count: {exc}"
        )


# =========================================================
# INITIALIZATION STATUS
# =========================================================

print("=" * 70)
print("ONCOPREDICT INITIALIZATION")
print("=" * 70)

print(f"CWD                  : {os.getcwd()}")
print(f"CURRENT_DIR          : {CURRENT_DIR}")
print(f"PROJECT_ROOT         : {PROJECT_ROOT}")
print(f"MODEL_DIR            : {MODEL_DIR}")

print(f"MODEL_PATH           : {MODEL_PATH}")
print(f"SCALER_PATH          : {SCALER_PATH}")
print(f"FEATURES_PATH        : {FEATURES_PATH}")

print(f"Model loaded         : {model is not None}")
print(f"Scaler loaded        : {scaler is not None}")

print(f"Feature count        : {len(feature_names)}")
print(f"Expected features    : {expected_feature_count}")

print(
    f"Model exists         : "
    f"{os.path.isfile(MODEL_PATH)}"
)

print(
    f"Scaler exists        : "
    f"{os.path.isfile(SCALER_PATH)}"
)

print(
    f"Features file exists : "
    f"{os.path.isfile(FEATURES_PATH)}"
)

if feature_names:

    print("Feature names:")

    for index, feature in enumerate(feature_names):

        print(
            f"  {index + 1:02d}. {feature}"
        )

print("=" * 70)


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

        "cwd": os.getcwd(),

        "model_dir": MODEL_DIR,

        "model_loaded": model is not None,

        "scaler_loaded": scaler is not None,

        "feature_count": len(feature_names),

        "expected_feature_count": expected_feature_count,

        "feature_names": feature_names,

        "model_exists": os.path.isfile(MODEL_PATH),

        "scaler_exists": os.path.isfile(SCALER_PATH),

        "features_file_exists": os.path.isfile(FEATURES_PATH),

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
# MODEL INFORMATION
# =========================================================

@app.route("/api/model-info", methods=["GET"])
def model_info():

    if model is None:

        return jsonify({

            "status": "error",

            "error": "Model is not loaded.",

            "load_errors": load_errors

        }), 500


    model_type = type(model).__name__

    model_module = type(model).__module__

    model_feature_count = None

    classes = None

    try:

        if hasattr(model, "n_features_in_"):

            model_feature_count = int(
                model.n_features_in_
            )

    except Exception:
        pass


    try:

        if hasattr(model, "classes_"):

            classes = [
                str(value)
                for value in model.classes_
            ]

    except Exception:
        pass


    return jsonify({

        "status": "success",

        "model_type": model_type,

        "model_module": model_module,

        "model_feature_count": model_feature_count,

        "feature_names_count": len(feature_names),

        "classes": classes

    })


# =========================================================
# PREDICTION API
# =========================================================

@app.route("/api/predict", methods=["POST"])
def predict():

    # -----------------------------------------------------
    # MODEL CHECK
    # -----------------------------------------------------

    if model is None:

        return jsonify({

            "status": "error",

            "error": "Model files were not loaded on the server.",

            "details": load_errors

        }), 500


    # -----------------------------------------------------
    # SCALER CHECK
    # -----------------------------------------------------

    if scaler is None:

        return jsonify({

            "status": "error",

            "error": "Scaler file was not loaded on the server.",

            "details": load_errors

        }), 500


    # -----------------------------------------------------
    # FEATURE CHECK
    # -----------------------------------------------------

    if not feature_names:

        return jsonify({

            "status": "error",

            "error": (
                "Feature names are unavailable "
                "on the server."
            ),

            "details": load_errors

        }), 500


    try:

        # =================================================
        # READ JSON
        # =================================================

        data = request.get_json(silent=True)


        if not isinstance(data, dict):

            return jsonify({

                "status": "error",

                "error": (
                    "Invalid or missing JSON payload."
                )

            }), 400


        # =================================================
        # BUILD INPUT VECTOR
        # =================================================

        input_vector = []

        invalid_features = []

        for feature in feature_names:

            value = data.get(feature, 0)

            try:

                # Handle empty values
                if value is None or value == "":

                    numeric_value = 0.0

                else:

                    numeric_value = float(value)


                # Reject NaN / infinity
                if not np.isfinite(numeric_value):

                    numeric_value = 0.0

                    invalid_features.append(feature)


                input_vector.append(
                    numeric_value
                )


            except (
                ValueError,
                TypeError
            ):

                input_vector.append(0.0)

                invalid_features.append(feature)


        # =================================================
        # NUMPY INPUT
        # =================================================

        formatted_input = np.asarray(
            input_vector,
            dtype=np.float64
        ).reshape(1, -1)


        # =================================================
        # VERIFY FEATURE COUNT
        # =================================================

        if (
            expected_feature_count > 0
            and formatted_input.shape[1]
            != expected_feature_count
        ):

            return jsonify({

                "status": "error",

                "error": (
                    "Input feature count does not "
                    "match the trained model."
                ),

                "received_features": int(
                    formatted_input.shape[1]
                ),

                "expected_features": int(
                    expected_feature_count
                )

            }), 400


        # =================================================
        # SCALING
        # =================================================

        scaled_input = scaler.transform(
            formatted_input
        )


        # =================================================
        # MODEL PREDICTION
        # =================================================

        prediction_raw = model.predict(
            scaled_input
        )[0]


        # =================================================
        # PREDICTION PROBABILITY
        # =================================================

        malignant_prob = None
        benign_prob = None


        if hasattr(model, "predict_proba"):

            probabilities = model.predict_proba(
                scaled_input
            )[0]

            probabilities = np.asarray(
                probabilities,
                dtype=float
            )


            # -------------------------------------------------
            # Determine class labels correctly
            # -------------------------------------------------

            if hasattr(model, "classes_"):

                classes = list(model.classes_)

                for class_value, probability in zip(
                    classes,
                    probabilities
                ):

                    try:

                        class_int = int(class_value)

                    except (
                        ValueError,
                        TypeError
                    ):

                        class_int = None


                    if class_int == 1:

                        malignant_prob = float(
                            probability
                        )

                    elif class_int == 0:

                        benign_prob = float(
                            probability
                        )


            # -------------------------------------------------
            # Standard binary classifier fallback
            # -------------------------------------------------

            if malignant_prob is None:

                if len(probabilities) >= 2:

                    malignant_prob = float(
                        probabilities[-1]
                    )

                    benign_prob = float(
                        probabilities[0]
                    )

                elif len(probabilities) == 1:

                    malignant_prob = float(
                        probabilities[0]
                    )

                    benign_prob = (
                        1.0 - malignant_prob
                    )

                else:

                    malignant_prob = 0.0
                    benign_prob = 1.0


        else:

            # -------------------------------------------------
            # Classifier without predict_proba
            # -------------------------------------------------

            try:

                prediction_int = int(
                    prediction_raw
                )

            except (
                ValueError,
                TypeError
            ):

                prediction_int = 0


            if prediction_int == 1:

                malignant_prob = 1.0
                benign_prob = 0.0

            else:

                malignant_prob = 0.0
                benign_prob = 1.0


        # =================================================
        # NORMALIZE PROBABILITIES
        # =================================================

        malignant_prob = float(
            np.clip(
                malignant_prob,
                0.0,
                1.0
            )
        )

        benign_prob = float(
            np.clip(
                benign_prob,
                0.0,
                1.0
            )
        )


        # =================================================
        # DIAGNOSIS
        # =================================================

        try:

            prediction_int = int(
                prediction_raw
            )

        except (
            ValueError,
            TypeError
        ):

            prediction_int = 1 if (
                malignant_prob >= 0.5
            ) else 0


        diagnosis = (
            "Malignant"
            if prediction_int == 1
            else "Benign"
        )


        # =================================================
        # RISK SCORE
        # =================================================

        risk_score = round(
            malignant_prob * 100,
            2
        )


        # =================================================
        # CONFIDENCE
        # =================================================

        confidence = round(
            max(
                malignant_prob,
                benign_prob
            ) * 100,
            2
        )


        # =================================================
        # RESPONSE
        # =================================================

        return jsonify({

            "status": "success",

            "diagnosis": diagnosis,

            "prediction": prediction_int,

            "risk_score": risk_score,

            "confidence": confidence,

            "malignant_probability": round(
                malignant_prob * 100,
                2
            ),

            "benign_probability": round(
                benign_prob * 100,
                2
            ),

            "feature_count": len(
                feature_names
            ),

            "invalid_features": invalid_features

        }), 200


    except Exception as exc:

        print(
            f"❌ Prediction error: {exc}"
        )

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
