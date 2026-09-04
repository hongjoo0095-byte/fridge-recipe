"use client";

import { useLocale } from "@/common/lib/i18n/LocaleProvider";
import type { Locale } from "@/common/lib/i18n/types";

const FLAGS: Record<Locale, string> = { ko: "🇰🇷", en: "🇺🇸", ja: "🇯🇵" };
const NAMES: Record<Locale, string> = { ko: "한국어", en: "English", ja: "日本語" };
const CODES: Locale[] = ["ko", "en", "ja"];

/** 화면 우상단 언어 선택기 — PhotoXcel의 LanguageSwitcher.tsx와 동일한 패턴. */
export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      className="absolute right-3 z-30 flex items-center gap-0.5 rounded-full bg-white/85 p-1 text-[11px] font-medium shadow-sm ring-1 ring-hairline backdrop-blur-md"
      style={{ top: "max(0.6rem, env(safe-area-inset-top))" }}
      aria-label={t.languageSwitcher.label}
    >
      {CODES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          aria-label={NAMES[code]}
          aria-pressed={locale === code}
          className={`rounded-full px-2 py-1 transition ${
            locale === code ? "bg-ink text-white" : "text-ink-soft hover:text-ink"
          }`}
        >
          <span aria-hidden="true">{FLAGS[code]}</span>
        </button>
      ))}
    </div>
  );
}
