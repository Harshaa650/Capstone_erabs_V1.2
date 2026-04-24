# ERABS — v1.2 (AI Assistant + Utilization Analytics + 12 resources)

Enterprise Resource Allocation & Booking System — a full-stack React + FastAPI
platform with **immersive 3D rooms**, **AI workspace concierge**, deep
**utilization analytics** and a carousel-driven dashboard.

---

## What's new in v1.2

### Sidebar & scroll
- Sidebar is now **sticky** — only the main content scrolls.

### Overview / Quick Book
- Quick-Book cards now use a **5 : 2 landscape ratio** (no more tall slivers).
- New **AI Assistant** panel sits directly below the Overview.
- Creative hero header with radial glow, animated blobs and CTA buttons.

### Resources page
- Compact **horizontal 2 × 2 cards** — image on the left, info on the right —
  so 4 rooms fit in the default viewport.
- Individual carousels rotate every 2 seconds.

### Room Detail (60 : 40 split)
- Taller layout, bigger swipeable gallery, styled animated booking form.
- **Booking bug fixed** — backend now validates against wall-clock hours,
  so `08:00 → 20:00` works across all timezones (including IST, where the
  previous UTC conversion caused rejects).
- Calendar and time inputs are bigger, labelled, with hover / focus glow.

### 12 resources · two new 3D scenes
- **10 meeting rooms** — each of the 5 scenes (`normal / large / medium / cabin / manager`) appears **twice**.
- **#11 Chess Lounge** (`scene_type: chess`) — custom three.js scene:
  two chess tables, stylised pieces, warm lounge lighting.
- **#12 Foosball Arena** (`scene_type: foosball`) — custom three.js scene:
  animated foosball table, rotating rods, LED scoreboard.
- Chess & Foosball require **no approval**.

### Seed history
- 90+ historical bookings spread across `admin`, `manager`, `employee` users
  so My Bookings, Approvals, Admin and Analytics pages all have real data
  out-of-the-box.

### New page — Utilization Analytics
Route: `/analytics`

- Peak hours bar chart
- Weekday area chart
- Interactive **day × hour heatmap**
- **Idle resources** panel ranked by estimated unused cost
- Per-resource utilization bars with color-coded tiers
- Scope toggle: *My data* vs *Org-wide* (manager/admin)
- Time window selector: 7 / 14 / 30 / 60 / 90 days

### AI Assistant (new) — Now powered by Groq! 🚀
Route: `/assistant` · also embedded on Overview.

- Natural-language chat powered by **Groq's Llama 3.3 70B** (ultra-fast inference).
- **Dynamic API key**: Users provide their own free Groq API key via UI.
- Context-aware: always receives the full, live resource catalogue.
- Quick-reply chips seed common queries.
- Live "next-hour availability" facts pre-injected for questions like
  *"find me a free room now"*.
- Persists chat history per user / session.
- Endpoints: `POST /api/ai/chat`, `POST /api/ai/validate-key`, `GET /api/ai/history`, `DELETE /api/ai/history`.
- **Get your free API key**: https://console.groq.com

**Setup**: See `GROQ_SETUP.md` and `HOW_TO_GET_GROQ_API_KEY.md` for detailed instructions.

---

## Running locally

### 1. Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**AI Assistant**: Users provide their own Groq API keys via the UI. Optionally, 
you can set `GROQ_API_KEY` in `backend/.env` as a fallback.

Get your free Groq API key at: https://console.groq.com

### 2. Frontend
```bash
cd frontend
yarn install
yarn dev           # http://localhost:5173
# or
yarn build && yarn preview
```

The Vite dev proxy forwards `/api/*` → `http://localhost:8000`.

---

## Demo credentials (seeded on first boot)

| role     | email              | password    |
|----------|--------------------|-------------|
| admin    | admin@erabs.io     | admin123    |
| manager  | manager@erabs.io   | manager123  |
| employee | employee@erabs.io  | employee123 |

Default DB: `sqlite:///./erabs.db`. Override via `DATABASE_URL` in `backend/.env`.

---

## Quick tour

1. Log in as any demo user.
2. Dashboard → scroll: the sidebar stays, only the right pane scrolls.
3. Scroll to **AI Assistant** → Click 🔑 to enter your Groq API key (get free at console.groq.com).
4. Try asking: *"Find me a free room for 4 people"* or *"Show me today's bookings"*.
5. Open **Resources** → 2 × 2 grid of horizontal cards, each with a 2 s carousel.
6. Click any room → 3D scene on the left (drag/zoom), description + booking on the right.
7. Pick a date + `09:00 → 11:00` → Confirm booking. It now works.
8. Sidebar → **Analytics** for peak hours, idle resources and unused-cost.
9. Sidebar → **AI Assistant** for the fullscreen chat experience.
10. Log in as *admin* to see 8+ pending approvals.

---

## 🤖 AI Assistant Setup

The AI Assistant uses **Groq** for ultra-fast AI responses powered by Llama 3.3 70B.

### Quick Setup:
1. Get a free API key at https://console.groq.com
2. Open the AI Assistant in ERABS
3. Click the 🔑 key icon
4. Paste your API key and click "Save & Validate"
5. Start chatting!

### Documentation:
- **Setup Guide**: `GROQ_SETUP.md`
- **Get API Key**: `HOW_TO_GET_GROQ_API_KEY.md`
- **Technical Details**: `AI_ASSISTANT_CHANGES.md`
- **Migration Summary**: `MIGRATION_SUMMARY.md`

### Features:
- ⚡ Ultra-fast responses (~300 tokens/second)
- 🔑 Dynamic API key management
- 💰 Free tier available
- 🎯 Context-aware (knows all resources)
- 💬 Persistent chat history
- 🛡️ Secure (keys stored client-side)
