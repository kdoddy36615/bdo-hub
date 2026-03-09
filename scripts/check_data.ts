import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
  // Sign in
  const { error: authErr } = await sb.auth.signInWithPassword({
    email: process.env.AUTO_LOGIN_EMAIL!,
    password: process.env.AUTO_LOGIN_PASSWORD!,
  });
  if (authErr) {
    console.log("Auth error:", authErr.message);
    return;
  }
  const { data: { user } } = await sb.auth.getUser();
  console.log("Auth OK, user:", user?.id);

  // Check questions
  const { data: q, error: qErr } = await sb.from("questions").select("id, question_text").limit(3);
  console.log("Questions:", q?.length ?? 0, qErr?.message ?? "OK");
  q?.forEach((x: any) => console.log("  -", x.question_text.slice(0, 60)));

  // Check resources
  const { data: r, error: rErr } = await sb.from("resources").select("id, title").limit(3);
  console.log("Resources:", r?.length ?? 0, rErr?.message ?? "OK");
  r?.forEach((x: any) => console.log("  -", x.title));

  // Check all tables
  for (const table of ["characters", "progression_items", "activities", "bosses", "playbooks"]) {
    const { data, error } = await sb.from(table).select("id").limit(1);
    console.log(`${table}: ${data?.length ?? 0} rows`, error?.message ?? "OK");
  }
}

check();
