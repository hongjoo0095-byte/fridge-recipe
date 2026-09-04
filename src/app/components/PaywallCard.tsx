"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/common/lib/i18n/LocaleProvider";
import type { BillingCycle } from "@/app/lib/subscriptionStore";

/**
 * 무료 사진 분석 3회를 다 쓴 뒤, 추천 결과(RecipeResultsScreen) 맨 아래에 자연스럽게
 * 붙는 결제 카드 — 결과 자체는 절대 가리지 않는다. 결제 처리는 서버형 리다이렉트
 * 구조다: 버튼을 누르면 서버(/api/paypal/create-subscription)가 PayPal에 구독을
 * 만들고 승인 URL을 돌려주며, 브라우저를 그 URL로 통째로 이동시킨다. 카드 번호를
 * 입력하는 화면 자체는 PayPal의 보안 결제창이라 이 앱은 카드 정보를 절대 받지도,
 * 저장하지도 않는다.
 *
 * PayPal 승인 화면에서 돌아온 뒤의 검증(verify-subscription) 처리는 이 컴포넌트가
 * 아니라 page.tsx가 최상단에서 담당한다 — 결제 리다이렉트는 전체 페이지 새로고침을
 * 일으켜 화면 상태(어떤 screen인지)가 초기화되므로, 이 카드가 다시 마운트된다는
 * 보장이 없기 때문이다.
 */

interface PlanInfo {
  cycle: BillingCycle;
  amount: string;
  currency: string;
}

const LOCALE_TAG: Record<string, string> = { ko: "ko-KR", en: "en-US", ja: "ja-JP" };

function formatAmount(plan: PlanInfo, locale: string): string {
  try {
    return new Intl.NumberFormat(LOCALE_TAG[locale] ?? "en-US", {
      style: "currency",
      currency: plan.currency,
      currencyDisplay: "narrowSymbol",
    }).format(Number(plan.amount));
  } catch {
    return `${plan.amount} ${plan.currency}`;
  }
}

export function PaywallCard() {
  const { locale, t } = useLocale();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [plans, setPlans] = useState<Partial<Record<BillingCycle, PlanInfo>>>({});
  const [planFailed, setPlanFailed] = useState<Partial<Record<BillingCycle, boolean>>>({});
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (["monthly", "yearly"] as BillingCycle[]).forEach((c) => {
      fetch(`/api/paypal/plan?cycle=${c}`)
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
        .then((data: PlanInfo) => {
          if (!cancelled) setPlans((prev) => ({ ...prev, [c]: data }));
        })
        .catch(() => {
          if (!cancelled) setPlanFailed((prev) => ({ ...prev, [c]: true }));
        });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function pay() {
    setPaying(true);
    setError(null);
    try {
      const res = await fetch("/api/paypal/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycle }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? t.paywall.startError);
      }
      window.location.href = data.url;
    } catch (err) {
      console.error("PaywallCard: 결제 시작 실패", err);
      setError(err instanceof Error ? err.message : t.paywall.startError);
      setPaying(false);
    }
  }

  const monthly = plans.monthly;
  const yearly = plans.yearly;
  const selectedPlan = plans[cycle];
  const selectedFailed = planFailed[cycle];

  // 연간 결제 절약률 — 월간 가격 x 12와 실제 연간 가격을 비교해 화면에 하드코딩하지 않는다.
  const savingsPercent =
    monthly && yearly
      ? Math.max(0, Math.round((1 - Number(yearly.amount) / (Number(monthly.amount) * 12)) * 100))
      : null;

  return (
    <div className="mt-6 overflow-hidden rounded-[28px] border border-hairline bg-surface shadow-[0_18px_36px_-18px_rgba(120,70,40,0.4)]">
      <div className="flex items-center gap-2 bg-accent-tint px-5 py-2.5 text-[13px] font-bold text-accent-deep">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0">
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        {t.paywall.usedBadge}
      </div>

      <div className="px-5 py-5">
        <p className="text-[17px] font-extrabold text-ink">{t.paywall.title}</p>
        <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{t.paywall.body}</p>

        {/* 월간/연간 토글 */}
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-surface-2 p-1">
          {(["monthly", "yearly"] as BillingCycle[]).map((c) => {
            const active = cycle === c;
            const plan = plans[c];
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCycle(c)}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-2.5 text-center transition ${
                  active ? "bg-surface shadow-[0_6px_16px_-10px_rgba(120,70,40,0.5)]" : ""
                }`}
              >
                <span className={`text-[13.5px] font-bold ${active ? "text-ink" : "text-ink-faint"}`}>
                  {c === "monthly" ? t.paywall.monthlyLabel : t.paywall.yearlyLabel}
                </span>
                <span className={`text-[15px] font-extrabold ${active ? "text-accent-deep" : "text-ink-faint"}`}>
                  {plan ? formatAmount(plan, locale) : planFailed[c] ? "—" : "···"}
                </span>
              </button>
            );
          })}
        </div>

        {cycle === "yearly" && savingsPercent !== null && savingsPercent > 0 && (
          <p className="mt-2 text-center text-[12.5px] font-bold text-gold-deep">
            {t.paywall.yearlySavings.replace("{percent}", String(savingsPercent))}
          </p>
        )}

        {/* 결제 버튼 하나 — PayPal 결제창으로 이동한다(카드결제는 그 결제창의 게스트 카드결제로 처리됨). */}
        <div className="mt-4 overflow-hidden rounded-2xl bg-surface-2 px-2 py-2">
          {paying ? (
            <div className="flex items-center justify-center gap-2 py-3">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-hairline border-t-accent" />
              <span className="text-[13px] font-semibold text-ink-soft">{t.paywall.loadingButton}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={pay}
              disabled={!selectedPlan && !selectedFailed}
              className="w-full rounded-xl bg-accent py-3.5 text-[15px] font-extrabold text-white transition active:scale-[0.98] disabled:opacity-60"
            >
              {t.paywall.payButton}
            </button>
          )}
        </div>

        {selectedFailed && !selectedPlan && (
          <p className="mt-2 text-center text-[12.5px] font-semibold text-danger">{t.paywall.priceLoadError}</p>
        )}

        {error && (
          <p className="mt-3 rounded-xl bg-danger-tint px-3 py-2 text-[13px] font-semibold text-danger">{error}</p>
        )}

        <p className="mt-3 text-[11.5px] leading-relaxed text-ink-faint">{t.paywall.billingNote}</p>
      </div>
    </div>
  );
}
