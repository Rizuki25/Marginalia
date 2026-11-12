"use client";

import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="shell py-16">
      <p className="label text-muted-foreground">Dashboard</p>
      <h1 className="display mt-6 max-w-2xl text-[clamp(32px,4.6vw,54px)]">
        Catatan gagal dimuat.
      </h1>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
        {error.message || "Terjadi kesalahan saat membaca data bacaan."}
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center rounded-[6px] border border-ink bg-neon px-5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-on-accent transition-colors hover:bg-[#c6eb00]"
        >
          Coba lagi
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-[6px] border border-ink px-5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          Muat ulang dashboard
        </Link>
      </div>
    </div>
  );
}
