import { NextRequest, NextResponse } from "next/server";
import { getPaypalPlan, type BillingCycle } from "@/lib/paypal";

export const runtime = "nodejs";

function parseCycle(value: string | null): BillingCycle | null {
  return value === "monthly" || value === "yearly" ? value : null;
}

// 결제 화면(PaywallCard)에 쓸 실제 요금제 정보(금액/주기)를 PayPal에서 그대로
// 읽어서 돌려준다 — 화면에 가격을 하드코딩하지 않기 위한 조회 전용 엔드포인트다.
export async function GET(req: NextRequest) {
  const cycle = parseCycle(req.nextUrl.searchParams.get("cycle"));
  if (!cycle) {
    return NextResponse.json({ error: "cycle 파라미터가 올바르지 않습니다." }, { status: 400 });
  }
  try {
    const plan = await getPaypalPlan(cycle);
    return NextResponse.json(plan);
  } catch (err) {
    console.error("paypal/plan:", err);
    return NextResponse.json({ error: "요금 정보를 불러오지 못했습니다." }, { status: 500 });
  }
}
