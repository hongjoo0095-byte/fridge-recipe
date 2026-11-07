import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "개인정보처리방침 · 냉장고 차림표",
};

export default function Page() {
  return <PolicyPage doc="privacy" />;
}
