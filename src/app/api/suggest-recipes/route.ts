/**
 * 재료 목록 -> 성격이 다른 레시피 3개. 사진을 다시 보내지 않는 텍스트 전용 호출이라
 * 사용자가 재료를 추가/삭제하고 다시 요청해도 가볍다.
 *
 * 세 레시피는 반드시 서로 다른 역할(fastest/novel/depleting)을 하나씩 맡는다 —
 * AI가 이 조건을 못 지키면(중복 역할, 3개 미만 등) 임의로 채워 넣지 않고 오류로
 * 처리한다. 사진과 무관하게 반복되는 뻔한 메뉴(김치볶음밥 등)를 피하려면, 이 앱은
 * "그럴듯한 기본 레시피로 채우기"를 절대 하지 않는다 — 항상 실제로 넘어온 재료
 * 목록을 근거로 한 결과만 돌려주거나, 못 만들면 오류를 돌려준다.
 */
import { NextResponse } from "next/server";
import { callGemini, extractJsonObject } from "@/common/lib/gemini";
import { getDictionary, isLocale, type Dictionary, type Locale } from "@/common/lib/i18n/dictionaries";
import { RECIPE_ROLES, type RecipeDifficulty, type RecipeRole, type RecipeSuggestion } from "@/app/lib/types";

export const runtime = "nodejs";

const MAX_INGREDIENTS = 20;
const MAX_INGREDIENT_NAME = 24;
const MAX_TITLE = 40;
const MAX_STEP = 120;
const MAX_STEPS = 8;
const MAX_MISSING = 2;

const LANGUAGE_INSTRUCTION: Record<Locale, string> = {
  ko: "title·steps·usedIngredients·missingIngredients 값은 모두 한국어로 작성하세요.",
  en: "Write title, steps, usedIngredients and missingIngredients values in English.",
  ja: "title・steps・usedIngredients・missingIngredients の値はすべて日本語で記述してください。",
};

function buildPrompt(ingredients: string[], locale: Locale): string {
  return `사용자의 냉장고에는 다음 재료가 있습니다: ${ingredients.join(", ")}

이 재료를 근거로, 성격이 서로 다른 요리 정확히 3개를 아래 JSON 형식으로만 응답하세요. 설명 문장이나 코드블록 표시 없이 JSON 객체 하나만 출력합니다.
{"recipes": [
  {"role": "fastest", "title": "요리명", "cookTimeMinutes": 숫자, "difficulty": "easy|medium|hard", "servings": 숫자, "usedIngredients": ["위 재료 목록 중 실제로 쓰는 것"], "missingIngredients": ["부족한 재료, 최대 2개"], "steps": ["조리 순서 문장"]},
  {"role": "novel", ...},
  {"role": "depleting", ...}
]}

역할 정의(반드시 3개 모두, 각각 정확히 한 번씩 포함할 것):
- "fastest": 조리시간이 15분 이내인, 가장 빨리 만들 수 있는 요리.
- "novel": 평소 흔히 안 하는, 재료 조합이 새롭고 의외인 요리.
- "depleting": 위 재료 목록 중 가장 많은 개수를 사용해서, 냉장고 재료를 가장 많이 소진하는 요리.

반드시 지킬 것:
- usedIngredients는 위에 나열된 재료 이름 중에서만 골라 쓴다(목록에 없는 재료를 지어내지 않는다).
- missingIngredients는 최대 2개, 이 요리에 필요하지만 위 목록에는 없는 재료만 적는다. 없으면 빈 배열.
- 위 재료 구성과 무관하게 아무 냉장고에나 갖다 붙일 수 있는 뻔한 메뉴(예: 단순 김치볶음밥, 단순 계란볶음밥)는 제안하지 않는다 — 반드시 이번에 주어진 재료 조합 자체가 그 메뉴를 골라야 하는 이유가 되게 한다.
- steps는 3~${MAX_STEPS}개, 각각 한두 문장의 실행 가능한 조리 순서.
- cookTimeMinutes와 servings는 숫자만.
${LANGUAGE_INSTRUCTION[locale]}`;
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

interface RequestBody {
  ingredients?: unknown;
  locale?: unknown;
}

function toSafeText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function toSafeInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? Math.round(value) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function toSafeDifficulty(value: unknown): RecipeDifficulty {
  return value === "easy" || value === "medium" || value === "hard" ? value : "medium";
}

/** 입력 재료 목록에 실제로 있는 이름만 usedIngredients로 인정한다(대소문자/공백
 *  무시 비교) — AI가 목록에 없는 재료를 "사용했다"고 지어내는 것을 막는다. */
function filterToKnownIngredients(values: unknown, known: Set<string>, max: number): string[] {
  if (!Array.isArray(values)) return [];
  const out: string[] = [];
  for (const v of values) {
    if (typeof v !== "string") continue;
    const name = v.trim().slice(0, MAX_INGREDIENT_NAME);
    if (name.length === 0) continue;
    if (!known.has(name.toLowerCase())) continue;
    out.push(name);
    if (out.length >= max) break;
  }
  return out;
}

function sanitizeSteps(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim().slice(0, MAX_STEP))
    .slice(0, MAX_STEPS);
}

/** 레시피 하나를 정제한다. role이 유효한 값이 아니거나 title/steps가 비어 있으면
 *  null을 돌려주고, 호출부가 이 레시피 전체를 버리게 한다 — 불완전한 항목을
 *  기본값으로 채워 넣지 않는다. */
function sanitizeRecipe(raw: unknown, knownIngredients: Set<string>): RecipeSuggestion | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  const role = r.role;
  if (!RECIPE_ROLES.includes(role as RecipeRole)) return null;

  const title = toSafeText(r.title, MAX_TITLE);
  if (title.length === 0) return null;

  const steps = sanitizeSteps(r.steps);
  if (steps.length === 0) return null;

  return {
    id: `${role}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role: role as RecipeRole,
    title,
    cookTimeMinutes: toSafeInt(r.cookTimeMinutes, 20),
    difficulty: toSafeDifficulty(r.difficulty),
    servings: toSafeInt(r.servings, 2),
    usedIngredients: filterToKnownIngredients(r.usedIngredients, knownIngredients, MAX_INGREDIENTS),
    missingIngredients: Array.isArray(r.missingIngredients)
      ? r.missingIngredients
          .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
          .map((v) => v.trim().slice(0, MAX_INGREDIENT_NAME))
          .slice(0, MAX_MISSING)
      : [],
    steps,
  };
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return errorResponse(getDictionary("ko").errors.invalidRequest, 400);
  }

  const locale: Locale = isLocale(body.locale) ? body.locale : "ko";
  const t: Dictionary = getDictionary(locale);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("suggest-recipes: GEMINI_API_KEY가 설정되어 있지 않습니다.");
    return errorResponse(t.errors.missingApiKey, 500);
  }

  const rawIngredients = Array.isArray(body.ingredients) ? body.ingredients : [];
  const ingredients = rawIngredients
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim().slice(0, MAX_INGREDIENT_NAME))
    .slice(0, MAX_INGREDIENTS);

  if (ingredients.length === 0) {
    return errorResponse(t.errors.minOneIngredient, 400);
  }

  const result = await callGemini({
    apiKey,
    parts: [{ text: buildPrompt(ingredients, locale) }],
    temperature: 0.6,
  });

  if (!result.ok) {
    const status = result.kind === "rateLimited" ? 429 : 502;
    return errorResponse(t.errors[result.kind], status);
  }

  const knownIngredients = new Set(ingredients.map((i) => i.toLowerCase()));

  let recipes: RecipeSuggestion[];
  try {
    const obj = extractJsonObject(result.text);
    const rawRecipes = Array.isArray(obj.recipes) ? obj.recipes : [];
    recipes = rawRecipes
      .map((r) => sanitizeRecipe(r, knownIngredients))
      .filter((r): r is RecipeSuggestion => r !== null);
  } catch (err) {
    console.error("suggest-recipes: 결과 파싱 실패", result.text.slice(0, 500), err);
    return errorResponse(t.errors.parseFailed, 502);
  }

  // 세 역할이 정확히 한 번씩, 중복 없이 모두 있어야 한다 — 아니면 임의로 채우지
  // 않고 오류로 처리한다(뻔한 기본 메뉴로 대체하지 않기 위함).
  const roles = new Set(recipes.map((r) => r.role));
  if (recipes.length !== 3 || roles.size !== 3) {
    console.error("suggest-recipes: 역할이 3개(fastest/novel/depleting) 모두 채워지지 않음", recipes.map((r) => r.role));
    return errorResponse(t.errors.tooFewRecipes, 502);
  }

  const orderedRecipes = RECIPE_ROLES.map((role) => recipes.find((r) => r.role === role)!);

  return NextResponse.json({ recipes: orderedRecipes });
}
