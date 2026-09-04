import { NextRequest, NextResponse } from "next/server";
import { createPaypalSubscription, type BillingCycle } from "@/lib/paypal";

export const runtime = "nodejs";

function parseCycle(value: unknown): BillingCycle | null {
  return value === "monthly" || value === "yearly" ? value : null;
}

// 클라이언트는 이 라우트를 호출해 승인 URL만 받고, 받은 URL로 브라우저 자체를
// 이동시킨다(window.location.href). PayPal JS SDK도, 클라이언트에 노출되는
// client-id도 필요 없다.
export async function POST(req: NextRequest) {
  let body: { cycle?: unknown };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const cycle = parseCycle(body.cycle) ?? "monthly";

  try {
    const origin = req.nextUrl.origin;
    const subscription = await createPaypalSubscription({
      cycle,
      returnUrl: origin,
      // cancel_url에 표시만 다르게 줘서, 홈 화면이 성공 복귀와 취소 복귀를 구분할 수 있게 한다.
      cancelUrl: `${origin}?paypal_cancelled=1`,
    });

    if (!subscription.approveUrl) {
      throw new Error("PayPal 승인 링크를 받지 못했습니다.");
    }

    return NextResponse.json({ url: subscription.approveUrl });
  } catch (err) {
    console.error("create-subscription:", err);
    return NextResponse.json(
      { error: "결제를 시작할 수 없습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
