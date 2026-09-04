/**
 * 공통 뒤로가기 버튼 — PhotoXcel의 BackButton.tsx와 동일한 패턴. href 대신 onClick도
 * 받을 수 있게 해, 페이지 이동 없이 화면 상태만 되돌리는 이 앱의 흐름(예: 결과 화면
 * -> 재료 편집 화면)에도 그대로 쓴다.
 */
export default function BackButton({ onClick, "aria-label": ariaLabel }: { onClick: () => void; "aria-label"?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? "뒤로"}
      className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-accent-tint active:scale-95"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>
  );
}
