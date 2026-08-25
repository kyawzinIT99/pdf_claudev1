"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { seedPosts } from "../lib/content";
import {
  defaultHomePage,
  type HomePageSettings,
} from "../lib/home";
import { homeUi } from "../lib/i18n";
import { LogoMark } from "./LogoMark";
import { PublicHeader } from "./PublicHeader";
import { MailSubscribe } from "./MailSubscribe";
import { usePublicLanguage } from "./usePublicLanguage";

export function PublicSite() {
  const { language, onLanguageChange } = usePublicLanguage();
  const [home, setHome] = useState<HomePageSettings>(defaultHomePage);
  const [posts, setPosts] = useState(seedPosts);
  const pageCopy = homeUi[language];

  useEffect(() => {
    function loadHome() {
      fetch("/api/home", { cache: "no-store", credentials: "same-origin" })
        .then((response) => (response.ok ? response.json() : Promise.reject()))
        .then((payload) => {
          if (payload.home) setHome(payload.home);
        })
        .catch(() => undefined);
    }
    loadHome();
    window.addEventListener("focus", loadHome);
    return () => window.removeEventListener("focus", loadHome);
  }, []);

  useEffect(() => {
    function loadPosts() {
      fetch("/api/posts", { cache: "no-store", credentials: "same-origin" })
        .then((response) => (response.ok ? response.json() : Promise.reject()))
        .then((payload) => {
          if (Array.isArray(payload.posts) && payload.posts.length) setPosts(payload.posts);
        })
        .catch(() => undefined);
    }
    loadPosts();
    window.addEventListener("focus", loadPosts);
    return () => window.removeEventListener("focus", loadPosts);
  }, []);

  const localizedHome =
    language === "en"
      ? home
      : {
          ...home,
          announcement: pageCopy.announcement,
          eyebrow: pageCopy.eyebrow,
          title: pageCopy.title,
          intro: pageCopy.intro,
          helpTitle: pageCopy.helpTitle,
          helpIntro: pageCopy.helpIntro,
          pathways: home.pathways.map((pathway, index) => ({
            ...pathway,
            title: pageCopy.routes[index],
            description: pageCopy.routeNotes[index],
          })) as HomePageSettings["pathways"],
        };

  const featuredPosts = posts.slice(0, 3);
  const storyImages = [
    "/story-prayer.png",
    "/story-cultural.png",
    "/story-learning.png",
  ];
  const lead = featuredPosts[0];
  const rest = featuredPosts.slice(1);

  return (
    <main className={`pdf-shell${language === "my" ? " is-my" : ""}`}>
      <p className="pdf-ticker">
        <span>{localizedHome.announcement}</span>
        <a href="#folio">{pageCopy.latestStories}</a>
      </p>

      <PublicHeader
        activeHref="/"
        language={language}
        onLanguageChange={onLanguageChange}
      />

      <section className="pdf-stage">
        <div className="pdf-stage-copy">
          <p className="pdf-kicker">{localizedHome.eyebrow}</p>
          <h1>{localizedHome.title}</h1>
          <p className="pdf-dek">{localizedHome.intro}</p>
          <div className="pdf-actions">
            <a className="pdf-cta" href="#index">
              {pageCopy.choosePath}
            </a>
            <Link className="pdf-ghost" href="/get-involved">
              {pageCopy.getInvolved}
            </Link>
          </div>
          <p className="pdf-note">{pageCopy.note}</p>
        </div>
        <figure className="pdf-stage-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={localizedHome.heroImageUrl}
            alt={localizedHome.heroImageAlt}
            key={localizedHome.heroImageUrl}
          />
          <figcaption>{pageCopy.photoCaption}</figcaption>
        </figure>
      </section>

      <section className="pdf-ledger" aria-label="Site facts">
        <div><b>04+</b><span>{pageCopy.years}</span></div>
        <div><b>08</b><span>{pageCopy.pages}</span></div>
        <div><b>08</b><span>{pageCopy.workflows}</span></div>
        <div><b>03</b><span>{pageCopy.languages}</span></div>
      </section>

      <section className="pdf-folio" id="folio">
        <header>
          <p className="pdf-kicker">{pageCopy.dispatch}</p>
          <h2>{pageCopy.storiesHeading}</h2>
        </header>
        <div className="pdf-folio-grid">
          {lead && (
            <article className="pdf-lead">
              <div className="pdf-lead-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lead.mediaUrl || storyImages[0]} alt={lead.mediaAlt || "PDF community activity"} />
              </div>
              <div>
                <span>{lead.category}</span>
                <time>{lead.date}</time>
                <h3>{lead.title}</h3>
                <p>{lead.excerpt}</p>
                <Link href="/stories">{pageCopy.continueStories}</Link>
              </div>
            </article>
          )}
          <div className="pdf-stack">
            {rest.map((post, index) => (
              <article key={post.slug}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.mediaUrl || storyImages[index + 1]} alt={post.mediaAlt || post.title} />
                <div>
                  <time>{post.date}</time>
                  <h3>{post.title}</h3>
                  <Link href="/stories">{pageCopy.read}</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pdf-banner" aria-label="Mission">
        <p>{pageCopy.banner}</p>
      </section>

      <section className="pdf-index" id="index">
        <header>
          <p className="pdf-kicker">{pageCopy.index}</p>
          <h2>{localizedHome.helpTitle}</h2>
          <p>{localizedHome.helpIntro}</p>
        </header>
        <ol>
          {localizedHome.pathways.map((pathway, index) => {
            if (!pathway.visible) return null;
            const external = pathway.href.startsWith("https://");
            return (
              <li key={index}>
                <a href={pathway.href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
                  <em>{String(index + 1).padStart(2, "0")}</em>
                  <strong>{pathway.title}</strong>
                  <span>{pathway.description}</span>
                </a>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="pdf-triad" id="work">
        <header>
          <p className="pdf-kicker">{pageCopy.mandate}</p>
          <h2>{pageCopy.triadTitle}</h2>
        </header>
        <div>
          <article>
            <h3>{pageCopy.triad[0].title}</h3>
            <p>{pageCopy.triad[0].body}</p>
            <Link href="/our-work">{pageCopy.triad[0].link}</Link>
          </article>
          <article>
            <h3>{pageCopy.triad[1].title}</h3>
            <p>{pageCopy.triad[1].body}</p>
            <Link href="/stories">{pageCopy.triad[1].link}</Link>
          </article>
          <article>
            <h3>{pageCopy.triad[2].title}</h3>
            <p>{pageCopy.triad[2].body}</p>
            <Link href="/events">{pageCopy.triad[2].link}</Link>
          </article>
        </div>
      </section>

      <section className="pdf-band">
        <div>
          <p className="pdf-kicker">{pageCopy.takePart}</p>
          <h2>{pageCopy.takePartTitle}</h2>
        </div>
        <div className="pdf-band-actions">
          <Link className="pdf-cta" href="/get-involved">
            {pageCopy.getInvolved}
          </Link>
          {home.telegramTraining.visible && home.telegramTraining.url ? (
            <a
              className="pdf-ghost"
              href={home.telegramTraining.url}
              target="_blank"
              rel="noreferrer"
            >
              {language === "my" ? pageCopy.telegramTraining : home.telegramTraining.cta}
            </a>
          ) : null}
        </div>
      </section>

      <MailSubscribe source="home" />

      <footer className="pdf-colophon">
        <div className="pdf-colophon-brand">
          <LogoMark />
          <div>
            <strong>PDF Myanmar Relief</strong>
            <span>{pageCopy.footerTag}</span>
          </div>
        </div>
        <nav>
          <Link href="/about">{language === "my" ? "အကြောင်း" : "About"}</Link>
          <Link href="/our-work">{language === "my" ? "လုပ်ငန်း" : "Our work"}</Link>
          <Link href="/giving">{language === "my" ? "လှူဒါန်းမှု" : "Giving"}</Link>
          <Link href="/stories">{language === "my" ? "သတင်း" : "News"}</Link>
          <Link href="/events">{language === "my" ? "ပွဲများ" : "Events"}</Link>
          <Link href="/gallery">{language === "my" ? "ဓာတ်ပုံများ" : "Gallery"}</Link>
          <Link href="/approach">{language === "my" ? "ချဉ်းကပ်ပုံ" : "Approach"}</Link>
          <Link href="/get-involved">{language === "my" ? "ဆက်သွယ်ရန်" : "Contact"}</Link>
        </nav>
        <p>{pageCopy.footerNote}</p>
      </footer>
    </main>
  );
}
