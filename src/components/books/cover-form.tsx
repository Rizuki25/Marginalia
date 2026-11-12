"use client";

import { useActionState, useRef } from "react";
import { updateCoverAction } from "@/lib/actions-books";
import { idleFormState } from "@/lib/form-state";
import { notifyUpdated } from "@/lib/notify";
import { useActionSuccess } from "@/lib/use-action-feedback";
import { Button } from "@/components/ui/button";
import { PendingSweep, PixelSpinner } from "@/components/wild/feedback-popup";
import { Field, FormMessage, TextInput } from "@/components/wild/field";

export function CoverForm({
  bookId,
  hasCover,
}: {
  bookId: string;
  hasCover: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    updateCoverAction,
    idleFormState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useActionSuccess(state, (message) => {
    notifyUpdated(message);
    formRef.current?.reset();
  });

  return (
    <form
      ref={formRef}
      action={formAction}
      aria-busy={pending}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="bookId" value={bookId} />
      <PendingSweep active={pending} label="Mengunggah sampul..." />

      <Field label="Unggah gambar" hint="JPG, PNG, WebP · maks 3 MB" htmlFor="cover-file">
        <input
          id="cover-file"
          name="coverFile"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block w-full max-w-sm cursor-pointer border border-line bg-paper p-2 font-mono text-[11px] text-muted-foreground file:mr-3 file:cursor-pointer file:border file:border-ink file:bg-paper file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:uppercase file:tracking-[0.12em] file:text-ink hover:file:bg-ink hover:file:text-paper"
        />
      </Field>

      <Field label="Atau tempel URL" hint="opsional" htmlFor="cover-url">
        <TextInput
          id="cover-url"
          name="coverUrl"
          type="url"
          placeholder="https://..."
        />
      </Field>

      <FormMessage status={state.status} message={state.message} />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? (
            <>
              <PixelSpinner />
              <span>Mengunggah...</span>
            </>
          ) : hasCover ? (
            "Ganti sampul"
          ) : (
            "Simpan sampul"
          )}
        </Button>
        <span className="label-sm text-muted-foreground">
          Kosongkan kedua kolom untuk membatalkan.
        </span>
      </div>
    </form>
  );
}
