export type CommitteeMember = {
  name: string;
  role: string;
  phone: string;
};

export type AboutFocus = {
  title: string;
  description: string;
};

export type AboutProfile = {
  historyEyebrow: string;
  historyTitle: string;
  historyBody: string;
  formed: string;
  incorporated: string;
  legalName: string;
  abn: string;
  focusEyebrow: string;
  focusTitle: string;
  focuses: [AboutFocus, AboutFocus, AboutFocus];
  committeeEyebrow: string;
  committeeTitle: string;
  committeeNote: string;
  committeeUpdated: string;
  address: string;
  phone: string;
  contactEyebrow: string;
  contactTitle: string;
  sourceNote: string;
  committee: CommitteeMember[];
};

const committee: CommitteeMember[] = [
  { name: "To be published", role: "Coordinator", phone: "—" },
  { name: "To be published", role: "Deputy coordinator", phone: "—" },
  { name: "To be published", role: "Secretary", phone: "—" },
  { name: "To be published", role: "Treasurer", phone: "—" },
  { name: "To be published", role: "Relief lead", phone: "—" },
  { name: "To be published", role: "Communications", phone: "—" },
  { name: "To be published", role: "Events", phone: "—" },
  { name: "To be published", role: "Volunteer lead", phone: "—" },
];

export const defaultAboutProfile: AboutProfile = {
  historyEyebrow: "Why this platform exists",
  historyTitle: "A public home for civilian relief and solidarity.",
  historyBody:
    "After Myanmar’s military coup, communities inside the country and in the diaspora needed a trustworthy place to publish care, not rumour. PDF is a civilian humanitarian website: administrators edit pages, stories, giving figures, events and galleries, and the public site shows only what they approve.\n\nThis platform keeps the same staff Admin Panel, publishing APIs and n8n automations as the shared community template, with a distinct public design for PDF.\n\nReplace this history, legal name, contacts and committee list in Admin → page settings. Nothing here is a live payment or combat channel.",
  formed: "1 February 2021",
  incorporated: "To be published",
  legalName: "PDF Myanmar Relief",
  abn: "To be published",
  focusEyebrow: "What we hold",
  focusTitle: "Dignity, verified updates and practical care.",
  focuses: [
    { title: "Civilian relief", description: "Practical support coordinated with trusted community partners." },
    { title: "Public record", description: "Stories, certificates and figures published with consent and review." },
    { title: "Community gatherings", description: "Events and galleries that keep people connected across distance." },
  ],
  committeeEyebrow: "People who serve",
  committeeTitle: "Public contacts.",
  committeeNote: "Names and phones appear only after administrators publish them.",
  committeeUpdated: "13 August 2026",
  address: "To be published by Admin",
  phone: "To be published",
  contactEyebrow: "Contact PDF",
  contactTitle: "Start with a private enquiry.",
  sourceNote: "Default copy for the PDF public site. Administrators should replace this with organisation-approved text.",
  committee,
};

const legacyShortHistory =
  "Burmese Catholics from diverse cultural backgrounds formed a spiritual home in Western Australia on 7 February 1999. With pastoral guidance from Rev. Fr. Ossie Lewis and the commitment of volunteers, the community was incorporated in 2008 and continues to bring generations together through worship, culture, friendship and care.";

export function cloneAboutProfile(profile: AboutProfile = defaultAboutProfile): AboutProfile {
  return {
    ...profile,
    focuses: profile.focuses.map((focus) => ({ ...focus })) as AboutProfile["focuses"],
    committee: profile.committee.map((member) => ({ ...member })),
  };
}

export function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

export function normalizeAboutProfile(value: unknown): AboutProfile {
  if (!value || typeof value !== "object") return cloneAboutProfile();
  const candidate = value as Partial<AboutProfile>;
  const text = (input: unknown, fallback: string) =>
    typeof input === "string" && input.trim() ? input.trim() : fallback;
  const focuses = Array.isArray(candidate.focuses) && candidate.focuses.length === 3
    ? candidate.focuses.map((focus, index) => ({
        title: text(focus?.title, defaultAboutProfile.focuses[index].title),
        description: text(focus?.description, defaultAboutProfile.focuses[index].description),
      })) as AboutProfile["focuses"]
    : cloneAboutProfile().focuses;
  const suppliedCommittee = Array.isArray(candidate.committee) && candidate.committee.length === committee.length
    ? candidate.committee.map((member, index) => ({
        name: text(member?.name, committee[index].name),
        role: text(member?.role, committee[index].role),
        phone: text(member?.phone, committee[index].phone),
      }))
    : committee.map((member) => ({ ...member }));

  return {
    historyEyebrow: text(candidate.historyEyebrow, defaultAboutProfile.historyEyebrow),
    historyTitle: text(candidate.historyTitle, defaultAboutProfile.historyTitle),
    historyBody: text(candidate.historyBody, defaultAboutProfile.historyBody) === legacyShortHistory
      ? defaultAboutProfile.historyBody
      : text(candidate.historyBody, defaultAboutProfile.historyBody),
    formed: text(candidate.formed, defaultAboutProfile.formed),
    incorporated: text(candidate.incorporated, defaultAboutProfile.incorporated),
    legalName: text(candidate.legalName, defaultAboutProfile.legalName),
    abn: text(candidate.abn, defaultAboutProfile.abn),
    focusEyebrow: text(candidate.focusEyebrow, defaultAboutProfile.focusEyebrow),
    focusTitle: text(candidate.focusTitle, defaultAboutProfile.focusTitle),
    focuses,
    committeeEyebrow: text(candidate.committeeEyebrow, defaultAboutProfile.committeeEyebrow),
    committeeTitle: text(candidate.committeeTitle, defaultAboutProfile.committeeTitle),
    committeeNote: text(candidate.committeeNote, defaultAboutProfile.committeeNote),
    committeeUpdated: text(candidate.committeeUpdated, defaultAboutProfile.committeeUpdated),
    address: text(candidate.address, defaultAboutProfile.address),
    phone: text(candidate.phone, defaultAboutProfile.phone),
    contactEyebrow: text(candidate.contactEyebrow, defaultAboutProfile.contactEyebrow),
    contactTitle: text(candidate.contactTitle, defaultAboutProfile.contactTitle),
    sourceNote: text(candidate.sourceNote, defaultAboutProfile.sourceNote),
    committee: suppliedCommittee,
  };
}
