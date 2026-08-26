import pandas as pd
import numpy as np
from pathlib import Path

np.random.seed(42)

# ----------------------------
# Load Dataset
# ----------------------------

project_root = Path(__file__).resolve().parent.parent
dataset_path = project_root / "dataset" / "breast_cancer_prediction.csv"

df = pd.read_csv(dataset_path)

# ----------------------------
# Introduce Missing Values
# ----------------------------

columns_to_modify = [
    "BMI",
    "Tumor_Size_cm",
    "Alcohol_Consumption",
    "Physical_Activity",
    "Hormone_Therapy"
]

for column in columns_to_modify:
    missing_indices = df.sample(frac=0.03, random_state=42).index
    df.loc[missing_indices, column] = np.nan

# ----------------------------
# Add Blood Pressure
# ----------------------------

df["Blood_Pressure"] = np.random.randint(90, 181, len(df))

# ----------------------------
# Add Cholesterol
# ----------------------------

df["Cholesterol"] = np.random.randint(130, 301, len(df))

# ----------------------------
# Add Diabetes
# ----------------------------

df["Diabetes"] = np.random.choice(
    ["Yes", "No"],
    len(df),
    p=[0.18, 0.82]
)

# ----------------------------
# Add Exercise Frequency
# ----------------------------

df["Exercise_Days_Per_Week"] = np.random.randint(
    0,
    8,
    len(df)
)

# ----------------------------
# Add Breastfeeding History
# ----------------------------

df["Breastfeeding_History"] = np.random.choice(
    ["Yes", "No", "Not Applicable"],
    len(df),
    p=[0.45, 0.35, 0.20]
)

# ----------------------------
# Add Monthly Income
# ----------------------------

df["Annual_Income_USD"] = np.random.randint(
    15000,
    150001,
    len(df)
)
df["Cancer_Stage"] = df["Cancer_Stage"].fillna("No Cancer")
# ----------------------------
# Save Dataset
# ----------------------------

df.to_csv(dataset_path, index=False)

print("Dataset Enhanced Successfully!")

print(df.head())

print()

print(df.shape)
