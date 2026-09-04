/** 레시피 상세 화면의 공유 본문 조립 — common/lib/shareText.ts(공유 메커니즘)와 짝을
 *  이루는, 이 앱 전용 텍스트 조립 함수. */
import type { Dictionary } from "@/common/lib/i18n/dictionaries";
import type { RecipeSuggestion } from "./types";

export function buildRecipeShareText(recipe: RecipeSuggestion, t: Dictionary): string {
  const lines: string[] = [
    t.share.reportTitle,
    `${recipe.title} · ${recipe.cookTimeMinutes}${t.recipes.minutesUnit} · ${t.recipes.difficulty[recipe.difficulty]} · ${recipe.servings}${t.detail.servingsLabel}`,
    "",
    `[${t.detail.usedHeading}] ${recipe.usedIngredients.join(", ") || "-"}`,
    recipe.missingIngredients.length > 0 ? `[${t.detail.missingHeading}] ${recipe.missingIngredients.join(", ")}` : "",
    "",
    `[${t.detail.stepsHeading}]`,
    ...recipe.steps.map((step, i) => `${i + 1}. ${step}`),
  ].filter((line) => line !== "");

  return lines.join("\n");
}

export function buildRecipeShareFileName(recipe: RecipeSuggestion): string {
  return `fridge-recipe-${recipe.id}.txt`;
}
