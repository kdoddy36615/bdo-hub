# BDO Command Center - Progress

## Phase 1: Architecture + DB + Scaffolding - COMPLETE

### Infrastructure
- [x] Monorepo with pnpm workspaces (apps/web + packages/db)
- [x] Next.js 16 with React 19, TypeScript strict, TailwindCSS v4
- [x] shadcn/ui initialized (19 components: sidebar, dialog, tabs, table, etc.)
- [x] Supabase auth with middleware (client, server, session refresh)
- [x] Theme provider with dark/light toggle
- [x] `.env.local` configured with Supabase credentials
- [x] Build passes cleanly

### Database (15+ tables)
- [x] profiles, characters, character_tags
- [x] progression_items, activities, activity_completions
- [x] bosses, boss_alts, boss_history
- [x] playbooks, playbook_steps
- [x] resources, questions, answers
- [x] storage_tabs, gathering_items, user_settings
- [x] Full RLS policies, indexes, updated_at triggers
- [x] Migrations run successfully on Supabase
- [x] Seed data populated (bosses, gathering items, user data)

### Pages Built (11 modules)
- [x] Dashboard - gear score, progression %, daily/weekly reset countdowns, boss list, characters
- [x] Progression - tabbed by category, add items with priority/difficulty, click-to-toggle status
- [x] Activities - daily/weekly checklist with live countdown timers, completion tracking
- [x] Boss Tracker - priority-grouped bosses, alt assignment, kill logging, history
- [x] Characters - CRUD with class/AP/AAP/DP, gear score calc, tagging system
- [x] Playbooks - expandable checklists, create from text, session-based check state
- [x] Resources - searchable library with tags, type filtering, external links
- [x] Storage - 10-tab warehouse planner with "Load Defaults"
- [x] Gathering - reference table from seeded data
- [x] Mentor Q&A - questions with expandable answers, confidence levels, source tracking
- [x] Settings - profile, timezone, reset times, theme toggle

### Auth
- [x] Login page
- [x] Signup page
- [x] Middleware auth protection
- [x] Auto-profile creation on signup

---

## Phase 2: Refinement - COMPLETE

### UI/UX Polish
- [x] Edit/delete on all CRUD operations (progression, characters, activities, playbooks, resources, storage, mentor)
- [x] Inline editing for progression items, characters, etc.
- [x] Confirmation dialogs for destructive actions
- [x] Toast notifications for success/error feedback (sonner)
- [x] Loading states and skeletons (dashboard, progression, activities, bosses, characters)
- [x] Mobile responsiveness pass (responsive padding, existing grid breakpoints verified)

### Feature Enhancements
- [x] Boss spawn timer calculations with live countdowns per boss
- [x] Character gear score visualization with color-coded indicators
- [x] Activity completion history view (History tab with date grouping)
- [x] Dashboard quick actions (one-click boss log, activity complete)
- [x] Settings persistence to user_settings table
- [x] Progression item sorting/filtering (sort by priority/difficulty/name/status, filter by status)

### Deferred to Phase 3
- [ ] Playbook step reordering (drag and drop - requires dnd library)
- [ ] Resource verification dates
- [ ] Import/export functionality
- [ ] Boss schedule JSON upload
- [ ] Bulk operations

---

## Phase 3: Integrations - IN PROGRESS

- [x] Git repository setup + initial commit (https://github.com/kdoddy36615/bdo-hub)
- [x] Vercel deployment (https://bdo-hub.vercel.app)
- [ ] Event integration (BDO news scraping)
- [ ] Optional community boss timer API config
- [ ] Garmoth build link integration
- [ ] Export dashboard to PDF
