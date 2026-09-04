/**
 * 다국어(i18n) 사전 타입 — Glucose Vision(src/lib/i18n)과 같은 패턴을 이 앱에 맞게
 * 이식했다. 프레임워크 의존성이 없는 순수 타입/데이터 모듈이라 서버 라우트와
 * 클라이언트 컴포넌트 양쪽에서 그대로 import해서 쓴다.
 */
import type { RecipeDifficulty, RecipeRole } from "@/app/lib/types";

export type Locale = "ko" | "en" | "ja";

export const LOCALES: Locale[] = ["ko", "en", "ja"];

export interface Dictionary {
  languageName: string;
  header: {
    title: string;
    subtitleLines: [string, string];
  };
  home: {
    captureCta: string;
    captureHint: string;
    captureButton: string;
    galleryCta: string;
    galleryHint: string;
    galleryButton: string;
    recentTitle: string;
    recentEmpty: string;
  };
  analyzing: {
    heading: string;
    bodyLines: [string, string];
    photoAlt: string;
  };
  ingredients: {
    heading: string;
    subheading: string;
    addPlaceholder: string;
    addButton: string;
    removeAria: string;
    detectedBadge: string;
    addedBadge: string;
    continueButton: string;
    continuing: string;
    minOneItem: string;
  };
  recipes: {
    heading: string;
    subheading: string;
    roleLabel: Record<RecipeRole, string>;
    roleHint: Record<RecipeRole, string>;
    minutesUnit: string;
    servingsUnit: string;
    difficulty: Record<RecipeDifficulty, string>;
    usedLabel: string;
    missingLabel: string;
    missingNone: string;
    openDetail: string;
    editIngredients: string;
  };
  detail: {
    stepsHeading: string;
    usedHeading: string;
    missingHeading: string;
    servingsLabel: string;
  };
  actions: {
    back: string;
    retry: string;
    cancel: string;
  };
  share: {
    shareButton: string;
    copyButton: string;
    copied: string;
    copyFailed: string;
    downloaded: string;
    shareFailed: string;
    reportTitle: string;
  };
  errors: {
    analyzeGeneric: string;
    minOneIngredient: string;
    missingApiKey: string;
    invalidRequest: string;
    missingImage: string;
    timeout: string;
    upstreamUnreachable: string;
    rateLimited: string;
    modelUnavailable: string;
    permissionDenied: string;
    upstreamError: string;
    invalidUpstreamResponse: string;
    noAnalysisText: string;
    parseFailed: string;
    networkError: string;
    unreadableResult: string;
    invalidResultShape: string;
    imageProcessingFailed: string;
    tooFewRecipes: string;
    noIngredientsFound: string;
  };
  languageSwitcher: {
    label: string;
  };
  demoModeNotice: string;
}
