import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function run() {
  const { error: authErr } = await sb.auth.signInWithPassword({
    email: process.env.AUTO_LOGIN_EMAIL!,
    password: process.env.AUTO_LOGIN_PASSWORD!,
  });
  if (authErr) { console.error("Auth failed:", authErr.message); return; }
  const { data: { user } } = await sb.auth.getUser();
  console.log("Signed in as", user?.id);

  // Insert as a Mentor Q&A question with the info baked in
  const { error } = await sb.from("questions").insert({
    user_id: user!.id,
    question_text: "What are the Imperial Fishing reset times and tips?",
    tags: ["fishing", "imperial", "life-skill", "timer", "reference"],
  });
  if (error) { console.error("Question insert failed:", error.message); return; }
  console.log("Inserted question");

  // Get the question we just inserted
  const { data: questions } = await sb
    .from("questions")
    .select("id")
    .eq("question_text", "What are the Imperial Fishing reset times and tips?")
    .limit(1);

  if (!questions?.length) { console.error("Could not find inserted question"); return; }

  const questionId = questions[0].id;

  // Add the answer with the detailed info
  const { error: ansErr } = await sb.from("answers").insert({
    question_id: questionId,
    answer_text: `Key Details on Imperial Fishing Resets:

Cycle: Every 3 hours.

Common Times (EST): 2 AM, 5 AM, 8 AM, 11 AM, 2 PM, 5 PM, 8 PM, 11 PM.

Tips: If the NPC is sold out, try changing channels or visiting less populated, distant towns like Valencia City, Dreighan, or O'draxxia.

Note: If you are logged in during a reset, you may need to swap characters or servers to see the new inventory.`,
    source_type: "personal",
    confidence: "verified",
  });

  if (ansErr) console.error("Answer insert failed:", ansErr.message);
  else console.log("Inserted answer with fishing details");
}

run();
