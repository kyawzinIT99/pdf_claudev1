import type { Metadata } from "next";
import { SectionPage } from "../components/SectionPage";

export const metadata: Metadata = { title: "Our Work" };

export default function OurWorkPage() {
  return <SectionPage sectionKey="our-work" />;
}

