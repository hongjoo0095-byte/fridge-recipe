import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "이용약관 · 냉장고 차림표",
};

export default function Page() {
  return <PolicyPage doc="terms" />;
}
