"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { updateBookStatusAction } from "@/lib/actions-books";
import { idleFormState } from "@/lib/form-state";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/status";
import type { BookStatus } from "@/lib/types";
import { FormMessage } from "@/components/wild/field";

export function StatusForm({
  bookId,
  status,
}: {
  bookId: string;
  status: BookStatus;
}) {
  const [state, formAction, pending] = useActionState(
    updateBookStatusAction,
    idleFormState,
  );

  useEffect(() => {
    if (state.status === "success") toast.success(state.message);
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="bookId" value={bookId} />
      <div role="group" aria-label="Status buku" className="flex flex-wrap gap-2">
        {STATUS_ORDER.map((option) => {
          const current = option === status;
          return (
            <button
              key={option}
              type="submit"
              name="status"
              value={option}
              disabled={current || pending}
              aria-current={current ? "true" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center border px-3 transition-colors",
                current
                  ? "border-ink bg-ink text-paper"
                  : "border-line text-ink hover:border-ink",
                pending && !current && "opacity-50",
              )}
            >
              <span className="label">{STATUS_LABEL[option]}</span>
            </button>
          );
        })}
      </div>
      <p className="label-sm text-muted-foreground">
        {pending
          ? "Menyimpan status..."
          : "Tanggal mulai dan selesai terisi otomatis mengikuti status."}
      </p>
      <FormMessage status={state.status} message={state.message} />
    </form>
  );
}
