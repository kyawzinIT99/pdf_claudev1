const FACEBOOK_HOSTS = ["facebook.com", "www.facebook.com", "web.facebook.com", "m.facebook.com", "fb.watch", "www.fb.watch"];
const TIKTOK_HOSTS = ["tiktok.com", "www.tiktok.com", "m.tiktok.com", "vm.tiktok.com", "vt.tiktok.com"];
const YOUTUBE_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be", "youtube-nocookie.com", "www.youtube-nocookie.com"];

export type LivePlatform = "none" | "facebook" | "tiktok" | "youtube";

/** Admin can store Facebook/TikTok/YouTube live links. Public /events player stays off until this is true. */
export const PUBLIC_LIVE_STREAM_ENABLED = false;

export function isWatchableLivePlatform(value: string): value is Exclude<LivePlatform, "none"> {
  return value === "facebook" || value === "tiktok" || value === "youtube";
}

export function detectLivePlatform(raw: string): LivePlatform {
  const url = parseHttps(raw);
  if (!url) return "none";
  const host = url.hostname.toLowerCase();
  if (FACEBOOK_HOSTS.some((item) => host === item || host.endsWith(`.${item}`))) return "facebook";
  if (TIKTOK_HOSTS.some((item) => host === item || host.endsWith(`.${item}`))) return "tiktok";
  if (YOUTUBE_HOSTS.some((item) => host === item || host.endsWith(`.${item}`))) return "youtube";
  return "none";
}

export function sanitizeLiveUrl(raw: string): string {
  const url = parseHttps(raw);
  if (!url) return "";
  if (detectLivePlatform(url.toString()) === "none") return "";
  return url.toString().slice(0, 500);
}

export function facebookEmbedSrc(liveUrl: string) {
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(liveUrl)}&show_text=false&autoplay=true`;
}

export function tiktokEmbedSrc(liveUrl: string) {
  const url = parseHttps(liveUrl);
  if (!url) return "";
  const video = url.pathname.match(/\/video\/(\d+)/);
  if (video) return `https://www.tiktok.com/embed/v2/${video[1]}`;
  return "";
}

export function youtubeEmbedSrc(liveUrl: string) {
  const url = parseHttps(liveUrl);
  if (!url) return "";
  const videoId = youtubeVideoId(url);
  if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
  const channel = url.pathname.match(/\/channel\/(UC[\w-]+)/);
  if (channel) return `https://www.youtube.com/embed/live_stream?channel=${encodeURIComponent(channel[1])}`;
  return "";
}

function youtubeVideoId(url: URL) {
  const host = url.hostname.toLowerCase();
  if (host === "youtu.be" || host === "www.youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] || "";
    return isYoutubeId(id) ? id : "";
  }
  const fromQuery = url.searchParams.get("v") || "";
  if (isYoutubeId(fromQuery)) return fromQuery;
  const fromPath = url.pathname.match(/\/(?:live|embed|shorts)\/([\w-]{11})/);
  return fromPath && isYoutubeId(fromPath[1]) ? fromPath[1] : "";
}

function isYoutubeId(value: string) {
  return /^[\w-]{11}$/.test(value);
}

function parseHttps(raw: string) {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}
