import type { Metadata } from "next";
import { SectionPage } from "../components/SectionPage";

export const metadata: Metadata = { title: "Giving" };

export default function GivingPage() {
  return <SectionPage sectionKey="giving" />;
}
