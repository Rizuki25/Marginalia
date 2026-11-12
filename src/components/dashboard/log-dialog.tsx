"use client";

import { useActionState, useEffect, useState } from "react";
import { saveReadingLogAction } from "@/lib/actions";
import { idleFormState } from "@/lib/form-state";
import { formatLongDate, todayISO } from "@/lib/date";
import { notifyAdded } from "@/lib/notify";
import { useActionSuccess } from "@/lib/use-action-feedback";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PendingSweep, PixelSpinner } from "@/components/wild/feedback-popup";
import {
  CheckboxRow,
  Field,
  FormMessage,
  NativeSelect,
  TextArea,
  TextInput,
} from "@/components/wild/field";
import type { BookOption } from "./types";

export function LogDialog({
  books,
  triggerLabel = "Catat bacaan hari ini",
  triggerVariant = "default",
}: {
  books: BookOption[];
  triggerLabel?: string;
  triggerVariant?: "default" | "outline";
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
        render={<Button variant={triggerVariant} />}
        disabled={books.length === 0}
      >
        {triggerLabel}
      </DialogTrigger>
      <DialogContent showCloseButton={!pending}>
        <PendingSweep active={pending} label="Menyimpan catatan bacaan..." />
        <DialogHeader>
          <DialogTitle>Catat bacaan hari ini</DialogTitle>
          <DialogDescription>
            Isi halaman terakhir yang kamu capai. Selisihnya dihitung otomatis
            dan progress bar ikut bergerak.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <LogForm
            books={books}
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

function LogForm({
  books,
  onDone,
  onPendingChange,
}: {
  books: BookOption[];
  onDone: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(
    saveReadingLogAction,
    idleFormState,
  );
  const [bookId, setBookId] = useState(books[0].id);
  const selected = books.find((book) => book.id === bookId) ?? books[0];
  const today = todayISO();
  const [logDate, setLogDate] = useState(today);
  const [endPage, setEndPage] = useState(String(selected.current_page));
  const [duration, setDuration] = useState("");
  const [dailyNote, setDailyNote] = useState("");
  const [finished, setFinished] = useState(false);

  const end = Number(endPage);
  const delta = Number.isFinite(end) ? Math.max(0, end - selected.current_page) : 0;
  const reachesEnd = end === selected.total_pages;
  const dateHint = /^\d{4}-\d{2}-\d{2}$/.test(logDate)
    ? formatLongDate(logDate)
    : undefined;

  useEffect(() => {
    onPendingChange(pending);
  }, [pending, onPendingChange]);

  useActionSuccess(state, (message) => {
    notifyAdded(message);
    onDone();
  });

  return (
    <form action={formAction} aria-busy={pending} className="flex flex-col">
      <input type="hidden" name="clientToday" value={today} />
      <div className="flex flex-col gap-5 px-6 py-5">
        <Field label="Buku" htmlFor="log-book">
          <NativeSelect
            id="log-book"
            name="bookId"
            value={bookId}
            onChange={(event) => {
              const next = event.target.value;
              setBookId(next);
              const book = books.find((row) => row.id === next);
              setEndPage(String(book?.current_page ?? 0));
              setFinished(false);
            }}
          >
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Tanggal baca" hint={dateHint} htmlFor="log-date">
            <TextInput
              id="log-date"
              name="logDate"
              type="date"
              value={logDate}
              onChange={(event) => setLogDate(event.target.value)}
              required
            />
          </Field>
          <Field
            label="Halaman terakhir"
            hint={`dari ${selected.total_pages}`}
            htmlFor="log-end"
          >
            <TextInput
              id="log-end"
              name="endPage"
              type="number"
              inputMode="numeric"
              min={1}
              max={selected.total_pages}
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

        <Field label="Durasi menit" hint="opsional" htmlFor="log-duration">
          <TextInput
            id="log-duration"
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

        <Field label="Catatan harian" hint="opsional" htmlFor="log-note">
          <TextArea
            id="log-note"
            name="dailyNote"
            rows={3}
            value={dailyNote}
            onChange={(event) => setDailyNote(event.target.value)}
            placeholder="Bab 6 bahas kebiasaan yang menempel pada tempat."
          />
        </Field>

        <CheckboxRow
          id="log-finish"
          name="markFinished"
          label="Tandai selesai dibaca"
          description={
            reachesEnd
              ? "Aktif otomatis karena halaman terakhir sama dengan total halaman."
              : "Status buku jadi Selesai Dibaca dan tanggal selesai terisi."
          }
          checked={finished || reachesEnd}
          disabled={reachesEnd}
          onChange={(event) => setFinished(event.target.checked)}
        />

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
            "Simpan catatan"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
