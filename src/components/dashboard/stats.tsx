import { cn } from "cn";
import type { DashboardStats } from "@/lib/data/dashboard";
import type { ReadingGoalRow } from "@/lib/types";
import { GoalDialog } from "./goal-dialog";

function Cell({
  label,
  value,
  unit,
  note,
  children,
}: {
  label: string;
  value: string;
  unit?: string;
  note: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col border-r border-b border-line p-5">
      <p className="label-sm text-muted-foreground">{label}</p>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span className="num text-[clamp(32px,3.6vw,42px)] font-semibold leading-none tracking-[-0.04em]">
          {value}
        </span>
        {unit ? (
          <span className="label-sm text-muted-foreground">{unit}</span>
        ) : null}
      </p>
      <p className="label-sm mt-2 text-muted-foreground">{note}</p>
      {children}
    </div>
  );
}

/** Up to 24 ticks stay legible; a bigger target is stated, not drawn. */
const MAX_TICKS = 24;

export function Stats({
  stats,
  goal,
  year,
}: {
  stats: DashboardStats;
  goal: ReadingGoalRow | null;
  year: number;
}) {
  const targetBooks = stats.targetBooks;
  const targetPages = stats.targetPagesPerDay;
  const filled = Math.min(stats.finishedThisYear, targetBooks);
  const tickCount = Math.min(targetBooks, MAX_TICKS);
  const booksLeft = Math.max(0, targetBooks - stats.finishedThisYear);
  const pagesLeft = Math.max(0, targetPages - stats.pagesToday);

  return (
    <div>
      <div className="grid grid-cols-2 border-l border-t border-line lg:grid-cols-4">
        <Cell
          label="Rentetan"
          value={String(stats.streak)}
          unit="hari"
          note={stats.streak > 0 ? "Beruntun sampai hari ini" : "Belum ada rentetan"}
        />
        <Cell
          label="Hari ini"
          value={String(stats.pagesToday)}
          unit="hal"
          note={
            targetPages === 0
              ? "Target harian belum diatur"
              : pagesLeft > 0
                ? `Target harian ${targetPages} hal, kurang ${pagesLeft}`
                : `Target harian ${targetPages} hal tercapai`
          }
        />
        <Cell
          label="Minggu ini"
          value={String(stats.pagesWeek)}
          unit="hal"
          note="Dihitung dari Senin"
        />
        <Cell
          label="Tamat tahun ini"
          value={String(stats.finishedThisYear)}
          unit={targetBooks > 0 ? `/ ${targetBooks}` : undefined}
          note={
            targetBooks === 0
              ? "Target buku belum diatur"
              : booksLeft === 0
                ? stats.finishedThisYear > targetBooks
                  ? `Target tercapai, ${stats.finishedThisYear - targetBooks} buku lewat target`
                  : "Target tahunan tercapai"
                : `${booksLeft} buku lagi menuju target`
          }
        >
          {targetBooks > 0 ? (
            <div
              role="img"
              aria-label={`${stats.finishedThisYear} dari ${targetBooks} buku selesai`}
              className="mt-3 flex flex-wrap gap-1"
            >
              {Array.from({ length: tickCount }, (_, index) => (
                <span
                  key={index}
                  className={cn(
                    "size-2.5 border border-ink",
                    index < filled ? "bg-ink" : "bg-transparent",
                  )}
                />
              ))}
              {targetBooks > tickCount ? (
                <span className="label-sm ml-1 self-center text-muted-foreground">
                  +{targetBooks - tickCount}
                </span>
              ) : null}
            </div>
          ) : null}
        </Cell>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-r border-b border-l border-line px-5 py-3">
        <p className="label-sm text-muted-foreground">
          {goal === null
            ? `Target ${year} belum diatur. Angka di atas baru laporan, belum ukuran kemajuan.`
            : `Target ${year}: ${
                targetBooks > 0 ? `${targetBooks} buku` : "tanpa target buku"
              }, ${
                targetPages > 0
                  ? `${targetPages} halaman per hari`
                  : "tanpa target harian"
              }`}
        </p>
        <GoalDialog goal={goal} year={year} />
      </div>
    </div>
  );
}
