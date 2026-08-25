import type { Metadata } from "next";
import { SectionPage } from "../components/SectionPage";

export const metadata: Metadata = { title: "Our Approach" };

export default function ApproachPage() {
  return <SectionPage sectionKey="approach" />;
}

