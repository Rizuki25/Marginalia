"use client";

import { useEffect } from "react";
import { cn } from "cn";

const STORAGE_KEY = "marginalia:motion";

/**
 * One switch for every decorative animation on the site: the pixel wave, the
 * marquee and the cursor trail. It also follows the operating system setting on
 * first visit, so motion is opt-in rather than assumed.
 *
 * State lives on `<html data-motion>` instead of React state, which keeps the
 * server and client markup identical and lets CSS do the switching.
 */
export function MotionToggle({ compact = false }: { compact?: boolean }) {
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const enabled =
      stored === "off" ? false : stored === "on" ? true : !prefersReduced;

    document.documentElement.dataset.motion = enabled ? "on" : "off";
  }, []);

  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.motion === "off" ? "on" : "off";

    root.dataset.motion = next;
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Hentikan atau jalankan animasi dekoratif"
      title="Gerak dekoratif"
      className={cn(
        "label-sm inline-flex min-h-11 items-center border border-line text-muted-foreground transition-colors hover:border-ink hover:text-ink",
        compact ? "size-11 justify-center px-0" : "gap-2 px-2.5",
      )}
    >
      <span aria-hidden="true" className="size-2 bg-current" />
      <span className={cn("motion-on-label", compact && "hidden")}>
        Gerak nyala
      </span>
      <span className={cn("motion-off-label", compact && "hidden")}>
        Gerak mati
      </span>
      <span className="sr-only">
        Animasi dekoratif bisa dihentikan kapan saja.
      </span>
    </button>
  );
}
