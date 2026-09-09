"use client";

import type { RecipeImageState } from "@/app/lib/useRecipeImages";

/**
 * 레시피 카드/상세 화면 상단의 완성 음식 사진 영역 — 항상 고정 비율(4:3) 컨테이너를
 * 써서 로딩 중/실패 상태가 바뀌어도 카드 높이가 튀지 않게 한다(허브 QA 기준:
 * "이미지 로딩 중 카드 높이 변화·깨진 프레임·빈칸이 없어야 한다").
 *
 * 실패 시에는 비슷해 보이는 다른 음식 사진을 대신 쓰지 않고, 항상 같은 브랜드
 * fallback 아이콘을 보여준다 — 틀린 사진이 사진 없음보다 신뢰를 더 해친다는
 * 허브 조사 결론을 그대로 따른다.
 */
export function RecipeImage({
  state,
  alt,
  rounded = "rounded-t-[24px]",
}: {
  state: RecipeImageState | undefined;
  alt: string;
  rounded?: string;
}) {
  return (
    <div className={`relative aspect-[4/3] w-full overflow-hidden bg-surface-2 ${rounded}`}>
      {state?.status === "ready" ? (
        <img src={state.url} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      ) : state?.status === "loading" ? (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-surface-2 via-hairline/60 to-surface-2" />
      ) : (
        <FallbackIcon />
      )}
    </div>
  );
}

function FallbackIcon() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-accent-tint to-surface-2"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-10 w-10 text-accent-deep/40"
      >
        <path d="M7 2.5v7a1.8 1.8 0 003.6 0v-7M8.8 2.5v18M7 2.5v4.5M10.6 2.5v4.5" />
        <path d="M16.5 2.5c-1.4 0-2.3 1.6-2.3 4.3 0 2 .7 3.4 1.6 3.9V21" />
      </svg>
    </div>
  );
}
