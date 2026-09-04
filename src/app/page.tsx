"use client";

import { useState } from "react";
import MobileShell from "@/common/components/MobileShell";
import { useLocale } from "@/common/lib/i18n/LocaleProvider";
import { analyzeFridgePhoto } from "@/app/lib/analyzeFridgePhoto";
import { suggestRecipes } from "@/app/lib/suggestRecipes";
import { addRecentEntry, getRecentEntries, type RecentEntry } from "@/app/lib/recentStore";
import type { RecipeSuggestion, RecognizedIngredient } from "@/app/lib/types";
import { HomeScreen } from "@/app/components/HomeScreen";
import { AnalyzingScreen } from "@/app/components/AnalyzingScreen";
import { IngredientsScreen } from "@/app/components/IngredientsScreen";
import { RecipeResultsScreen } from "@/app/components/RecipeResultsScreen";
import { RecipeDetailScreen } from "@/app/components/RecipeDetailScreen";

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
        <HomeScreen onFileSelected={runAnalysis} error={homeError} recent={recent} />
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
        />
      )}

      {screen === "detail" && selectedRecipe && (
        <RecipeDetailScreen recipe={selectedRecipe} onBack={() => setScreen("results")} />
      )}
    </MobileShell>
  );
}
