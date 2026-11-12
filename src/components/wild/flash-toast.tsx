"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { notifyAdded, notifyDeleted, notifyUpdated } from "@/lib/notify";

const COOKIE_NAME = "marginalia_flash";

function consumeFlashCookie(): {
  kind: "added" | "updated" | "deleted";
  title?: string;
  message: string;
} | null {
  if (typeof document === "undefined") return null;
  const prefix = `${COOKIE_NAME}=`;
  const entry = document.cookie
    .split("; ")
    .find((part) => part.startsWith(prefix));
  if (!entry) return null;

  // Clear immediately so refreshes or back navigation do not replay it.
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;

  try {
    const raw = decodeURIComponent(entry.slice(prefix.length));
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "kind" in parsed &&
      "message" in parsed &&
      typeof parsed.message === "string"
    ) {
      const title =
        "title" in parsed && typeof parsed.title === "string"
          ? parsed.title
          : undefined;
      if (parsed.kind === "added") return { kind: "added", title, message: parsed.message };
      if (parsed.kind === "updated") return { kind: "updated", title, message: parsed.message };
      if (parsed.kind === "deleted") return { kind: "deleted", title, message: parsed.message };
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Reads any one-shot flash cookie set by a redirecting Server Action and
 * displays it through the standard animated pop-up.
 */
export function FlashToast() {
  const pathname = usePathname();

  useEffect(() => {
    const flash = consumeFlashCookie();
    if (!flash) return;

    if (flash.kind === "added") notifyAdded(flash.message, flash.title);
    else if (flash.kind === "updated") notifyUpdated(flash.message, flash.title);
    else notifyDeleted(flash.message, flash.title);
  }, [pathname]);

  return null;
}
