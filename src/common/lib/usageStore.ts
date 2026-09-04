/**
 * 무료 사용 횟수 카운터 — Glucose Vision의 subscriptionStore.ts에서 결제/구독 부분을
 * 뺀 사용량 카운터만 이식했다. 이 앱의 MVP에는 아직 결제 화면이 없으므로 지금은
 * 어떤 화면도 이 값으로 기능을 막지 않는다 — 나중에 결제를 붙일 때, 한도를 넘으면
 * PaywallScreen으로 보내는 판단 근거로 그대로 재사용하기 위해 미리 마련해둔다.
 */
const USAGE_KEY_PREFIX = "usage-count:v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getUsageCount(appKey: string): number {
  if (!isBrowser()) return 0;
  const raw = window.localStorage.getItem(`${appKey}:${USAGE_KEY_PREFIX}`);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function incrementUsageCount(appKey: string): number {
  if (!isBrowser()) return 0;
  const next = getUsageCount(appKey) + 1;
  try {
    window.localStorage.setItem(`${appKey}:${USAGE_KEY_PREFIX}`, String(next));
  } catch (err) {
    console.error("usageStore: 사용 횟수 저장 실패", err);
  }
  return next;
}
