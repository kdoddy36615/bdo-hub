/**
 * BDO Command Center - Document Ingestion Script
 *
 * Parses bdo_progression_tabs_v9.html and extracts:
 * - Adventure Journals
 * - Progression roadmap items
 * - Storage layout
 * - Gathering exclusives
 *
 * Also seeds default playbooks from the project spec.
 *
 * Usage: npx tsx scripts/ingest_docs.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface IngestReport {
  timestamp: string;
  parsed: Record<string, number>;
  inserted: Record<string, number>;
  skipped: string[];
  errors: string[];
}

const report: IngestReport = {
  timestamp: new Date().toISOString(),
  parsed: {},
  inserted: {},
  skipped: [],
  errors: [],
};

// Parse v9 HTML
function parseV9HTML(): {
  journals: string[];
  progressionItems: { title: string; category: string; priority: string }[];
  storageLayout: { tab: number; label: string }[];
  gatheringItems: { name: string; use: string; why: string }[];
} {
  const htmlPath = resolve(__dirname, "../docs/bdo_progression_tabs_v9.html");
  const html = readFileSync(htmlPath, "utf-8");

  // Extract journals from the journals tab
  const journalMatches = html.match(/<div class="tab" id="journals">([\s\S]*?)<\/div>\s*<\/div>/);
  const journals: string[] = [];
  if (journalMatches) {
    const liRegex = /<li>(.*?)<\/li>/g;
    let match;
    while ((match = liRegex.exec(journalMatches[1])) !== null) {
      journals.push(match[1].trim());
    }
  }

  // Extract combat progression priorities
  const combatMatch = html.match(/<div class="tab active" id="combat">([\s\S]*?)<\/div>\s*<\/div>/);
  const progressionItems: { title: string; category: string; priority: string }[] = [];
  if (combatMatch) {
    const liRegex = /<li>(.*?)<\/li>/g;
    let match;
    let priority = 1;
    while ((match = liRegex.exec(combatMatch[1])) !== null) {
      progressionItems.push({
        title: match[1].trim().replace(/→/g, "->"),
        category: "combat",
        priority: priority <= 2 ? "high" : "medium",
      });
      priority++;
    }
  }

  // Extract storage layout
  const storageMatch = html.match(/<div class="tab" id="storage">([\s\S]*?)<\/div>\s*<\/div>/);
  const storageLayout: { tab: number; label: string }[] = [];
  if (storageMatch) {
    const trRegex = /<tr><td>(\d+)<\/td><td>(.*?)<\/td><\/tr>/g;
    let match;
    while ((match = trRegex.exec(storageMatch[1])) !== null) {
      storageLayout.push({ tab: parseInt(match[1]), label: match[2].trim() });
    }
  }

  // Extract gathering items
  const gatheringMatch = html.match(/<div class="tab" id="gathering">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/);
  const gatheringItems: { name: string; use: string; why: string }[] = [];
  if (gatheringMatch) {
    const trRegex = /<tr>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<\/tr>/g;
    let match;
    while ((match = trRegex.exec(gatheringMatch[1])) !== null) {
      // Skip header row
      if (match[1].includes("<th>")) continue;
      gatheringItems.push({
        name: match[1].trim(),
        use: match[2].trim(),
        why: match[3].trim(),
      });
    }
  }

  report.parsed = {
    journals: journals.length,
    progressionItems: progressionItems.length,
    storageLayout: storageLayout.length,
    gatheringItems: gatheringItems.length,
  };

  return { journals, progressionItems, storageLayout, gatheringItems };
}

// Default playbooks from spec
const DEFAULT_PLAYBOOKS = [
  {
    title: "Combat Grinding Playbook",
    category: "grinding",
    description: "Pre-grind checklist for combat sessions",
    steps: [
      "Repair gear",
      "Clear inventory",
      "Activate pets",
      "Apply food buff",
      "Apply draught",
      "Apply church/tent buffs",
      "Activate alchemy stone",
      "Equip crystal preset",
      "Verify artifact/lightstones",
      "Activate loot scroll (optional)",
    ],
  },
  {
    title: "AFK Fishing Playbook",
    category: "fishing",
    description: "Setup checklist for overnight AFK fishing",
    steps: [
      "Empty inventory",
      "Equip fishing rod",
      "Equip fishing clothes",
      "Confirm fishing artifacts",
      "Apply fishing food buff",
      "Start auto fishing",
      "Confirm safe location",
    ],
  },
  {
    title: "Boss Run Playbook",
    category: "boss",
    description: "Quick checklist before boss spawns",
    steps: [
      "Swap to boss alt",
      "Clear inventory",
      "Repair gear",
      "Activate pets",
      "Tag boss",
    ],
  },
  {
    title: "Weekly Reset Playbook",
    category: "weekly",
    description: "Weekly content to complete after reset",
    steps: [
      "Pit of the Undying",
      "Black Shrine",
      "Atoraxxion weekly",
    ],
  },
];

// Default resources from spec
const DEFAULT_RESOURCES = [
  { title: "Garmoth.com", url: "https://garmoth.com", resource_type: "tool", author: "Garmoth", tags: ["gear", "builds", "tools"] },
  { title: "BDO Codex", url: "https://bdocodex.com", resource_type: "wiki", author: "BDO Codex", tags: ["database", "items", "quests"] },
  { title: "BDO Foundry", url: "https://www.blackdesertfoundry.com", resource_type: "guide", author: "BDO Foundry", tags: ["guides", "classes"] },
  { title: "EvilDoUsHarm (YouTube)", url: "https://youtube.com/@EvilDoUsHarm", resource_type: "video", author: "EvilDoUsHarm", tags: ["guides", "tutorials"] },
];

async function seedData(userId?: string) {
  console.log("Starting data ingestion...\n");

  const parsed = parseV9HTML();
  console.log(`Parsed: ${parsed.journals.length} journals, ${parsed.progressionItems.length} progression items`);
  console.log(`        ${parsed.storageLayout.length} storage tabs, ${parsed.gatheringItems.length} gathering items\n`);

  // Note: Boss and gathering reference data is handled by 002_seed_data.sql migration
  // This script seeds user-specific data (requires a user_id)

  if (!userId) {
    console.log("No user_id provided. Skipping user-specific seed data.");
    console.log("To seed user data, pass USER_ID environment variable:");
    console.log("  USER_ID=<your-user-id> npx tsx scripts/ingest_docs.ts\n");

    report.skipped.push("User-specific data (no USER_ID provided)");
    writeReport();
    return;
  }

  // Seed progression items
  const progressionRows = parsed.progressionItems.map((item, i) => ({
    user_id: userId,
    title: item.title,
    category: item.category,
    priority: item.priority,
    status: "not_started",
    sort_order: i,
  }));

  // Add journal progression items
  parsed.journals.forEach((journal, i) => {
    progressionRows.push({
      user_id: userId,
      title: journal,
      category: "journal",
      priority: i < 3 ? "high" : "medium",
      status: "not_started",
      sort_order: progressionRows.length,
    });
  });

  const { error: progErr } = await supabase.from("progression_items").insert(progressionRows);
  if (progErr) {
    report.errors.push(`Progression items: ${progErr.message}`);
    console.error("Error inserting progression items:", progErr.message);
  } else {
    report.inserted.progressionItems = progressionRows.length;
    console.log(`Inserted ${progressionRows.length} progression items`);
  }

  // Seed default activities
  const defaultActivities = [
    { user_id: userId, name: "World Bosses", category: "daily", reset_type: "daily", sort_order: 0 },
    { user_id: userId, name: "Black Shrine", category: "weekly", reset_type: "weekly", sort_order: 1 },
    { user_id: userId, name: "Pit of the Undying", category: "weekly", reset_type: "weekly", sort_order: 2 },
    { user_id: userId, name: "Atoraxxion Weekly", category: "weekly", reset_type: "weekly", sort_order: 3 },
  ];

  const { error: actErr } = await supabase.from("activities").insert(defaultActivities);
  if (actErr) {
    report.errors.push(`Activities: ${actErr.message}`);
  } else {
    report.inserted.activities = defaultActivities.length;
    console.log(`Inserted ${defaultActivities.length} default activities`);
  }

  // Seed playbooks
  for (const pb of DEFAULT_PLAYBOOKS) {
    const { data: playbook, error: pbErr } = await supabase
      .from("playbooks")
      .insert({
        user_id: userId,
        title: pb.title,
        description: pb.description,
        category: pb.category,
      })
      .select()
      .single();

    if (pbErr) {
      report.errors.push(`Playbook ${pb.title}: ${pbErr.message}`);
      continue;
    }

    const stepRows = pb.steps.map((title, i) => ({
      playbook_id: playbook.id,
      step_number: i + 1,
      title,
    }));

    await supabase.from("playbook_steps").insert(stepRows);
  }
  report.inserted.playbooks = DEFAULT_PLAYBOOKS.length;
  console.log(`Inserted ${DEFAULT_PLAYBOOKS.length} playbooks`);

  // Seed resources
  const resourceRows = DEFAULT_RESOURCES.map((r) => ({
    user_id: userId,
    ...r,
  }));

  const { error: resErr } = await supabase.from("resources").insert(resourceRows);
  if (resErr) {
    report.errors.push(`Resources: ${resErr.message}`);
  } else {
    report.inserted.resources = resourceRows.length;
    console.log(`Inserted ${resourceRows.length} default resources`);
  }

  // Seed storage layout
  const storageRows = parsed.storageLayout.map((s) => ({
    user_id: userId,
    tab_number: s.tab,
    label: s.label,
  }));

  if (storageRows.length > 0) {
    const { error: stErr } = await supabase.from("storage_tabs").insert(storageRows);
    if (stErr) {
      report.errors.push(`Storage: ${stErr.message}`);
    } else {
      report.inserted.storageTabs = storageRows.length;
      console.log(`Inserted ${storageRows.length} storage tabs`);
    }
  }

  writeReport();
}

function writeReport() {
  const reportPath = resolve(__dirname, "ingest_report.json");
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport written to ${reportPath}`);

  if (report.errors.length > 0) {
    console.log(`\nErrors (${report.errors.length}):`);
    report.errors.forEach((e) => console.log(`  - ${e}`));
  }
}

const userId = process.env.USER_ID;
seedData(userId).catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
