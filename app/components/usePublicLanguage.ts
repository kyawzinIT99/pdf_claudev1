"use client";

import { useEffect, useState } from "react";
import type { PublicLanguage } from "../lib/i18n";

const STORAGE_KEY = "pdf-language";

function isPublicLanguage(value: string | null): value is PublicLanguage {
  return value === "en" || value === "my" || value === "kar";
}

export function usePublicLanguage() {
  const [language, setLanguage] = useState<PublicLanguage>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isPublicLanguage(stored)) setLanguage(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "my" ? "my" : "en";
    document.documentElement.dataset.lang = language;
  }, [language]);

  function onLanguageChange(next: PublicLanguage) {
    setLanguage(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return { language, onLanguageChange };
}
