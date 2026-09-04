import LanguageSwitcher from "./LanguageSwitcher";

/**
 * 모든 화면이 공유하는 모바일 앱 셸 — PhotoXcel의 PhoneFrame.tsx를 이 앱에 맞게
 * 단순화해 이식했다. 실제 모바일 기기에서는 풀블리드 페이지로, 데스크톱 미리보기
 * (이번 승인용 화면 등)에서는 장식용 폰 목업으로 보인다.
 */
export default function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center overscroll-none bg-accent-tint sm:py-10">
      <div className="relative w-full overflow-hidden bg-surface sm:w-[390px] sm:rounded-[2.75rem] sm:border-[10px] sm:border-neutral-900 sm:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.35)]">
        <div className="pointer-events-none absolute left-1/2 top-0 z-20 hidden h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-neutral-900 sm:block" />
        <LanguageSwitcher />
        <main
          className="relative flex min-h-[100dvh] flex-col bg-gradient-to-b from-page to-surface px-6 sm:min-h-[844px]"
          style={{
            paddingTop: "max(2.5rem, env(safe-area-inset-top))",
            paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
          }}
        >
          <div className="mx-auto w-full max-w-sm flex-1">{children}</div>
          <div className="mx-auto mt-8 hidden h-1.5 w-32 rounded-full bg-hairline sm:block" />
        </main>
      </div>
    </div>
  );
}
