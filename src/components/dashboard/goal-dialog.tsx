"use client";

import { useActionState, useEffect, useState } from "react";
import { saveReadingGoalAction } from "@/lib/actions-goals";
import { idleFormState } from "@/lib/form-state";
import { notifyAdded, notifyDeleted, notifyUpdated } from "@/lib/notify";
import { useActionSuccess } from "@/lib/use-action-feedback";
import type { ReadingGoalRow } from "@/lib/types";
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
import { Field, FormMessage, TextInput } from "@/components/wild/field";

export function GoalDialog({
  goal,
  year,
}: {
  goal: ReadingGoalRow | null;
  year: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const hasGoal = goal !== null;

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
            className="label-sm inline-flex min-h-11 items-center border border-line px-3 text-muted-foreground transition-colors hover:border-ink hover:text-ink"
          />
        }
      >
        {hasGoal ? "Ubah target" : "Atur target"}
      </DialogTrigger>
      <DialogContent showCloseButton={!pending} className="sm:max-w-md">
        <PendingSweep active={pending} label="Menyimpan target membaca..." />
        <DialogHeader>
          <DialogTitle>Target membaca {year}</DialogTitle>
          <DialogDescription>
            Angka ini hanya mengubah cara dashboard mengukur kemajuan. Riwayat
            bacaanmu tidak ikut berubah. Isi 0 di kedua kolom untuk menghapus
            target.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <GoalForm
            goal={goal}
            year={year}
            hasGoal={hasGoal}
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

function GoalForm({
  goal,
  year,
  hasGoal,
  onDone,
  onPendingChange,
}: {
  goal: ReadingGoalRow | null;
  year: number;
  hasGoal: boolean;
  onDone: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(
    saveReadingGoalAction,
    idleFormState,
  );

  useEffect(() => {
    onPendingChange(pending);
  }, [pending, onPendingChange]);

  useActionSuccess(state, (message) => {
    if (message === "Target dihapus.") notifyDeleted(message);
    else if (hasGoal) notifyUpdated(message);
    else notifyAdded(message);
    onDone();
  });

  return (
    <form action={formAction} aria-busy={pending} className="flex flex-col">
      <input type="hidden" name="year" value={year} />

      <div className="flex flex-col gap-5 px-6 py-5">
        <Field
          label="Target buku tahun ini"
          hint={goal ? "0 untuk menghapus" : "opsional"}
          htmlFor="goal-books"
        >
          <TextInput
            id="goal-books"
            name="targetBooks"
            type="number"
            inputMode="numeric"
            min={0}
            max={999}
            defaultValue={goal?.target_books ?? ""}
            placeholder="12"
          />
        </Field>

        <Field label="Target halaman per hari" hint="opsional" htmlFor="goal-pages">
          <TextInput
            id="goal-pages"
            name="targetPagesPerDay"
            type="number"
            inputMode="numeric"
            min={0}
            max={5000}
            defaultValue={goal?.target_pages_per_day ?? ""}
            placeholder="20"
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
            "Simpan target"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
