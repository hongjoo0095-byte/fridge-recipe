"use client";

import { useEffect, useRef, useState } from "react";
import MobileShell from "@/common/components/MobileShell";
import { useLocale } from "@/common/lib/i18n/LocaleProvider";
import { analyzeFridgePhoto } from "@/app/lib/analyzeFridgePhoto";
import { suggestRecipes } from "@/app/lib/suggestRecipes";
import { addRecentEntry, getRecentEntries, type RecentEntry } from "@/app/lib/recentStore";
import {
  getPhotoAnalysisUsageCount,
  getSubscriptionState,
  incrementPhotoAnalysisUsageCount,
  saveActiveSubscription,
  shouldShowPaywall,
  type SubscriptionState,
} from "@/app/lib/subscriptionStore";
import type { RecipeSuggestion, RecognizedIngredient } from "@/app/lib/types";
import { HomeScreen } from "@/app/components/HomeScreen";
import { AnalyzingScreen } from "@/app/components/AnalyzingScreen";
import { IngredientsScreen } from "@/app/components/IngredientsScreen";
import { RecipeResultsScreen } from "@/app/components/RecipeResultsScreen";
import { RecipeDetailScreen } from "@/app/components/RecipeDetailScreen";

const DEFAULT_SUBSCRIPTION: SubscriptionState = {
  status: "none",
  subscriptionId: null,
  cycle: null,
  verifiedAt: null,
};

type Screen = "home" | "analyzing" | "ingredients" | "results" | "detail";

function randomId(): string {
  if (typeof window !== "undefined" && "randomUUID" in window.crypto) {
    return window.crypto.randomUUID();
  }
  return `ing_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("파일을 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const { locale, t } = useLocale();

  const [screen, setScreen] = useState<Screen>("home");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<RecognizedIngredient[]>([]);
  const [recipes, setRecipes] = useState<RecipeSuggestion[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [homeError, setHomeError] = useState<string | null>(null);
  const [ingredientsError, setIngredientsError] = useState<string | null>(null);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [recent, setRecent] = useState<RecentEntry[]>(() => getRecentEntries());

  // 결제(구독) 관련 상태 — usageCount/subscription은 브라우저 전용 localStorage에서만
  // 읽을 수 있어 SSR과의 하이드레이션 불일치를 피하려고 기본값으로 시작한 뒤 마운트
  // 후 effect에서 실제 값으로 채운다(LocaleProvider와 같은 패턴).
  const [usageCount, setUsageCount] = useState(0);
  const [subscription, setSubscription] = useState<SubscriptionState>(DEFAULT_SUBSCRIPTION);
  const [paypalNotice, setPaypalNotice] = useState<
    { type: "verifying" | "subscribed" | "cancelled" | "error" } | null
  >(null);
  const handledPaypalReturnRef = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 전용 localStorage를 마운트 후 1회 읽어오는 용도
    setUsageCount(getPhotoAnalysisUsageCount());
    setSubscription(getSubscriptionState());
  }, []);

  // PayPal 승인 페이지에서 돌아온 뒤(성공 또는 취소) 처리 — 결제 리다이렉트는 전체
  // 페이지 새로고침을 일으켜 screen이 "home"으로 초기화되므로, 어떤 화면을 보고
  // 있었는지와 무관하게 최상단에서 한 번만 처리한다.
  useEffect(() => {
    if (handledPaypalReturnRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const subscriptionId = params.get("subscription_id");
    const wasCancelled = params.get("paypal_cancelled") === "1";
    if (!subscriptionId && !wasCancelled) return;
    handledPaypalReturnRef.current = true;
    window.history.replaceState({}, "", window.location.pathname);

    if (wasCancelled) {
      Promise.resolve().then(() => setPaypalNotice({ type: "cancelled" }));
      return;
    }

    Promise.resolve()
      .then(() => {
        setPaypalNotice({ type: "verifying" });
        return fetch("/api/paypal/verify-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscriptionId }),
        });
      })
      .then(async (res) => {
        const json = (await res.json()) as { verified?: boolean; cycle?: "monthly" | "yearly" | null };
        if (json.verified && subscriptionId) {
          saveActiveSubscription(subscriptionId, json.cycle ?? null);
          setSubscription(getSubscriptionState());
          setPaypalNotice({ type: "subscribed" });
        } else {
          setPaypalNotice({ type: "error" });
        }
      })
      .catch((err) => {
        console.error("PayPal 구독 확인 실패", err);
        setPaypalNotice({ type: "error" });
      });
  }, []);

  async function runAnalysis(file: File) {
    setHomeError(null);
    setScreen("analyzing");
    try {
      const dataUrl = await readAsDataUrl(file);
      setPhotoDataUrl(dataUrl);
    } catch {
      // 미리보기용 썸네일 생성 실패는 흐름을 막지 않는다 — 표시만 생략한다.
    }

    try {
      const names = await analyzeFridgePhoto(file, locale);
      setIngredients(names.map((name) => ({ id: randomId(), name, source: "detected" as const })));
      // 사진 분석이 실제로 성공했을 때만 무료 횟수를 소모한다(실패한 시도는 소모하지 않음).
      setUsageCount(incrementPhotoAnalysisUsageCount());
      setScreen("ingredients");
    } catch (err) {
      setHomeError(err instanceof Error ? err.message : t.errors.analyzeGeneric);
      setScreen("home");
    }
  }

  function handleAddIngredient(name: string) {
    setIngredients((prev) => {
      if (prev.some((ing) => ing.name.toLowerCase() === name.toLowerCase())) return prev;
      return [...prev, { id: randomId(), name, source: "added" }];
    });
  }

  function handleRemoveIngredient(id: string) {
    setIngredients((prev) => prev.filter((ing) => ing.id !== id));
  }

  async function handleContinueToRecipes() {
    if (ingredients.length === 0) {
      setIngredientsError(t.ingredients.minOneItem);
      return;
    }
    setIngredientsError(null);
    setRecipesLoading(true);
    try {
      const result = await suggestRecipes(
        ingredients.map((ing) => ing.name),
        locale,
      );
      setRecipes(result);
      setScreen("results");
      addRecentEntry(result[0]?.title ?? "", Math.max(0, result.length - 1));
      setRecent(getRecentEntries());
    } catch (err) {
      setIngredientsError(err instanceof Error ? err.message : t.errors.analyzeGeneric);
    } finally {
      setRecipesLoading(false);
    }
  }

  function handleBackToHome() {
    setScreen("home");
    setPhotoDataUrl(null);
    setIngredients([]);
    setIngredientsError(null);
  }

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId) ?? null;

  return (
    <MobileShell>
      {screen === "home" && (
        <HomeScreen
          onFileSelected={runAnalysis}
          error={homeError}
          recent={recent}
          paypalNotice={paypalNotice}
        />
      )}

      {screen === "analyzing" && <AnalyzingScreen photoDataUrl={photoDataUrl} />}

      {screen === "ingredients" && (
        <IngredientsScreen
          ingredients={ingredients}
          onAdd={handleAddIngredient}
          onRemove={handleRemoveIngredient}
          onBack={handleBackToHome}
          onContinue={handleContinueToRecipes}
          loading={recipesLoading}
          error={ingredientsError}
        />
      )}

      {screen === "results" && (
        <RecipeResultsScreen
          recipes={recipes}
          onOpenDetail={(id) => {
            setSelectedRecipeId(id);
            setScreen("detail");
          }}
          onEditIngredients={() => setScreen("ingredients")}
          showPaywall={shouldShowPaywall(usageCount, subscription)}
        />
      )}

      {screen === "detail" && selectedRecipe && (
        <RecipeDetailScreen recipe={selectedRecipe} onBack={() => setScreen("results")} />
      )}
    </MobileShell>
  );
}
