# BDO Command Center

Personal progression and knowledge management dashboard for Black Desert Online.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, TailwindCSS v4, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Deployment:** Vercel + Supabase

## Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Supabase CLI (`npm install -g supabase`)

## Local Development

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up Supabase

Create a new Supabase project at [supabase.com](https://supabase.com), then:

```bash
cp .env.example apps/web/.env.local
# Edit apps/web/.env.local with your Supabase credentials
```

### 3. Run database migrations

In the Supabase SQL Editor, run these files in order:

1. `packages/db/migrations/001_initial_schema.sql` - Creates all tables, RLS policies, indexes
2. `packages/db/migrations/002_seed_data.sql` - Seeds boss and gathering reference data

### 4. Start the dev server

```bash
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### 5. Seed user data (optional)

After creating an account and signing in, seed your personal data:

```bash
USER_ID=<your-supabase-user-id> npx tsx scripts/ingest_docs.ts
```

This parses `docs/bdo_progression_tabs_v9.html` and creates default progression items, playbooks, activities, resources, and storage layout.

## Project Structure

```
bdo-hub/
  apps/web/           Next.js application
    app/              App Router pages
    components/       React components (shadcn/ui + custom)
    hooks/            Custom React hooks
    lib/              Utilities, Supabase client, types
  packages/db/        Database migrations and seeds
    migrations/       SQL migration files
    seeds/            Seed data
  scripts/            Data ingestion scripts
  docs/               BDO reference documents
```

## Deployment

### Supabase

1. Push migrations to your Supabase project via the SQL Editor
2. Configure auth providers and email templates

### Vercel

1. Import the repository
2. Set root directory to `apps/web`
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

## Modules

| Module | Description |
|--------|-------------|
| Dashboard | Overview with gear score, reset timers, boss list |
| Progression | Track combat, gear, and journal progression |
| Activities | Time-gated daily/weekly checklist with countdowns |
| Boss Tracker | World boss schedule, alt assignment, kill history |
| Characters | Character profiles with AP/AAP/DP and tagging |
| Playbooks | Step-by-step checklists for gameplay workflows |
| Resources | Curated guide and tool library |
| Storage | Warehouse tab organization planner |
| Gathering | Gathering-exclusive item reference |
| Mentor Q&A | Store advice from experienced players |
| Settings | Timezone, reset times, theme preferences |
