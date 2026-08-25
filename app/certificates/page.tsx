import type { Metadata } from "next";
import { SectionPage } from "../components/SectionPage";

export const metadata: Metadata = { title: "Certificates" };

export default function CertificatesPage() {
  return <SectionPage sectionKey="certificates" />;
}
