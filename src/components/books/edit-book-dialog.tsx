"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { updateBookAction } from "@/lib/actions-books";
import { idleFormState } from "@/lib/form-state";
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
import type { BookRow } from "@/lib/types";

export function EditBookDialog({
  book,
  triggerLabel = "Ubah data buku",
}: {
  book: BookRow;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);

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
        {triggerLabel}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah data buku</DialogTitle>
          <DialogDescription>
            Total halaman tidak bisa lebih kecil dari posisi sekarang
            ({book.current_page}). Sampul diatur terpisah di bawah.
          </DialogDescription>
        </DialogHeader>
        {open ? <EditBookForm book={book} onDone={() => setOpen(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function EditBookForm({
  book,
  onDone,
}: {
  book: BookRow;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateBookAction,
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
