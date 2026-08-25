export const sectionKeys = [
  "about",
  "our-work",
  "giving",
  "certificates",
  "stories",
  "approach",
  "get-involved",
] as const;

export type SectionKey = (typeof sectionKeys)[number];

export type SectionFeature = {
  number: string;
  title: string;
  description: string;
};

export type SectionDefinition = {
  key: SectionKey;
  label: string;
  eyebrow: string;
  title: string;
  summary: string;
  statement: string;
  features: [SectionFeature, SectionFeature, SectionFeature];
};

export const sectionDefinitions: Record<SectionKey, SectionDefinition> = {
  about: {
    key: "about",
    label: "About",
    eyebrow: "Who we are",
    title: "A civilian network. A public record of care.",
    summary:
      "PDF is a humanitarian community platform standing with people affected by Myanmar’s military coup. We centre civilian dignity, verified information and accountable support.",
    statement: "People first. No propaganda. Care that can be shown.",
    features: [
      { number: "01", title: "Dignity", description: "Civilian lives, families and communities remain at the centre of every page." },
      { number: "02", title: "Truth", description: "Public copy, photos and figures are published only after administrator review." },
      { number: "03", title: "Solidarity", description: "Diaspora and local partners coordinate relief, culture and civic care." },
    ],
  },
  "our-work": {
    key: "our-work",
    label: "Our work",
    eyebrow: "Relief in motion",
    title: "Care for civilians. Clarity for supporters.",
    summary:
      "Our work covers humanitarian relief, community gatherings, learning, and transparent reporting — not combat. Administrators choose what the public sees.",
    statement: "Help that is named. Help that is followed up.",
    features: [
      { number: "01", title: "Civilian relief", description: "Coordinating practical support with trusted community partners." },
      { number: "02", title: "Public storytelling", description: "Photographs and recaps published with consent and context." },
      { number: "03", title: "Emergency care", description: "Verified appeals and transparent follow-up when communities face urgent need." },
    ],
  },
  stories: {
    key: "stories",
    label: "News & stories",
    eyebrow: "Current updates",
    title: "News, photographs and community stories.",
    summary:
      "This feed changes when editors publish. Announcements, activity photographs and recaps appear only after administrator approval.",
    statement: "Current updates live here. Our Work explains what we do.",
    features: [
      { number: "01", title: "Community updates", description: "Approved news from activities and conversations." },
      { number: "02", title: "Shared stories", description: "Photographs and reflections published with consent." },
      { number: "03", title: "Notices and recaps", description: "Clear information that helps people understand recent activity." },
    ],
  },
  approach: {
    key: "approach",
    label: "Our approach",
    eyebrow: "How we serve",
    title: "Civilian-led. Carefully shared. Accountable.",
    summary:
      "We listen to community members, work with trusted partners, protect dignity and consent, and communicate activities clearly.",
    statement: "Welcome people. Respect every story. Serve together.",
    features: [
      { number: "01", title: "Listen and welcome", description: "Make space for families, young people and elders to participate with respect." },
      { number: "02", title: "Serve together", description: "Coordinate volunteers and partners through clear roles." },
      { number: "03", title: "Share responsibly", description: "Publish photos and stories only with context, consent and review." },
    ],
  },
  "get-involved": {
    key: "get-involved",
    label: "Get involved",
    eyebrow: "Take part",
    title: "Bring your time, knowledge and care.",
    summary:
      "Ask how you can help with relief, translation, events or responsible partnership. Inquiries stay private until staff follow up.",
    statement: "Reliable information first. Human support when it is needed.",
    features: [
      { number: "01", title: "Volunteer", description: "Offer skills in care, logistics, media or community hosting." },
      { number: "02", title: "Ask privately", description: "Send a confidential enquiry through this website." },
      { number: "03", title: "Support responsibly", description: "Discuss giving or partnership without sending payment details in the form." },
    ],
  },
  giving: {
    key: "giving",
    label: "Giving",
    eyebrow: "Community support",
    title: "Transparent giving. Shared responsibility.",
    summary:
      "See published appeal figures and yearly totals updated by authorised administrators. Support is welcomed through trusted community channels.",
    statement: "Care given with clarity. Trust kept with open reporting.",
    features: [
      { number: "01", title: "Transparency", description: "Donation amounts and totals shown here are controlled in the Admin Panel." },
      { number: "02", title: "Stewardship", description: "Funds and appeals are handled with committee oversight and clear purpose." },
      { number: "03", title: "Community care", description: "Giving supports civilian relief, gatherings and practical help." },
    ],
  },
  certificates: {
    key: "certificates",
    label: "Certificates",
    eyebrow: "Recognition",
    title: "Certificates and formal recognition.",
    summary:
      "A public gallery of certificates and recognitions published by authorised administrators for community trust and shared history.",
    statement: "Service remembered. Trust made visible.",
    features: [
      { number: "01", title: "Published by Admin", description: "Only approved certificates appear on this page." },
      { number: "02", title: "Community trust", description: "Formal recognition helps supporters see accountable service." },
      { number: "03", title: "Living record", description: "New certificates can be added anytime from the Admin Panel." },
    ],
  },
};

export const publicNavigation = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/our-work", label: "Our work" },
  { href: "/giving", label: "Giving" },
  { href: "/certificates", label: "Certificates" },
  { href: "/stories", label: "News & stories" },
  { href: "/events", label: "Events" },
  { href: "/gallery", label: "Gallery" },
  { href: "/approach", label: "Our approach" },
  { href: "/get-involved", label: "Get involved", cta: true },
] as const;
