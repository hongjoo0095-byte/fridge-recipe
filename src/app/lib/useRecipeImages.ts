"use client";

/**
 * 레시피별 완성 음식 사진을 가져와 recipe.id로 캐싱하는 훅 — 결과 화면과 상세
 * 화면이 같은 레시피 목록을 공유하는 동안(page.tsx에서 한 번만 호출) 중복
 * 요청(=중복 Gemini 이미지 생성 비용)이 생기지 않게 한다.
 */
import { useEffect, useState } from "react";
import type { Locale } from "@/common/lib/i18n/dictionaries";
import type { RecipeSuggestion } from "./types";

export type RecipeImageState = { status: "loading" } | { status: "ready"; url: string } | { status: "error" };

const IS_DEMO = process.env.NEXT_PUBLIC_FRIDGE_DEMO === "1";

export function useRecipeImages(
  recipes: RecipeSuggestion[],
  locale: Locale,
): Record<string, RecipeImageState> {
  const [images, setImages] = useState<Record<string, RecipeImageState>>({});
  const recipeIdsKey = recipes.map((r) => r.id).join(",");

  useEffect(() => {
    if (recipes.length === 0) return;
    let cancelled = false;

    recipes.forEach((recipe) => {
      setImages((prev) => (prev[recipe.id] ? prev : { ...prev, [recipe.id]: { status: "loading" } }));

      // 데모 모드(GEMINI_API_KEY 미설정 환경)에서는 실제 이미지 생성 호출을 시도하지
      // 않고 곧바로 fallback으로 넘어간다 — 화면 흐름은 그대로 확인할 수 있다.
      if (IS_DEMO) {
        Promise.resolve().then(() => {
          if (!cancelled) setImages((prev) => ({ ...prev, [recipe.id]: { status: "error" } }));
        });
        return;
      }

      fetch("/api/recipe-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: recipe.title,
          usedIngredients: recipe.usedIngredients,
          missingIngredients: recipe.missingIngredients,
          locale,
        }),
      })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
        .then((data: { image?: unknown }) => {
          if (cancelled) return;
          if (typeof data.image === "string" && data.image.length > 0) {
            setImages((prev) => ({ ...prev, [recipe.id]: { status: "ready", url: data.image as string } }));
          } else {
            setImages((prev) => ({ ...prev, [recipe.id]: { status: "error" } }));
          }
        })
        .catch(() => {
          if (!cancelled) setImages((prev) => ({ ...prev, [recipe.id]: { status: "error" } }));
        });
    });

    return () => {
      cancelled = true;
    };
    // recipeIdsKey(레시피 id 조합)가 바뀔 때만 다시 요청한다 — recipes 배열 참조 자체는
    // 매 렌더 바뀔 수 있어도 같은 레시피 목록이면 재요청하지 않기 위해서다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeIdsKey, locale]);

  return images;
}
