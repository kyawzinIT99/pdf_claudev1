/** Admin-controlled structured content for Giving and Certificates pages. */

export type GivingContent = {
  amountLabel: string;
  amountValue: string;
  totalLabel: string;
  totalValue: string;
  showAmounts: boolean;
  note: string;
  howToGive: string;
  updatedLabel: string;
};

export type CertificateItem = {
  id: string;
  title: string;
  issuer: string;
  year: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  visible: boolean;
};

export type CertificatesContent = {
  galleryIntro: string;
  items: CertificateItem[];
};

export type PageStructuredContent = {
  giving?: GivingContent;
  certificates?: CertificatesContent;
};

export const defaultGivingContent: GivingContent = {
  amountLabel: "Current appeal",
  amountValue: "AUD 0",
  totalLabel: "Total received this year",
  totalValue: "AUD 0",
  showAmounts: true,
  note:
    "These figures are published by authorised administrators for community transparency. They are not a live payment system.",
  howToGive:
    "To support PDF, contact the community through Get Involved. Payment instructions are shared only through authorised channels after committee approval.",
  updatedLabel: "Updated by Admin",
};

export const defaultCertificatesContent: CertificatesContent = {
  galleryIntro:
    "Certificates and formal recognitions published by authorised administrators. Only items marked visible appear on the public website.",
  items: [
    {
      id: "cert-1",
      title: "Certificate of appreciation",
      issuer: "Community partner",
      year: "2026",
      description: "Recognition of volunteer service and community care.",
      imageUrl: "",
      imageAlt: "Certificate image",
      visible: false,
    },
  ],
};

function isSafeImageHref(value: string) {
  return (
    !value ||
    value.startsWith("/") ||
    value.startsWith("https://") ||
    value.startsWith("http://localhost") ||
    value.startsWith("data:image/")
  );
}

export function normalizeGivingContent(value: unknown): GivingContent {
  const raw = value && typeof value === "object" ? (value as Partial<GivingContent>) : {};
  return {
    amountLabel: String(raw.amountLabel || defaultGivingContent.amountLabel).trim().slice(0, 80) || defaultGivingContent.amountLabel,
    amountValue: String(raw.amountValue || defaultGivingContent.amountValue).trim().slice(0, 40) || defaultGivingContent.amountValue,
    totalLabel: String(raw.totalLabel || defaultGivingContent.totalLabel).trim().slice(0, 80) || defaultGivingContent.totalLabel,
    totalValue: String(raw.totalValue || defaultGivingContent.totalValue).trim().slice(0, 40) || defaultGivingContent.totalValue,
    showAmounts: raw.showAmounts !== false,
    note: String(raw.note || defaultGivingContent.note).trim().slice(0, 600) || defaultGivingContent.note,
    howToGive: String(raw.howToGive || defaultGivingContent.howToGive).trim().slice(0, 800) || defaultGivingContent.howToGive,
    updatedLabel: String(raw.updatedLabel || defaultGivingContent.updatedLabel).trim().slice(0, 80) || defaultGivingContent.updatedLabel,
  };
}

export function normalizeCertificatesContent(value: unknown): CertificatesContent {
  const raw = value && typeof value === "object" ? (value as Partial<CertificatesContent>) : {};
  const source = Array.isArray(raw.items) ? raw.items : defaultCertificatesContent.items;
  const items = source.slice(0, 12).map((item, index) => {
    const row = item && typeof item === "object" ? (item as Partial<CertificateItem>) : {};
    const imageUrl = String(row.imageUrl || "").trim().slice(0, 500);
    return {
      id: String(row.id || `cert-${index + 1}`).trim().slice(0, 40) || `cert-${index + 1}`,
      title: String(row.title || "Certificate").trim().slice(0, 140) || "Certificate",
      issuer: String(row.issuer || "").trim().slice(0, 120),
      year: String(row.year || "").trim().slice(0, 20),
      description: String(row.description || "").trim().slice(0, 400),
      imageUrl: isSafeImageHref(imageUrl) ? imageUrl : "",
      imageAlt: String(row.imageAlt || row.title || "Certificate").trim().slice(0, 240),
      visible: Boolean(row.visible),
    };
  });
  return {
    galleryIntro:
      String(raw.galleryIntro || defaultCertificatesContent.galleryIntro).trim().slice(0, 500) ||
      defaultCertificatesContent.galleryIntro,
    items: items.length ? items : defaultCertificatesContent.items.map((item) => ({ ...item })),
  };
}

export function parsePageContent(key: string, value: unknown): PageStructuredContent {
  let parsed: Record<string, unknown> = {};
  try {
    if (typeof value === "string") parsed = JSON.parse(value || "{}");
    else if (value && typeof value === "object") parsed = value as Record<string, unknown>;
  } catch {
    parsed = {};
  }
  if (key === "giving") {
    return { giving: normalizeGivingContent(parsed.giving ?? parsed) };
  }
  if (key === "certificates") {
    return { certificates: normalizeCertificatesContent(parsed.certificates ?? parsed) };
  }
  return {};
}

export function serializePageContent(key: string, content: PageStructuredContent | undefined) {
  if (key === "giving") {
    return JSON.stringify({ giving: normalizeGivingContent(content?.giving) });
  }
  if (key === "certificates") {
    return JSON.stringify({ certificates: normalizeCertificatesContent(content?.certificates) });
  }
  return "{}";
}

export function supportsPageContent(key: string): key is "giving" | "certificates" {
  return key === "giving" || key === "certificates";
}
