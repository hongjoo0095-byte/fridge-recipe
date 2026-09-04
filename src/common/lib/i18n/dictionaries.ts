/**
 * 언어 사전 조회 + 브라우저 언어 자동 감지 — Glucose Vision(src/lib/i18n/dictionaries.ts)과
 * 동일한 패턴. 프레임워크 의존성이 없어 서버 라우트와 클라이언트 양쪽에서 그대로 쓴다.
 */
import type { Dictionary, Locale } from "./types.ts";
import { LOCALES } from "./types.ts";
import ko from "./ko.ts";
import en from "./en.ts";
import ja from "./ja.ts";

export type { Dictionary, Locale };
export { LOCALES };

const DICTIONARIES: Record<Locale, Dictionary> = { ko, en, ja };

export const LOCALE_STORAGE_KEY = "fridge-recipe:locale:v1";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as string[]).includes(value);
}

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export function detectBrowserLocale(navigatorLanguage: string | undefined): Locale {
  const lang = (navigatorLanguage ?? "").toLowerCase();
  if (lang.startsWith("ko")) return "ko";
  if (lang.startsWith("ja")) return "ja";
  return "en";
}
