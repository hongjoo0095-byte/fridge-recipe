"use client";

import { Analytics } from "@vercel/analytics/next";

// 내 브라우저 방문 제외: 주소 끝에 ?internal=on 을 한 번 붙여 열면 이 브라우저는 집계에서 빠집니다.
// 다시 집계하려면 ?internal=off 로 한 번 열면 됩니다.
const OPT_OUT_KEY = "va-disable";

function isOptedOut(): boolean {
  try {
    const flag = new URLSearchParams(window.location.search).get("internal");
    if (flag === "on") localStorage.setItem(OPT_OUT_KEY, "1");
    if (flag === "off") localStorage.removeItem(OPT_OUT_KEY);
    return localStorage.getItem(OPT_OUT_KEY) !== null;
  } catch {
    return false;
  }
}

export default function AnalyticsOptOut() {
  return <Analytics beforeSend={(event) => (isOptedOut() ? null : event)} />;
}
