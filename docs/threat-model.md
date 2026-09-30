# ATO Shield — Threat Model

ATO Shield is a defensive portfolio prototype. This document is honest about
what it can and cannot do.

## In scope threats

| Threat | How ATO Shield helps |
|---|---|
| Credential stuffing | Repeated failed attempts feed the risk engine as a strong signal; high-volume failures push a login toward BLOCK. |
| Password reuse / leaked credentials | If a leaked credential is used from a new device/location, the behavioural signals (new device, new location, odd hour) raise the risk score even though the password itself was correct. |
| New-device login | Explicitly tracked via `is_new_device`; contributes to both the ML feature vector and a rule-based point weight. |
| Unusual login behaviour | The Isolation Forest model is trained on a synthetic "normal" distribution per the demo dataset, so logins that deviate from that shape score as anomalies. |
| Session compromise after login | Session management lets a user see every active session and revoke any of them individually or in bulk. |
| Unfamiliar location | Tracked via `is_new_location`; contributes to the score. In production this would use a real IP geolocation provider — this demo uses a location string supplied at login. |

## Out of scope / not detected

- **Sophisticated attackers who match the victim's normal behavioural pattern** (same device fingerprint, same rough geography, reasonable hours). Behavioural anomaly detection has an inherent blind spot here.
- **Phishing / social engineering that captures a live session token**, since ATO Shield analyzes login *events*, not every subsequent authenticated request.
- **Malware or credential theft occurring outside the application** (keyloggers, infostealers) — ATO Shield only sees the resulting login attempt.
- **Distributed / low-and-slow credential stuffing** across many accounts, which would need cross-account correlation this prototype doesn't implement.
- **IP geolocation accuracy** — this demo accepts a location string from the client for demonstration purposes rather than using a production-grade geolocation/IP-intelligence service.

## Design decisions

- **ML + rules, not ML alone.** Isolation Forest surfaces behaviour that doesn't fit the account's learned pattern, but a pure ML score is not auditable or explainable enough to justify blocking a real login on its own. Rule-based signals (new device, new location, odd hour, failed attempts) are combined with the ML signal so every decision has a plain-language reason attached.
- **Thresholds are heuristics.** The 0–39 / 40–69 / 70–100 risk bands and the point weights in `risk_engine.py` are chosen for a legible demo, not calibrated against real fraud data or an industry framework.
- **No offensive tooling.** The Attack Simulator only replays pre-defined feature combinations through the existing risk engine — it does not perform real brute-force attempts, credential stuffing, or any live attack against the system.

## Honesty statement

ATO Shield is a defensive prototype demonstrating behavioural anomaly
detection and account security workflows. It is **not** a replacement for
enterprise identity providers, production fraud-detection systems, SIEM
platforms, WAFs, or production-grade authentication infrastructure.
