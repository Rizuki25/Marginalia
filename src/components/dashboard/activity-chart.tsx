import { cn } from "cn";
import { formatShortDate, formatWeekday, todayISO } from "@/lib/date";
import type { ActivityDay } from "@/lib/data/dashboard";

export function ActivityChart({ activity }: { activity: ActivityDay[] }) {
  const max = Math.max(...activity.map((day) => day.pages), 1);
  const today = todayISO();
  const total = activity.reduce((sum, day) => sum + day.pages, 0);

  if (total === 0) {
    return (
      <div className="border border-line p-6 md:p-8">
        <p className="display-2 max-w-xl text-[clamp(20px,2.2vw,26px)]">
          Belum ada halaman tercatat.
        </p>
        <p className="mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground">
          Grafik ini terisi setelah kamu menyimpan catatan bacaan pertama.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex h-[168px] items-end gap-[3px] md:gap-2">
        {activity.map((day) => {
          const isToday = day.date === today;
          const height = day.pages > 0 ? Math.max(6, (day.pages / max) * 100) : 2;
          return (
            <div
              key={day.date}
              className="flex h-full flex-1 flex-col justify-end"
              title={`${formatShortDate(day.date)}: ${day.pages} halaman`}
            >
              <span className="num mb-1 hidden text-center text-[10px] text-muted-foreground md:block">
                {day.pages > 0 ? day.pages : ""}
              </span>
              <div
                className={cn(
                  "w-full",
                  day.pages > 0 ? "bg-ink" : "bg-ink/15",
                  isToday && day.pages > 0 && "bg-ink",
                )}
                style={{ height: `${height}%` }}
              />
              {isToday ? (
                <div className="h-[3px] w-full bg-neon" aria-hidden="true" />
              ) : (
                <div className="h-[3px] w-full" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex gap-[3px] border-t border-line pt-2 md:gap-2">
        {activity.map((day) => (
          <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
            <span
              className={cn(
                "label-sm text-[9px]",
                day.date === today ? "text-ink" : "text-muted-foreground",
              )}
            >
              {formatWeekday(day.date)}
            </span>
            {day.date === today ? (
              <span className="label-sm text-[8px] text-ink">Kini</span>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <p className="label-sm text-muted-foreground">
          Total 14 hari · <span className="num text-ink">{total}</span> halaman
        </p>
        <p className="label-sm flex items-center gap-2 text-muted-foreground">
          <span aria-hidden="true" className="inline-block h-[3px] w-4 bg-neon" />
          Penanda hari ini
        </p>
      </div>
    </div>
  );
}
