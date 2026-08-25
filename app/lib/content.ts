export type PostStatus = "draft" | "review" | "published";
export type PublicPlacement =
  | "about"
  | "our-work"
  | "stories"
  | "approach"
  | "get-involved";

export interface CommunityPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: "Field notes" | "Learning" | "Events";
  placement: PublicPlacement;
  status: PostStatus;
  channels: string[];
  date: string;
  author: string;
  visualLabel: string;
  mediaId?: number | null;
  mediaIds?: number[];
  mediaUrl?: string | null;
  mediaType?: string | null;
  mediaAlt?: string;
  gallery?: Array<{
    id: number;
    url: string;
    contentType: string;
    alt: string;
  }>;
  scheduledAt?: string | null;
}

export const seedPosts: CommunityPost[] = [
  {
    id: 1,
    slug: "community-table-takes-shape",
    title: "A community table takes shape",
    excerpt:
      "A field note about people meeting, listening and deciding what support should look like next.",
    body:
      "This is preview content for the design system. It will be replaced by an authorized historical post during content migration.",
    category: "Field notes",
    placement: "stories",
    status: "published",
    channels: ["Website", "Facebook", "Telegram"],
    date: "26 JUL 2026",
    author: "Community editor",
    visualLabel: "LISTEN • PLAN • ACT",
  },
  {
    id: 2,
    slug: "learning-belongs-everywhere",
    title: "Learning belongs everywhere",
    excerpt:
      "A flexible workshop format helps neighbours share practical knowledge without barriers or complicated systems.",
    body:
      "This is preview content for the design system. It will be replaced by an authorized historical post during content migration.",
    category: "Learning",
    placement: "stories",
    status: "published",
    channels: ["Website", "Email"],
    date: "21 JUL 2026",
    author: "Community editor",
    visualLabel: "SHARE WHAT YOU KNOW",
  },
  {
    id: 3,
    slug: "open-day-small-conversations",
    title: "An open day built from small conversations",
    excerpt:
      "The best community events do more than fill a room—they make space for the next relationship to begin.",
    body:
      "This is preview content for the design system. It will be replaced by an authorized historical post during content migration.",
    category: "Events",
    placement: "stories",
    status: "published",
    channels: ["Website", "Facebook", "Telegram", "Email"],
    date: "17 JUL 2026",
    author: "Community editor",
    visualLabel: "COME AS YOU ARE",
  },
];
