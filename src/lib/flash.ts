import { cookies } from "next/headers";

export const FLASH_COOKIE = "marginalia_flash";

export interface FlashPayload {
  kind: "added" | "updated" | "deleted";
  title?: string;
  message: string;
}

/**
 * Stores a short-lived readable cookie before a server redirect so the next
 * page can show the animated confirmation pop-up once navigation finishes.
 */
export async function setFlashToast(payload: FlashPayload): Promise<void> {
  const jar = await cookies();
  jar.set(FLASH_COOKIE, JSON.stringify(payload), {
    path: "/",
    maxAge: 30,
    sameSite: "lax",
    httpOnly: false,
  });
}
