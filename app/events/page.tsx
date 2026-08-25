import type { Metadata } from "next";
import { EventsPage } from "../components/EventsPage";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Upcoming gatherings, briefings, solidarity events and community workshops published by PDF administrators.",
};

export default function Events() {
  return <EventsPage />;
}
