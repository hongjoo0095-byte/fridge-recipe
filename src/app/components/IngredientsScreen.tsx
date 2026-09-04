"use client";

import { useState } from "react";
import { useLocale } from "@/common/lib/i18n/LocaleProvider";
import BackButton from "@/common/components/BackButton";
import type { RecognizedIngredient } from "@/app/lib/types";

export function IngredientsScreen({
  ingredients,
  onAdd,
  onRemove,
  onBack,
  onContinue,
  loading,
  error,
}: {
  ingredients: RecognizedIngredient[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
  loading: boolean;
  error: string | null;
}) {
  const { t } = useLocale();
  const [draft, setDraft] = useState("");

  function submitAdd() {
    const name = draft.trim();
    if (!name) return;
    onAdd(name);
    setDraft("");
  }

  return (
    <div className="flex flex-1 flex-col pt-1">
      <div className="mb-1 flex items-center">
        <BackButton onClick={onBack} aria-label={t.actions.back} />
      </div>

      <h1 className="text-[22px] font-extrabold text-ink">{t.ingredients.heading}</h1>
      <p className="mt-1 text-[16px] leading-snug text-ink-soft">{t.ingredients.subheading}</p>

      {error && <p className="mt-3 rounded-2xl bg-danger-tint px-4 py-3 text-[15px] text-danger">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {ingredients.map((ing) => (
          <span
            key={ing.id}
            className="flex items-center gap-2 rounded-full bg-accent-tint py-2 pl-4 pr-2 text-[16px] font-semibold text-accent-deep shadow-[0_4px_12px_-8px_rgba(200,70,40,0.5)]"
          >
            {ing.name}
            <button
              type="button"
              onClick={() => onRemove(ing.id)}
              aria-label={`${t.ingredients.removeAria}: ${ing.name}`}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-deep/15 text-[13px] text-accent-deep"
            >
              ✕
            </button>
          </span>
        ))}
        {ingredients.length === 0 && <p className="text-[15px] text-ink-faint">{t.ingredients.minOneItem}</p>}
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submitAdd();
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t.ingredients.addPlaceholder}
          className="flex-1 rounded-full border border-hairline bg-surface px-4 py-3 text-[16px] text-ink outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="rounded-full bg-ink px-5 py-3 text-[16px] font-bold text-white transition active:scale-95"
        >
          {t.ingredients.addButton}
        </button>
      </form>

      <button
        type="button"
        onClick={onContinue}
        disabled={loading || ingredients.length === 0}
        className="relative mt-6 flex w-full items-center justify-center overflow-hidden rounded-[22px] bg-accent py-4 text-[18px] font-bold text-white shadow-[0_14px_28px_-12px_rgba(200,70,40,0.55)] transition enabled:active:scale-[0.98] disabled:opacity-45"
      >
        <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent" />
        <span className="relative">{loading ? t.ingredients.continuing : t.ingredients.continueButton}</span>
      </button>
    </div>
  );
}
