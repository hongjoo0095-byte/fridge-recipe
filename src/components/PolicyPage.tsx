"use client";

import Link from "next/link";
import { useLocale } from "@/common/lib/i18n/LocaleProvider";

// 개인정보처리방침·이용약관·해지/환불 안내 (ko/en/ja). 2026-11-07 작성.
// 실제 코드 동작 기준: 사진은 Gemini로만 전송·서버 미저장, 기록은 기기 localStorage,
// 결제는 PayPal 정기 구독. 환불 기준은 PhotoXcel과 동일(7일 이내·미사용 시 전액).

export type PolicyDoc = "privacy" | "terms" | "refund";

type Section = { h: string; p: string };
type Content = {
  effective: string;
  back: string;
  contact: string;
  privacy: { title: string; sections: Section[] };
  terms: { title: string; sections: Section[] };
  refund: { title: string; sections: Section[] };
};

const CONTENT: Record<"ko" | "en" | "ja", Content> = {
  "ko": {
    "effective": "시행일: 2026년 11월 7일",
    "back": "처음 화면으로",
    "contact": "문의: hongjoo0095@gmail.com",
    "privacy": {
      "title": "개인정보처리방침",
      "sections": [
        {
          "h": "처리하는 정보",
          "p": "냉장고 차림표은(는) 회원가입 없이 이용할 수 있으며 이름·이메일 등 신원 정보를 수집하지 않습니다. 분석을 위해 직접 선택한 냉장고 사진을 처리합니다."
        },
        {
          "h": "사진의 처리",
          "p": "선택한 사진은 분석을 위해 Google Gemini API(Google LLC)로 전송됩니다. 서비스 서버에는 사진을 저장하지 않으며, 분석이 끝나면 보관하지 않습니다. 레시피 완성 이미지를 만들 때는 사진이 아니라 메뉴 이름과 재료 목록만 전송됩니다."
        },
        {
          "h": "기기에 저장되는 정보",
          "p": "최근 추천 목록(최대 5건), 무료 분석 사용 횟수, 구독 확인 상태, 언어 설정은 이 기기의 브라우저에만 저장됩니다. 사진 원본은 저장하지 않습니다. 브라우저 데이터를 지우면 함께 삭제됩니다."
        },
        {
          "h": "결제 정보",
          "p": "유료 구독 결제는 PayPal이 처리하며, 카드 번호 등 결제 수단 정보는 PayPal 결제창에만 입력됩니다. 서비스는 구독이 실제로 활성 상태인지 확인하기 위해 PayPal 구독 ID로 PayPal에 상태를 조회합니다."
        },
        {
          "h": "이용 통계",
          "p": "서비스 개선을 위해 Vercel Web Analytics로 방문한 페이지 등 전체 이용 현황을 집계합니다. 개인정보를 제3자에게 판매하지 않습니다."
        },
        {
          "h": "문의 및 권리",
          "p": "개인정보 관련 문의나 삭제 요청은 아래 이메일로 보내주세요. 기기에 저장된 정보는 브라우저 데이터 삭제로 직접 지울 수 있습니다."
        }
      ]
    },
    "terms": {
      "title": "이용약관",
      "sections": [
        {
          "h": "서비스 내용",
          "p": "냉장고 차림표은(는) 냉장고 사진을 AI로 분석해 재료를 인식하고 만들 수 있는 요리를 추천하는 서비스입니다."
        },
        {
          "h": "AI 결과의 한계",
          "p": "재료 인식과 레시피는 AI 추정 결과이며 틀릴 수 있습니다. 알레르기, 식품의 신선도와 상태, 충분한 가열 여부는 이용자가 직접 확인해야 합니다."
        },
        {
          "h": "무료 이용",
          "p": "이 기기에서 사진 분석을 5회까지 무료로 이용할 수 있습니다. 무료 이용 범위는 변경될 수 있습니다."
        },
        {
          "h": "유료 구독",
          "p": "무료 횟수를 다 쓴 뒤에는 PayPal 정기 구독(월간 또는 연간)으로 계속 이용할 수 있습니다. 구독은 해지하기 전까지 선택한 주기마다 자동으로 결제되며, 금액은 결제 화면에 표시된 금액이 적용됩니다."
        },
        {
          "h": "해지 및 환불",
          "p": "이용자는 언제든 구독을 해지할 수 있습니다. 해지 방법과 환불 기준은 해지·환불 안내를 따릅니다."
        },
        {
          "h": "이용자의 의무",
          "p": "타인의 권리를 침해하는 사진을 올리거나, 서비스를 비정상적으로 대량 호출하는 등 운영을 방해하는 행위를 해서는 안 됩니다."
        },
        {
          "h": "약관의 변경",
          "p": "서비스나 법령이 바뀌면 약관이 변경될 수 있으며, 변경 내용은 이 페이지에 게시합니다."
        }
      ]
    },
    "refund": {
      "title": "해지 및 환불",
      "sections": [
        {
          "h": "구독 해지",
          "p": "PayPal 계정의 자동 결제(구독) 관리 메뉴에서 직접 해지하거나, 아래 이메일로 요청해 주세요. 해지하면 다음 결제부터 청구되지 않으며, 이미 결제한 기간이 끝날 때까지는 계속 이용할 수 있습니다."
        },
        {
          "h": "환불 기준",
          "p": "결제일로부터 7일 이내이고 결제 후 분석 기능을 사용하지 않은 경우 전액 환불해 드립니다. 7일이 지났거나 이미 이용하신 경우 환불이 제한될 수 있지만, 특별한 사정이 있다면 문의해 주세요."
        },
        {
          "h": "환불 요청 방법",
          "p": "계정이 없는 서비스이므로 PayPal 결제 이메일 주소와 결제일(또는 PayPal 거래 ID)을 함께 보내주세요. 카드 번호나 비밀번호는 보내지 마세요. 환불은 PayPal 계정 또는 PayPal에 연결된 결제수단으로 처리됩니다."
        }
      ]
    }
  },
  "en": {
    "effective": "Effective date: November 7, 2026",
    "back": "Back to home",
    "contact": "Contact: hongjoo0095@gmail.com",
    "privacy": {
      "title": "Privacy Policy",
      "sections": [
        {
          "h": "Information we process",
          "p": "Fridge Feast can be used without signing up and does not collect identity information such as your name or email. It processes the fridge photos you choose to analyze."
        },
        {
          "h": "How photos are handled",
          "p": "Photos you select are sent to the Google Gemini API (Google LLC) for analysis. Photos are not stored on our servers and are not kept after analysis. When generating a finished-dish image, only the dish name and ingredient list are sent, not your photo."
        },
        {
          "h": "Information stored on your device",
          "p": "Recent suggestions (up to 5), your free analysis count, subscription status and language setting are stored only in this device's browser. Original photos are not stored. Clearing browser data deletes them."
        },
        {
          "h": "Payment information",
          "p": "Subscription payments are processed by PayPal, and card details are entered only in the PayPal checkout. To confirm that a subscription is active, the service checks its status with PayPal using the PayPal subscription ID."
        },
        {
          "h": "Usage statistics",
          "p": "We use Vercel Web Analytics to measure overall usage, such as pages visited. We do not sell personal information to third parties."
        },
        {
          "h": "Questions and your rights",
          "p": "Send privacy questions or deletion requests to the email below. You can delete information stored on your device by clearing your browser data."
        }
      ]
    },
    "terms": {
      "title": "Terms of Service",
      "sections": [
        {
          "h": "The service",
          "p": "Fridge Feast uses AI to recognize ingredients in a fridge photo and suggest dishes you can make."
        },
        {
          "h": "Limits of AI results",
          "p": "Ingredient recognition and recipes are AI estimates and may be wrong. You are responsible for checking allergies, food freshness and condition, and that food is cooked thoroughly."
        },
        {
          "h": "Free use",
          "p": "You can analyze up to 5 photos for free on this device. The free allowance may change."
        },
        {
          "h": "Paid subscription",
          "p": "After the free analyses, you can continue with a PayPal subscription (monthly or yearly). It renews automatically each period until you cancel, at the price shown at checkout."
        },
        {
          "h": "Cancellation and refunds",
          "p": "You may cancel your subscription at any time. How to cancel and refund rules are described on the cancellation & refunds page."
        },
        {
          "h": "Your obligations",
          "p": "Do not upload photos that infringe others' rights or disrupt the service, for example by sending abnormally large numbers of requests."
        },
        {
          "h": "Changes to these terms",
          "p": "These terms may change when the service or the law changes. Changes are posted on this page."
        }
      ]
    },
    "refund": {
      "title": "Cancellation & Refunds",
      "sections": [
        {
          "h": "Cancelling",
          "p": "Cancel in the automatic payments (subscriptions) section of your PayPal account, or email us below. After cancelling you will not be charged again, and you can keep using the service until the end of the period you already paid for."
        },
        {
          "h": "Refund policy",
          "p": "We give a full refund if you ask within 7 days of payment and have not used the analysis feature since paying. Refunds may be limited after 7 days or after use, but contact us if you have special circumstances."
        },
        {
          "h": "How to request",
          "p": "Because there are no accounts, please include your PayPal email address and payment date (or PayPal transaction ID). Never send card numbers or passwords. Refunds go to your PayPal account or the payment method linked to it."
        }
      ]
    }
  },
  "ja": {
    "effective": "施行日: 2026年11月7日",
    "back": "最初の画面へ",
    "contact": "お問い合わせ: hongjoo0095@gmail.com",
    "privacy": {
      "title": "プライバシーポリシー",
      "sections": [
        {
          "h": "取り扱う情報",
          "p": "冷蔵庫ごはんは会員登録なしで利用でき、氏名やメールアドレスなどの身元情報を収集しません。分析のためにご自身で選択した冷蔵庫の写真を処理します。"
        },
        {
          "h": "写真の取り扱い",
          "p": "選択した写真は分析のためGoogle Gemini API（Google LLC）に送信されます。写真はサービスのサーバーに保存されず、分析後も保管されません。料理の完成イメージを作成する際は、写真ではなくメニュー名と材料リストのみが送信されます。"
        },
        {
          "h": "端末に保存される情報",
          "p": "最近のおすすめ（最大5件）、無料分析の利用回数、サブスクリプションの確認状態、言語設定は、この端末のブラウザにのみ保存されます。写真の原本は保存しません。ブラウザのデータを消去すると削除されます。"
        },
        {
          "h": "決済情報",
          "p": "有料サブスクリプションの決済はPayPalが処理し、カード番号などの決済手段情報はPayPalの決済画面にのみ入力されます。サービスはサブスクリプションが有効かどうかを確認するため、PayPalのサブスクリプションIDでPayPalに状態を照会します。"
        },
        {
          "h": "利用統計",
          "p": "サービス改善のため、Vercel Web Analyticsで閲覧ページなど全体的な利用状況を集計します。個人情報を第三者に販売することはありません。"
        },
        {
          "h": "お問い合わせと権利",
          "p": "個人情報に関するお問い合わせや削除のご依頼は、下記のメールアドレスまでお送りください。端末に保存された情報は、ブラウザのデータを消去することでご自身で削除できます。"
        }
      ]
    },
    "terms": {
      "title": "利用規約",
      "sections": [
        {
          "h": "サービス内容",
          "p": "冷蔵庫ごはんは、冷蔵庫の写真をAIで分析して材料を認識し、作れる料理を提案するサービスです。"
        },
        {
          "h": "AIの結果の限界",
          "p": "材料の認識とレシピはAIによる推定であり、誤りがある場合があります。アレルギー、食品の鮮度や状態、十分な加熱は利用者ご自身でご確認ください。"
        },
        {
          "h": "無料利用",
          "p": "この端末で写真の分析を5回まで無料でご利用いただけます。無料の範囲は変更される場合があります。"
        },
        {
          "h": "有料サブスクリプション",
          "p": "無料回数を使い切った後は、PayPalのサブスクリプション（月額または年額）で継続利用できます。解約するまで選択した周期ごとに自動で決済され、金額は決済画面に表示された金額が適用されます。"
        },
        {
          "h": "解約及び返金",
          "p": "利用者はいつでもサブスクリプションを解約できます。解約方法と返金基準は解約・返金のご案内に従います。"
        },
        {
          "h": "利用者の義務",
          "p": "他人の権利を侵害する写真のアップロードや、異常な大量リクエストなどサービスの運営を妨げる行為をしてはなりません。"
        },
        {
          "h": "規約の変更",
          "p": "サービスや法令の変更に伴い規約が変更される場合があり、変更内容はこのページに掲載します。"
        }
      ]
    },
    "refund": {
      "title": "解約・返金",
      "sections": [
        {
          "h": "サブスクリプションの解約",
          "p": "PayPalアカウントの自動支払い（サブスクリプション）管理から直接解約するか、下記のメールアドレスまでご依頼ください。解約後は次回以降の請求は発生せず、お支払い済みの期間が終わるまでは引き続きご利用いただけます。"
        },
        {
          "h": "返金基準",
          "p": "お支払い日から7日以内で、お支払い後に分析機能を利用していない場合は全額返金いたします。7日を過ぎた場合や既にご利用の場合は返金が制限されることがありますが、特別な事情がある場合はご相談ください。"
        },
        {
          "h": "返金のご依頼方法",
          "p": "アカウントのないサービスのため、PayPalのお支払いメールアドレスとお支払い日（またはPayPal取引ID）をお知らせください。カード番号やパスワードは送らないでください。返金はPayPalアカウントまたはPayPalに登録された支払い方法に行われます。"
        }
      ]
    }
  }
};

const LINK_LABELS: Record<"ko" | "en" | "ja", Record<PolicyDoc, string>> = {
  ko: { terms: "이용약관·요금", privacy: "개인정보처리방침", refund: "해지·환불" },
  en: { terms: "Terms & pricing", privacy: "Privacy", refund: "Cancellation & refunds" },
  ja: { terms: "利用規約・料金", privacy: "プライバシー", refund: "解約・返金" },
};

const DOCS: PolicyDoc[] = ["terms", "privacy", "refund"];

export function PolicyLinks() {
  const { locale } = useLocale();
  const labels = LINK_LABELS[locale] ?? LINK_LABELS.ko;
  return (
    <nav aria-label="policies" className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 pb-4 text-[12.5px] text-ink-faint">
      {DOCS.map((doc) => (
        <Link key={doc} href={`/${doc}`} className="underline underline-offset-2 hover:text-ink">
          {labels[doc]}
        </Link>
      ))}
    </nav>
  );
}

export default function PolicyPage({ doc }: { doc: PolicyDoc }) {
  const { locale } = useLocale();
  const c = CONTENT[locale] ?? CONTENT.ko;
  const page = c[doc];
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-8">
      <Link href="/" className="text-[14px] font-semibold text-ink-soft hover:text-ink">
        ← {c.back}
      </Link>
      <h1 className="mt-6 text-[24px] font-bold tracking-tight text-ink">{page.title}</h1>
      <p className="mt-1 text-[12.5px] text-ink-faint">{c.effective}</p>
      <div className="mt-6 flex flex-col gap-5">
        {page.sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-[15px] font-semibold text-ink">{s.h}</h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">{s.p}</p>
          </section>
        ))}
      </div>
      <p className="mt-8 text-[13px] text-ink-soft">
        <a href="mailto:hongjoo0095@gmail.com" className="underline underline-offset-2">{c.contact}</a>
      </p>
      <PolicyLinks />
    </main>
  );
}
