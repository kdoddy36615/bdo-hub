import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const email = process.env.AUTO_LOGIN_EMAIL!;
const password = process.env.AUTO_LOGIN_PASSWORD!;

const supabase = createClient(supabaseUrl, supabaseKey);

const RESOURCES: {
  title: string;
  url: string;
  resource_type: string;
  author: string;
  tags: string[];
}[] = [
  {
    title: "GrumpyG Horses Guide",
    url: "https://grumpygreen.cricket/bdo-horse/?cn-reloaded=1",
    resource_type: "guide",
    author: "GrumpyGreenCricket",
    tags: ["horses", "training", "life-skill"],
  },
  {
    title: "GrumpyG Hunting Guide",
    url: "https://grumpygreen.cricket/bdo-hunting-guide-eminent/",
    resource_type: "guide",
    author: "GrumpyGreenCricket",
    tags: ["hunting", "life-skill"],
  },
  {
    title: "Vital or Life Crystal via LoML Forest Crystal",
    url: "https://grumpygreen.cricket/life-skill-crystals/?cn-reloaded=1",
    resource_type: "guide",
    author: "GrumpyGreenCricket",
    tags: ["crystals", "life-skill", "LoML"],
  },
  {
    title: "Shim Cheong's Miraculous Fish Tank",
    url: "https://grumpygreen.cricket/bdo-fish-tank/",
    resource_type: "guide",
    author: "GrumpyGreenCricket",
    tags: ["fishing", "life-skill", "fish-tank"],
  },
  {
    title: "Fishing Lifeskill Guide",
    url: "https://www.blackdesertfoundry.com/fishing-guide/#Fishing_Gear_and_Buffs",
    resource_type: "guide",
    author: "BDFoundry",
    tags: ["fishing", "life-skill"],
  },
  {
    title: "bdolytics - The BDO Database",
    url: "https://bdolytics.com/en/NA",
    resource_type: "tool",
    author: "bdolytics",
    tags: ["database", "tool", "items", "market"],
  },
  {
    title: "Ancient Relic Scrolls Guide",
    url: "https://www.blackdesertfoundry.com/ancient-relic-scrolls-guide/",
    resource_type: "guide",
    author: "BDFoundry",
    tags: ["scrolls", "silver", "pve"],
  },
  {
    title: "Caphras Calculator",
    url: "https://garmoth.com/caphras-calculator",
    resource_type: "tool",
    author: "Garmoth.com",
    tags: ["caphras", "gear", "calculator", "enhancement"],
  },
  {
    title: "Garmoth Boss Timer",
    url: "https://garmoth.com/boss-timer",
    resource_type: "tool",
    author: "Garmoth.com",
    tags: ["bosses", "timer", "schedule"],
  },
  {
    title: "BDFoundry Interactive Map",
    url: "https://www.blackdesertfoundry.com/map/",
    resource_type: "tool",
    author: "BDFoundry",
    tags: ["map", "nodes", "exploration"],
  },
];

async function main() {
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

  // Check existing to avoid duplicates
  const { data: existing } = await supabase.from("resources").select("url");
  const existingUrls = new Set((existing ?? []).map((r: { url: string }) => r.url));

  let inserted = 0;
  for (const r of RESOURCES) {
    if (existingUrls.has(r.url)) {
      console.log("Skipping (exists):", r.title);
      continue;
    }

    const { error } = await supabase.from("resources").insert({
      user_id: user.id,
      title: r.title,
      url: r.url,
      resource_type: r.resource_type,
      author: r.author,
      tags: r.tags,
    });

    if (error) {
      console.error("Insert failed:", error.message, r.title);
    } else {
      inserted++;
      console.log("Inserted:", r.title);
    }
  }

  console.log(`Done: ${inserted} resources inserted`);
}

main();
