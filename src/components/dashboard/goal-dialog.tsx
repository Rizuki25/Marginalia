"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { saveReadingGoalAction } from "@/lib/actions-goals";
import { idleFormState } from "@/lib/form-state";
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
import { Field, FormMessage, TextInput } from "@/components/wild/field";

export function GoalDialog({
  goal,
  year,
}: {
  goal: ReadingGoalRow | null;
  year: number;
}) {
  const [open, setOpen] = useState(false);
  const hasGoal = goal !== null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Target membaca {year}</DialogTitle>
          <DialogDescription>
            Angka ini hanya mengubah cara dashboard mengukur kemajuan. Riwayat
            bacaanmu tidak ikut berubah. Isi 0 di kedua kolom untuk menghapus
            target.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <GoalForm goal={goal} year={year} onDone={() => setOpen(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function GoalForm({
  goal,
  year,
  onDone,
}: {
  goal: ReadingGoalRow | null;
  year: number;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    saveReadingGoalAction,
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
        <DialogClose render={<Button variant="ghost" type="button" />}>
          Batal
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan target"}
        </Button>
      </DialogFooter>
    </form>
  );
}
