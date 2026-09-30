# Central, fixed feature ordering used by BOTH training and inference.
# Never reorder without retraining the model.

FEATURE_COLUMNS = [
    "failed_attempts",
    "login_hour",
    "is_new_device",
    "is_new_location",
    "login_frequency",
    "time_since_previous_login",
    "device_count",
    "location_count",
]
