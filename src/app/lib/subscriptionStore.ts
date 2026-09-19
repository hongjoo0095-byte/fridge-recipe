/**
 * 무료 사진 분석 횟수 + 결제(구독) 상태 저장소 — 이 앱은 계정도 서버 DB도 없으므로
 * (recentStore.ts와 같은 이유) 기기별 localStorage에만 저장한다.
 *
 * 다만 "유료로 전환됐다"는 사실만큼은 클라이언트가 스스로 결정하게 두지 않는다 —
 * PayPal 승인 직후 반드시 서버(src/app/api/paypal/verify-subscription/route.ts)에
 * 실제 구독 상태를 물어보고, PayPal이 ACTIVE라고 확인해준 경우에만
 * saveActiveSubscription()으로 이 저장소에 기록한다(src/app/page.tsx).
 */
import { getUsageCount, incrementUsageCount } from "@/common/lib/usageStore";

const APP_KEY = "fridge-recipe";
const SUBSCRIPTION_KEY = `${APP_KEY}:subscription:v1`;

/** 무료로 분석할 수 있는 사진 횟수 — 이 횟수까지는 결제 화면을 아예 보여주지 않는다. */
export const FREE_ANALYSIS_LIMIT = 3;

export type BillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "active" | "none";

export interface SubscriptionState {
  status: SubscriptionStatus;
  subscriptionId: string | null;
  cycle: BillingCycle | null;
  verifiedAt: string | null;
}

const DEFAULT_SUBSCRIPTION: SubscriptionState = {
  status: "none",
  subscriptionId: null,
  cycle: null,
  verifiedAt: null,
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/** 냉장고 사진 분석(analyze-fridge) 성공 횟수. */
export function getPhotoAnalysisUsageCount(): number {
  return getUsageCount(APP_KEY);
}

/** 사진 분석이 성공했을 때만 호출한다(실패한 시도는 소모하지 않는다). */
export function incrementPhotoAnalysisUsageCount(): number {
  return incrementUsageCount(APP_KEY);
}

function parseSubscriptionState(raw: unknown): SubscriptionState {
  if (!raw || typeof raw !== "object") return DEFAULT_SUBSCRIPTION;
  const record = raw as Record<string, unknown>;
  const status = record.status === "active" ? "active" : "none";
  const cycle = record.cycle === "monthly" || record.cycle === "yearly" ? record.cycle : null;
  return {
    status,
    subscriptionId: typeof record.subscriptionId === "string" ? record.subscriptionId : null,
    cycle,
    verifiedAt: typeof record.verifiedAt === "string" ? record.verifiedAt : null,
  };
}

export function getSubscriptionState(): SubscriptionState {
  if (!isBrowser()) return DEFAULT_SUBSCRIPTION;
  try {
    const raw = window.localStorage.getItem(SUBSCRIPTION_KEY);
    if (!raw) return DEFAULT_SUBSCRIPTION;
    return parseSubscriptionState(JSON.parse(raw));
  } catch (err) {
    console.error("subscriptionStore: 구독 상태 읽기 실패", err);
    return DEFAULT_SUBSCRIPTION;
  }
}

/** 서버가 PayPal에 직접 물어봐서 ACTIVE를 확인해준 경우에만 호출해야 한다. */
export function saveActiveSubscription(subscriptionId: string, cycle: BillingCycle | null): void {
  if (!isBrowser()) return;
  const state: SubscriptionState = {
    status: "active",
    subscriptionId,
    cycle,
    verifiedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("subscriptionStore: 구독 상태 저장 실패", err);
  }
}

export function isPaidUser(state: SubscriptionState): boolean {
  return state.status === "active";
}

/**
 * 무료 횟수(FREE_ANALYSIS_LIMIT)를 다 쓴 뒤부터 결제 화면을 보여줘야 하는지 —
 * usageCount는 "지금까지 성공한 분석 횟수"이므로, 3번째 분석이 성공한 시점에
 * 이미 무료 한도를 다 쓴 것이다(>= 비교). 결과 화면(RecipeResultsScreen)에서는
 * 그 3번째 결과 자체를 가리지 않고 맨 아래에 결제 카드만 자연스럽게 붙이고,
 * 다음(4번째) 촬영 시도부터는 홈 화면(page.tsx)이 촬영 버튼 대신 이 카드로
 * 막는다.
 */
export function shouldShowPaywall(usageCount: number, subscription: SubscriptionState): boolean {
  return !isPaidUser(subscription) && usageCount >= FREE_ANALYSIS_LIMIT;
}
