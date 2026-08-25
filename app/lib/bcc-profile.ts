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
  historyEyebrow: "Why we exist",
  historyTitle: "Born from the coup, built for the people it harmed.",
  historyBody:
    "On 1 February 2021 the military seized power in Myanmar and took the country from its people. What followed was not an abstraction: homes shelled, villages emptied, clinics and schools closed, parents jailed, and millions pushed into hunger and flight. PDF was formed in answer to that — a civilian humanitarian community that carries help to the people the coup has hurt.\n\nWe hold two things at once, and we do not pretend otherwise. We care for people: food, shelter, medical support, schooling and small dignities, given on need alone and never on ethnicity, faith, region or affiliation. And we oppose the coup: we refuse to treat military rule as normal, we record what it has cost civilians, and we say so publicly. Care without truth is charity that helps the perpetrator; truth without care is only noise.\n\nWe are unarmed and we take no part in combat. We are not a government, a party, or an armed organisation, and we do not speak for any. Our work is relief, documentation and community — carried out with the consent of the people in it.\n\nWe publish what we do so it can be checked. Figures, photographs, appeals and follow-ups appear only after review, because a community asking for trust owes the people a record it can be held to.",
  formed: "1 February 2021",
  incorporated: "To be published",
  legalName: "PDF Myanmar Relief",
  abn: "To be published",
  focusEyebrow: "What we stand on",
  focusTitle: "Relief for civilians. A record against the coup.",
  focuses: [
    { title: "Civilian relief", description: "Food, shelter, medical support and schooling for families displaced or impoverished by military rule — given on need alone." },
    { title: "Documenting the cost", description: "What the coup has done to civilians, recorded with consent and published so it cannot be quietly erased." },
    { title: "Community that holds", description: "Gatherings, culture and learning that keep people connected across displacement, borders and years." },
  ],
  committeeEyebrow: "People who serve",
  committeeTitle: "Public contacts.",
  committeeNote: "Names and phones appear only after administrators publish them.",
  committeeUpdated: "13 August 2026",
  address: "To be published by Admin",
  phone: "To be published",
  contactEyebrow: "Contact PDF",
  contactTitle: "Start with a private enquiry.",
  sourceNote: "Starting copy for the PDF public site. Administrators can rewrite every line of this page in Admin → Pages → About.",
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
