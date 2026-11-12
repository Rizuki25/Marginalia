"use client";

import { useSyncExternalStore } from "react";

/**
 * Theme state without a provider.
 *
 * The mode lives in three places: `localStorage` (the choice), `data-theme` on
 * `<html>` (what was chosen) and the `dark` class on `<html>` (what is painted).
 * A blocking script in `<head>` applies all of that before paint, so the first
 * frame is already correct.
 *
 * Components read the mode through `useSyncExternalStore` with a server
 * snapshot of "system". React uses that snapshot while hydrating, so the client
 * markup matches the server exactly, then it re-renders with the stored value.
 * That is what avoids the hydration mismatch a `useEffect`-set state produced.
 */

export type ThemeMode = "system" | "light" | "dark";

export const THEME_KEY = "marginalia:theme";

const listeners = new Set<() => void>();

function isMode(value: string | null): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

export function storedMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const value = window.localStorage.getItem(THEME_KEY);
    return isMode(value) ? value : "system";
  } catch {
    return "system";
  }
}

export function resolvedMode(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  root.classList.toggle("dark", resolvedMode(mode) === "dark");
  root.dataset.theme = mode;
}

export function setThemeMode(mode: ThemeMode): void {
  try {
    window.localStorage.setItem(THEME_KEY, mode);
  } catch {
    // Private mode or blocked storage: the class still changes for this tab.
  }
  applyTheme(mode);
  for (const listener of listeners) listener();
}

function notify(): void {
  applyTheme(storedMode());
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", notify);

  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_KEY) notify();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", notify);
    window.removeEventListener("storage", onStorage);
  };
}

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribe, storedMode, () => "system");
}
