"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { LOCALE_STORAGE_KEY, detectBrowserLocale, getDictionary, isLocale, type Dictionary, type Locale } from "./dictionaries";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/** Glucose Vision의 LocaleProvider와 동일한 방식 — 저장된 선택이 있으면 그걸 쓰고,
 *  없으면 브라우저 언어를 감지해 바로 저장해둔다. */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ko");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isLocale(saved)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 후 1회, 저장된 언어를 복원하는 용도
        setLocaleState(saved);
        return;
      }
    } catch {
      // localStorage를 쓸 수 없는 환경(사생활 보호 모드 등)이면 감지만 하고 저장은 건너뛴다.
    }
    const detected = detectBrowserLocale(window.navigator.language);
    setLocaleState(detected);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, detected);
    } catch {
      // 저장 실패는 무시 — 이번 세션만 감지된 언어로 보여준다.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function setLocale(next: Locale) {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // 저장 실패는 무시한다 — 이번 세션 동안은 어차피 선택한 언어로 보인다.
    }
  }

  const value = useMemo<LocaleContextValue>(() => ({ locale, setLocale, t: getDictionary(locale) }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale은 LocaleProvider 안에서만 사용할 수 있습니다.");
  return ctx;
}
