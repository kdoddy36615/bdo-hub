import { createClient } from "@/lib/supabase/server";
import { MentorContent } from "./mentor-content";

export default async function MentorPage() {
  const supabase = await createClient();

  const { data: questions } = await supabase
    .from("questions")
    .select("*, answers(*)")
    .order("created_at", { ascending: false });

  return <MentorContent questions={questions ?? []} />;
}
