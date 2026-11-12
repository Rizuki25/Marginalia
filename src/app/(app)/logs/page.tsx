import type { Metadata } from "next";
import { getLogsData } from "@/lib/data/logs";
import { LogLedger } from "@/components/logs/log-ledger";
import { LogDialog } from "@/components/dashboard/log-dialog";
import { toBookOption } from "@/components/dashboard/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Riwayat · Marginalia",
};

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string | string[] }>;
}) {
  const { month } = await searchParams;
  const data = await getLogsData(Array.isArray(month) ? month[0] : month);

  const readingBooks = data.books
    .filter((book) => book.status === "READING")
    .map(toBookOption);

  return (
    <div className="shell py-8 md:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label">Riwayat</p>
          <h1 className="display mt-4 text-[clamp(32px,4.6vw,54px)]">
            Kalender bacaan.
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            Setiap hari yang kamu catat, lengkap dengan halaman, durasi, dan
            catatan hariannya. Batang di kalender setinggi jumlah halaman hari
            itu.
          </p>
        </div>

        {readingBooks.length > 0 ? (
          <LogDialog
            books={readingBooks}
            triggerLabel="Catat bacaan"
            triggerVariant="outline"
          />
        ) : null}
      </div>

      {data.logs.length === 0 && data.months.length === 0 ? (
        <div className="mt-8 border-t border-line pt-6 md:mt-10">
          <p className="display-2 max-w-xl text-[clamp(22px,2.6vw,30px)]">
            Belum ada hari yang tercatat.
          </p>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            {readingBooks.length > 0
              ? "Catat halaman terakhir yang kamu capai hari ini, lalu tanggalnya muncul di kalender ini."
              : "Tambahkan buku dengan status Sedang dibaca dulu, setelah itu setiap sesi bacaan bisa dicatat di sini."}
          </p>
          {readingBooks.length > 0 ? (
            <div className="mt-6">
              <LogDialog books={readingBooks} triggerLabel="Catat bacaan" />
            </div>
          ) : null}
        </div>
      ) : (
        <LogLedger data={data} />
      )}

      <footer className="mt-16 border-t border-line pt-5">
          <p className="label-sm text-muted-foreground">Marginalia</p>
        </footer>
    </div>
  );
}
