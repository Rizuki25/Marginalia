import { deleteReadingLogAction } from "@/lib/actions-books";
import { formatShortDate } from "@/lib/date";
import type { ReadingLogRow } from "@/lib/types";
import { ConfirmAction } from "@/components/wild/confirm-action";
import { EditLogDialog } from "./edit-log-dialog";

export function LogTimeline({
  logs,
  totalPages,
}: {
  logs: ReadingLogRow[];
  totalPages: number;
}) {
  if (logs.length === 0) {
    return (
      <div className="border border-line p-6">
        <p className="display-2 text-[20px]">Belum ada catatan harian.</p>
        <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
          Setiap kali kamu mencatat bacaan, satu baris riwayat muncul di sini.
        </p>
      </div>
    );
  }

  return (
    <ol className="border-t border-line">
      {logs.map((log) => (
        <li
          key={log.id}
          className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 border-b border-line py-4 md:grid-cols-[110px_88px_minmax(0,1fr)_auto]"
        >
          <span className="num text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            {formatShortDate(log.log_date)}
          </span>

          <span className="num text-[13px] font-semibold text-ink md:col-auto">
            +{log.pages_read} hal
          </span>

          <div className="col-span-2 md:col-span-1">
            <p className="num text-[11px] text-muted-foreground">
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
            <EditLogDialog log={log} totalPages={totalPages} />
            <ConfirmAction
              triggerLabel="Hapus"
              title="Hapus catatan ini?"
              description={`Catatan ${formatShortDate(log.log_date)} (+${log.pages_read} halaman) akan dihapus, dan posisi buku dihitung ulang dari catatan yang tersisa.`}
              confirmLabel="Hapus catatan"
              successMessage="Catatan dihapus, posisi buku dihitung ulang."
              action={deleteReadingLogAction}
              hidden={{ logId: log.id }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
