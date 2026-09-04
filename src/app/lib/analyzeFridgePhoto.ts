/**
 * 냉장고 사진 -> 인식된 재료 이름 목록. 실제 호출은 서버(/api/analyze-fridge)가
 * 하므로 GEMINI_API_KEY는 이 파일/브라우저 어디에도 등장하지 않는다.
 */
import { compressPhotoForUpload } from "@/common/lib/image";
import type { Locale } from "@/common/lib/i18n/dictionaries";
import { getDictionary } from "@/common/lib/i18n/dictionaries";
import { DEMO_INGREDIENTS } from "./demoData";

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

export async function analyzeFridgePhoto(photo: File, locale: Locale): Promise<string[]> {
  const t = getDictionary(locale);

  if (IS_DEMO) {
    await new Promise((resolve) => setTimeout(resolve, 1400));
    return DEMO_INGREDIENTS;
  }

  let imageBase64: string;
  let mimeType: string;
  try {
    ({ base64: imageBase64, mimeType } = await compressPhotoForUpload(photo));
  } catch (err) {
    console.error("analyzeFridgePhoto: 이미지 처리 실패", err);
    throw new Error(t.errors.imageProcessingFailed);
  }

  let response: Response;
  try {
    response = await fetch("/api/analyze-fridge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, mimeType, locale }),
    });
  } catch (err) {
    console.error("analyzeFridgePhoto: 서버 요청 실패", err);
    throw new Error(t.errors.networkError);
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, t.errors.upstreamError));
  }

  let body: { ingredients?: unknown };
  try {
    body = await response.json();
  } catch (err) {
    console.error("analyzeFridgePhoto: 응답 파싱 실패", err);
    throw new Error(t.errors.unreadableResult);
  }

  if (!Array.isArray(body.ingredients)) {
    throw new Error(t.errors.invalidResultShape);
  }

  return body.ingredients.filter((v): v is string => typeof v === "string");
}
