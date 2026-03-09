# BDO Hub

Personal Black Desert Online progression dashboard.

## Features

- **Dashboard** -- At-a-glance overview of your account progress and daily/weekly tasks.
- **Characters** -- Manage your character roster with class, level, and gear details.
- **Progression** -- Track long-term goals like gear enhancement milestones and skill levels.
- **Activities** -- Log daily and weekly activities such as quests, grinding, and lifeskills.
- **Bosses** -- Monitor world boss schedules with "Next Boss" hero display, spawn countdowns, and attendance tracking.
- **Playbooks** -- Save and share step-by-step guides for grind rotations, enhancing, and more.
- **Resources** -- Catalog materials, recipes, and other in-game resource references.
- **Gathering** -- Plan gathering routes and track node empire output.
- **Storage** -- Keep an inventory of items across town storages and the central market.
- **Mentor Q&A** -- AI-powered assistant for answering BDO gameplay questions.
- **Settings** -- Configure account preferences and choose from 12 visual themes (6 dark, 6 light).

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- React 19
- TypeScript (strict)
- Supabase (Auth + PostgreSQL + RLS)
- TailwindCSS v4
- shadcn/ui (base-ui)
- Sonner (toast notifications)
- pnpm workspaces (monorepo)
- Deployed on Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase project

### Setup

1. Clone the repo:

   ```bash
   git clone https://github.com/your-username/bdo-hub.git
   cd bdo-hub
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Copy `.env.example` to `apps/web/.env.local` and fill in your Supabase credentials:

   ```bash
   cp .env.example apps/web/.env.local
   ```

4. Start the dev server:

   ```bash
   pnpm --filter @bdo-hub/web dev
   ```

### Running Tests

```bash
pnpm --filter @bdo-hub/web test
```

## Project Structure

```
bdo-hub/
├── apps/web/          # Next.js web app
│   ├── app/(app)/     # App routes (dashboard, characters, etc.)
│   ├── components/    # Shared UI components
│   ├── lib/           # Utilities, types, hooks, Supabase clients
│   └── public/        # Static assets
├── packages/db/       # Database package (shared types)
├── scripts/           # Seed scripts
└── vercel.json        # Deployment config
```

## Deployment

Deployed on Vercel. Push to `master` triggers auto-deploy. Environment variables are configured in the Vercel dashboard.

## License

MIT
