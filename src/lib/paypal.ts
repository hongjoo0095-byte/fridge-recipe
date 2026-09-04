/**
 * 서버 전용 PayPal REST 클라이언트 — Glucose Vision(src/lib/paypal.ts)의 구독(Billing
 * Plan) 리다이렉트 방식을 그대로 따르되, 이 앱은 월간/연간 두 개의 요금제를 다룬다.
 * PAYPAL_CLIENT_SECRET은 이 파일 밖으로 절대 나가지 않고, 클라이언트는 이 파일이
 * 만들어준 승인(approve) URL로 브라우저 자체를 이동시키기만 한다.
 */

const PAYPAL_API_BASE =
  process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

export type BillingCycle = "monthly" | "yearly";

/** 요금제(월간/연간)별로 PayPal 대시보드에서 미리 만들어둔 Billing Plan ID. */
function planIdFor(cycle: BillingCycle): string {
  const envKey = cycle === "monthly" ? "PAYPAL_PLAN_ID_MONTHLY" : "PAYPAL_PLAN_ID_YEARLY";
  const id = process.env[envKey];
  if (!id) {
    throw new Error(`${envKey}가 설정되어 있지 않습니다.`);
  }
  return id;
}

/** planId로 어느 요금제(월간/연간)인지 역으로 찾는다 — verify-subscription에서 구독 확인 후 사용. */
export function cycleForPlanId(planId: string | undefined | null): BillingCycle | null {
  if (!planId) return null;
  if (planId === process.env.PAYPAL_PLAN_ID_MONTHLY) return "monthly";
  if (planId === process.env.PAYPAL_PLAN_ID_YEARLY) return "yearly";
  return null;
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET이 설정되어 있지 않습니다.");
  }
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description ?? "PayPal 인증에 실패했습니다.");
  }
  return data.access_token as string;
}

export async function createPaypalSubscription(opts: {
  cycle: BillingCycle;
  returnUrl: string;
  cancelUrl: string;
}) {
  const planId = planIdFor(opts.cycle);
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plan_id: planId,
      application_context: {
        return_url: opts.returnUrl,
        cancel_url: opts.cancelUrl,
        user_action: "SUBSCRIBE_NOW",
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message ?? "PayPal 구독 생성에 실패했습니다.");
  }

  // PayPal이 계정 설정에 따라 rel:"approve" 대신 rel:"payer-action"으로 승인 링크를
  // 내려줄 수 있다(둘 다 같은 형태의 리다이렉트 URL) — 두 값 모두 대응한다.
  const links = data.links as { rel: string; href: string }[];
  const approveUrl =
    links.find((l) => l.rel === "approve")?.href ?? links.find((l) => l.rel === "payer-action")?.href;

  return { id: data.id as string, approveUrl };
}

export async function getPaypalSubscription(subscriptionId: string) {
  const token = await getAccessToken();

  const res = await fetch(
    `${PAYPAL_API_BASE}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message ?? "PayPal 구독 조회에 실패했습니다.");
  }
  return { status: data.status as string, planId: data.plan_id as string | undefined };
}

/**
 * 결제 화면에 보여줄 금액/주기를 PayPal에 등록된 실제 요금제에서 그대로 읽어온다 —
 * 화면 쪽에 가격을 하드코딩하지 않기 위해서다.
 */
export async function getPaypalPlan(cycle: BillingCycle) {
  const planId = planIdFor(cycle);
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_API_BASE}/v1/billing/plans/${encodeURIComponent(planId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message ?? "PayPal 요금제 조회에 실패했습니다.");
  }

  interface BillingCycleSchedule {
    tenure_type?: string;
    frequency?: { interval_unit?: string; interval_count?: number };
    pricing_scheme?: { fixed_price?: { value?: string; currency_code?: string } };
  }
  const cycles = (data.billing_cycles ?? []) as BillingCycleSchedule[];
  const regular = cycles.find((c) => c.tenure_type === "REGULAR") ?? cycles[0];
  const price = regular?.pricing_scheme?.fixed_price;
  if (!price?.value || !price.currency_code) {
    throw new Error("PayPal 요금제 응답에서 가격 정보를 찾지 못했습니다.");
  }

  return {
    cycle,
    amount: price.value,
    currency: price.currency_code,
    intervalUnit: regular?.frequency?.interval_unit ?? "MONTH",
    intervalCount: regular?.frequency?.interval_count ?? 1,
  };
}
