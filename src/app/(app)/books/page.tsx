import type { Metadata } from "next";
import { getLibraryData } from "@/lib/data/books";
import { BookDialog } from "@/components/dashboard/book-dialog";
import { Library } from "@/components/books/library";
import { PixelWave } from "@/components/wild/pixel-wave";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Koleksi · Marginalia",
};

export default async function BooksPage() {
  const data = await getLibraryData();
  const total = data.books.length;

  return (
    <>
      <div className="shell py-8 md:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="label">Koleksi</p>
            <h1 className="display mt-4 text-[clamp(32px,4.6vw,54px)]">Rak buku.</h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              {total > 0
                ? `${total} buku tercatat, terbagi ke empat rak. Pindahkan rak dari halaman detail buku.`
                : "Belum ada buku. Tambahkan yang pertama, lalu catat halaman terakhir setiap hari."}
            </p>
          </div>

          <BookDialog triggerLabel="Tambah buku" triggerVariant="default" />
        </div>

        <div className="mt-8 md:mt-10">
          {total === 0 ? (
            <div className="border-t border-line pt-6">
              <p className="display-2 max-w-xl text-[clamp(22px,2.6vw,30px)]">
                Rak masih kosong.
              </p>
              <p className="mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground">
                Isi judul, penulis, dan total halaman. Sampul bisa diunggah nanti
                dari halaman detail.
              </p>
            </div>
          ) : (
            <Library books={data.books} counts={data.counts} />
          )}
        </div>

        <footer className="mt-16 border-t border-line pt-5">
          <p className="label-sm text-muted-foreground">Marginalia</p>
        </footer>
      </div>
      <PixelWave />
    </>
  );
}
