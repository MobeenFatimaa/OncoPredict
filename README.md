# OncoPredict

An AI-powered breast cancer risk assessment prototype built with **Python, Scikit-learn, Logistic Regression, Flask, and Vercel**. The application accepts clinical and diagnostic parameters and provides a benign or malignant classification with estimated probabilities and confidence.

> **Disclaimer:** OncoPredict is an educational and research prototype. It is not a medical diagnostic system and should not replace professional medical advice or clinical judgment.

## Live Demo

**OncoPredict:** Add your deployed Vercel URL here.

## Features

* Logistic Regression binary classification
* Feature scaling with Scikit-learn
* Malignant and benign probability estimation
* Interactive prediction dashboard
* Dynamic feature loading
* Model health-check API
* REST prediction API
* Responsive web interface
* Vercel deployment support

## Tech Stack

* **Python**
* **Flask**
* **Scikit-learn**
* **NumPy**
* **Joblib**
* **JavaScript**
* **HTML/CSS**
* **Tailwind CSS**
* **Vercel**

## Project Structure

```text
OncoPredict/
├── api/
│   └── index.py
├── model/
│   ├── model.joblib
│   ├── scaler.joblib
│   └── feature_names.joblib
├── static/
├── templates/
│   └── index.html
├── app.py
├── requirements.txt
├── vercel.json
└── README.md
```

## API Endpoints

| Method | Endpoint        | Description              |
| ------ | --------------- | ------------------------ |
| `GET`  | `/`             | Web application          |
| `GET`  | `/api/health`   | Model health status      |
| `GET`  | `/api/features` | Available model features |
| `POST` | `/api/predict`  | Generate prediction      |

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/OncoPredict.git
cd OncoPredict
pip install -r requirements.txt
python app.py
```

Open:

```text
http://localhost:5000
```

## Model Pipeline

```text
Clinical Input
      ↓
Feature Ordering
      ↓
Feature Scaling
      ↓
Logistic Regression
      ↓
Prediction Probability
      ↓
Benign / Malignant Result
```

## Model Files

The `model/` directory contains:

* `model.joblib` — trained Logistic Regression model
* `scaler.joblib` — fitted feature scaler
* `feature_names.joblib` — model feature configuration

All three files must correspond to the same training pipeline.

## Author

**Mobeen Fatima**

BS Computer Science (Specialized AI)

## License

Licensed under the **Apache License 2.0**.

https://www.apache.org/licenses/LICENSE-2.0
