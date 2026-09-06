/**
 * 서버 전용 PayPal REST 클라이언트 — Glucose Vision(src/lib/paypal.ts)의 구독(Billing
 * Plan) 리다이렉트 방식을 그대로 따르되, 이 앱은 월간/연간 두 개의 요금제를 다룬다.
 * PAYPAL_CLIENT_SECRET은 이 파일 밖으로 절대 나가지 않고, 클라이언트는 이 파일이
 * 만들어준 승인(approve) URL로 브라우저 자체를 이동시키기만 한다.
 *
 * 주의: Vercel은 환경변수를 대시보드에서 추가/수정해도 이미 배포된 서버리스 함수에는
 * 자동 반영되지 않는다 — 새 값을 쓰려면 재배포(Redeploy)가 한 번 더 필요하다.
 */

const SANDBOX_BASE = "https://api-m.sandbox.paypal.com";
const LIVE_BASE = "https://api-m.paypal.com";
/** PAYPAL_ENV=live로 명시했을 때만 live를 우선 시도한다 — 그 외(미설정 포함)엔 sandbox를 우선 시도한다. */
const PREFERRED_BASE = process.env.PAYPAL_ENV === "live" ? LIVE_BASE : SANDBOX_BASE;

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

/**
 * PayPal(또는 그 앞단의 프록시/차단 페이지)이 항상 JSON을 준다고 가정하지 않는다 — 응답이
 * JSON이 아니면 res.json()이 원인 불명의 SyntaxError로 죽는 대신, 상태코드+본문을 그대로
 * 담은 명확한 에러로 바꿔서 서버 로그에서 바로 원인을 알 수 있게 한다.
 */
async function parsePaypalResponse(res: Response, context: string): Promise<Record<string, unknown>> {
  const raw = await res.text();
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(`PayPal ${context} 응답이 JSON이 아닙니다 (HTTP ${res.status}): ${raw.slice(0, 300)}`);
  }
}

async function requestAccessToken(base: string, clientId: string, clientSecret: string) {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await parsePaypalResponse(res, "인증(oauth2/token)");
  return { ok: res.ok, status: res.status, data };
}

/**
 * PAYPAL_ENV 설정과 실제 PAYPAL_CLIENT_ID/SECRET의 환경(live/sandbox)이 어긋나 있어도 죽지
 * 않도록, 두 엔드포인트 중 실제로 인증되는 쪽을 서버가 스스로 찾아 쓴다(PhotoXcel/
 * src/lib/paypal.ts와 동일한 패턴). invalid_client는 "이 키는 이 환경 게 아니다"라는
 * 결정적 신호라 반대 환경으로만 자동 재시도하고, 그 외 실패는 바로 표면화한다.
 */
async function getAccessTokenAndBase(): Promise<{ token: string; base: string }> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET이 설정되어 있지 않습니다.");
  }

  const fallbackBase = PREFERRED_BASE === LIVE_BASE ? SANDBOX_BASE : LIVE_BASE;

  const first = await requestAccessToken(PREFERRED_BASE, clientId, clientSecret);
  if (first.ok) {
    return { token: first.data.access_token as string, base: PREFERRED_BASE };
  }

  const firstCode = first.data.error as string | undefined;
  if (firstCode !== "invalid_client") {
    throw new Error(`PayPal 인증 실패 (HTTP ${first.status}, ${firstCode ?? "unknown_error"}) — ${PREFERRED_BASE}`);
  }

  const second = await requestAccessToken(fallbackBase, clientId, clientSecret);
  if (second.ok) {
    console.warn(
      `PayPal: PAYPAL_ENV 설정(${PREFERRED_BASE}) 대신 ${fallbackBase} 환경 키로 인증에 성공했습니다. ` +
        `Vercel 환경변수 PAYPAL_ENV를 맞춰 설정해두는 것을 권장합니다(지금도 결제는 정상 동작함).`
    );
    return { token: second.data.access_token as string, base: fallbackBase };
  }

  const secondCode = second.data.error as string | undefined;
  throw new Error(
    `PayPal 인증 실패 — live/sandbox 두 환경 모두 시도했지만 실패했습니다 ` +
      `(${PREFERRED_BASE}: ${firstCode}, ${fallbackBase}: ${secondCode ?? "unknown_error"}). ` +
      `PAYPAL_CLIENT_ID/SECRET 값 자체를 확인하세요.`
  );
}

export async function createPaypalSubscription(opts: {
  cycle: BillingCycle;
  returnUrl: string;
  cancelUrl: string;
}) {
  const planId = planIdFor(opts.cycle);
  const { token, base } = await getAccessTokenAndBase();

  const res = await fetch(`${base}/v1/billing/subscriptions`, {
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

  const data = await parsePaypalResponse(res, "구독 생성(billing/subscriptions)");
  if (!res.ok) {
    throw new Error(
      `PayPal 구독 생성 실패 (HTTP ${res.status}): ${(data.message as string | undefined) ?? JSON.stringify(data).slice(0, 300)}`
    );
  }

  // PayPal이 계정 설정에 따라 rel:"approve" 대신 rel:"payer-action"으로 승인 링크를
  // 내려줄 수 있다(둘 다 같은 형태의 리다이렉트 URL) — 두 값 모두 대응한다.
  const links = (data.links ?? []) as { rel: string; href: string }[];
  const approveUrl =
    links.find((l) => l.rel === "approve")?.href ?? links.find((l) => l.rel === "payer-action")?.href;

  return { id: data.id as string, approveUrl };
}

export async function getPaypalSubscription(subscriptionId: string) {
  const { token, base } = await getAccessTokenAndBase();

  const res = await fetch(
    `${base}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await parsePaypalResponse(res, "구독 조회(billing/subscriptions)");
  if (!res.ok) {
    throw new Error(
      `PayPal 구독 조회 실패 (HTTP ${res.status}): ${(data.message as string | undefined) ?? JSON.stringify(data).slice(0, 300)}`
    );
  }
  return { status: data.status as string, planId: data.plan_id as string | undefined };
}

/**
 * 결제 화면에 보여줄 금액/주기를 PayPal에 등록된 실제 요금제에서 그대로 읽어온다 —
 * 화면 쪽에 가격을 하드코딩하지 않기 위해서다.
 */
export async function getPaypalPlan(cycle: BillingCycle) {
  const planId = planIdFor(cycle);
  const { token, base } = await getAccessTokenAndBase();

  const res = await fetch(`${base}/v1/billing/plans/${encodeURIComponent(planId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parsePaypalResponse(res, "요금제 조회(billing/plans)");
  if (!res.ok) {
    throw new Error(
      `PayPal 요금제 조회 실패 (HTTP ${res.status}): ${(data.message as string | undefined) ?? JSON.stringify(data).slice(0, 300)}`
    );
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
