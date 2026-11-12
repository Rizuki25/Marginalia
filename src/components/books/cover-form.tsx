"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { updateCoverAction } from "@/lib/actions-books";
import { idleFormState } from "@/lib/form-state";
import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="bookId" value={bookId} />

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
          {pending ? "Mengunggah..." : hasCover ? "Ganti sampul" : "Simpan sampul"}
        </Button>
        <span className="label-sm text-muted-foreground">
          Kosongkan kedua kolom untuk membatalkan.
        </span>
      </div>
    </form>
  );
}
