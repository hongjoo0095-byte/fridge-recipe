"use client";

import { useRef } from "react";
import { useLocale } from "@/common/lib/i18n/LocaleProvider";
import type { RecentEntry } from "@/app/lib/recentStore";

export function HomeScreen({
  onFileSelected,
  error,
  recent,
}: {
  onFileSelected: (file: File) => void;
  error: string | null;
  recent: RecentEntry[];
}) {
  const { t } = useLocale();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    e.target.value = "";
  }

  return (
    <div className="flex flex-1 flex-col pt-1">
      <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-ink">{t.header.title}</h1>
      <p className="mt-1.5 text-[16px] leading-snug text-ink-soft">
        {t.header.subtitleLines[0]} {t.header.subtitleLines[1]}
      </p>

      {error && (
        <p className="mt-4 rounded-2xl bg-danger-tint px-4 py-3 text-[15px] text-danger">{error}</p>
      )}

      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleChange} />
      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />

      <div className="mt-5 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="relative overflow-hidden rounded-[22px] bg-accent px-5 py-4 text-left shadow-[0_14px_28px_-12px_rgba(200,70,40,0.55)] transition active:scale-[0.98]"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-[22px] bg-gradient-to-b from-white/35 to-transparent" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/25">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="h-[22px] w-[22px]">
                <path d="M4 8a2 2 0 012-2h1.5l1-1.5h7l1 1.5H18a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" />
                <circle cx="12" cy="13" r="3.2" />
              </svg>
            </span>
            <span>
              <span className="block text-[18px] font-bold text-white">{t.home.captureButton}</span>
              <span className="mt-0.5 block text-[14px] text-white/85">{t.home.captureHint}</span>
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="relative overflow-hidden rounded-[22px] border border-hairline bg-surface px-5 py-4 text-left shadow-[0_10px_22px_-14px_rgba(120,70,40,0.3)] transition active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-tint">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className="h-[22px] w-[22px] [stroke:var(--color-gold-deep)]">
                <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
                <circle cx="8.5" cy="10" r="1.4" />
                <path d="M4 16.5l4.5-4 3 2.6 3.5-4L20 16" />
              </svg>
            </span>
            <span>
              <span className="block text-[18px] font-bold text-ink">{t.home.galleryButton}</span>
              <span className="mt-0.5 block text-[14px] text-ink-faint">{t.home.galleryHint}</span>
            </span>
          </div>
        </button>
      </div>

      <div className="mt-6">
        <div className="mb-2.5 text-[14px] font-bold text-ink-soft">{t.home.recentTitle}</div>
        {recent.length === 0 ? (
          <p className="text-[15px] leading-relaxed text-ink-faint">{t.home.recentEmpty}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-2xl border border-hairline bg-surface px-4 py-3 shadow-[0_6px_16px_-12px_rgba(120,70,40,0.4)]"
              >
                <div className="min-w-0">
                  <div className="truncate text-[15.5px] font-semibold text-ink">
                    {entry.headline}
                    {entry.extraCount > 0 ? ` 외 ${entry.extraCount}개` : ""}
                  </div>
                  <div className="text-[13px] text-ink-faint">{new Date(entry.at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
