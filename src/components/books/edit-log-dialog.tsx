"use client";

import { useActionState, useEffect, useState } from "react";
import { updateReadingLogAction } from "@/lib/actions-books";
import { idleFormState } from "@/lib/form-state";
import { formatLongDate, todayISO } from "@/lib/date";
import { notifyUpdated } from "@/lib/notify";
import { useActionSuccess } from "@/lib/use-action-feedback";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PendingSweep, PixelSpinner } from "@/components/wild/feedback-popup";
import {
  Field,
  FormMessage,
  TextArea,
  TextInput,
} from "@/components/wild/field";
import type { ReadingLogRow } from "@/lib/types";

export function EditLogDialog({
  log,
  totalPages,
}: {
  log: ReadingLogRow;
  totalPages: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) setOpen(next);
      }}
    >
      <DialogTrigger
        render={
          <button
            type="button"
            className="label-sm inline-flex min-h-11 items-center border border-line px-2.5 text-muted-foreground transition-colors hover:border-ink hover:text-ink"
          />
        }
      >
        Ubah
      </DialogTrigger>
      <DialogContent showCloseButton={!pending}>
        <PendingSweep active={pending} label="Memperbarui catatan bacaan..." />
        <DialogHeader>
          <DialogTitle>Ubah catatan</DialogTitle>
          <DialogDescription>
            Halaman awal tetap {log.start_page}. Posisi buku dihitung ulang dari
            semua catatan yang tersisa.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <EditLogForm
            log={log}
            totalPages={totalPages}
            onDone={() => {
              setPending(false);
              setOpen(false);
            }}
            onPendingChange={setPending}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EditLogForm({
  log,
  totalPages,
  onDone,
  onPendingChange,
}: {
  log: ReadingLogRow;
  totalPages: number;
  onDone: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateReadingLogAction,
    idleFormState,
  );
  const [logDate, setLogDate] = useState(log.log_date);
  const [endPage, setEndPage] = useState(String(log.end_page));
  const [duration, setDuration] = useState(
    log.duration_minutes === null ? "" : String(log.duration_minutes),
  );
  const [dailyNote, setDailyNote] = useState(log.daily_note ?? "");
  const today = todayISO();

  const end = Number(endPage);
  const delta = Number.isFinite(end) ? Math.max(0, end - log.start_page) : 0;
  const dateHint = /^\d{4}-\d{2}-\d{2}$/.test(logDate)
    ? formatLongDate(logDate)
    : undefined;

  useEffect(() => {
    onPendingChange(pending);
  }, [pending, onPendingChange]);

  useActionSuccess(state, (message) => {
    notifyUpdated(message);
    onDone();
  });

  return (
    <form action={formAction} aria-busy={pending} className="flex flex-col">
      <input type="hidden" name="logId" value={log.id} />
      <input type="hidden" name="clientToday" value={today} />

      <div className="flex flex-col gap-5 px-6 py-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Tanggal baca" hint={dateHint} htmlFor={`log-date-${log.id}`}>
            <TextInput
              id={`log-date-${log.id}`}
              name="logDate"
              type="date"
              value={logDate}
              onChange={(event) => setLogDate(event.target.value)}
              required
            />
          </Field>
          <Field
            label="Halaman akhir"
            hint={`dari ${totalPages}`}
            htmlFor={`log-end-${log.id}`}
          >
            <TextInput
              id={`log-end-${log.id}`}
              name="endPage"
              type="number"
              inputMode="numeric"
              min={log.start_page}
              max={totalPages}
              value={endPage}
              onChange={(event) => setEndPage(event.target.value)}
              required
            />
          </Field>
        </div>

        <div className="flex items-center justify-between border border-line bg-surface-2 px-3 py-2.5">
          <span className="label-sm text-muted-foreground">Halaman terbaca</span>
          <span className="num text-[15px] font-semibold text-ink">+{delta}</span>
        </div>

        <Field label="Durasi menit" hint="opsional" htmlFor={`log-dur-${log.id}`}>
          <TextInput
            id={`log-dur-${log.id}`}
            name="durationMinutes"
            type="number"
            inputMode="numeric"
            min={0}
            max={1440}
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            placeholder="25"
          />
        </Field>

        <Field label="Catatan harian" hint="opsional" htmlFor={`log-note-${log.id}`}>
          <TextArea
            id={`log-note-${log.id}`}
            name="dailyNote"
            rows={3}
            value={dailyNote}
            onChange={(event) => setDailyNote(event.target.value)}
          />
        </Field>

        <FormMessage status={state.status} message={state.message} />
      </div>

      <DialogFooter>
        <DialogClose
          render={<Button variant="ghost" type="button" disabled={pending} />}
        >
          Batal
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <PixelSpinner />
              <span>Menyimpan...</span>
            </>
          ) : (
            "Simpan perubahan"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
