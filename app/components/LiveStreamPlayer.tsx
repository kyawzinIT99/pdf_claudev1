"use client";

import {
  facebookEmbedSrc,
  isWatchableLivePlatform,
  tiktokEmbedSrc,
  youtubeEmbedSrc,
  type LivePlatform,
} from "../lib/live-stream";

export function LiveStreamPlayer({
  platform,
  liveUrl,
  title,
  watchLabel,
}: {
  platform: LivePlatform;
  liveUrl: string;
  title: string;
  watchLabel: string;
}) {
  if (!liveUrl || !isWatchableLivePlatform(platform)) return null;
  const embed =
    platform === "facebook"
      ? facebookEmbedSrc(liveUrl)
      : platform === "tiktok"
        ? tiktokEmbedSrc(liveUrl)
        : youtubeEmbedSrc(liveUrl);

  return (
    <div className="pdf-live-player">
      {embed ? (
        <iframe
          src={embed}
          title={title}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <div className="pdf-live-fallback">
          <p>{title}</p>
        </div>
      )}
      <a className="pdf-live-watch" href={liveUrl} target="_blank" rel="noreferrer">
        {watchLabel}
      </a>
    </div>
  );
}
