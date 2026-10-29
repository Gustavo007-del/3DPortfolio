import type { Metadata } from "next";
import StoryExperience from "@/components/Story/StoryExperience";

export const metadata: Metadata = {
  title: "The Story | Shijil P",
  description: "A self-playing visual story about turning ideas into experiences.",
};

export default function StoryPage() {
  return <StoryExperience />;
}
