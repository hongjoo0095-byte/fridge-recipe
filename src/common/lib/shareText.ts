/**
 * 결과 텍스트를 공유/복사/다운로드한다 — Glucose Vision의 shareMeal.ts에서 텍스트
 * 조립 부분(앱마다 다름)을 빼고 공유 메커니즘만 공통 모듈로 이식했다. 서버나
 * 사용자 계정에는 아무것도 저장하지 않는다.
 */
function downloadTextFile(text: string, filename: string): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type ShareOutcome = "shared" | "downloaded" | "cancelled" | "failed";

/** Web Share API로 텍스트 파일을 공유한다(메모/파일/Drive/메일 등이 뜨려면 파일로
 *  공유해야 한다). 지원하지 않는 브라우저에서는 텍스트 파일 다운로드로 대체한다. */
export async function shareText(text: string, filename: string): Promise<ShareOutcome> {
  if (typeof navigator === "undefined") return "failed";

  if (navigator.share) {
    const file = new File([text], filename, { type: "text/plain" });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
        return "shared";
      }
      await navigator.share({ text, title: filename });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return "cancelled";
      }
      console.error("shareText: navigator.share 실패", err);
      return "failed";
    }
  }

  try {
    downloadTextFile(text, filename);
    return "downloaded";
  } catch (err) {
    console.error("shareText: 다운로드 폴백 실패", err);
    return "failed";
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("copyText: 클립보드 복사 실패", err);
    return false;
  }
}
