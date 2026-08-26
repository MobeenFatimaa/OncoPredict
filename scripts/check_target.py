import pandas as pd
from pathlib import Path

project_root = Path(__file__).resolve().parent.parent

df = pd.read_csv(project_root / "dataset" / "breast_cancer_prediction.csv")

print(df["Cancer"].value_counts())

print()

print(df["Cancer"].value_counts(normalize=True) * 100)