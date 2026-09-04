/**
 * 재료 이름 목록 -> 성격이 다른 레시피 3개(fastest/novel/depleting). 실제 호출은
 * 서버(/api/suggest-recipes)가 한다.
 */
import type { Locale } from "@/common/lib/i18n/dictionaries";
import { getDictionary } from "@/common/lib/i18n/dictionaries";
import type { RecipeSuggestion } from "./types";
import { DEMO_RECIPES } from "./demoData";

const IS_DEMO = process.env.NEXT_PUBLIC_FRIDGE_DEMO === "1";

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body: unknown = await response.json();
    const message = (body as { error?: unknown } | null)?.error;
    if (typeof message === "string" && message.length > 0) return message;
  } catch {
    // 서버가 JSON이 아닌 응답을 준 경우 기본 메시지를 쓴다.
  }
  return fallback;
}

export async function suggestRecipes(ingredients: string[], locale: Locale): Promise<RecipeSuggestion[]> {
  const t = getDictionary(locale);

  if (IS_DEMO) {
    await new Promise((resolve) => setTimeout(resolve, 1600));
    // 데모 데이터는 사용자가 편집한 재료 목록을 반영해 usedIngredients를 다시
    // 걸러낸다 — 재료를 지워도 화면이 그대로 "모든 재료를 썼다"고 보여주지 않게.
    const known = new Set(ingredients.map((i) => i.toLowerCase()));
    return DEMO_RECIPES.map((r) => ({
      ...r,
      usedIngredients: r.usedIngredients.filter((i) => known.has(i.toLowerCase())),
    }));
  }

  let response: Response;
  try {
    response = await fetch("/api/suggest-recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients, locale }),
    });
  } catch (err) {
    console.error("suggestRecipes: 서버 요청 실패", err);
    throw new Error(t.errors.networkError);
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, t.errors.upstreamError));
  }

  let body: { recipes?: unknown };
  try {
    body = await response.json();
  } catch (err) {
    console.error("suggestRecipes: 응답 파싱 실패", err);
    throw new Error(t.errors.unreadableResult);
  }

  if (!Array.isArray(body.recipes)) {
    throw new Error(t.errors.invalidResultShape);
  }

  return body.recipes as RecipeSuggestion[];
}
