"use client";



import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { translations, type Locale } from "@/lib/i18n/translations";

export type { Locale };



type I18nContextValue = {

  locale: Locale;

  setLocale: (l: Locale) => void;

  t: (key: string) => string;

};



const I18nContext = createContext<I18nContextValue | null>(null);



export function I18nProvider({ children }: { children: ReactNode }) {

  const [locale, setLocaleState] = useState<Locale>("az");



  useEffect(() => {

    const stored = localStorage.getItem("mv-locale") as Locale | null;

    if (stored === "az" || stored === "en") setLocaleState(stored);

  }, []);



  const setLocale = useCallback((l: Locale) => {

    setLocaleState(l);

    localStorage.setItem("mv-locale", l);

  }, []);



  const t = useCallback((key: string) => translations[locale][key] ?? key, [locale]);



  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);



  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;

}



export function useI18n() {

  const ctx = useContext(I18nContext);

  if (!ctx) throw new Error("useI18n must be used within I18nProvider");

  return ctx;

}

