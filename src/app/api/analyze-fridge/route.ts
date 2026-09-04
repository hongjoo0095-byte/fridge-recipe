/**
 * 냉장고 사진 -> 재료 목록 인식. GEMINI_API_KEY는 이 서버 라우트에서만 읽는다
 * (Glucose Vision의 api/analyze-meal/route.ts와 동일한 원칙).
 *
 * 이 라우트는 "무엇이 보이는가"만 답한다 — 레시피 추천은 사용자가 재료를 확인·수정한
 * 뒤 /api/suggest-recipes에서 별도로 요청한다. 그래야 사용자가 재료를 고친 경우
 * 그 수정 내용이 실제로 추천에 반영된다.
 */
import { NextResponse } from "next/server";
import { callGemini, extractJsonObject } from "@/common/lib/gemini";
import { getDictionary, isLocale, type Dictionary, type Locale } from "@/common/lib/i18n/dictionaries";

export const runtime = "nodejs";

const MAX_INGREDIENT_NAME = 24;
const MAX_INGREDIENTS = 20;

const LANGUAGE_INSTRUCTION: Record<Locale, string> = {
  ko: "재료 이름은 한국어로 작성하세요.",
  en: "Write ingredient names in English.",
  ja: "食材名は日本語で記述してください。",
};

function buildPrompt(locale: Locale): string {
  return `사진 속 냉장고 또는 식재료를 보고, 실제로 알아볼 수 있는 식재료만 나열하세요. 설명 문장이나 코드블록 표시 없이 아래 JSON 형식 하나만 출력합니다.
{"ingredients": ["재료명", "재료명"]}

규칙:
- 실제로 사진에서 식별 가능한 식재료만 적는다. 안 보이는 재료를 추측해서 넣지 않는다.
- 재료명은 짧은 명사(예: "대파", "두부", "달걀")로, 브랜드명·포장재·용기는 제외한다.
- 같은 재료를 중복해서 적지 않는다.
- 최대 ${MAX_INGREDIENTS}개까지만 적는다(재료가 더 많으면 눈에 잘 띄는 것 위주로).
${LANGUAGE_INSTRUCTION[locale]}

사진에서 식재료를 전혀 찾을 수 없으면 "ingredients"를 빈 배열로 반환하세요.`;
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

interface RequestBody {
  imageBase64?: unknown;
  mimeType?: unknown;
  locale?: unknown;
}

function sanitizeIngredientNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const name = item.trim().slice(0, MAX_INGREDIENT_NAME);
    if (name.length === 0) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
    if (out.length >= MAX_INGREDIENTS) break;
  }
  return out;
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
    console.error("analyze-fridge: GEMINI_API_KEY가 설정되어 있지 않습니다.");
    return errorResponse(t.errors.missingApiKey, 500);
  }

  const { imageBase64, mimeType } = body;
  if (typeof imageBase64 !== "string" || imageBase64.length === 0) {
    return errorResponse(t.errors.missingImage, 400);
  }
  const safeMimeType = typeof mimeType === "string" && mimeType.startsWith("image/") ? mimeType : "image/jpeg";

  const result = await callGemini({
    apiKey,
    parts: [{ text: buildPrompt(locale) }, { inline_data: { mime_type: safeMimeType, data: imageBase64 } }],
    temperature: 0.2,
  });

  if (!result.ok) {
    const status = result.kind === "rateLimited" ? 429 : 502;
    return errorResponse(t.errors[result.kind], status);
  }

  let ingredients: string[];
  try {
    const obj = extractJsonObject(result.text);
    ingredients = sanitizeIngredientNames(obj.ingredients);
  } catch (err) {
    console.error("analyze-fridge: 분석 결과 파싱 실패", result.text.slice(0, 500), err);
    return errorResponse(t.errors.parseFailed, 502);
  }

  if (ingredients.length === 0) {
    return errorResponse(t.errors.noIngredientsFound, 422);
  }

  return NextResponse.json({ ingredients });
}
