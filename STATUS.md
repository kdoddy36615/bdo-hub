# BDO Hub — STATUS

## Completed

### 12-Theme System
- 12 themes (6 dark, 6 light) with CSS variables in oklch color space
- Theme selector in header (Dialog-based), full grid in Settings page
- Persisted to localStorage with flash prevention and migration from old key
- See `apps/web/lib/themes.ts` for theme metadata

### Boss Timer "Next Boss" Hero
- Added Previous / Next / Followed By spawn display at top of Boss Tracker page
- Groups bosses spawning at the same time (within 5min window)
- Shows countdown + boss names + spawn time in EST
- Reuses existing spawn schedule data from Supabase

### Dashboard Resource Links
- Added: Garmoth Boss Timer, BDO Foundry Map, AP/DP Increase Quests, Weight Limit Guide, Arsha.io Market
- Reorganized link order by usefulness

## Research Findings — Garmoth / External Data Integration

### Boss Timer Data
- **Boss schedules are STATIC** — Pearl Abyss publishes a fixed weekly timetable that changes a few times per year
- Sites like garmoth.com are just countdown clocks based on the known schedule
- Events can temporarily alter schedules (announced via patch notes)
- **Our current implementation is correct** — static SpawnWindow data in Supabase is the right approach
- When PA changes the schedule, just update the `bosses` table `spawn_schedule` column

### Available APIs (NOT garmoth — they block scraping and TOS prohibits it)
- **Arsha.io** (`api.arsha.io`) — Free, no auth, open-source Central Market data. Confirmed working. Items, prices, stock, trade volumes for NA/EU/KR.
- **BDO Alerts** (`api.bdoalerts.net`) — Free API key (Discord application, 24-48h). Boss timers, market data, player profiles, news. 100 req/min, 5k/day.
- **Pearl Abyss** — No official public API

### Garmoth.com — DO NOT SCRAPE
- Returns 403 on automated requests (bot protection)
- TOS explicitly prohibits scraping, replication, or unauthorized API use
- Potential legal consequences
- Use legitimate alternatives (arsha.io, BDO Alerts, static data) instead

### BDO Foundry Map — Cannot Embed
- Uses Leaflet.js with locally-hosted tiles
- `X-Frame-Options: SAMEORIGIN` blocks iframe embedding
- Best approach: link out with coordinates in URL hash (already implemented in dashboard links)

### Grind Spot Data
- No legitimate public API for grind spot silver/hr data
- Garmoth's grind tracker is unique — no open alternative
- Options: maintain curated static dataset from community wikis, or just link to garmoth

## TODO — Future Features

### High Priority
- [ ] **Arsha.io Market Integration** — Add market price lookup for commonly needed items (enhancement mats, boss gear). API is free and confirmed working.
- [ ] **Adventure Log / Family Buff Tracker** — Track permanent family-wide AP/DP from quests (Bartali's Log, Kama +1DP, O'dyllita +1AP, LoML, Kzarka kills). Static checklist with ~+10 AP / +10 DP total potential.
- [ ] **Update Boss Schedule** — Verify current schedule against latest PA timetable. Consider fetching from BDO Alerts API for auto-updates.

### Medium Priority
- [ ] **Grind Spot Reference** — Static dataset of popular grind spots with AP/DP requirements, region, estimated silver/hr
- [ ] **BDO Alerts API Integration** — Apply for free API key, integrate boss timer auto-updates and market data
- [ ] **Curated Guide Links** — Expand resources with more community guides (gear upgrade paths, lifeskill guides)

### Low Priority / Theme System
- [ ] Add "System" theme option (follows OS prefers-color-scheme)
- [ ] Theme transition animation
- [ ] Store theme preference in Supabase user_settings
- [ ] Per-chart theme-aware color palettes

### Not Feasible
- Scraping garmoth.com (blocked + TOS)
- Embedding BDO Foundry map (X-Frame-Options blocks it)
- Pearl Abyss official API (doesn't exist)
