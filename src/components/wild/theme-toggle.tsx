"use client";

import { cn } from "cn";
import { useThemeMode, setThemeMode, type ThemeMode } from "./theme";

/**
 * Cycles light -> dark -> system. Three states rather than two, because
 * "follow my system" is the default and dropping it on the first click would
 * be a regression.
 *
 * The label comes from `useThemeMode`, which returns "system" as its server
 * snapshot. That is what keeps the hydrated markup identical to the SSR
 * markup; the stored value shows up in the same tick, before paint.
 */
const ORDER: ThemeMode[] = ["system", "light", "dark"];

const LABEL: Record<ThemeMode, string> = {
  system: "Tema sistem",
  light: "Tema terang",
  dark: "Tema gelap",
};

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const mode = useThemeMode();
  const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];

  return (
    <button
      type="button"
      onClick={() => setThemeMode(next)}
      aria-label={`${LABEL[mode]}. Ganti ke ${LABEL[next].toLowerCase()}.`}
      title={LABEL[mode]}
      className={cn(
        "label-sm inline-flex min-h-11 items-center border border-line text-muted-foreground transition-colors hover:border-ink hover:text-ink",
        compact ? "size-11 justify-center px-0" : "gap-2 px-2.5",
      )}
    >
      <span aria-hidden="true" className="size-2 border border-current">
        <span
          className={
            mode === "dark"
              ? "block size-full bg-current"
              : mode === "light"
                ? "block size-full bg-transparent"
                : "block size-full bg-current/40"
          }
        />
      </span>
      <span className={cn(compact && "hidden")}>{LABEL[mode]}</span>
    </button>
  );
}
