import os
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from feature_columns import FEATURE_COLUMNS
from generate_dataset import build_dataset

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "isolation_forest.joblib")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.joblib")


def train():
    os.makedirs(MODEL_DIR, exist_ok=True)
    df = build_dataset()
    X = df[FEATURE_COLUMNS].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # contamination reflects the small fraction of anomalous rows we mixed in
    model = IsolationForest(
        n_estimators=200,
        contamination=0.035,
        random_state=42,
    )
    model.fit(X_scaled)

    joblib.dump({"model": model, "feature_columns": FEATURE_COLUMNS}, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)

    print(f"Model saved to {MODEL_PATH}")
    print(f"Scaler saved to {SCALER_PATH}")

    # quick sanity check
    scores = model.score_samples(X_scaled)
    print("Score range:", scores.min(), scores.max())


if __name__ == "__main__":
    train()
