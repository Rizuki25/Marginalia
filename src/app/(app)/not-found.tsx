import Link from "next/link";

export default function AppNotFound() {
  return (
    <div className="shell py-16">
      <p className="label text-muted-foreground">404</p>
      <h1 className="display mt-5 max-w-2xl text-[clamp(32px,4.6vw,54px)]">
        Halaman ini tidak ada di rak.
      </h1>
      <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
        Alamatnya mungkin salah, atau buku yang kamu cari sudah dihapus.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/books"
          className="inline-flex h-11 items-center rounded-[6px] border border-ink bg-neon px-5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-on-accent transition-colors hover:bg-[#c6eb00]"
        >
          Ke koleksi
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-[6px] border border-ink px-5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          Ke dashboard
        </Link>
      </div>
    </div>
  );
}
