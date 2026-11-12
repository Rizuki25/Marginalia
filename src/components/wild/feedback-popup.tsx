"use client";

import type { CSSProperties } from "react";
import { toast } from "sonner";
import { cn } from "cn";

export type FeedbackKind =
  | "added"
  | "updated"
  | "deleted"
  | "downloaded"
  | "error";

interface KindMeta {
  eyebrow: string;
  defaultTitle: string;
  stampClass: string;
  frameClass: string;
  barTrackClass: string;
  barFillClass: string;
}

const KIND_META: Record<FeedbackKind, KindMeta> = {
  added: {
    eyebrow: "Ditambahkan",
    defaultTitle: "Berhasil ditambahkan",
    stampClass: "bg-neon text-on-accent border-ink",
    frameClass: "border-ink shadow-[6px_6px_0_0_var(--ink)]",
    barTrackClass: "bg-ink",
    barFillClass: "bg-neon",
  },
  updated: {
    eyebrow: "Diperbarui",
    defaultTitle: "Berhasil diperbarui",
    stampClass: "bg-neon text-on-accent border-ink",
    frameClass: "border-ink shadow-[6px_6px_0_0_var(--ink)]",
    barTrackClass: "bg-ink",
    barFillClass: "bg-neon",
  },
  deleted: {
    eyebrow: "Dihapus",
    defaultTitle: "Berhasil dihapus",
    stampClass: "bg-ink text-paper border-ink",
    frameClass: "border-ink shadow-[6px_6px_0_0_var(--ink)]",
    barTrackClass: "bg-line",
    barFillClass: "bg-ink",
  },
  downloaded: {
    eyebrow: "Unduhan",
    defaultTitle: "Berhasil diunduh",
    stampClass: "bg-neon text-on-accent border-ink",
    frameClass: "border-ink shadow-[6px_6px_0_0_var(--ink)]",
    barTrackClass: "bg-ink",
    barFillClass: "bg-neon",
  },
  error: {
    eyebrow: "Galat",
    defaultTitle: "Gagal memproses",
    stampClass: "bg-danger-fill text-on-danger border-ink",
    frameClass: "border-danger-fill shadow-[6px_6px_0_0_var(--danger-fill)]",
    barTrackClass: "bg-line",
    barFillClass: "bg-danger-fill",
  },
};

/**
 * Four-cell pixel spinner matching Marginalia's stepped grid language.
 */
export function PixelSpinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-grid size-3 shrink-0 grid-cols-2 gap-[2px]", className)}
    >
      <span
        className="animate-pixel-chase bg-current"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="animate-pixel-chase bg-current"
        style={{ animationDelay: "180ms" }}
      />
      <span
        className="animate-pixel-chase bg-current"
        style={{ animationDelay: "540ms" }}
      />
      <span
        className="animate-pixel-chase bg-current"
        style={{ animationDelay: "360ms" }}
      />
    </span>
  );
}

/**
 * Full-width indeterminate progress strip shown at the top of a form or dialog
 * while a server mutation is in flight.
 */
export function PendingSweep({
  active,
  label = "Sedang memproses...",
  className,
}: {
  active: boolean;
  label?: string;
  className?: string;
}) {
  if (!active) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "relative h-[3px] w-full overflow-hidden bg-ink",
        className,
      )}
    >
      <span className="animate-pending-sweep absolute inset-y-0 left-0 w-2/5 bg-neon" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * High-contrast Swiss-pixel pop-up notification rendered inside Sonner.
 */
export function FeedbackPopup({
  toastId,
  kind,
  title,
  message,
  duration = 4000,
}: {
  toastId: string | number;
  kind: FeedbackKind;
  title?: string;
  message: string;
  duration?: number;
}) {
  const meta = KIND_META[kind];
  const heading = title ?? meta.defaultTitle;
  const isError = kind === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      style={{ "--toast-duration": `${duration}ms` } as CSSProperties}
      className={cn(
        "animate-toast-enter relative w-full overflow-hidden border-2 bg-paper text-ink sm:w-[372px]",
        meta.frameClass,
      )}
    >
      <div className="flex items-start gap-3.5 px-4 py-3.5 pr-2">
        <div className="relative mt-0.5 shrink-0">
          {!isError ? (
            <>
              <span
                aria-hidden="true"
                className="animate-spark-tl pointer-events-none absolute -top-1 -left-1 size-1 bg-neon"
              />
              <span
                aria-hidden="true"
                className="animate-spark-tr pointer-events-none absolute -top-1 -right-1 size-1 bg-ink"
              />
              <span
                aria-hidden="true"
                className="animate-spark-bl pointer-events-none absolute -bottom-1 -left-1 size-1 bg-warm"
              />
              <span
                aria-hidden="true"
                className="animate-spark-br pointer-events-none absolute -right-1 -bottom-1 size-1 bg-neon"
              />
            </>
          ) : null}

          <div
            className={cn(
              "pixel-corners pixel-corners-sm animate-pixel-stamp flex size-9 items-center justify-center border",
              meta.stampClass,
            )}
          >
            {isError ? (
              <svg
                viewBox="0 0 16 16"
                aria-hidden="true"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="square"
              >
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 16 16"
                aria-hidden="true"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="square"
                strokeLinejoin="miter"
              >
                <path
                  d="M3.2 8.4L6.6 11.8L13 4.6"
                  className="animate-check-draw"
                />
              </svg>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1 py-0.5">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn(
                "size-1.5 shrink-0",
                isError ? "bg-danger-fill" : "bg-neon",
              )}
            />
            <p className="label-sm text-muted-foreground">{meta.eyebrow}</p>
          </div>
          <p className="mt-1 font-sans text-[15px] font-extrabold leading-tight tracking-[-0.02em] text-ink">
            {heading}
          </p>
          <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
            {message}
          </p>
        </div>

        <button
          type="button"
          onClick={() => toast.dismiss(toastId)}
          aria-label="Tutup notifikasi"
          className="-mt-1 inline-flex size-11 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-ink/[0.06] hover:text-ink"
        >
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>

      <div aria-hidden="true" className={cn("h-[3px] w-full", meta.barTrackClass)}>
        <div
          className={cn("animate-toast-progress h-full w-full", meta.barFillClass)}
        />
      </div>
    </div>
  );
}
