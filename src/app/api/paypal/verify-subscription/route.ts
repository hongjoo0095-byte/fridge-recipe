/**
 * PayPal 구독 상태 확인 API — PAYPAL_CLIENT_SECRET은 src/lib/paypal.ts 안에서만 읽는다.
 *
 * 클라이언트(page.tsx)는 PayPal 승인 페이지에서 돌아온 뒤 받은 subscriptionId만 이
 * 라우트로 보낸다. "결제가 끝났다"는 사실을 클라이언트 스스로 판단해 유료 상태를
 * 저장하게 두지 않고, 이 서버가 PayPal에 직접 물어봐서 실제로 ACTIVE 상태인지
 * 확인한 결과만 돌려준다.
 */
import { NextResponse } from "next/server";
import { cycleForPlanId, getPaypalSubscription } from "@/lib/paypal";

export const runtime = "nodejs";

interface VerifyRequestBody {
  subscriptionId?: unknown;
}

export async function POST(request: Request) {
  let body: VerifyRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ verified: false, error: "invalid_request" }, { status: 400 });
  }

  const subscriptionId = body.subscriptionId;
  if (typeof subscriptionId !== "string" || subscriptionId.length === 0) {
    return NextResponse.json({ verified: false, error: "missing_subscription_id" }, { status: 400 });
  }

  try {
    const { status, planId } = await getPaypalSubscription(subscriptionId);
    return NextResponse.json({ verified: status === "ACTIVE", status, cycle: cycleForPlanId(planId) });
  } catch (err) {
    console.error("verify-subscription: 확인 중 오류", err);
    return NextResponse.json({ verified: false, error: "internal_error" }, { status: 502 });
  }
}
