"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { PublicLanguage } from "../lib/i18n";

const STORAGE_KEY = "pdf-language";
const LANGUAGE_EVENT = "pdf-language-change";

function isPublicLanguage(value: string | null): value is PublicLanguage {
  return value === "en" || value === "my" || value === "kar";
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(LANGUAGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(LANGUAGE_EVENT, onChange);
  };
}

function getLanguage(): PublicLanguage {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isPublicLanguage(stored) ? stored : "en";
  } catch {
    return "en";
  }
}

export function usePublicLanguage() {
  const language = useSyncExternalStore(subscribe, getLanguage, () => "en" as PublicLanguage);

  useEffect(() => {
    document.documentElement.lang = language === "my" ? "my" : "en";
    document.documentElement.dataset.lang = language;
  }, [language]);

  function onLanguageChange(next: PublicLanguage) {
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(LANGUAGE_EVENT));
  }

  return { language, onLanguageChange };
}
