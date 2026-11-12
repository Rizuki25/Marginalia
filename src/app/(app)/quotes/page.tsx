import type { Metadata } from "next";
import { getQuotesData } from "@/lib/data/quotes";
import { QuoteDialog } from "@/components/dashboard/quote-dialog";
import { QuotesGallery } from "@/components/quotes/quotes-gallery";
import { PixelWave } from "@/components/wild/pixel-wave";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Quotes · Marginalia",
};

export default async function QuotesPage() {
  const data = await getQuotesData();

  return (
    <>
      <div className="shell py-8 md:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="label">Quotes</p>
            <h1 className="display mt-4 text-[clamp(32px,4.6vw,54px)]">
              Kutipan yang kamu simpan.
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              Semua kalimat yang pernah kamu tandai, lengkap dengan asal buku dan
              halamannya. Cari dengan kata kunci atau saring lewat tag.
            </p>
          </div>

          {data.books.length > 0 ? (
            <QuoteDialog books={data.books} triggerLabel="Tambah kutipan" />
          ) : null}
        </div>

        <div className="mt-8 md:mt-10">
          {data.quotes.length === 0 ? (
            <div className="border-t border-line pt-6">
              <p className="display-2 max-w-xl text-[clamp(22px,2.6vw,30px)]">
                Belum ada kutipan tersimpan.
              </p>
              <p className="mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground">
                {data.books.length > 0
                  ? "Simpan kalimat pertama yang berkesan, lalu kutipan itu muncul di sini dan di dashboard."
                  : "Tambahkan buku dulu di dashboard, kutipan selalu menempel pada satu buku."}
              </p>
              {data.books.length > 0 ? (
                <div className="mt-6">
                  <QuoteDialog books={data.books} triggerLabel="Simpan kutipan" />
                </div>
              ) : null}
            </div>
          ) : (
            <QuotesGallery
              quotes={data.quotes}
              filterBooks={data.filterBooks}
              filterTags={data.filterTags}
            />
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
