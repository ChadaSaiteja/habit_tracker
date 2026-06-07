# Habit Tracker

> Track your daily habits with a monthly grid, streaks, and a live progress chart.

## 🌐 Live URLs

| Platform | URL |
|---|---|
| **Cloudflare Workers** | https://habitracker.chadasaiteja.workers.dev |
| **GitHub Pages** | https://chadasaiteja.github.io/habit_tracker/ |

---

## Features

- **Monthly grid** — full calendar sheet for any past or current month
- **Today-only editing** — past days are locked; future days are dimmed
- **Streaks** — per-habit consecutive-day streak counter with fire/lightning emoji
- **Daily progress chart** — SVG line graph of completions across the month
- **Drag-to-reorder** — rearrange habits by dragging rows
- **Inline rename** — click a habit name to edit it in place
- **Suggestions** — one-click quick-add for common habits
- **Persistent storage** — data saved in `localStorage` (per browser/device)
- **PWA ready** — includes `manifest.webmanifest` for installability
- **Responsive** — works on mobile and desktop

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Plain HTML + CSS + Vanilla JS (no frameworks) |
| Fonts | Inter via Google Fonts |
| Hosting | Cloudflare Workers (assets mode) / GitHub Pages |
| Storage | Browser `localStorage` |

---

## Run locally

```bash
# Any static server works, e.g.:
npx serve .
# then open http://localhost:3000
```

Or just open `index.html` directly in a browser.

---

## Deploy

### Cloudflare Workers
```bash
npx wrangler deploy
```
Configured in `wrangler.jsonc` — deploys the whole folder as static assets under the name `habitracker`.

### GitHub Pages
1. Go to **Settings → Pages** in this repository.
2. Set source to **Deploy from a branch → `main` / `/ (root)`**.
3. Save — the site will be live at `https://chadasaiteja.github.io/habit_tracker/`.

---

## Data & privacy

All data is stored **locally in your browser** via `localStorage`. Nothing is sent to any server. Clearing browser data will erase your habits and history.
