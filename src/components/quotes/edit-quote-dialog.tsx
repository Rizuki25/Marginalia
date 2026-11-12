"use client";

import { useActionState, useEffect, useState } from "react";
import { updateQuoteAction } from "@/lib/actions";
import { idleFormState } from "@/lib/form-state";
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
import { Field, FormMessage, TextArea, TextInput } from "@/components/wild/field";
import type { QuoteRow } from "@/lib/types";

export function EditQuoteDialog({
  quote,
  triggerClassName,
}: {
  quote: QuoteRow;
  triggerClassName?: string;
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
            className={
              triggerClassName ??
              "label-sm inline-flex min-h-11 items-center border border-line px-2.5 text-muted-foreground transition-colors hover:border-ink hover:text-ink"
            }
          />
        }
      >
        Ubah
      </DialogTrigger>
      <DialogContent showCloseButton={!pending}>
        <PendingSweep active={pending} label="Memperbarui kutipan..." />
        <DialogHeader>
          <DialogTitle>Ubah kutipan</DialogTitle>
          <DialogDescription>
            Teks, halaman, bab, dan refleksi bisa diperbaiki. Buku asal kutipan
            tetap.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <EditQuoteForm
            quote={quote}
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

function EditQuoteForm({
  quote,
  onDone,
  onPendingChange,
}: {
  quote: QuoteRow;
  onDone: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateQuoteAction,
    idleFormState,
  );

  useEffect(() => {
    onPendingChange(pending);
  }, [pending, onPendingChange]);

  useActionSuccess(state, (message) => {
    notifyUpdated(message);
    onDone();
  });

  return (
    <form action={formAction} aria-busy={pending} className="flex flex-col">
      <input type="hidden" name="quoteId" value={quote.id} />

      <div className="flex flex-col gap-5 px-6 py-5">
        <Field label="Kutipan" htmlFor={`q-content-${quote.id}`}>
          <TextArea
            id={`q-content-${quote.id}`}
            name="content"
            rows={5}
            maxLength={2000}
            defaultValue={quote.content}
            required
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Halaman" hint="opsional" htmlFor={`q-page-${quote.id}`}>
            <TextInput
              id={`q-page-${quote.id}`}
              name="pageNumber"
              type="number"
              inputMode="numeric"
              min={1}
              defaultValue={quote.page_number ?? ""}
            />
          </Field>
          <Field label="Bab" hint="opsional" htmlFor={`q-chapter-${quote.id}`}>
            <TextInput
              id={`q-chapter-${quote.id}`}
              name="chapter"
              defaultValue={quote.chapter ?? ""}
            />
          </Field>
        </div>

        <Field label="Refleksi pribadi" hint="opsional" htmlFor={`q-note-${quote.id}`}>
          <TextArea
            id={`q-note-${quote.id}`}
            name="personalNote"
            rows={2}
            defaultValue={quote.personal_note ?? ""}
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
