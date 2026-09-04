/** 홈 화면의 "최근 추천" 목록 — 계정/서버가 없는 이 앱의 성격상 기기별
 *  localStorage에만 최근 5건을 남긴다. */
const KEY = "fridge-recipe:recent:v1";
const MAX_ITEMS = 5;

export interface RecentEntry {
  id: string;
  headline: string;
  extraCount: number;
  at: string;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getRecentEntries(): RecentEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecentEntry[]) : [];
  } catch {
    return [];
  }
}

export function addRecentEntry(headline: string, extraCount: number): void {
  if (!isBrowser()) return;
  const entry: RecentEntry = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    headline,
    extraCount,
    at: new Date().toISOString(),
  };
  const next = [entry, ...getRecentEntries()].slice(0, MAX_ITEMS);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch (err) {
    console.error("recentStore: 저장 실패", err);
  }
}
