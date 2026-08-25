import type { Metadata } from "next";
import { GalleryPage } from "../components/GalleryPage";

export const metadata: Metadata = {
  title: "Photo Gallery",
  description:
    "Approved photo albums from PDF community events, relief activities and gatherings.",
};

export default function Gallery() {
  return <GalleryPage />;
}
