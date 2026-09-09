/**
 * Gemini generateContent 호출 + 오류 분류 — Glucose Vision의
 * app/api/analyze-meal/route.ts에 있던 fetch/상태코드 처리 로직을 앱에 상관없는
 * 부분만 뽑아 공통 모듈로 이식했다. 프롬프트 내용과 응답 파싱(필드 검증)은
 * 앱마다 다르므로 각 라우트에 남겨둔다.
 */
export const GEMINI_TIMEOUT_MS = 25_000;

export type GeminiErrorKind =
  | "timeout"
  | "upstreamUnreachable"
  | "rateLimited"
  | "modelUnavailable"
  | "permissionDenied"
  | "upstreamError"
  | "invalidUpstreamResponse"
  | "noAnalysisText";

export type GeminiCallResult = { ok: true; text: string } | { ok: false; kind: GeminiErrorKind };

interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

/** Gemini generateContent 응답 JSON에서 첫 후보의 텍스트 파트를 꺼낸다. */
export function extractGeminiText(responseJson: unknown): string | null {
  if (typeof responseJson !== "object" || responseJson === null) return null;
  const candidates = (responseJson as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const content = (candidates[0] as { content?: unknown } | undefined)?.content;
  const parts = (content as { parts?: unknown } | undefined)?.parts;
  if (!Array.isArray(parts)) return null;
  const textPart = parts.find(
    (part): part is { text: string } => typeof (part as { text?: unknown } | undefined)?.text === "string",
  );
  return textPart ? textPart.text : null;
}

/** 응답 텍스트(설명 문장이나 ```json 코드블록이 섞여 있을 수 있음)에서 JSON 객체
 *  부분만 찾아 파싱한다. */
export function extractJsonObject(text: string): Record<string, unknown> {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("응답에서 JSON 객체를 찾지 못했습니다.");
  }
  return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;
}

/** 특정 날짜가 박힌 모델 ID는 계정별로 가용성이 달라 404가 날 수 있어 Google이
 *  제공하는 "-latest" 별칭을 쓴다(PhotoXcel/Glucose Vision과 동일한 이유). */
export const GEMINI_MODEL = "gemini-flash-latest";

/** 이미지 생성 전용 모델("nano-banana") — 텍스트 생성(GEMINI_MODEL)과는 다른 모델이다. */
export const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";

export async function callGemini(opts: {
  apiKey: string;
  parts: GeminiPart[];
  temperature?: number;
}): Promise<GeminiCallResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${opts.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: opts.parts }],
          generationConfig: { temperature: opts.temperature ?? 0.3 },
        }),
        signal: controller.signal,
      },
    );
  } catch (err) {
    console.error("gemini: 요청 실패", err);
    const kind: GeminiErrorKind = err instanceof Error && err.name === "AbortError" ? "timeout" : "upstreamUnreachable";
    return { ok: false, kind };
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    console.error("gemini: API 오류", response.status, errText.slice(0, 500));
    if (response.status === 429) return { ok: false, kind: "rateLimited" };
    if (response.status === 404) return { ok: false, kind: "modelUnavailable" };
    if (response.status === 403) {
      // 키가 없는 게 아니라 키에 걸린 제한(HTTP 리퍼러/API 제한) 때문일 가능성이 높다.
      console.error("gemini: 403 PERMISSION_DENIED — 키 제한(HTTP 리퍼러/API 제한)을 확인할 것.");
      return { ok: false, kind: "permissionDenied" };
    }
    return { ok: false, kind: "upstreamError" };
  }

  let responseJson: unknown;
  try {
    responseJson = await response.json();
  } catch (err) {
    console.error("gemini: 응답 파싱 실패", err);
    return { ok: false, kind: "invalidUpstreamResponse" };
  }

  const text = extractGeminiText(responseJson);
  if (text === null) {
    console.error("gemini: 응답에서 텍스트를 찾지 못함", JSON.stringify(responseJson).slice(0, 500));
    return { ok: false, kind: "noAnalysisText" };
  }

  return { ok: true, text };
}

export type GeminiImageCallResult =
  | { ok: true; mimeType: string; base64: string }
  | { ok: false; kind: GeminiErrorKind };

/** Gemini generateContent 응답 JSON에서 첫 후보의 이미지(inline_data) 파트를 꺼낸다. */
export function extractGeminiImage(responseJson: unknown): { mimeType: string; base64: string } | null {
  if (typeof responseJson !== "object" || responseJson === null) return null;
  const candidates = (responseJson as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const content = (candidates[0] as { content?: unknown } | undefined)?.content;
  const parts = (content as { parts?: unknown } | undefined)?.parts;
  if (!Array.isArray(parts)) return null;
  const imagePart = parts.find(
    (part): part is { inline_data: { mime_type: string; data: string } } =>
      typeof (part as { inline_data?: { data?: unknown; mime_type?: unknown } } | undefined)?.inline_data
        ?.data === "string",
  );
  if (!imagePart) return null;
  return { mimeType: imagePart.inline_data.mime_type || "image/png", base64: imagePart.inline_data.data };
}

/**
 * callGemini와 같은 요청 구조(generateContent)를 쓰지만 텍스트가 아니라 이미지
 * 생성 모델(GEMINI_IMAGE_MODEL)을 호출하고, 응답에서 inline_data(base64 이미지)를
 * 꺼낸다. 에러 분류(타임아웃/요율제한/모델없음/권한없음 등)는 callGemini와 동일한
 * 기준을 그대로 재사용한다.
 */
export async function callGeminiImage(opts: { apiKey: string; prompt: string }): Promise<GeminiImageCallResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${opts.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: opts.prompt }] }],
        }),
        signal: controller.signal,
      },
    );
  } catch (err) {
    console.error("gemini-image: 요청 실패", err);
    const kind: GeminiErrorKind = err instanceof Error && err.name === "AbortError" ? "timeout" : "upstreamUnreachable";
    return { ok: false, kind };
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    console.error("gemini-image: API 오류", response.status, errText.slice(0, 500));
    if (response.status === 429) return { ok: false, kind: "rateLimited" };
    if (response.status === 404) return { ok: false, kind: "modelUnavailable" };
    if (response.status === 403) return { ok: false, kind: "permissionDenied" };
    return { ok: false, kind: "upstreamError" };
  }

  let responseJson: unknown;
  try {
    responseJson = await response.json();
  } catch (err) {
    console.error("gemini-image: 응답 파싱 실패", err);
    return { ok: false, kind: "invalidUpstreamResponse" };
  }

  const image = extractGeminiImage(responseJson);
  if (image === null) {
    console.error("gemini-image: 응답에서 이미지를 찾지 못함", JSON.stringify(responseJson).slice(0, 500));
    return { ok: false, kind: "noAnalysisText" };
  }

  return { ok: true, mimeType: image.mimeType, base64: image.base64 };
}
