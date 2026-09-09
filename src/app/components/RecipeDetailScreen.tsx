"use client";

import { useState } from "react";
import { useLocale } from "@/common/lib/i18n/LocaleProvider";
import BackButton from "@/common/components/BackButton";
import { copyText, shareText } from "@/common/lib/shareText";
import { buildRecipeShareFileName, buildRecipeShareText } from "@/app/lib/fridgeShare";
import type { RecipeSuggestion } from "@/app/lib/types";
import { RecipeImage } from "@/app/components/RecipeImage";
import type { RecipeImageState } from "@/app/lib/useRecipeImages";

export function RecipeDetailScreen({
  recipe,
  imageState,
  onBack,
}: {
  recipe: RecipeSuggestion;
  imageState: RecipeImageState | undefined;
  onBack: () => void;
}) {
  const { t } = useLocale();
  const [status, setStatus] = useState<string | null>(null);

  async function handleShare() {
    const text = buildRecipeShareText(recipe, t);
    const outcome = await shareText(text, buildRecipeShareFileName(recipe));
    if (outcome === "downloaded") setStatus(t.share.downloaded);
    if (outcome === "failed") setStatus(t.share.shareFailed);
  }

  async function handleCopy() {
    const ok = await copyText(buildRecipeShareText(recipe, t));
    setStatus(ok ? t.share.copied : t.share.copyFailed);
  }

  return (
    <div className="flex flex-1 flex-col pt-1">
      {/* 하단 고정 공유 바에 가려지지 않도록 여유 패딩을 둔다 */}
      <div className="flex-1 pb-24">
        <div className="mb-1 flex items-center">
          <BackButton onClick={onBack} aria-label={t.actions.back} />
        </div>

        <RecipeImage state={imageState} alt={recipe.title} rounded="rounded-[22px]" />

        <h1 className="mt-4 text-[22px] font-extrabold leading-snug text-ink">{recipe.title}</h1>
        <div className="mt-1.5 flex flex-wrap gap-2">
          <span className="rounded-full bg-surface-2 px-3 py-1 text-[14.5px] font-semibold text-ink">
            {recipe.cookTimeMinutes}
            {t.recipes.minutesUnit}
          </span>
          <span className="rounded-full bg-surface-2 px-3 py-1 text-[14.5px] font-semibold text-ink">
            {t.recipes.difficulty[recipe.difficulty]}
          </span>
          <span className="rounded-full bg-surface-2 px-3 py-1 text-[14.5px] font-semibold text-ink">
            {recipe.servings}
            {t.detail.servingsLabel}
          </span>
        </div>

        <div className="mt-4 rounded-[22px] border border-hairline bg-surface p-4 shadow-[0_10px_24px_-16px_rgba(120,70,40,0.35)]">
          <div className="text-[14px] font-bold text-ink-soft">{t.detail.usedHeading}</div>
          <div className="mt-1 text-[16px] leading-relaxed text-ink">{recipe.usedIngredients.join(", ") || "-"}</div>
          {recipe.missingIngredients.length > 0 && (
            <>
              <div className="mt-3 text-[14px] font-bold text-ink-soft">{t.detail.missingHeading}</div>
              <div className="mt-1 text-[16px] leading-relaxed text-ink">{recipe.missingIngredients.join(", ")}</div>
            </>
          )}
        </div>

        <div className="mt-5 text-[15px] font-extrabold text-ink-soft">{t.detail.stepsHeading}</div>
        <div className="mt-2.5 flex flex-col gap-3">
          {recipe.steps.map((step, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-[20px] border border-hairline bg-surface p-4 shadow-[0_10px_22px_-16px_rgba(120,70,40,0.3)]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-[16px] font-extrabold text-white">
                {i + 1}
              </span>
              <p className="pt-1 text-[17px] leading-relaxed text-ink">{step}</p>
            </div>
          ))}
        </div>

        {status && <p className="mt-4 text-center text-[14px] text-ink-soft">{status}</p>}
      </div>

      {/* 요구사항: 공유 버튼을 화면 하단에 고정. 실제 기술 근거가 있는 두 동작만
          제공한다 — "복사"는 클립보드 복사, "공유"는 OS 공유시트를 열어 메모·메시지·
          Drive 등으로 보낼 수 있게 한다(navigator.share는 대상 앱을 앱이 직접 골라
          여는 API가 아니라 OS가 목록을 보여주는 방식이라, 메모/메시지/Drive를 각각
          독립 버튼으로 흉내 내면 실제로는 다 같은 동작이면서 다른 앱으로 간다고
          거짓 안내하게 된다). */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="flex w-full max-w-sm gap-3 rounded-[22px] border border-hairline bg-surface/95 p-2.5 shadow-[0_-8px_24px_-8px_rgba(120,70,40,0.25)] backdrop-blur">
          <button
            type="button"
            onClick={handleCopy}
            className="flex flex-1 items-center justify-center gap-2 rounded-[16px] bg-surface-2 py-3 text-[18px] font-bold text-ink transition active:scale-[0.97]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <rect x="8" y="8" width="12" height="12" rx="2" />
              <path d="M4 16V6a2 2 0 012-2h10" />
            </svg>
            {t.share.copyButton}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-[16px] bg-accent py-3 text-[18px] font-bold text-white shadow-[0_10px_22px_-12px_rgba(200,70,40,0.6)] transition active:scale-[0.97]"
          >
            <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent" />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="relative h-5 w-5">
              <path d="M21 15a2 2 0 01-2 2H8l-4 4V5a2 2 0 012-2h13a2 2 0 012 2z" />
            </svg>
            <span className="relative">{t.share.shareButton}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
