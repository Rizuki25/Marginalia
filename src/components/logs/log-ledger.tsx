import Link from "next/link";
import { cn } from "cn";
import { deleteReadingLogAction } from "@/lib/actions-books";
import {
  addMonths,
  firstWeekdayOffset,
  formatLongDate,
  formatMonth,
  monthDates,
  todayISO,
} from "@/lib/date";
import { monthNeighbours, type LogsData, type MonthLog } from "@/lib/data/logs";
import { EditLogDialog } from "@/components/books/edit-log-dialog";
import { Section } from "@/components/shell/section";
import { ConfirmAction } from "@/components/wild/confirm-action";

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

interface Summary {
  pages: number;
  sessions: number;
  minutes: number;
  activeDays: number;
}

function summarise(logs: MonthLog[]): Summary {
  return {
    pages: logs.reduce((sum, log) => sum + log.pages_read, 0),
    sessions: logs.length,
    minutes: logs.reduce((sum, log) => sum + (log.duration_minutes ?? 0), 0),
    activeDays: new Set(logs.map((log) => log.log_date)).size,
  };
}

function PagerButton({
  month,
  direction,
  href,
}: {
  month: string;
  direction: "previous" | "next";
  href: string | null;
}) {
  const label = (
    <>
      {direction === "previous" ? <span aria-hidden="true">&larr;</span> : null}
      {formatMonth(month)}
      {direction === "next" ? <span aria-hidden="true">&rarr;</span> : null}
    </>
  );

  if (!href) {
    return (
      <span
        aria-disabled="true"
        className="label inline-flex min-h-11 items-center gap-2 border border-line px-3 text-muted-foreground"
      >
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="label inline-flex min-h-11 items-center gap-2 border border-line px-3 text-ink transition-colors hover:border-ink"
    >
      {label}
    </Link>
  );
}

/** One cell per day: bar height is that day's pages, read against the month peak. */
function MonthCalendar({ month, logs }: { month: string; logs: MonthLog[] }) {
  const perDay = new Map<string, number>();
  for (const log of logs) {
    perDay.set(log.log_date, (perDay.get(log.log_date) ?? 0) + log.pages_read);
  }

  const peak = Math.max(1, ...perDay.values());
  const dates = monthDates(month);
  const blanks = firstWeekdayOffset(month);
  const today = todayISO();

  const cells: Array<string | null> = [
    ...Array.from({ length: blanks }, () => null),
    ...dates,
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: Array<Array<string | null>> = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return (
    <div>
      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">
          Halaman yang dibaca setiap hari pada {formatMonth(month)}.
        </caption>
        <thead>
          <tr>
            {WEEKDAYS.map((day) => (
              <th
                key={day}
                scope="col"
                className="label-sm border-b border-line pb-2 text-left font-normal text-muted-foreground"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIndex) => (
            <tr key={weekIndex}>
              {week.map((date, dayIndex) => {
                if (!date) {
                  return (
                    <td
                      key={`blank-${weekIndex}-${dayIndex}`}
                      className="h-[76px] border border-line-soft p-1.5"
                    />
                  );
                }

                const pages = perDay.get(date) ?? 0;
                const isToday = date === today;
                const isFuture = date > today;
                const height = pages > 0 ? Math.max(8, (pages / peak) * 100) : 0;

                return (
                  <td
                    key={date}
                    aria-current={isToday ? "date" : undefined}
                    className={cn(
                      "relative h-[76px] border p-1.5 align-bottom",
                      isToday ? "border-ink" : "border-line-soft",
                    )}
                  >
                    {isToday ? (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 top-0 h-[3px] bg-neon"
                      />
                    ) : null}

                    <div className="flex h-full flex-col justify-between" aria-hidden="true">
                      <span
                        className={cn(
                          "num text-[10px] leading-none",
                          isToday
                            ? "font-semibold text-ink"
                            : isFuture
                              ? "text-muted-foreground"
                              : "text-muted-foreground",
                        )}
                      >
                        {date.slice(8)}
                      </span>

                      <div className="mt-1.5 flex h-[30px] items-end">
                        {pages > 0 ? (
                          <div className="w-full bg-ink" style={{ height: `${height}%` }} />
                        ) : null}
                      </div>

                      <span className="num mt-1.5 block text-[10px] leading-none text-ink">
                        {pages > 0 ? pages : ""}
                      </span>
                    </div>

                    <span className="sr-only">
                      {isFuture
                        ? `${formatLongDate(date)}: belum terjadi`
                        : `${formatLongDate(date)}: ${pages > 0 ? `${pages} halaman` : "tidak ada catatan"}`}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="label-sm mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block h-3 w-1.5 bg-ink" />
          Tinggi batang = halaman
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block h-[3px] w-3 bg-neon" />
          Hari ini
        </span>
      </p>
    </div>
  );
}

function DayLedger({ logs }: { logs: MonthLog[] }) {
  const groups = new Map<string, MonthLog[]>();
  for (const log of logs) {
    const list = groups.get(log.log_date) ?? [];
    list.push(log);
    groups.set(log.log_date, list);
  }

  return (
    <div>
      {[...groups.entries()].map(([date, dayLogs]) => {
        const dayPages = dayLogs.reduce((sum, log) => sum + log.pages_read, 0);
        const dayMinutes = dayLogs.reduce(
          (sum, log) => sum + (log.duration_minutes ?? 0),
          0,
        );

        return (
          <section key={date} className="mt-5 first:mt-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line pb-2">
              <h3 className="label text-ink">{formatLongDate(date)}</h3>
              <p className="label-sm text-muted-foreground">
                {dayLogs.length} sesi · {dayPages} halaman
                {dayMinutes > 0 ? ` · ${dayMinutes} menit` : ""}
              </p>
            </div>

            <ol>
              {dayLogs.map((log) => (
                <li
                  key={log.id}
                  className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-4 gap-y-2 border-b border-line-soft py-3 md:grid-cols-[72px_minmax(0,1fr)_auto]"
                >
                  <span className="num whitespace-nowrap pt-0.5 text-[13px] font-semibold text-ink">
                    +{log.pages_read} hal
                  </span>

                  <div className="min-w-0">
                    <Link
                      href={`/books/${log.book_id}`}
                      className="inline-flex min-h-11 items-center font-sans text-[15px] font-semibold leading-snug text-ink underline-offset-4 hover:underline"
                    >
                      {log.bookTitle}
                    </Link>
                    <p className="num mt-1 text-[11px] text-muted-foreground">
                      Hal. {log.start_page} &rarr; {log.end_page}
                      {log.duration_minutes ? ` · ${log.duration_minutes} menit` : ""}
                    </p>
                    {log.daily_note ? (
                      <p className="mt-1.5 max-w-2xl text-[14px] leading-snug text-ink">
                        {log.daily_note}
                      </p>
                    ) : null}
                  </div>

                  <div className="col-span-2 flex items-center gap-2 md:col-span-1 md:justify-end">
                    <EditLogDialog log={log} totalPages={log.bookTotalPages} />
                    <ConfirmAction
                      triggerLabel="Hapus"
                      title="Hapus catatan ini?"
                      description={`Catatan ${formatLongDate(log.log_date)} (+${log.pages_read} halaman) akan dihapus, dan posisi ${log.bookTitle} dihitung ulang dari catatan yang tersisa.`}
                      confirmLabel="Hapus catatan"
                      successMessage="Catatan dihapus, posisi buku dihitung ulang."
                      action={deleteReadingLogAction}
                      hidden={{ logId: log.id }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

export function LogLedger({ data }: { data: LogsData }) {
  const summary = summarise(data.logs);
  const { previous, next } = monthNeighbours(data);

  return (
    <div className="mt-8 md:mt-10">
      <nav
        aria-label="Pilih bulan"
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-y border-line py-2"
      >
        <div className="flex flex-wrap items-center gap-2">
          <PagerButton
            month={addMonths(data.month, -1)}
            direction="previous"
            href={previous ? `/logs?month=${previous}` : null}
          />
          <PagerButton
            month={addMonths(data.month, 1)}
            direction="next"
            href={next ? `/logs?month=${next}` : null}
          />
        </div>

        <p className="label-sm text-muted-foreground">
          {summary.activeDays} hari · {summary.sessions} sesi ·{" "}
          <span className="num text-ink">{summary.pages}</span> halaman
        </p>
      </nav>

      <div className="mt-6">
        <Section index="01" title={formatMonth(data.month)}>
          <MonthCalendar month={data.month} logs={data.logs} />
        </Section>
      </div>

      <div className="mt-10">
        <Section
          index="02"
          title="Catatan per hari"
          aside={
            <p className="label-sm mt-1 hidden text-muted-foreground md:block">
              {summary.activeDays} hari
            </p>
          }
        >
          {data.logs.length === 0 ? (
            <div className="border border-line p-6">
              <p className="display-2 text-[20px]">Bulan ini belum ada catatan.</p>
              <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
                Pilih bulan lain lewat tombol di atas, atau catat sesi hari ini
                supaya kalender ini terisi.
              </p>
            </div>
          ) : (
            <DayLedger logs={data.logs} />
          )}
        </Section>
      </div>
    </div>
  );
}
