import { MentorContent } from "./mentor-content";
import mentorData from "@/lib/mentor-data.json";

export default function MentorPage() {
  return <MentorContent questions={mentorData} />;
}
