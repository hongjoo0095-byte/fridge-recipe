import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "해지 및 환불 · 냉장고 차림표",
};

export default function Page() {
  return <PolicyPage doc="refund" />;
}
