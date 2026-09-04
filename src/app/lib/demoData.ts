/**
 * 로컬 미리보기 전용 예시 데이터 — GEMINI_API_KEY가 아직 설정되지 않은 상태에서도
 * 화면 흐름을 실제로 눌러볼 수 있도록 쓴다.
 *
 * NEXT_PUBLIC_FRIDGE_DEMO=1 일 때만 analyzeFridgePhoto.ts / suggestRecipes.ts가
 * 서버 호출 대신 이 데이터를 돌려준다 — 실제 배포본은 이 플래그를 켜지 않으므로
 * 항상 진짜 /api 라우트를 호출한다(PhotoXcel/Glucose Vision과 동일하게, 키가
 * 없으면 "AI 분석 기능이 설정되어 있지 않아요" 오류를 그대로 보여준다).
 */
import type { RecipeSuggestion } from "./types";

export const DEMO_INGREDIENTS: string[] = ["달걀", "대파", "두부", "김치", "어묵", "당근"];

export const DEMO_RECIPES: RecipeSuggestion[] = [
  {
    id: "demo_fastest",
    role: "fastest",
    title: "달걀두부부침",
    cookTimeMinutes: 10,
    difficulty: "easy",
    servings: 2,
    usedIngredients: ["달걀", "두부"],
    missingIngredients: ["식용유"],
    steps: [
      "두부를 1cm 두께로 썰어 키친타월로 물기를 뺀다.",
      "달걀을 풀어 소금으로 간한다.",
      "두부를 달걀물에 담갔다가 팬에 노릇하게 부친다.",
      "양면이 익으면 접시에 담아낸다.",
    ],
  },
  {
    id: "demo_novel",
    role: "novel",
    title: "당근어묵카레볶음",
    cookTimeMinutes: 15,
    difficulty: "easy",
    servings: 2,
    usedIngredients: ["당근", "어묵", "대파"],
    missingIngredients: ["카레가루"],
    steps: [
      "당근은 채썰고 어묵은 한입 크기로 썬다.",
      "팬에 대파를 볶아 향을 낸 뒤 당근을 먼저 볶는다.",
      "당근이 반쯤 익으면 어묵과 카레가루를 넣고 함께 볶는다.",
      "물 2~3스푼을 더해 카레가루가 골고루 배도록 볶아 마무리한다.",
    ],
  },
  {
    id: "demo_depleting",
    role: "depleting",
    title: "냉장고탈탈전골",
    cookTimeMinutes: 25,
    difficulty: "medium",
    servings: 3,
    usedIngredients: ["달걀", "대파", "두부", "김치", "어묵", "당근"],
    missingIngredients: [],
    steps: [
      "냄비에 김치를 볶다가 물을 부어 육수를 낸다.",
      "당근과 두부, 어묵을 큼직하게 썰어 넣고 끓인다.",
      "재료가 익으면 대파를 넣는다.",
      "마지막에 달걀을 풀어 넣고 한소끔 더 끓여 마무리한다.",
    ],
  },
];
