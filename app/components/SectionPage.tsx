"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  cloneAboutProfile,
  defaultAboutProfile,
  type AboutProfile,
  type CommitteeMember,
} from "../lib/bcc-profile";
import type { CommunityPost } from "../lib/content";
import {
  defaultCertificatesContent,
  defaultGivingContent,
  type CertificatesContent,
  type GivingContent,
} from "../lib/page-content";
import {
  defaultPageMedia,
  supportsPageMedia,
  type PageMedia,
} from "../lib/page-media";
import { sectionDefinitions, type SectionKey } from "../lib/sections";
import { defaultHomePage, type TelegramTrainingSettings } from "../lib/home";
import { aboutUi, localizeSection } from "../lib/i18n";
import { LogoMark } from "./LogoMark";
import { PublicHeader } from "./PublicHeader";
import { usePublicLanguage } from "./usePublicLanguage";
import { CommunityContactForm } from "./CommunityContactForm";

function CommitteeCard({ member, leadership }: { member: CommitteeMember; leadership: string }) {
  return (
    <article className="committee-card">
      <span>{member.role}</span>
      <h3>{member.name}</h3>
      <small>{leadership}</small>
    </article>
  );
}

export function SectionPage({ sectionKey }: { sectionKey: SectionKey }) {
  const section = sectionDefinitions[sectionKey];
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [rawPageCopy, setPageCopy] = useState(section);
  const [aboutProfile, setAboutProfile] = useState<AboutProfile>(() => cloneAboutProfile());
  const [pageMedia, setPageMedia] = useState<PageMedia | undefined>(() =>
    supportsPageMedia(sectionKey) ? defaultPageMedia[sectionKey] : undefined,
  );
  const [giving, setGiving] = useState<GivingContent>(defaultGivingContent);
  const [certificates, setCertificates] = useState<CertificatesContent>(defaultCertificatesContent);
  const [telegramTraining, setTelegramTraining] = useState<TelegramTrainingSettings>(
    defaultHomePage.telegramTraining,
  );
  const { language, onLanguageChange } = usePublicLanguage();
  const ui = language === "my" ? aboutUi.my : aboutUi.en;
  const pageCopy = localizeSection(language, sectionKey, rawPageCopy);
  const visibleFeatures = sectionKey === "our-work"
    ? pageCopy.features.map((feature) =>
        feature.number === "03" && feature.title === "Community care"
          ? sectionDefinitions["our-work"].features[2]
          : feature,
      )
    : pageCopy.features;
  const aboutMedia = pageMedia || defaultPageMedia.about;
  const workMedia = pageMedia || defaultPageMedia["our-work"];
  const visibleCertificates = certificates.items.filter((item) => item.visible);

  useEffect(() => {
    if (sectionKey !== "stories") {
      return;
    }

    function loadPosts() {
      fetch("/api/posts", { cache: "no-store", credentials: "same-origin" })
        .then((response) => (response.ok ? response.json() : Promise.reject()))
        .then((payload) => {
          if (Array.isArray(payload.posts)) setPosts(payload.posts);
        })
        .catch(() => setPosts([]));
    }
    loadPosts();
    window.addEventListener("focus", loadPosts);
    return () => window.removeEventListener("focus", loadPosts);
  }, [sectionKey]);

  useEffect(() => {
    function loadPage() {
      fetch(`/api/pages?key=${encodeURIComponent(sectionKey)}`, {
        cache: "no-store",
        credentials: "same-origin",
      })
        .then((response) => (response.ok ? response.json() : Promise.reject()))
        .then((payload) => {
          if (payload.page) {
            setPageCopy((current) => ({ ...current, ...payload.page }));
            if (sectionKey === "about" && payload.page.about) {
              setAboutProfile(payload.page.about);
            }
            if (payload.page.media && supportsPageMedia(sectionKey)) {
              setPageMedia(payload.page.media);
            }
            if (sectionKey === "giving" && payload.page.content?.giving) {
              setGiving(payload.page.content.giving);
            }
            if (sectionKey === "certificates" && payload.page.content?.certificates) {
              setCertificates(payload.page.content.certificates);
            }
          }
        })
        .catch(() => {
          setPageCopy(section);
          if (sectionKey === "about") setAboutProfile(cloneAboutProfile(defaultAboutProfile));
          if (supportsPageMedia(sectionKey)) setPageMedia(defaultPageMedia[sectionKey]);
          if (sectionKey === "giving") setGiving(defaultGivingContent);
          if (sectionKey === "certificates") setCertificates(defaultCertificatesContent);
        });
    }
    loadPage();
    window.addEventListener("focus", loadPage);
    return () => window.removeEventListener("focus", loadPage);
  }, [section, sectionKey]);

  useEffect(() => {
    if (sectionKey !== "our-work" && sectionKey !== "get-involved") return;
    function loadTraining() {
      fetch("/api/home", { cache: "no-store", credentials: "same-origin" })
        .then((response) => (response.ok ? response.json() : Promise.reject()))
        .then((payload) => {
          if (payload.home?.telegramTraining) setTelegramTraining(payload.home.telegramTraining);
        })
        .catch(() => undefined);
    }
    loadTraining();
    window.addEventListener("focus", loadTraining);
    return () => window.removeEventListener("focus", loadTraining);
  }, [sectionKey]);

  return (
    <main className={`pdf-shell pdf-inner section-page section-${sectionKey}${language === "my" ? " is-my" : ""}`}>
      <PublicHeader
        activeHref={`/${sectionKey}`}
        language={language}
        onLanguageChange={onLanguageChange}
      />

      <section className={`section-page-hero${sectionKey === "about" ? " has-feature-photo" : ""}${sectionKey === "our-work" ? " has-work-photo" : ""}`}>
        {sectionKey === "about" ? (
          <>
            <figure className="section-about-photo">
              {/* vinext's image optimizer does not serve this static WebP reliably. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={aboutMedia.heroImageUrl}
                alt={aboutMedia.heroImageAlt}
                width={1536}
                height={1024}
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
              <figcaption>{ui.photoCaption}</figcaption>
            </figure>
            <div className="section-about-copy">
              <p className="section-about-kicker">
                <span aria-hidden="true">01</span>
                {pageCopy.eyebrow}
              </p>
              <h1>{pageCopy.title}</h1>
              <p className="section-lead">{pageCopy.summary}</p>
            </div>
          </>
        ) : sectionKey === "our-work" ? (
          <>
            <div className="section-work-copy">
              <p className="eyebrow">{pageCopy.eyebrow}</p>
              <h1>{pageCopy.title}</h1>
              <p className="section-lead">{pageCopy.summary}</p>
            </div>
            <figure className="section-work-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={workMedia.heroImageUrl}
                alt={workMedia.heroImageAlt}
                loading="eager"
                fetchPriority="high"
              />
              <figcaption>{ui.workCaption}</figcaption>
            </figure>
          </>
        ) : (
          <>
            <div>
              <p className="eyebrow">{pageCopy.eyebrow}</p>
              <h1>{pageCopy.title}</h1>
              <p className="section-lead">{pageCopy.summary}</p>
            </div>
            <div className="section-emblem" aria-hidden="true">
              <span>{pageCopy.label}</span>
              <i />
              <b>PDF</b>
            </div>
          </>
        )}
      </section>

      <section className="section-statement">
        <p>{pageCopy.statement}</p>
      </section>

      {sectionKey === "giving" && giving.showAmounts ? (
        <section className="giving-totals" aria-labelledby="giving-totals-title">
          <div className="giving-totals-intro">
            <p className="eyebrow">{ui.givingEyebrow}</p>
            <h2 id="giving-totals-title">{ui.givingTitle}</h2>
            <p>{giving.note}</p>
            <small>{giving.updatedLabel}</small>
          </div>
          <div className="giving-totals-grid">
            <article>
              <span>{giving.amountLabel}</span>
              <strong>{giving.amountValue}</strong>
            </article>
            <article>
              <span>{giving.totalLabel}</span>
              <strong>{giving.totalValue}</strong>
            </article>
          </div>
          <div className="giving-howto">
            <h3>{ui.howToGive}</h3>
            <p>{giving.howToGive}</p>
            <Link className="button button-dark" href="/get-involved#community-contact">
              {ui.givingCta}
            </Link>
          </div>
        </section>
      ) : null}

      {sectionKey === "certificates" ? (
        <section className="certificates-gallery" aria-labelledby="certificates-gallery-title">
          <div className="certificates-gallery-intro">
            <p className="eyebrow">{ui.certEyebrow}</p>
            <h2 id="certificates-gallery-title">{ui.certTitle}</h2>
            <p>{certificates.galleryIntro}</p>
          </div>
          {visibleCertificates.length ? (
            <div className="certificates-grid">
              {visibleCertificates.map((item) => (
                <article key={item.id} className="certificate-card">
                  {item.imageUrl ? (
                    <figure>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl} alt={item.imageAlt || item.title} loading="lazy" />
                    </figure>
                  ) : (
                    <div className="certificate-placeholder" aria-hidden="true">
                      <span>Certificate</span>
                    </div>
                  )}
                  <div className="certificate-copy">
                    <span>{[item.year, item.issuer].filter(Boolean).join(" · ")}</span>
                    <h3>{item.title}</h3>
                    {item.description ? <p>{item.description}</p> : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="section-empty">
              <span>{ui.coming}</span>
              <p>{ui.certEmpty}</p>
            </div>
          )}
        </section>
      ) : null}

      {sectionKey === "stories" && (
        <section className="story-feed-boundary" aria-labelledby="story-feed-boundary-title">
          <div>
            <p className="eyebrow">{ui.storiesBoundaryEyebrow}</p>
            <h2 id="story-feed-boundary-title">{ui.storiesBoundaryTitle}</h2>
          </div>
          <div>
            <p>
              {ui.storiesBoundaryBody}
            </p>
            <Link href="/our-work">{ui.readWork} <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      )}

      {sectionKey === "stories" && (
        <section className="facebook-community-panel" aria-labelledby="facebook-community-title">
          <div>
            <p className="eyebrow">{ui.alsoOnSite}</p>
            <h2 id="facebook-community-title">{ui.eventsAlbumsTitle}</h2>
          </div>
          <div className="facebook-community-action">
            <p>
              {ui.eventsAlbumsBody}
            </p>
            <Link href="/events">
              {ui.openCalendar} <span aria-hidden="true">→</span>
            </Link>
            <small>{ui.galleryNote}</small>
          </div>
        </section>
      )}

      <section className={`section-feature-grid${sectionKey === "our-work" ? " work-focus-grid" : ""}`}>
        {visibleFeatures.map((feature, index) => (
          <article key={feature.number}>
            {sectionKey === "our-work" && (
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={workMedia.featureImages[index]?.url || defaultPageMedia["our-work"].featureImages[index].url}
                  alt={workMedia.featureImages[index]?.alt || defaultPageMedia["our-work"].featureImages[index].alt}
                  loading="lazy"
                />
              </figure>
            )}
            <span>{feature.number}</span>
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>

      {sectionKey === "our-work" && (
        <section className="work-updates-route" aria-labelledby="work-updates-title">
          <div>
            <p className="eyebrow">{ui.lookingActivity}</p>
            <h2 id="work-updates-title">{ui.workVsNews}</h2>
          </div>
          <div>
            <p>
              {ui.workVsNewsBody}
            </p>
            <Link className="button button-dark" href="/stories">{ui.viewNews}</Link>
            <a href="https://web.facebook.com/groups/115394412003293" target="_blank" rel="noreferrer">
              {ui.facebook} <span aria-hidden="true">↗</span>
            </a>
            {telegramTraining.visible && telegramTraining.url ? (
              <a href={telegramTraining.url} target="_blank" rel="noreferrer">
                {language === "my" ? ui.telegramTraining : telegramTraining.cta}{" "}
                <span aria-hidden="true">↗</span>
              </a>
            ) : null}
          </div>
        </section>
      )}

      {sectionKey === "about" && (
        <>
          <section className="bcc-history" aria-labelledby="bcc-history-title">
            <div className="bcc-history-intro">
              <div>
                <p className="eyebrow">{language === "my" ? ui.historyEyebrow : aboutProfile.historyEyebrow}</p>
                <h2 id="bcc-history-title">{language === "my" ? ui.historyTitle : aboutProfile.historyTitle}</h2>
              </div>
              <div className="bcc-history-copy">
                {(language === "my" ? ui.historyBody : aboutProfile.historyBody).split(/\n\n+/).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="bcc-facts" aria-label="Organisation facts">
              <article><span>{ui.formed}</span><strong>{aboutProfile.formed}</strong></article>
              <article><span>{ui.incorporated}</span><strong>{aboutProfile.incorporated}</strong></article>
              <article><span>{ui.registered}</span><strong>{aboutProfile.legalName}</strong></article>
              <article><span>{ui.abn}</span><strong>{aboutProfile.abn}</strong></article>
            </div>
          </section>

          <section className="bcc-ministries" aria-labelledby="bcc-ministries-title">
            <div className="bcc-section-heading">
                <p className="eyebrow">{language === "my" ? ui.focusEyebrow : aboutProfile.focusEyebrow}</p>
                <h2 id="bcc-ministries-title">{language === "my" ? ui.focusTitle : aboutProfile.focusTitle}</h2>
            </div>
            <div className="bcc-ministry-grid">
              {(language === "my" ? ui.focuses : aboutProfile.focuses).map((focus, index) => (
                <article key={`${index}-${focus.title}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{focus.title}</h3>
                  <p>{focus.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="bcc-committee" id="committee" aria-labelledby="bcc-committee-title">
            <div className="bcc-section-heading committee-heading">
              <div>
                <p className="eyebrow">{ui.committeeEyebrow}</p>
                <h2 id="bcc-committee-title">{ui.committeeTitle}</h2>
              </div>
              <p>
                {ui.committeeNote} {ui.updated} {aboutProfile.committeeUpdated}.
              </p>
            </div>

            <div className="committee-grid">
              {aboutProfile.committee.map((member, index) => (
                <CommitteeCard member={member} leadership={ui.leadership} key={`${index}-${member.role}`} />
              ))}
            </div>
          </section>

          <section className="bcc-contact" aria-labelledby="bcc-contact-title">
            <div>
              <p className="eyebrow">{ui.contactEyebrow}</p>
              <h2 id="bcc-contact-title">{ui.contactTitle}</h2>
            </div>
            <div className="bcc-contact-action">
              <p>
                {ui.contactBody}
              </p>
              <Link className="button button-light" href="/get-involved#community-contact">
                {ui.contactCta}
              </Link>
              <small>{ui.contactSmall}</small>
            </div>
          </section>

          <p className="bcc-source-note">
            {aboutProfile.sourceNote}
          </p>
        </>
      )}

      {sectionKey === "stories" && (
        <section className="section-published">
          <div className="section-published-heading">
            <p className="eyebrow">{ui.recentUpdates}</p>
            <h2>{ui.newsFeed}</h2>
          </div>
          {posts.length ? (
          <div className="section-published-grid">
            {posts.map((post) => {
              const gallery =
                post.gallery?.length
                  ? post.gallery
                  : post.mediaUrl
                    ? [
                        {
                          id: post.mediaId || post.id,
                          url: post.mediaUrl,
                          contentType: post.mediaType || "image/",
                          alt: post.mediaAlt || post.title,
                        },
                      ]
                    : [];
              const cover = gallery[0];
              return (
              <article key={post.id}>
                {cover && cover.contentType.startsWith("image/") && (
                  <figure className="section-story-album">
                    {/* Public media is served only when attached to a published post. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cover.url}
                      alt={cover.alt || post.title}
                      loading="lazy"
                      decoding="async"
                    />
                    {gallery.length > 1 ? (
                      <div className="section-story-thumbs">
                        {gallery.slice(1).map((item) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={item.id}
                            src={item.url}
                            alt={item.alt || post.title}
                            loading="lazy"
                          />
                        ))}
                      </div>
                    ) : null}
                  </figure>
                )}
                <div className="section-published-copy">
                  <span>{post.category}</span>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                  <time>{post.date}</time>
                </div>
              </article>
              );
            })}
          </div>
          ) : (
            <div className="section-empty">
              <span>{ui.coming}</span>
              <p>{ui.emptyUpdates}</p>
            </div>
          )}
        </section>
      )}

      {sectionKey === "get-involved" && <CommunityContactForm />}

      <footer className="section-footer">
        <Link className="wordmark" href="/">
          <LogoMark />
          <span>PDF MYANMAR RELIEF</span>
        </Link>
        <p>{ui.footer}</p>
      </footer>
    </main>
  );
}
