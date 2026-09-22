# Free demo database recovery

The September 2026 recovery created a new database; it did not recover the missing project's historical records. Existing reference seeds and a small, explicitly labeled sample workspace are used instead.

For a fresh database, apply these files in one transaction: `001_initial_schema.sql`, `002_seed_data.sql`, `003_mentor_answers.sql`, `004_gear_slots.sql`, `006_daily_checklist.sql`, `007_grind_log.sql`, `008_answer_replies.sql`, then `20260922201511_isolate_demo_ownership.sql`. Do not expose the intermediate legacy schema: it contains permissive policies superseded by the final migration. Skip `004b_gear_seed.sql`; it is historical shared gear, not the isolated demo seed.

Enable Supabase anonymous sign-ins and preserve its default auth rate limits. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (a modern publishable key works despite the legacy variable name), and `NEXT_PUBLIC_DEMO_MODE=true` in Vercel. No service-role key is needed by the web app. Shared `AUTO_LOGIN_EMAIL` and `AUTO_LOGIN_PASSWORD` are no longer used.

Visitors explicitly select **Try a private demo**. Each receives an independent anonymous account and JWT-owned rows. The signup trigger creates illustrative characters, progression, activities and gear; user edits persist in Supabase. Clearing the session loses access to the anonymous account. This is not an account-recovery or cloud-sync promise.

`tests/demo_isolation.sql` verifies owner defaults, cross-user read/update rejection, forged-owner rejection, private mentor answers and rejection of unauthenticated table access. It runs inside a rollback, leaving no test accounts. Run Supabase security advisors after deployment. Its anonymous-user warnings are expected for this intentional demo: authenticated anonymous users can access only their own rows. There must be no permissive `USING (true)` or `WITH CHECK (true)` write policies.

Anonymous accounts consume Free database capacity. Supabase currently does not automatically clean them up. Review capacity before adding traffic, and use the documented anonymous-user cleanup only with an explicit retention decision. No automated deletion or paid service is configured by this release.

References: https://supabase.com/docs/guides/auth/auth-anonymous and https://supabase.com/docs/guides/database/postgres/row-level-security.
