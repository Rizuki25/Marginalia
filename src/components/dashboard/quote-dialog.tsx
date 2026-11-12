"use client";

import { useActionState, useEffect, useState } from "react";
import { saveQuoteAction } from "@/lib/actions";
import { idleFormState } from "@/lib/form-state";
import { notifyAdded } from "@/lib/notify";
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
  CheckboxRow,
  Field,
  FormMessage,
  NativeSelect,
  TextArea,
  TextInput,
} from "@/components/wild/field";
import type { BookOption } from "./types";

export function QuoteDialog({
  books,
  triggerLabel = "Simpan kutipan",
  triggerVariant = "outline",
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
        <PendingSweep active={pending} label="Menyimpan kutipan..." />
        <DialogHeader>
          <DialogTitle>Simpan kutipan</DialogTitle>
          <DialogDescription>
            Tempel kalimat yang mau kamu simpan, lalu tandai halamannya supaya
            mudah ditemukan lagi.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <QuoteForm
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

function QuoteForm({
  books,
  onDone,
  onPendingChange,
}: {
  books: BookOption[];
  onDone: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(
    saveQuoteAction,
    idleFormState,
  );
  const [content, setContent] = useState("");

  useEffect(() => {
    onPendingChange(pending);
  }, [pending, onPendingChange]);

  useActionSuccess(state, (message) => {
    notifyAdded(message);
    onDone();
  });

  return (
    <form action={formAction} aria-busy={pending} className="flex flex-col">
      <div className="flex flex-col gap-5 px-6 py-5">
        <Field label="Kutipan" hint={`${content.length}/2000`} htmlFor="quote-content">
          <TextArea
            id="quote-content"
            name="content"
            rows={5}
            maxLength={2000}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Tulis kutipannya di sini."
            required
          />
        </Field>

        <Field label="Buku" htmlFor="quote-book">
          <NativeSelect id="quote-book" name="bookId" defaultValue={books[0].id}>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Halaman" hint="opsional" htmlFor="quote-page">
            <TextInput
              id="quote-page"
              name="pageNumber"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="64"
            />
          </Field>
          <Field label="Bab" hint="opsional" htmlFor="quote-chapter">
            <TextInput id="quote-chapter" name="chapter" placeholder="Bab 2" />
          </Field>
        </div>

        <Field label="Tag" hint="satu tag" htmlFor="quote-tag">
          <TextInput
            id="quote-tag"
            name="tag"
            placeholder="filosofi"
            maxLength={40}
          />
        </Field>

        <Field label="Refleksi pribadi" hint="opsional" htmlFor="quote-note">
          <TextArea
            id="quote-note"
            name="personalNote"
            rows={2}
            placeholder="Kenapa kalimat ini penting buatmu?"
          />
        </Field>

        <CheckboxRow
          id="quote-favorite"
          name="isFavorite"
          label="Tandai favorit"
          description="Kutipan favorit muncul lebih sering di dashboard."
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
            "Simpan kutipan"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
