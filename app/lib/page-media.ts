import type { SectionKey } from "./sections";

export type PageFeatureImage = {
  url: string;
  alt: string;
};

export type PageMedia = {
  heroImageUrl: string;
  heroImageAlt: string;
  featureImages: [PageFeatureImage, PageFeatureImage, PageFeatureImage];
};

const defaultFeatureImages: Record<"our-work", PageMedia["featureImages"]> = {
  "our-work": [
    {
      url: "/community-story-faith.jpg",
      alt: "Community members gathered together",
    },
    {
      url: "/community-story-culture.jpg",
      alt: "Community members celebrating culture together",
    },
    {
      url: "/community-story-care.jpg",
      alt: "Community members meeting and planning together",
    },
  ],
};

export const defaultPageMedia: Record<"about" | "our-work", PageMedia> = {
  about: {
    heroImageUrl: "/pdf-about-profile.png",
    heroImageAlt:
      "Community organisers reviewing relief lists and village needs together.",
    featureImages: [
      { url: "", alt: "" },
      { url: "", alt: "" },
      { url: "", alt: "" },
    ],
  },
  "our-work": {
    heroImageUrl: "/our-work-community.jpg",
    heroImageAlt:
      "Young community members walking together outdoors.",
    featureImages: defaultFeatureImages["our-work"],
  },
};

export function supportsPageMedia(key: string): key is "about" | "our-work" {
  return key === "about" || key === "our-work";
}

function isSafeImageHref(value: string) {
  return (
    value.startsWith("/") ||
    value.startsWith("https://") ||
    value.startsWith("http://localhost") ||
    value.startsWith("data:image/")
  );
}

export function normalizePageMedia(key: SectionKey, value: unknown): PageMedia | undefined {
  if (!supportsPageMedia(key)) return undefined;
  const defaults = defaultPageMedia[key];
  const raw = value && typeof value === "object" ? (value as Partial<PageMedia>) : {};
  const heroImageUrl =
    typeof raw.heroImageUrl === "string" && raw.heroImageUrl.trim() && isSafeImageHref(raw.heroImageUrl.trim())
      ? raw.heroImageUrl.trim().slice(0, 500)
      : defaults.heroImageUrl;
  const heroImageAlt =
    typeof raw.heroImageAlt === "string" && raw.heroImageAlt.trim()
      ? raw.heroImageAlt.trim().slice(0, 240)
      : defaults.heroImageAlt;

  const featureSource = Array.isArray(raw.featureImages) ? raw.featureImages : [];
  const featureImages = defaults.featureImages.map((fallback, index) => {
    const candidate = featureSource[index] as Partial<PageFeatureImage> | undefined;
    const url =
      typeof candidate?.url === "string" && candidate.url.trim() && isSafeImageHref(candidate.url.trim())
        ? candidate.url.trim().slice(0, 500)
        : fallback.url;
    const alt =
      typeof candidate?.alt === "string" && candidate.alt.trim()
        ? candidate.alt.trim().slice(0, 240)
        : fallback.alt;
    return { url, alt };
  }) as PageMedia["featureImages"];

  return { heroImageUrl, heroImageAlt, featureImages };
}

export function parsePageMedia(key: SectionKey, jsonValue: unknown): PageMedia | undefined {
  if (!supportsPageMedia(key)) return undefined;
  try {
    return normalizePageMedia(key, JSON.parse(String(jsonValue || "{}")));
  } catch {
    return normalizePageMedia(key, {});
  }
}
