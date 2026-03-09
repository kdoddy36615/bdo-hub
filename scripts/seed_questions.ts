import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const email = process.env.AUTO_LOGIN_EMAIL!;
const password = process.env.AUTO_LOGIN_PASSWORD!;

const supabase = createClient(supabaseUrl, supabaseKey);

const QUESTIONS: { question_text: string; tags: string[] }[] = [
  {
    question_text:
      "How do Ninja and Kunoichi compare for a player primarily interested in PvP long-term? Compare: difficulty, survivability, damage potential, common PvP roles, and which is more commonly played in high-level PvP.",
    tags: ["pvp", "ninja", "kunoichi", "class-comparison"],
  },
  {
    question_text:
      "If I want to tag a character purely for relaxed PvE grinding, which classes are currently considered the most brainless/easy to grind with? Are Valkyrie and Guardian still the main recommendations, or are there better options now?",
    tags: ["pve", "grinding", "tag", "class-choice"],
  },
  {
    question_text:
      "If my long-term goal is to main Ninja, is an evasion build still considered the standard endgame direction, or has the meta shifted toward DR builds?",
    tags: ["ninja", "gear", "evasion", "dr", "endgame"],
  },
  {
    question_text:
      "For Arena of Solare specifically, is it worth worrying about class choice? Do balance patches change the AoS meta frequently enough that class choice matters less?",
    tags: ["pvp", "arena-of-solare", "class-choice", "meta"],
  },
  {
    question_text:
      "To a newer player, grabs seem extremely powerful. Are grabs actually that strong in the current PvP meta, or do they mostly feel overpowered until you understand protections and spacing?",
    tags: ["pvp", "grabs", "cc", "mechanics"],
  },
  {
    question_text:
      "What is the best way to learn the protection gaps in other classes where you can land a CC?",
    tags: ["pvp", "cc", "protections", "learning"],
  },
  {
    question_text:
      "What is the best method to practice CC chains and damage combos? Is the Battle Arena training dummy sufficient, or are there better practice methods?",
    tags: ["pvp", "combos", "practice", "battle-arena"],
  },
  {
    question_text:
      "Are any life skills necessary or strongly recommended for progression, or can a player focused on PvE/PvP safely ignore them?",
    tags: ["life-skills", "progression", "pve"],
  },
  {
    question_text:
      "Is setting up a worker empire and node network still worth doing for a newer player today?",
    tags: ["workers", "nodes", "silver", "progression"],
  },
  {
    question_text:
      "Given the above goals (PvE grinding, PvP improvement, Ninja main), what should my priority order be?",
    tags: ["progression", "priorities", "ninja", "pve", "pvp"],
  },
];

async function main() {
  // Sign in
  const { error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (authError) {
    console.error("Auth failed:", authError.message);
    process.exit(1);
  }
  console.log("Signed in");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.error("No user after sign in");
    process.exit(1);
  }

  // Check existing questions to avoid duplicates
  const { data: existing } = await supabase
    .from("questions")
    .select("question_text");
  const existingTexts = new Set(
    (existing ?? []).map((q: { question_text: string }) =>
      q.question_text.slice(0, 50)
    )
  );

  let inserted = 0;
  for (const q of QUESTIONS) {
    if (existingTexts.has(q.question_text.slice(0, 50))) {
      console.log("Skipping (exists):", q.question_text.slice(0, 60) + "...");
      continue;
    }

    const { error } = await supabase.from("questions").insert({
      user_id: user.id,
      question_text: q.question_text,
      tags: q.tags,
    });

    if (error) {
      console.error("Insert failed:", error.message, q.question_text.slice(0, 40));
    } else {
      inserted++;
      console.log("Inserted:", q.question_text.slice(0, 60) + "...");
    }
  }

  console.log(`Done: ${inserted} questions inserted`);
}

main();
