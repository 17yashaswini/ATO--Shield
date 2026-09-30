"""
Generates a synthetic dataset representing NORMAL human login behaviour.

Isolation Forest is trained almost entirely on "normal" patterns so that
genuinely unusual behaviour (new device at 3AM with many failed attempts,
etc.) falls outside the learned distribution.

A small number of clearly anomalous rows are mixed in only so the model
sees the shape of outliers during evaluation, not so it "memorizes" attacks.
"""
import numpy as np
import pandas as pd
from feature_columns import FEATURE_COLUMNS

RNG = np.random.default_rng(42)


def generate_normal_rows(n):
    rows = []
    for _ in range(n):
        # Most people log in during waking hours
        login_hour = int(np.clip(RNG.normal(14, 4), 0, 23))
        failed_attempts = RNG.choice([0, 0, 0, 1, 1, 2], p=[0.55, 0.15, 0.1, 0.1, 0.05, 0.05])
        is_new_device = RNG.choice([0, 1], p=[0.92, 0.08])
        is_new_location = RNG.choice([0, 1], p=[0.9, 0.1])
        login_frequency = max(1, RNG.normal(20, 6))  # logins per 30 days
        time_since_previous_login = max(0.1, RNG.normal(18, 10))  # hours
        device_count = RNG.choice([1, 2, 3], p=[0.6, 0.3, 0.1])
        location_count = RNG.choice([1, 2, 3], p=[0.65, 0.25, 0.1])

        rows.append([
            failed_attempts, login_hour, is_new_device, is_new_location,
            login_frequency, time_since_previous_login, device_count, location_count,
        ])
    return rows


def generate_anomalous_rows(n):
    rows = []
    for _ in range(n):
        login_hour = int(RNG.choice([1, 2, 3, 4, 23]))
        failed_attempts = int(RNG.integers(4, 10))
        is_new_device = 1
        is_new_location = int(RNG.choice([0, 1], p=[0.2, 0.8]))
        login_frequency = max(0.5, RNG.normal(3, 2))
        time_since_previous_login = max(0.05, RNG.normal(2, 1.5))
        device_count = int(RNG.integers(3, 8))
        location_count = int(RNG.integers(3, 8))

        rows.append([
            failed_attempts, login_hour, is_new_device, is_new_location,
            login_frequency, time_since_previous_login, device_count, location_count,
        ])
    return rows


def build_dataset(n_normal=4000, n_anomalous=150):
    normal = generate_normal_rows(n_normal)
    anomalous = generate_anomalous_rows(n_anomalous)
    data = normal + anomalous
    labels = [0] * len(normal) + [1] * len(anomalous)  # 1 = anomalous (eval only)

    df = pd.DataFrame(data, columns=FEATURE_COLUMNS)
    df["is_anomalous_label"] = labels
    return df.sample(frac=1, random_state=42).reset_index(drop=True)


if __name__ == "__main__":
    df = build_dataset()
    df.to_csv("synthetic_login_data.csv", index=False)
    print(f"Generated {len(df)} rows -> synthetic_login_data.csv")
    print(df["is_anomalous_label"].value_counts())
