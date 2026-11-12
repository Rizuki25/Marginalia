import { formatLongDate, todayISO } from "@/lib/date";
import { getDashboardData } from "@/lib/data/dashboard";
import { Section } from "@/components/shell/section";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { BookDialog } from "@/components/dashboard/book-dialog";
import { QuoteSpotlight } from "@/components/dashboard/quote-spotlight";
import { Spotlight } from "@/components/dashboard/spotlight";
import { Stats } from "@/components/dashboard/stats";
import { toBookOption } from "@/components/dashboard/types";
import { Marquee } from "@/components/wild/marquee";
import { PixelWave } from "@/components/wild/pixel-wave";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const today = todayISO();
  const year = Number(today.slice(0, 4));
  const readingOptions = data.readingBooks.map(toBookOption);
  const allOptions = data.allBooks.map(toBookOption);

  return (
    <div>
      <Marquee />
      <div className="shell py-8 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-3">
            <p className="label">Dashboard</p>
            <p className="label-sm text-muted-foreground">{formatLongDate(today)}</p>
          </div>
          {data.spotlight ? (
            <BookDialog triggerLabel="Tambah buku" triggerVariant="outline" />
          ) : null}
        </div>

        <div className="mt-8 flex flex-col gap-10 md:mt-10 md:gap-12">
          <Section index="01" title="Sedang dibaca">
            {data.spotlight ? (
              <Spotlight
                book={data.spotlight}
                readingBooks={readingOptions}
                allBooks={allOptions}
              />
            ) : (
              <div className="max-w-2xl">
                <h1 className="display text-[clamp(32px,4.6vw,54px)]">
                  Belum ada buku yang sedang dibaca.
                </h1>
                <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
                  Tambahkan buku pertama, lalu catat halaman terakhir setiap hari.
                  Progress bar dan rentetan bacaan akan terisi sendiri.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <BookDialog triggerLabel="Tambah buku" triggerVariant="default" />
                </div>
              </div>
            )}
          </Section>

          <Section
            index="02"
            title="Statistik"
            aside={
              <p className="label-sm mt-1 hidden text-muted-foreground md:block">
                Dari catatan bacaan
              </p>
            }
          >
            <Stats stats={data.stats} goal={data.goal} year={year} />
          </Section>

          <Section
            index="03"
            title="Aktivitas 14 hari"
            aside={
              <p className="label-sm mt-1 hidden text-muted-foreground md:block">
                Halaman per hari
              </p>
            }
          >
            <ActivityChart activity={data.activity} />
          </Section>

          <Section index="04" title="Kutipan pilihan">
            <QuoteSpotlight quotes={data.quotes} books={allOptions} />
          </Section>
        </div>

        <footer className="mt-16 border-t border-line pt-5">
          <p className="label-sm text-muted-foreground">Marginalia</p>
        </footer>
      </div>
      <PixelWave />
    </div>
  );
}
