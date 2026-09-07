# Visitors Web

Next.js frontend for `Visitors`, a China-first AI travel planner focused on executable domestic city trips.

## What This Package Contains

- Dual-entry start screen for quick planning and Xiaohongshu evidence-first planning
- Mobile-first three-step planning wizard
- Reservation evidence preview before final plan generation
- Result page with route, reservation risk, budget, checklist, map, parking, hotel-area, and graph panels
- Editable itinerary controls for locking stops, removing stops, and re-optimizing flexible route segments
- Showcase and share routes for portfolio recording
- Chinese / English switching and light / dark theme switching

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The backend should run from `../api` on `http://127.0.0.1:8000`. If needed, set:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## Useful Routes

- `/` opens the dual-entry homepage.
- `/plan/new?entry=quick` opens the normal planning flow.
- `/plan/new?entry=xiaohongshu` opens the evidence-first flow.
- `/showcase` opens the stable demo result page.
- `/showcase/share` opens the recording-friendly share view.

## Product Notes

Suzhou is a demo preset for recording and explanation. The actual product flow starts from manual input for any domestic China city.

The two most important frontend interactions are:

- Evidence preview: users parse reservation-sensitive notes before final generation.
- Editable result workflow: users lock, remove, and re-optimize stops instead of accepting a static generated itinerary.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run test
```

## Environment Variables

See `.env.example` for frontend keys. Most UI can still render without map keys, but AMap-dependent features degrade when keys are missing.
