# Setu — AI-Based Multilingual Mass Communication & Public Awareness Management Platform

A full-stack MVP implementing all three modules from the project plan:

1. **Audience Management & Campaign Planning** — recipient database, segmentation (language, geography, occupation, organization), campaign creation, reusable templates.
2. **AI Content Generation & Multilingual Communication Engine** — LLM-based content generation, translation into Indian languages, per-recipient personalization, sentiment analysis, and a compliance check before deployment.
3. **Multi-Channel Distribution & Engagement Analytics** — simulated fan-out across Email/SMS/WhatsApp/Push/Web, delivery tracking, engagement events (opens/clicks/feedback), and analytics dashboards.

## Stack

- **Backend:** FastAPI + SQLAlchemy + SQLite (zero-config; swap `DATABASE_URL` for Postgres in production) + JWT auth with role-based access control (admin / campaign_manager / comms_team).
- **AI:** Calls the [Groq API](https://console.groq.com) (`llama-3.3-70b-versatile`) for generation, translation, and sentiment. **Works without any API key too** — every AI function has a deterministic mock fallback, so the whole platform is demo-able out of the box. Set `GROQ_API_KEY` to get real LLM output (Groq has a free tier — grab a key at https://console.groq.com/keys).
- **Frontend:** React (Vite) + Tailwind + Recharts, JWT-authenticated dashboard.

## Running it

### Backend
```bash
cd backend
pip install -r requirements.txt
python seed.py          # creates demo users + sample audience data
uvicorn app.main:app --reload --port 8000
```
API docs (Swagger): http://localhost:8000/docs

Optional, for real AI output instead of mocks — copy `.env.example` to `.env` and fill in your key:
```bash
cd backend
cp .env.example .env      # macOS/Linux
copy .env.example .env    # Windows
```
Then edit `.env` and set:
```
GROQ_API_KEY=gsk_your_key_here
```
The app loads `.env` automatically on startup (via `python-dotenv`) — no need to `export`/`set` it manually in the terminal each time. **Never commit `.env`** — it's already in `.gitignore`; only `.env.example` (which has no real key) should be shared/committed.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

### Demo logins
| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | admin |
| `manager` | `manager123` | campaign_manager |

## Demo walkthrough

1. Log in as `manager`.
2. **Audience** — view/add recipients, filter by language/state/occupation/organization.
3. **Campaigns → New Campaign** — name it, write a one-line brief, pick a type.
4. On the campaign page:
   - **Step 1** — generate AI content from your brief in a chosen tone.
   - **Step 2** — select target Indian languages and translate.
   - **Step 3** — pick channels and dispatch (simulates realistic delivered/sent/failed outcomes).
   - **Step 4** — engagement analytics appear once messages/events exist.
5. **Dashboard** — overall reach, language-wise "broadcast pulse," channel mix, delivery/open/click rates.

## Project structure
```
backend/
  app/
    main.py            FastAPI app + router registration
    models.py          SQLAlchemy models (all 3 modules)
    schemas.py          Pydantic request/response schemas
    auth.py             JWT auth, password hashing, role dependency
    ai_service.py       LLM wrapper: generate / translate / personalize / sentiment / compliance
    routers/
      auth_router.py
      audience_router.py       Module 1
      ai_router.py             Module 2
      distribution_router.py  Module 3
      analytics_router.py      Module 3
  seed.py               Demo data seeding script
  requirements.txt

frontend/
  src/
    pages/              Login, Dashboard, Audience, Campaigns, CampaignDetail
    components/         Sidebar, StatCard, ProtectedRoute
    context/AuthContext.jsx
    api.js               Axios client with JWT interceptor
```

## Notes for extending toward the full 8-week plan

- **Real channel integrations:** `distribution_router.py`'s `send_campaign` currently simulates delivery outcomes. Swap in real Email (SMTP/SendGrid), SMS (Twilio/MSG91), and WhatsApp Business API calls where the simulation logic sits — the data model (`Message`, `EngagementEvent`) already supports real delivery/webhook callbacks.
- **Auth hardening:** add refresh tokens and rate limiting before production use; `JWT_SECRET` must be set via environment variable, not left at its dev default.
- **Scale testing:** the Week 7–8 plan calls for load/stress testing with thousands of recipients — the current SQLite setup should be swapped for Postgres and the send loop batched/queued (e.g. via Celery/RQ) at that scale.
- **Indic NLP:** translation currently goes through the LLM directly; if you specifically want IndicTrans2 or Bhashini integration per the original brief, swap the implementation inside `ai_service.translate_content` — the router/schema layer above it doesn't need to change.
