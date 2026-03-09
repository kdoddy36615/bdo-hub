export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Character {
  id: string;
  user_id: string;
  name: string;
  class_name: string;
  level: number;
  ap: number;
  aap: number;
  dp: number;
  gear_score: number;
  is_main: boolean;
  notes: string | null;
  last_played: string | null;
  created_at: string;
  updated_at: string;
}

export interface CharacterTag {
  id: string;
  user_id: string;
  main_character_id: string;
  tagged_character_id: string;
  gear_copied: string | null;
  marni_fuel_used: number;
  notes: string | null;
  created_at: string;
}

export interface ProgressionItem {
  id: string;
  user_id: string;
  title: string;
  category: "combat" | "lifeskill" | "journal" | "gear" | "quest" | "other";
  status: "not_started" | "in_progress" | "completed" | "skipped";
  priority: "critical" | "high" | "medium" | "low";
  difficulty_est: "easy" | "medium" | "hard" | "extreme" | null;
  notes: string | null;
  refs: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  name: string;
  category: "daily" | "weekly" | "event" | "other";
  reset_type: "daily" | "weekly" | "biweekly" | "monthly" | "custom";
  reset_day: number | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface ActivityCompletion {
  id: string;
  activity_id: string;
  user_id: string;
  completed_at: string;
  reset_period: string;
  notes: string | null;
}

export interface ActivityCompletionWithActivity extends ActivityCompletion {
  activities: {
    name: string;
    reset_type: string;
  } | null;
}

export interface Boss {
  id: string;
  name: string;
  priority: "high" | "medium" | "low";
  spawn_type: "field" | "world" | "special";
  spawn_schedule: SpawnWindow[];
  location: string | null;
  notable_drops: string[];
  notes: string | null;
}

export interface SpawnWindow {
  days: number[];
  times: string[];
}

export interface BossAlt {
  id: string;
  user_id: string;
  boss_id: string;
  character_id: string;
  notes: string | null;
  last_used: string | null;
  created_at: string;
}

export interface BossHistory {
  id: string;
  user_id: string;
  boss_id: string;
  date: string;
  attended: boolean;
  fragments_obtained: number;
  drops: string | null;
  notes: string | null;
}

export interface Playbook {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: "grinding" | "boss" | "lifeskill" | "enhancing" | "fishing" | "weekly" | "other" | null;
  created_at: string;
  updated_at: string;
}

export interface PlaybookStep {
  id: string;
  playbook_id: string;
  step_number: number;
  title: string;
  content: string | null;
  is_optional: boolean;
}

export interface Resource {
  id: string;
  user_id: string;
  title: string;
  url: string | null;
  resource_type: "guide" | "tool" | "video" | "wiki" | "discord" | "other" | null;
  author: string | null;
  date_verified: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
}

export interface Question {
  id: string;
  user_id: string;
  question_text: string;
  tags: string[];
  created_at: string;
}

export interface Answer {
  id: string;
  question_id: string;
  answer_text: string;
  source_url: string | null;
  source_type: "mentor" | "guide" | "wiki" | "personal" | "other" | null;
  confidence: "low" | "medium" | "high" | "verified" | null;
  verified_date: string | null;
  created_at: string;
}

export interface StorageTab {
  id: string;
  user_id: string;
  tab_number: number;
  label: string;
  description: string | null;
  color: string | null;
}

export interface GatheringItem {
  id: string;
  name: string;
  category: string;
  use_description: string | null;
  why_it_matters: string | null;
  is_gathering_exclusive: boolean;
  market_availability: string | null;
}

export interface UserSettings {
  id: string;
  user_id: string;
  daily_reset_time: string;
  weekly_reset_day: number;
  timezone: string;
  notification_enabled: boolean;
  theme: string;
  updated_at: string;
}
