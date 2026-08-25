"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { navLabel, publicLanguages, type PublicLanguage } from "../lib/i18n";
import { publicNavigation } from "../lib/sections";
import { LogoMark } from "./LogoMark";

export { publicLanguages, type PublicLanguage };

function languageButtonLabel(option: (typeof publicLanguages)[number]) {
  return "latin" in option && option.latin
    ? `${option.label} · ${option.latin}`
    : option.label;
}

export function PublicHeader({
  activeHref,
  language = "en",
  onLanguageChange,
}: {
  activeHref?: string;
  language?: PublicLanguage;
  onLanguageChange?: (language: PublicLanguage) => void;
}) {
  const [languageOpen, setLanguageOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const languageMenuId = useId();
  const mobileMenuId = useId();
  const languageRef = useRef<HTMLDivElement>(null);
  const currentLanguage =
    publicLanguages.find((option) => option.code === language) ?? publicLanguages[0];

  const links = publicNavigation.filter((item) => !("cta" in item && item.cta));
  const cta = publicNavigation.find((item) => "cta" in item && item.cta);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!languageRef.current?.contains(event.target as Node)) setLanguageOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLanguageOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function isActive(href: string) {
    if (!activeHref) return false;
    if (href === "/") return activeHref === "/";
    return activeHref === href;
  }

  return (
    <header className={`pdf-masthead${language === "my" ? " is-my" : ""}`}>
      <div className="pdf-flag" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="pdf-masthead-top">
        <Link className="pdf-wordmark" href="/" aria-label="PDF community home">
          <LogoMark />
          <span>
            <b>PDF</b>
            <small>{language === "my" ? "မြန်မာ အရပ်သား ကယ်ဆယ်ရေး" : "Myanmar civilian relief"}</small>
          </span>
        </Link>
        <div className="pdf-masthead-tools">
          <div className="pdf-lang" ref={languageRef}>
            <button
              type="button"
              aria-expanded={languageOpen}
              aria-controls={languageMenuId}
              aria-haspopup="menu"
              onClick={() => setLanguageOpen((value) => !value)}
            >
              {languageButtonLabel(currentLanguage)}
            </button>
            {languageOpen && (
              <div id={languageMenuId} role="menu">
                {publicLanguages.map((option) => (
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={option.code === language}
                    key={option.code}
                    onClick={() => {
                      onLanguageChange?.(option.code);
                      setLanguageOpen(false);
                    }}
                  >
                    {languageButtonLabel(option)}
                  </button>
                ))}
              </div>
            )}
          </div>
          {cta && (
            <Link className="pdf-cta" href={cta.href}>
              {navLabel(language, cta.href, cta.label)}
            </Link>
          )}
          <button
            type="button"
            className={`pdf-burger${mobileOpen ? " is-open" : ""}`}
            aria-expanded={mobileOpen}
            aria-controls={mobileMenuId}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((value) => !value)}
          >
            <span className="pdf-burger-bars" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="pdf-burger-label">
              {mobileOpen
                ? language === "my"
                  ? "ပိတ်ရန်"
                  : "Close"
                : language === "my"
                  ? "မီနူး"
                  : "Menu"}
            </span>
          </button>
        </div>
      </div>
      <nav className="pdf-rail" aria-label="Site sections">
        {links.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "is-on" : undefined}
              aria-current={active ? "page" : undefined}
            >
              {navLabel(language, item.href, item.label)}
            </Link>
          );
        })}
      </nav>
      {mobileOpen && (
        <>
          <button
            type="button"
            className="pdf-drawer-dim"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <nav className="pdf-drawer" id={mobileMenuId} aria-label="All pages">
            <p className="pdf-drawer-kicker">{language === "my" ? "စာမျက်နှာများ" : "Pages"}</p>
            {links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive(item.href) ? "is-on" : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  {navLabel(language, item.href, item.label)}
                </Link>
              ))}
            {cta && (
              <Link className="pdf-cta" href={cta.href} onClick={() => setMobileOpen(false)}>
                {navLabel(language, cta.href, cta.label)}
              </Link>
            )}
          </nav>
        </>
      )}
    </header>
  );
}
