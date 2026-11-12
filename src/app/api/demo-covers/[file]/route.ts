import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { coversDir } from "@/lib/demo/store";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/**
 * Serves covers uploaded in demo mode. With Supabase configured the covers
 * live in Storage and this route stays closed.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ file: string }> },
) {
  if (isSupabaseConfigured) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { file } = await context.params;
  if (!/^[A-Za-z0-9-]+\.(jpg|jpeg|png|webp|gif)$/.test(file)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = file.split(".").pop()?.toLowerCase() ?? "";
  const type = TYPES[ext];
  if (!type) return new NextResponse("Not found", { status: 404 });

  try {
    const bytes = await fs.readFile(
      /*turbopackIgnore: true*/ path.join(coversDir, file),
    );
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
