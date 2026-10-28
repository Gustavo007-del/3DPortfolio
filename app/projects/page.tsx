import type { Metadata } from "next";
import ProjectIndex from "@/components/Projects/ProjectIndex";

export const metadata: Metadata = {
  title: "Selected Projects | Shijil P",
  description: "Selected full-stack, mobile, and interactive projects by Shijil P.",
};

export default function ProjectsPage() {
  return <ProjectIndex />;
}
