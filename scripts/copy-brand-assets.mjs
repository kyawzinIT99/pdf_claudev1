import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, ".next", "static", "brand");
mkdirSync(outDir, { recursive: true });

/** Hostinger Node deploys often omit `public/`; ship brand media inside `.next/static`. */
const assets = [
  ["public/bccwa-logo.jpg", "bccwa-logo.jpg"],
  ["public/logo.jpg", "logo.jpg"],
  ["public/favicon.png", "favicon.png"],
  ["public/community-hero-group.jpg", "community-hero-group.jpg"],
  ["public/story-prayer.png", "story-prayer.png"],
  ["public/story-cultural.png", "story-cultural.png"],
  ["public/story-learning.png", "story-learning.png"],
  ["public/our-work-community.jpg", "our-work-community.jpg"],
  ["public/about-community-australia.webp", "about-community-australia.webp"],
  ["public/community-story-faith.jpg", "community-story-faith.jpg"],
  ["public/community-story-culture.jpg", "community-story-culture.jpg"],
  ["public/community-story-care.jpg", "community-story-care.jpg"],
  ["public/it-solutions-zone-logo.png", "it-solutions-zone-logo.png"],
  ["public/og-australian-spirit.png", "og-australian-spirit.png"],
  ["app/icon.png", "icon.png"],
];

let copied = 0;
for (const [from, name] of assets) {
  const source = join(root, from);
  if (!existsSync(source)) {
    console.warn(`[copy-brand-assets] missing ${from}`);
    continue;
  }
  copyFileSync(source, join(outDir, name));
  copied += 1;
  console.log(`[copy-brand-assets] ${name}`);
}
console.log(`[copy-brand-assets] copied ${copied}/${assets.length}`);
