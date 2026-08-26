import pandas as pd
from pathlib import Path

project_root = Path(__file__).resolve().parent.parent

df = pd.read_csv(
    project_root /
    "dataset" /
    "breast_cancer_prediction.csv"
)

print("=" * 60)

print(df.head())

print("=" * 60)

print(df.info())

print("=" * 60)

print(df.isnull().sum())

print("=" * 60)

print(df.describe(include="all"))