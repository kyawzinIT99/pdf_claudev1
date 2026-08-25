import type { Metadata } from "next";
import { SectionPage } from "../components/SectionPage";

export const metadata: Metadata = { title: "Get Involved" };

export default function GetInvolvedPage() {
  return <SectionPage sectionKey="get-involved" />;
}
