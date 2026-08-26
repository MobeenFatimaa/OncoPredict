import pandas as pd
from pathlib import Path

project_root = Path(__file__).resolve().parent.parent

df = pd.read_csv(project_root / "dataset" / "breast_cancer_prediction.csv")

print("Duplicate rows:", df.duplicated().sum())