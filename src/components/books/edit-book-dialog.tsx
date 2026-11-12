"use client";

import { useActionState, useEffect, useState } from "react";
import { updateBookAction } from "@/lib/actions-books";
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
import { Field, FormMessage, TextInput } from "@/components/wild/field";
import type { BookRow } from "@/lib/types";

export function EditBookDialog({
  book,
  triggerLabel = "Ubah data buku",
}: {
  book: BookRow;
  triggerLabel?: string;
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
            className="label-sm inline-flex min-h-11 items-center border border-line px-3 text-muted-foreground transition-colors hover:border-ink hover:text-ink"
          />
        }
      >
        {triggerLabel}
      </DialogTrigger>
      <DialogContent showCloseButton={!pending}>
        <PendingSweep active={pending} label="Memperbarui data buku..." />
        <DialogHeader>
          <DialogTitle>Ubah data buku</DialogTitle>
          <DialogDescription>
            Total halaman tidak bisa lebih kecil dari posisi sekarang
            ({book.current_page}). Sampul diatur terpisah di bawah.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <EditBookForm
            book={book}
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

function EditBookForm({
  book,
  onDone,
  onPendingChange,
}: {
  book: BookRow;
  onDone: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateBookAction,
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
      <input type="hidden" name="bookId" value={book.id} />

      <div className="flex flex-col gap-5 px-6 py-5">
        <Field label="Judul" htmlFor={`book-title-${book.id}`}>
          <TextInput
            id={`book-title-${book.id}`}
            name="title"
            defaultValue={book.title}
            required
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Penulis" htmlFor={`book-author-${book.id}`}>
            <TextInput
              id={`book-author-${book.id}`}
              name="author"
              defaultValue={book.author}
              required
            />
          </Field>
          <Field label="Genre" hint="opsional" htmlFor={`book-cat-${book.id}`}>
            <TextInput
              id={`book-cat-${book.id}`}
              name="category"
              defaultValue={book.category ?? ""}
            />
          </Field>
        </div>

        <Field
          label="Total halaman"
          hint={`min. ${Math.max(1, book.current_page)}`}
          htmlFor={`book-pages-${book.id}`}
        >
          <TextInput
            id={`book-pages-${book.id}`}
            name="totalPages"
            type="number"
            inputMode="numeric"
            min={Math.max(1, book.current_page)}
            defaultValue={book.total_pages}
            required
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
