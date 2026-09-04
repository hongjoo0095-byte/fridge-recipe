"use client";

import { useLocale } from "@/common/lib/i18n/LocaleProvider";
import BackButton from "@/common/components/BackButton";
import type { RecipeRole, RecipeSuggestion } from "@/app/lib/types";

const ROLE_STYLE: Record<RecipeRole, { badge: string; bar: string }> = {
  fastest: { badge: "bg-accent-tint text-accent-deep", bar: "bg-accent" },
  novel: { badge: "bg-gold-tint text-gold-deep", bar: "bg-gold" },
  depleting: { badge: "bg-apricot-tint text-apricot-deep", bar: "bg-apricot" },
};

function StatChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-[14.5px] font-semibold text-ink">
      <span className="flex h-4 w-4 items-center justify-center text-ink-soft">{icon}</span>
      {label}
    </span>
  );
}

const ClockIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-full w-full">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const GaugeIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-full w-full">
    <path d="M12 20a8 8 0 100-16 8 8 0 000 16z" />
    <path d="M12 12l3.5-3.5" />
  </svg>
);
const PeopleIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-full w-full">
    <circle cx="12" cy="8" r="3.2" />
    <path d="M5.5 20a6.5 6.5 0 0113 0" />
  </svg>
);
const MissingIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-full w-full">
    <path d="M12 9v4M12 16.5v.01" />
    <path d="M10.3 4.5L2.9 18a1.6 1.6 0 001.4 2.4h15.4a1.6 1.6 0 001.4-2.4L13.7 4.5a1.6 1.6 0 00-3.4 0z" />
  </svg>
);

export function RecipeResultsScreen({
  recipes,
  onOpenDetail,
  onEditIngredients,
}: {
  recipes: RecipeSuggestion[];
  onOpenDetail: (id: string) => void;
  onEditIngredients: () => void;
}) {
  const { t } = useLocale();

  return (
    <div className="flex flex-1 flex-col pt-1">
      <div className="mb-1 flex items-center">
        <BackButton onClick={onEditIngredients} aria-label={t.recipes.editIngredients} />
      </div>

      <h1 className="text-[22px] font-extrabold text-ink">{t.recipes.heading}</h1>
      <p className="mt-1 text-[16px] leading-snug text-ink-soft">{t.recipes.subheading}</p>

      <div className="mt-4 flex flex-1 flex-col gap-3.5">
        {recipes.map((recipe) => {
          const style = ROLE_STYLE[recipe.role];
          return (
            <button
              key={recipe.id}
              type="button"
              onClick={() => onOpenDetail(recipe.id)}
              className="relative overflow-hidden rounded-[24px] border border-hairline bg-surface p-4 text-left shadow-[0_16px_32px_-16px_rgba(120,70,40,0.35)] transition active:scale-[0.99]"
            >
              <span className={`absolute inset-y-0 left-0 w-1.5 ${style.bar}`} />
              <div className="pl-2">
                <span className={`inline-block rounded-full px-3 py-1.5 text-[14px] font-extrabold ${style.badge}`}>
                  {t.recipes.roleLabel[recipe.role]}
                </span>
                <div className="mt-2.5 text-[20px] font-extrabold leading-snug text-ink">{recipe.title}</div>
                <div className="mt-0.5 text-[14.5px] text-ink-faint">{t.recipes.roleHint[recipe.role]}</div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <StatChip icon={ClockIcon} label={`${recipe.cookTimeMinutes}${t.recipes.minutesUnit}`} />
                  <StatChip icon={GaugeIcon} label={t.recipes.difficulty[recipe.difficulty]} />
                  <StatChip icon={PeopleIcon} label={`${recipe.servings}${t.recipes.servingsUnit}`} />
                </div>

                <div className="mt-2.5 flex items-start gap-1.5 text-[15px] text-ink-soft">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-apricot-deep">{MissingIcon}</span>
                  <span>
                    <span className="font-semibold text-ink">{t.recipes.missingLabel}: </span>
                    {recipe.missingIngredients.length > 0 ? recipe.missingIngredients.join(", ") : t.recipes.missingNone}
                  </span>
                </div>

                <div className="mt-3 text-right text-[15px] font-bold text-accent-deep">{t.recipes.openDetail} ›</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
