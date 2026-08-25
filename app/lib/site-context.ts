export const siteIdentity = {
  name: "PDF Myanmar Relief",
  shortName: "PDF",
  tagline: "Civilian humanitarian community",
  description:
    "Verified stories, events and community notices for civilians in and from Myanmar.",
  contactEmail: process.env.PUBLIC_CONTACT_EMAIL?.trim() || "pdfantimailtary@gmail.com",
  facebookGroup: "https://web.facebook.com/groups/115394412003293",
  telegramTraining: "https://t.me/AIkzautomation_bot?start=public",
};

export function publicOrigin(request?: Request) {
  const configured = process.env.APP_ORIGIN?.trim();
  if (configured && configured !== "https://example.org") {
    try {
      return new URL(configured).origin;
    } catch {
      /* fall through */
    }
  }
  if (request) {
    const host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      new URL(request.url).host;
    const proto =
      request.headers.get("x-forwarded-proto") ||
      (host.includes("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return "http://localhost:3000";
}

export function siteLinks(origin: string) {
  return {
    home: `${origin}/`,
    about: `${origin}/about`,
    ourWork: `${origin}/our-work`,
    giving: `${origin}/giving`,
    stories: `${origin}/stories`,
    events: `${origin}/events`,
    gallery: `${origin}/gallery`,
    getInvolved: `${origin}/get-involved`,
    facebookGroup: siteIdentity.facebookGroup,
    telegramTraining: siteIdentity.telegramTraining,
    contactEmail: siteIdentity.contactEmail,
  };
}

export function subscribeAutomationContext(request: Request, extra: Record<string, unknown> = {}) {
  const origin = publicOrigin(request);
  const links = siteLinks(origin);
  return {
    organisation: siteIdentity.name,
    organisationShort: siteIdentity.shortName,
    tagline: siteIdentity.tagline,
    origin,
    links,
    contactEmail: siteIdentity.contactEmail,
    welcome: {
      subject: `Welcome to ${siteIdentity.shortName} community updates`,
      intro: `You asked ${siteIdentity.name} to email approved event notices.`,
      footer: siteIdentity.tagline,
      contactEmail: siteIdentity.contactEmail,
    },
    ...extra,
  };
}

export function inquiryAutomationContext(request: Request, extra: Record<string, unknown> = {}) {
  const origin = publicOrigin(request);
  const links = siteLinks(origin);
  return {
    organisation: siteIdentity.name,
    organisationShort: siteIdentity.shortName,
    tagline: siteIdentity.tagline,
    origin,
    links,
    contactEmail: siteIdentity.contactEmail,
    sendVisitorGreeting: true,
    welcome: {
      subject: `We received your enquiry — ${siteIdentity.shortName}`,
      intro: `Thank you for writing to ${siteIdentity.name}. Staff have your message and will follow up.`,
      body:
        "This is a greeting only. Your enquiry stays in the administrator follow-up queue until staff reply.",
      footer: siteIdentity.tagline,
      contactEmail: siteIdentity.contactEmail,
    },
    ...extra,
  };
}
