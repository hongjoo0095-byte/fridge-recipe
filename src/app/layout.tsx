import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { LocaleProvider } from "@/common/lib/i18n/LocaleProvider";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: "냉장고 한상",
  description: "냉장고 사진 한 장으로 오늘 만들 수 있는 요리를 추천해드려요",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f4f7ef",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`h-full antialiased ${notoSansKR.variable}`}>
      <body className="min-h-full flex flex-col bg-page text-ink font-sans">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
