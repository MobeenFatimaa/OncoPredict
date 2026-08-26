import numpy as np
import pandas as pd

# -------------------------------
# Random Seed
# -------------------------------

np.random.seed(42)

# -------------------------------
# Number of Samples
# -------------------------------

NUM_ROWS = 10000

# -------------------------------
# Generate Features
# -------------------------------

age = np.random.randint(20, 85, NUM_ROWS)

gender = np.random.choice(
    ["Female", "Male"],
    NUM_ROWS,
    p=[0.93, 0.07]
)

bmi = np.round(
    np.random.normal(27, 4.5, NUM_ROWS),
    1
)

family_history = np.random.choice(
    ["Yes", "No"],
    NUM_ROWS,
    p=[0.30, 0.70]
)

smoking = np.random.choice(
    ["Yes", "No"],
    NUM_ROWS,
    p=[0.25, 0.75]
)

alcohol = np.random.choice(
    ["Yes", "No"],
    NUM_ROWS,
    p=[0.35, 0.65]
)

physical_activity = np.random.choice(
    ["Low", "Moderate", "High"],
    NUM_ROWS,
    p=[0.30, 0.45, 0.25]
)

genetic_mutation = np.random.choice(
    ["Positive", "Negative"],
    NUM_ROWS,
    p=[0.15, 0.85]
)

tumor_size = np.round(
    np.abs(np.random.normal(2.5, 1.8, NUM_ROWS)),
    2
)

lymph_node = np.random.choice(
    ["Yes", "No"],
    NUM_ROWS,
    p=[0.20, 0.80]
)

mammogram = np.random.choice(
    ["Normal", "Suspicious", "Abnormal"],
    NUM_ROWS,
    p=[0.65, 0.20, 0.15]
)

hormone_therapy = np.random.choice(
    ["Yes", "No"],
    NUM_ROWS,
    p=[0.20, 0.80]
)

menopause = np.random.choice(
    ["Pre", "Post"],
    NUM_ROWS,
    p=[0.45, 0.55]
)

# -------------------------------
# Risk Score
# -------------------------------

risk_score = (
    (age > 50).astype(int)
    + (bmi > 30).astype(int)
    + (family_history == "Yes").astype(int)
    + (smoking == "Yes").astype(int)
    + (genetic_mutation == "Positive").astype(int)
    + (tumor_size > 3).astype(int)
    + (lymph_node == "Yes").astype(int)
    + (mammogram != "Normal").astype(int)
)

# -------------------------------
# Target Variable
# -------------------------------

cancer = (risk_score >= 4).astype(int)

# -------------------------------
# Cancer Stage
# -------------------------------

stage = []

for value in cancer:

    if value == 0:

        stage.append("None")

    else:

        stage.append(
            np.random.choice(
                [
                    "Stage I",
                    "Stage II",
                    "Stage III",
                    "Stage IV"
                ],
                p=[
                    0.40,
                    0.30,
                    0.20,
                    0.10
                ]
            )
        )

# -------------------------------
# Biopsy Result
# -------------------------------

biopsy = []

for value in cancer:

    if value == 1:

        biopsy.append("Malignant")

    else:

        biopsy.append("Benign")

# -------------------------------
# Create DataFrame
# -------------------------------

df = pd.DataFrame({

    "Patient_ID":
        np.arange(100001, 100001 + NUM_ROWS),

    "Age":
        age,

    "Gender":
        gender,

    "BMI":
        bmi,

    "Family_History":
        family_history,

    "Smoking":
        smoking,

    "Alcohol_Consumption":
        alcohol,

    "Physical_Activity":
        physical_activity,

    "Hormone_Therapy":
        hormone_therapy,

    "Menopause_Status":
        menopause,

    "Genetic_Mutation":
        genetic_mutation,

    "Tumor_Size_cm":
        tumor_size,

    "Lymph_Node_Involvement":
        lymph_node,

    "Mammogram_Result":
        mammogram,

    "Biopsy_Result":
        biopsy,

    "Cancer_Stage":
        stage,

    "Cancer":
        cancer
})

# -------------------------------
# Save CSV
# -------------------------------
from pathlib import Path

# Get the project root
project_root = Path(__file__).resolve().parent.parent

# Create dataset folder if it doesn't exist
dataset_dir = project_root / "dataset"
dataset_dir.mkdir(parents=True, exist_ok=True)

# Save the CSV
output_path = dataset_dir / "breast_cancer_prediction.csv"
df.to_csv(output_path, index=False)

print(f"Dataset saved to: {output_path}")

print("Dataset Created Successfully!")
print(df.head())

print()

print(df.shape)