import type { Metadata } from "next";
import { SectionPage } from "../components/SectionPage";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return <SectionPage sectionKey="about" />;
}

