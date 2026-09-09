/**
 * 레시피 완성 사진 생성 — GEMINI_API_KEY(이미 analyze-fridge/suggest-recipes에서
 * 쓰는 것과 동일한 키)로 해당 레시피에 맞는 완성 음식 사진 1장을 만든다.
 *
 * 왜 사진 대신 생성인가: 메뉴명은 AI가 그때그때 새로 만드는 것이라 고정된 사진
 * 데이터베이스로는 항상 일치를 보장할 수 없다. 대신 메뉴명 + 실제 재료 목록을
 * 그대로 이미지 생성 프롬프트에 넣어, 스톡사진보다 그 레시피 자체와 더 가깝게
 * 만든다(허브 QA 기준: "메뉴 정체성·주재료와 명확히 일치해야 한다").
 *
 * 실패(키 없음/요율제한/타임아웃 등)는 500으로 응답하고, 클라이언트가 브랜드
 * fallback 이미지로 대체한다 — 틀린 사진을 억지로 보여주지 않는다.
 */
import { NextResponse } from "next/server";
import { callGeminiImage } from "@/common/lib/gemini";
import { isLocale, type Locale } from "@/common/lib/i18n/dictionaries";

export const runtime = "nodejs";

const MAX_TITLE_LEN = 60;
const MAX_INGREDIENT_LEN = 24;
const MAX_INGREDIENTS = 12;

function sanitizeIngredients(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .slice(0, MAX_INGREDIENTS)
    .map((v) => v.trim().slice(0, MAX_INGREDIENT_LEN));
}

function buildPrompt(title: string, ingredients: string[], locale: Locale): string {
  const ingredientLine = ingredients.length > 0 ? ingredients.join(", ") : "";
  const localeNote: Record<Locale, string> = {
    ko: "이 요리는 한국 가정식 스타일입니다.",
    en: "This is a home-cooked dish.",
    ja: "これは家庭料理です。",
  };
  return [
    `A professional, appetizing food photograph of a finished, plated dish called "${title}".`,
    ingredientLine ? `Made with these ingredients: ${ingredientLine}.` : "",
    localeNote[locale],
    "Shot from a 45-degree angle on a simple plate or bowl, soft natural lighting, shallow depth of field, realistic restaurant-quality plating.",
    "No text, no watermark, no logo, no hands, no people, no packaging in the frame.",
  ]
    .filter(Boolean)
    .join(" ");
}

interface RequestBody {
  title?: unknown;
  usedIngredients?: unknown;
  missingIngredients?: unknown;
  locale?: unknown;
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim().slice(0, MAX_TITLE_LEN) : "";
  if (!title) {
    return NextResponse.json({ error: "missing_title" }, { status: 400 });
  }
  const locale: Locale = isLocale(body.locale) ? body.locale : "ko";
  const ingredients = [
    ...sanitizeIngredients(body.usedIngredients),
    ...sanitizeIngredients(body.missingIngredients),
  ].slice(0, MAX_INGREDIENTS);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("recipe-image: GEMINI_API_KEY가 설정되어 있지 않습니다.");
    return NextResponse.json({ error: "missing_api_key" }, { status: 500 });
  }

  const result = await callGeminiImage({ apiKey, prompt: buildPrompt(title, ingredients, locale) });
  if (!result.ok) {
    const status = result.kind === "rateLimited" ? 429 : 502;
    return NextResponse.json({ error: result.kind }, { status });
  }

  return NextResponse.json({ image: `data:${result.mimeType};base64,${result.base64}` });
}
