import type { Metadata } from "next";
import { SectionPage } from "../components/SectionPage";

export const metadata: Metadata = { title: "News & Stories" };

export default function StoriesPage() {
  return <SectionPage sectionKey="stories" />;
}

