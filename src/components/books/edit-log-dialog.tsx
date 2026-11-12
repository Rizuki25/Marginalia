"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { updateReadingLogAction } from "@/lib/actions-books";
import { idleFormState } from "@/lib/form-state";
import { todayISO } from "@/lib/date";
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
  const [endPage, setEndPage] = useState(String(log.end_page));
  const today = todayISO();

  const end = Number(endPage);
  const delta = Number.isFinite(end) ? Math.max(0, end - log.start_page) : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
      <DialogContent>
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
            endPage={endPage}
            setEndPage={setEndPage}
            delta={delta}
            today={today}
            onDone={() => setOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EditLogForm({
  log,
  totalPages,
  endPage,
  setEndPage,
  delta,
  today,
  onDone,
}: {
  log: ReadingLogRow;
  totalPages: number;
  endPage: string;
  setEndPage: (value: string) => void;
  delta: number;
  today: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateReadingLogAction,
    idleFormState,
  );

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      onDone();
    }
  }, [state, onDone]);

  return (
    <form action={formAction} className="flex flex-col">
      <input type="hidden" name="logId" value={log.id} />

      <div className="flex flex-col gap-5 px-6 py-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Tanggal baca" htmlFor={`log-date-${log.id}`}>
            <TextInput
              id={`log-date-${log.id}`}
              name="logDate"
              type="date"
              defaultValue={log.log_date}
              max={today}
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
            defaultValue={log.duration_minutes ?? ""}
            placeholder="25"
          />
        </Field>

        <Field label="Catatan harian" hint="opsional" htmlFor={`log-note-${log.id}`}>
          <TextArea
            id={`log-note-${log.id}`}
            name="dailyNote"
            rows={3}
            defaultValue={log.daily_note ?? ""}
          />
        </Field>

        <FormMessage status={state.status} message={state.message} />
      </div>

      <DialogFooter>
        <DialogClose render={<Button variant="ghost" type="button" />}>
          Batal
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan perubahan"}
        </Button>
      </DialogFooter>
    </form>
  );
}
