export type HomePathway = {
  title: string;
  description: string;
  href: string;
  visible: boolean;
};

export type TelegramTrainingSettings = {
  title: string;
  description: string;
  cta: string;
  url: string;
  visible: boolean;
};

export type HomePageSettings = {
  announcement: string;
  eyebrow: string;
  title: string;
  intro: string;
  heroImageUrl: string;
  heroImageAlt: string;
  helpTitle: string;
  helpIntro: string;
  pathways: [HomePathway, HomePathway, HomePathway, HomePathway];
  telegramTraining: TelegramTrainingSettings;
};

export const defaultTelegramTraining: TelegramTrainingSettings = {
  title: "Learn in Telegram.",
  description:
    "Open the PDF training bot for Python and IT lessons. The course continues in Telegram. Giving is not taken on this page.",
  cta: "Open Telegram training",
  url: "https://t.me/AIkzautomation_bot?start=public",
  visible: true,
};

export function isSafeTelegramHref(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    return host === "t.me" || host === "www.t.me" || host === "telegram.me" || host === "www.telegram.me";
  } catch {
    return false;
  }
}

export function normalizeTelegramTraining(value: unknown): TelegramTrainingSettings {
  const raw = value && typeof value === "object" ? (value as Partial<TelegramTrainingSettings>) : {};
  const url = String(raw.url || "").trim().slice(0, 500);
  return {
    title: String(raw.title || defaultTelegramTraining.title).trim().slice(0, 100) || defaultTelegramTraining.title,
    description:
      String(raw.description || defaultTelegramTraining.description).trim().slice(0, 360) ||
      defaultTelegramTraining.description,
    cta: String(raw.cta || defaultTelegramTraining.cta).trim().slice(0, 80) || defaultTelegramTraining.cta,
    url: isSafeTelegramHref(url) ? url : defaultTelegramTraining.url,
    visible: raw.visible !== false,
  };
}

export const defaultHomePage: HomePageSettings = {
  announcement: "Civilian humanitarian action for people affected by the coup",
  eyebrow: "Dignity • Solidarity • Care",
  title: "Stand with people. Rebuild with care.",
  intro:
    "PDF is a community relief platform for civilians in and from Myanmar. We publish verified stories, transparent giving, events and practical pathways — edited from the Admin Panel.",
  heroImageUrl: "/pdf-hero-civilian.png",
  heroImageAlt: "Civilians packing relief supplies together in a community hall.",
  helpTitle: "How can you take part?",
  helpIntro: "Choose a path. Every public page is updated by authorised administrators.",
  pathways: [
    {
      title: "Follow verified updates",
      description: "Read approved news and stories published by the editorial team.",
      href: "/stories",
      visible: true,
    },
    {
      title: "Support relief work",
      description: "See published appeal figures and how giving is accounted for.",
      href: "/giving",
      visible: true,
    },
    {
      title: "Join an event",
      description: "Community gatherings, briefings and solidarity events from the calendar.",
      href: "/events",
      visible: true,
    },
    {
      title: "Volunteer or partner",
      description: "Ask privately how you can help with care, translation, logistics or advocacy.",
      href: "/get-involved",
      visible: true,
    },
  ],
  telegramTraining: { ...defaultTelegramTraining },
};
