# ATO Shield

**A human-centered account takeover detection and response platform.**

Most security alerts say something like "suspicious login detected" and leave
the user guessing: was that me? Is my account compromised? What do I do now?
ATO Shield turns that confusing moment into a clear sequence — **detect →
understand → verify → protect → recover → prevent** — so a normal person can
act with confidence, not anxiety.

## Real-world problem

A user notices an unfamiliar login, a new device, a login at 3 AM, or several
failed attempts, but has no way to know:

- Was this actually me?
- How serious is it?
- Should I change my password or sign out other devices?
- What should I do first?

Most account-security UIs stop at "we detected something." ATO Shield keeps
going: it explains *why* something was flagged in plain language and walks
the user through exactly what to do next.

## Key features

- **Behavioural anomaly detection** — an Isolation Forest model trained on
  synthetic normal login behaviour flags logins that don't match a user's
  usual pattern.
- **Risk engine** — combines the ML signal with explicit rules (new device,
  new location, unusual hour, failed attempts) into a 0–100 score, a
  LOW/MEDIUM/HIGH level, and an ALLOW/FLAG/BLOCK action.
- **Human-readable explanations** — every flagged login comes with plain
  reasons, never a raw model score.
- **"Was this you?" flow** — confirm a login was you (device gets trusted) or
  report it and jump straight into account recovery.
- **Guided account recovery** — five concrete steps (revoke session, sign
  out others, change password, review activity, enable stronger auth) with
  a visible progress bar.
- **Session management** — see every active session and revoke any of them.
- **Security score & recommendations** — computed live from the account's
  actual state, never hardcoded.
- **Security timeline** — a single chronological view of what happened
  during an incident.
- **Admin dashboard & attack simulator** — monitor risk distribution across
  all users and safely replay six login scenarios through the real risk
  engine (no live attacks are performed).
- **Fully responsive** — sidebar layout on desktop, collapsible top nav and
  stacked cards on mobile.

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for a full request-flow
walkthrough and a Mermaid diagram of how the pieces fit together.

## Tech stack

**Frontend:** React 18, Vite, React Router, Axios, Tailwind CSS, Recharts
**Backend:** Flask, Flask-JWT-Extended, Flask-Limiter, Flask-CORS
**Database:** MongoDB (Atlas-compatible), PyMongo
**ML:** scikit-learn (Isolation Forest), pandas, NumPy, joblib
**Deployment:** Vercel (frontend) / Render (backend) / MongoDB Atlas

## ML methodology

A synthetic dataset of "normal" login behaviour (device familiarity, login
hour, failed attempts, location familiarity, login frequency, time since
previous login, device/location counts) is generated in
`backend/ml/generate_dataset.py`, with a small number of clearly anomalous
rows mixed in only so the model has seen the shape of outliers.
`backend/ml/train_model.py` scales the features and fits an Isolation Forest,
persisting both the model and the scaler with `joblib`. At inference time,
`app/services/anomaly_detector.py` loads the same artifacts and scores a
live login's feature vector using the exact same `FEATURE_COLUMNS` ordering
defined once in `ml/feature_columns.py` — training and inference can never
drift apart on feature order.

The raw Isolation Forest score is **never shown to end users**. It's combined
with rule-based points in `app/services/risk_engine.py` into the 0–100 score
that does get shown, alongside the specific reasons that drove it.

## Risk engine thresholds

```
0–39   LOW     → ALLOW
40–69  MEDIUM  → FLAG
70–100 HIGH    → BLOCK
```

These are project-level heuristics chosen to make the demo legible, **not**
industry-standard, calibrated fraud-scoring thresholds. See
[`docs/threat-model.md`](docs/threat-model.md) for what this system can and
cannot actually detect.

## Database design

MongoDB collections: `users`, `login_events`, `sessions`, `security_events`,
`notifications`, `recovery_sessions`. Full field lists are in the original
project spec; the shapes match what's used throughout `backend/app/routes/`.

## API summary

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout

GET    /api/users/profile
GET    /api/users/security-score
GET    /api/users/login-history

GET    /api/sessions
POST   /api/sessions/:id/revoke
POST   /api/sessions/revoke-others

GET    /api/security/events
GET    /api/security/events/:id
POST   /api/security/events/:id/confirm
POST   /api/security/events/:id/report
GET    /api/security/recommendations
GET    /api/security/timeline

POST   /api/recovery/start
POST   /api/recovery/action

GET    /api/admin/dashboard
GET    /api/admin/users
GET    /api/admin/events
GET    /api/admin/login-events
POST   /api/admin/simulate

GET    /api/notifications
POST   /api/notifications/:id/read
```

## Security model

- Passwords hashed with Werkzeug's `generate_password_hash` — never stored
  in plaintext.
- JWT-based auth (`Flask-JWT-Extended`), role claim embedded in the token.
- Admin-only routes enforced via an `admin_required()` decorator that checks
  the JWT role claim server-side.
- Login endpoints rate-limited via `Flask-Limiter`.
- Error responses never leak stack traces, secrets, or internal details —
  see `app/middleware/error_handler.py`.

## Setup

### 1. MongoDB

Create a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (or
point at any MongoDB instance) and grab the connection string.

### 2. Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # fill in MONGO_URI, SECRET_KEY, JWT_SECRET_KEY

# Train the ML model (writes backend/ml/models/*.joblib)
cd ml && python train_model.py && cd ..

# Seed demo data (1 admin + 4 users + realistic login/session history)
python seed.py

# Run the API
python run.py   # http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:5000/api
npm run dev   # http://localhost:5173
```

### 4. Tests

```bash
cd backend
pytest tests/ -v
```

Tests run against `mongomock` (an in-memory MongoDB stand-in), so they don't
require a live database connection.

## Demo credentials

After running `seed.py`, all accounts share the password `Password123!`:

| Role  | Email                     |
|-------|---------------------------|
| admin | admin@atoshield.dev       |
| user  | yashu@atoshield.dev       |
| user  | rahul@atoshield.dev       |
| user  | priya@atoshield.dev       |
| user  | aman@atoshield.dev        |

`yashu@atoshield.dev` has 15 days of normal login history plus one flagged
login and one blocked account-takeover attempt already seeded, so the
dashboard, timeline, and "was this you?" flow all have real data to show
immediately.

## Demo walkthrough

1. Log in as `yashu@atoshield.dev` → Dashboard shows security score, recent
   suspicious activity, and the timeline of the seeded incident.
2. Open **Security Events** → click the flagged event → see the "Was this
   you?" prompt with plain-language reasons.
3. Click **No, secure my account** → land on **Recovery** → walk through
   the five-step guided flow (revoke session → sign out others → change
   password → review activity → enable stronger auth).
4. Log in as `admin@atoshield.dev` → **Admin Dashboard** shows risk
   distribution and blocked/allowed/flagged charts across all users.
5. Go to **Attack Simulator** → run "Combined Account Takeover Attempt" →
   watch the real risk engine score it live and explain why.

## Deployment

- **Frontend → Vercel:** point Vercel at `frontend/`, set
  `VITE_API_BASE_URL` to your deployed backend URL.
- **Backend → Render:** point Render at `backend/`, set `MONGO_URI`,
  `SECRET_KEY`, `JWT_SECRET_KEY`, and `FRONTEND_ORIGIN` as environment
  variables. Run `python ml/train_model.py` once during the build step (or
  commit the trained `.joblib` files) so the model artifacts exist before
  `run.py` starts.
- **Database → MongoDB Atlas:** whitelist Render's outbound IPs (or allow
  all for a demo) and use the Atlas connection string as `MONGO_URI`.

## Limitations

ATO Shield is a defensive portfolio prototype demonstrating behavioural
anomaly detection and account-security workflows. It is **not** a
replacement for enterprise identity providers, production fraud-detection
systems, SIEM platforms, WAFs, or production-grade authentication
infrastructure. It does not detect attackers who closely mimic a victim's
normal behaviour, session-token theft after a legitimate login, or
distributed credential stuffing across many accounts. See
[`docs/threat-model.md`](docs/threat-model.md) for the full picture.

## Future improvements

- Passkeys / WebAuthn as a real "stronger authentication" option
- Real-time push notifications and email alerts
- Production-grade device fingerprinting and IP geolocation intelligence
- Continuous model retraining and monitoring on real (anonymized) login data
- Streaming/event-driven architecture for real-time detection at scale
- SIEM integration for enterprise deployments

## Interview talking points

- **Why Isolation Forest?** Anomaly detection fits better than supervised
  classification here since labelled account-takeover data is scarce; the
  model learns "normal" and flags what doesn't fit, without needing
  examples of every possible attack.
- **Why combine ML with rules?** Rules catch known, explainable patterns
  (failed-attempt counts, new device). ML catches behavioural drift a rule
  wouldn't anticipate. Neither is trusted alone to make a blocking decision.
- **What makes this different from a typical ML dashboard project?** The
  detection is one step in a full loop — understand, verify, protect,
  recover, prevent — not the end of the story.
