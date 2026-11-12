import type { Metadata } from "next";
import Link from "next/link";
import { formatLongDate } from "@/lib/date";
import { getBookDetailData } from "@/lib/data/books";
import { STATUS_LABEL } from "@/lib/status";
import { Section } from "@/components/shell/section";
import { BookCover } from "@/components/books/book-cover";
import { CoverForm } from "@/components/books/cover-form";
import { LogTimeline } from "@/components/books/log-timeline";
import { EditBookDialog } from "@/components/books/edit-book-dialog";
import { ConfirmAction } from "@/components/wild/confirm-action";
import { deleteBookAction } from "@/lib/actions-books";
import { ReviewForm } from "@/components/books/review-form";
import { StatusForm } from "@/components/books/status-form";
import { LogDialog } from "@/components/dashboard/log-dialog";
import { QuoteDialog } from "@/components/dashboard/quote-dialog";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  // Reading the book here means an unknown id resolves to a real 404 status
  // before the body starts streaming.
  const { book } = await getBookDetailData(id);
  return { title: `${book.title} · Marginalia` };
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getBookDetailData(id);

  const { book, percent, logs, quotes, totals } = data;
  const option = {
    id: book.id,
    title: book.title,
    author: book.author,
    current_page: book.current_page,
    total_pages: book.total_pages,
  };

  return (
    <div className="shell py-8 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/books"
          className="label inline-flex min-h-11 items-center text-muted-foreground transition-colors hover:text-ink"
        >
          &larr; Koleksi
        </Link>
        <span className="label-sm border border-line px-2 py-1 text-muted-foreground">
          {STATUS_LABEL[book.status]}
        </span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 md:mt-10 md:grid-cols-12 md:gap-12">
        <div className="md:col-span-4 lg:col-span-3">
          <div className="w-full max-w-[220px]">
            <BookCover
              title={book.title}
              author={book.author}
              src={book.cover_url}
              sizes="(min-width: 768px) 220px, 45vw"
              priority
              textSize="text-[17px]"
            />
          </div>
        </div>

        <div className="md:col-span-8 lg:col-span-9">
          <h1 className="display text-[clamp(28px,4vw,46px)]">{book.title}</h1>
          <p className="label mt-3 text-muted-foreground">
            {book.author}
            {book.category ? ` · ${book.category}` : ""}
          </p>

          <div className="mt-6 max-w-xl">
            <div className="flex items-baseline justify-between gap-4">
              <span className="label">Progres halaman</span>
              <span className="num text-[11px] text-muted-foreground">
                {book.current_page} / {book.total_pages} · {percent}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={`Progres membaca ${book.title}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="mt-2 h-4 w-full border border-ink bg-paper p-[2px]"
            >
              <div className="h-full bg-neon" style={{ width: `${percent}%` }} />
            </div>
          </div>

          <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-4">
            <div>
              <dt className="label-sm text-muted-foreground">Mulai</dt>
              <dd className="num mt-1 text-[12px]">
                {book.started_at ? formatLongDate(book.started_at) : "Belum"}
              </dd>
            </div>
            <div>
              <dt className="label-sm text-muted-foreground">Selesai</dt>
              <dd className="num mt-1 text-[12px]">
                {book.finished_at ? formatLongDate(book.finished_at) : "Belum"}
              </dd>
            </div>
            <div>
              <dt className="label-sm text-muted-foreground">Sesi baca</dt>
              <dd className="num mt-1 text-[12px]">{totals.sessions}</dd>
            </div>
            <div>
              <dt className="label-sm text-muted-foreground">Total dibaca</dt>
              <dd className="num mt-1 text-[12px]">{totals.pagesRead} hal</dd>
            </div>
          </dl>

          <div className="mt-7 flex flex-wrap gap-3">
            {book.status === "READING" ? (
              <LogDialog books={[option]} triggerLabel="Catat bacaan" />
            ) : null}
            <QuoteDialog books={[option]} triggerLabel="Simpan kutipan" />
            <EditBookDialog book={book} />
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-10 md:gap-12">
        <Section index="01" title="Status">
          <StatusForm bookId={book.id} status={book.status} />
        </Section>

        <Section index="02" title="Rating & ulasan">
          <ReviewForm bookId={book.id} rating={book.rating} review={book.review} />
        </Section>

        <Section index="03" title="Sampul">
          <CoverForm bookId={book.id} hasCover={Boolean(book.cover_url)} />
        </Section>

        <Section
          index="04"
          title="Riwayat bacaan"
          aside={
            <p className="label-sm mt-1 hidden text-muted-foreground md:block">
              {totals.sessions} sesi
            </p>
          }
        >
          <LogTimeline logs={logs} totalPages={book.total_pages} />
        </Section>

        <Section index="05" title="Kutipan buku ini">
          {quotes.length === 0 ? (
            <div className="border border-line p-6">
              <p className="display-2 text-[20px]">Belum ada kutipan.</p>
              <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
                Kutipan yang kamu simpan dari buku ini akan terkumpul di sini.
              </p>
            </div>
          ) : (
            <ul className="border-t border-line">
              {quotes.map((quote) => (
                <li key={quote.id} className="border-b border-line py-4">
                  <p className="max-w-2xl text-[15px] leading-relaxed text-ink">
                    {quote.content}
                  </p>
                  <p className="label-sm mt-2 text-muted-foreground">
                    {quote.page_number ? `Hal. ${quote.page_number}` : "Tanpa halaman"}
                    {quote.chapter ? ` · ${quote.chapter}` : ""}
                    {quote.is_favorite ? " · Favorit" : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border border-danger-fill/40 p-5">
          <div>
            <p className="label text-ink">Hapus buku</p>
            <p className="mt-2 max-w-md text-[13px] leading-snug text-muted-foreground">
              Menghapus buku juga menghapus seluruh catatan bacaan dan kutipannya.
              Tindakan ini tidak bisa dibatalkan.
            </p>
          </div>
          <ConfirmAction
            triggerLabel="Hapus buku"
            triggerClassName="label-sm inline-flex min-h-11 items-center border border-danger-fill px-3 text-danger transition-colors hover:bg-danger-fill hover:text-on-danger"
            title={`Hapus "${book.title}"?`}
            description={`${logs.length} catatan bacaan dan ${quotes.length} kutipan dari buku ini akan ikut terhapus permanen.`}
            confirmLabel="Hapus buku"
            successMessage="Buku dihapus."
            action={deleteBookAction}
            hidden={{ bookId: book.id }}
          />
        </div>

      <footer className="mt-16 border-t border-line pt-5">
          <p className="label-sm text-muted-foreground">Marginalia</p>
        </footer>
    </div>
  );
}
