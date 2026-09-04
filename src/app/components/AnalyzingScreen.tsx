"use client";

import { useLocale } from "@/common/lib/i18n/LocaleProvider";

/** 재료를 하나씩 찾아내는 느낌을 주는 진행 표시용 아이콘 5개(장식용 — 실제 인식 결과와는
 *  무관하며, 결과가 오기 전까지 순차적으로 훑는 애니메이션만 담당한다). */
const SCAN_ICONS = ["🥚", "🥬", "🧅", "🥕", "🧊"];

export function AnalyzingScreen({ photoDataUrl }: { photoDataUrl: string | null }) {
  const { t } = useLocale();

  return (
    <div className="flex flex-1 flex-col pt-1">
      <h1 className="whitespace-pre-line text-[24px] font-extrabold leading-tight text-ink">{t.analyzing.heading}</h1>
      <p className="mt-2 text-[16px] leading-relaxed text-ink-soft">
        {t.analyzing.bodyLines[0]} {t.analyzing.bodyLines[1]}
      </p>

      <div className="mt-6 flex items-center gap-4">
        {photoDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- 방금 찍은 사진을 그대로 미리보기로 보여줄 뿐 최적화 대상 자산이 아니다
          <img
            src={photoDataUrl}
            alt={t.analyzing.photoAlt}
            className="h-20 w-20 shrink-0 rounded-2xl border border-hairline object-cover shadow-[0_8px_20px_-10px_rgba(120,70,40,0.4)]"
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          {SCAN_ICONS.map((icon, i) => (
            <div
              key={i}
              className="relative flex items-center gap-3 rounded-2xl border border-hairline bg-surface px-3.5 py-2.5"
              style={{ animation: "fridge-scan-row 2.4s ease-in-out infinite", animationDelay: `${i * 0.42}s` }}
            >
              <span className="text-[19px] leading-none">{icon}</span>
              <span className="h-2.5 flex-1 rounded-full bg-surface-2" />
              <span
                className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white"
                style={{ animation: "fridge-scan-check 2.4s ease-in-out infinite", animationDelay: `${i * 0.42}s` }}
              >
                ✓
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
