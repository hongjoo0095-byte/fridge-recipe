/**
 * 냉장고 레시피 앱 전용 데이터 구조 — 공통 기본판(src/common)에는 없는,
 * 이 앱만의 도메인 타입만 모아둔다.
 */

/** 사진에서 AI가 인식한 재료, 또는 사용자가 직접 추가한 재료. */
export interface RecognizedIngredient {
  id: string;
  name: string;
  source: "detected" | "added";
}

/**
 * 추천 레시피의 "역할" — 세 메뉴가 서로 겹치지 않도록 반드시 이 세 역할을 하나씩
 * 채우게 한다(analyze-fridge/route.ts, suggest-recipes/route.ts 참고).
 * - fastest: 조리시간이 가장 짧은 메뉴
 * - novel: 재료 조합이 새롭고 의외인 메뉴
 * - depleting: 인식된 재료를 가장 많이 소진하는 메뉴
 */
export type RecipeRole = "fastest" | "novel" | "depleting";

export const RECIPE_ROLES: RecipeRole[] = ["fastest", "novel", "depleting"];

export type RecipeDifficulty = "easy" | "medium" | "hard";

export interface RecipeSuggestion {
  id: string;
  role: RecipeRole;
  title: string;
  cookTimeMinutes: number;
  difficulty: RecipeDifficulty;
  servings: number;
  /** 이 요리에 실제로 쓰이는, 사용자가 가진 재료 이름. */
  usedIngredients: string[];
  /** 부족한 재료 — 최대 2개로 제한한다(서버에서 clamp). */
  missingIngredients: string[];
  steps: string[];
}
