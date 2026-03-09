# BDO Hub — STATUS

> Last reviewed: 2026-03-09 | Codebase: ~8,300 LOC across 69 files | Tests: 27 passing (5 files)

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

### All 11 Module Pages
- Dashboard, Characters, Character Tags, Bosses, Activities, Progression, Playbooks, Resources, Gathering, Mentor Q&A, Storage, Settings
- Full CRUD with Dialog forms, toast feedback, loading skeletons
- Auth flow: middleware auto-login, redirect guards on /login and /signup

---

## Architecture Review (Mar 2026)

### P0 — Bugs / Silent Failures

#### `useSupabaseFetch` swallows all errors
- **File**: `lib/hooks/use-supabase-fetch.ts:16-19`
- `.then()` with no `.catch()`. Network failures, auth expiry, and RLS violations all silently vanish. Loading stays true forever on error, or shows stale initial data.
- **Fix**: Add `error` state, `.catch()` handler, expose error to components, show toast or error UI.

#### Supabase query errors coerced to empty arrays
- Every fetcher does `a.data ?? []` without checking `a.error`. A query returning `{ data: null, error: "..." }` silently becomes an empty list.
- **Fix**: Check `.error` on each query response inside fetchers. Throw or surface errors.

#### Boss schedule data is stale
- Seed data has 10 bosses from pre-Dec 2025. PA overhauled timetable Dec 24, 2025 — new bosses (Bulgasal, Uturi, Sangoon, Golden Pig King), max 2 simultaneous spawns, different time slots.
- **Fix**: Update `bosses` table and `spawn_schedule` JSON. See TODO section.

### P1 — Correctness / Data Integrity

#### `getCurrentWeeklyPeriod()` has flawed week calculation
- **File**: `lib/timers.ts:90-97`
- Non-ISO week numbering. Near year boundaries (late Dec / early Jan), can attribute activity completions to wrong week — weekly tasks may appear incomplete after the year rolls over even though BDO reset hasn't happened.
- **Fix**: Use proper ISO 8601 week calculation or key on the Wednesday reset date directly.

#### `getESTOffset()` has dead code and fragile DST detection
- **File**: `lib/timers.ts:102-113`
- Lines 104-106 compute `stdOffset` (unused). DST detected by parsing locale strings — works but untested around the DST transition hour.
- **Fix**: Remove dead variable, add DST edge case tests, consider using `Intl.DateTimeFormat` `resolvedOptions().timeZone` approach.

#### Unbounded `activity_completions` query on dashboard
- **File**: `components/dashboard/dashboard-content.tsx:81`
- `supabase.from("activity_completions").select("*")` — no limit, no date filter. After months of use, fetches thousands of rows when only current period matters.
- **Fix**: Filter by `reset_period` or add date range.

### P2 — Code Quality / Maintainability

#### Duplicated `isCompleted()` logic
- Identical function in `dashboard-content.tsx:131-138` and `activities-content.tsx:64-71`. Same period lookup, same `.some()` check.
- **Fix**: Extract to shared utility in `lib/timers.ts` or `lib/utils.ts`.

#### `createClient()` called per-event-handler
- Every mutation creates a fresh Supabase browser client. Supabase SDK is designed for shared singleton per browser context.
- **Fix**: Create once at module scope or use React context. Current approach works but wastes resources.

#### UserSettings.timezone is unused
- Settings page lets users configure timezone but every timer function hardcodes `America/New_York`.
- **Fix**: Either use the setting in timer calculations, or remove the timezone field from Settings UI to avoid confusion.

#### Type assertions instead of Supabase generics
- All queries cast: `(c.data as Character[])`. Supabase supports typed queries via `supabase gen types typescript`.
- **Fix**: Generate types, use `supabase.from<Database>()`. Catches schema drift at compile time.

#### 500+ line monolith components
- `dashboard-content.tsx` (500 lines), `bosses-content.tsx` (589 lines).
- **Fix**: Extract sub-components (StatsGrid, BossHero, ActivityChecklist, SpawnTimer, etc.).

#### `next-themes` is a dead dependency
- Installed in package.json but unused (custom `theme-provider.tsx` instead).
- **Fix**: `pnpm remove next-themes`.

### P3 — Low Priority

- Theme stored in localStorage + `user_settings.theme` — dual source of truth
- No optimistic UI updates (every mutation → full refetch)
- `window.print()` for PDF export is basic
- No per-section loading skeletons (entire page skeleton on any query)
- `BossAltWithChar` defined inline in `bosses-content.tsx`, should be in `types.ts`
- Test coverage: 5 test files for 69 source files. Zero component rendering tests.

---

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

---

## TODO — What To Do Next

### Sprint 1: Fix the Foundation (do this first)
These are bugs or correctness issues that will cause real problems as you use the app.

- [ ] **Fix `useSupabaseFetch` error handling** — Add `.catch()`, `error` state, surface failures to user. This is the #1 issue.
- [ ] **Check `.error` in Supabase fetchers** — Every `a.data ?? []` should first check `a.error` and throw/toast.
- [ ] **Fix `getCurrentWeeklyPeriod()`** — Replace with ISO 8601 week calc or Wednesday-anchored period key.
- [ ] **Add date filter to dashboard completions query** — Filter `activity_completions` to current period only.
- [ ] **Remove dead `stdOffset` variable** in `timers.ts:104-106`.
- [ ] **Remove `next-themes`** dead dependency.

### Sprint 2: Boss Schedule + Data Quality
- [ ] **Update Boss Schedule to Dec 2025 Patch** — Add Bulgasal, Uturi, Sangoon, Golden Pig King. Update all spawn_schedule JSON. Source: official timetable at `naeu.playblackdesert.com/en-US/Wiki?wikiNo=83` or BDO Alerts API.
- [ ] **Extract shared `isCompleted()` utility** — One function used by dashboard and activities.
- [ ] **Supabase singleton** — Create client once per context, not per event handler.
- [ ] **Move `BossAltWithChar` to `types.ts`**.

### Sprint 3: New Features
- [ ] **Arsha.io Market Integration** — Add market price lookup for commonly needed items (enhancement mats, boss gear). API is free and confirmed working.
- [ ] **Adventure Log / Family Buff Tracker** — Track permanent family-wide AP/DP from quests (Bartali's Log, Kama +1DP, O'dyllita +1AP, LoML, Kzarka kills). Static checklist with ~+10 AP / +10 DP total potential.
- [ ] **Generate Supabase types** — `supabase gen types typescript` for compile-time schema safety.

### Sprint 4: Code Quality
- [ ] **Break up monolith components** — Split dashboard-content.tsx and bosses-content.tsx into sub-components.
- [ ] **Respect user timezone setting** — Wire `UserSettings.timezone` into timer calculations, or remove the field.
- [ ] **Add component tests** — At minimum: dashboard render, activity toggle, boss kill logging.
- [ ] **Add DST edge case tests** for timer functions.

### Backlog
- [ ] Grind Spot Reference (static dataset)
- [ ] BDO Alerts API Integration (apply for key)
- [ ] Curated Guide Links expansion
- [ ] "System" theme (OS prefers-color-scheme)
- [ ] Theme transition animation
- [ ] Sync theme to Supabase user_settings
- [ ] Per-chart theme-aware color palettes
- [ ] Optimistic UI updates
- [ ] Per-section loading skeletons

### Not Feasible
- Scraping garmoth.com (blocked + TOS)
- Embedding BDO Foundry map (X-Frame-Options blocks it)
- Pearl Abyss official API (doesn't exist)
