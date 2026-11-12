"use client";

import { useActionState, useState } from "react";
import { cn } from "cn";
import { updateBookStatusAction } from "@/lib/actions-books";
import { idleFormState } from "@/lib/form-state";
import { notifyUpdated } from "@/lib/notify";
import { useActionSuccess } from "@/lib/use-action-feedback";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/status";
import type { BookStatus } from "@/lib/types";
import { PendingSweep, PixelSpinner } from "@/components/wild/feedback-popup";
import { FormMessage } from "@/components/wild/field";

export function StatusForm({
  bookId,
  status,
}: {
  bookId: string;
  status: BookStatus;
}) {
  const [targetStatus, setTargetStatus] = useState<BookStatus | null>(null);
  const [state, formAction, pending] = useActionState(
    updateBookStatusAction,
    idleFormState,
  );

  useActionSuccess(state, (message) => {
    setTargetStatus(null);
    notifyUpdated(message);
  });

  return (
    <form action={formAction} aria-busy={pending} className="flex flex-col gap-3">
      <input type="hidden" name="bookId" value={bookId} />
      <PendingSweep active={pending} label="Mengubah status buku..." />
      <div role="group" aria-label="Status buku" className="flex flex-wrap gap-2">
        {STATUS_ORDER.map((option) => {
          const current = option === status;
          const activeTarget = pending && targetStatus === option;
          return (
            <button
              key={option}
              type="submit"
              name="status"
              value={option}
              disabled={current || pending}
              aria-current={current ? "true" : undefined}
              onClick={() => setTargetStatus(option)}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 border px-3 transition-colors",
                current
                  ? "border-ink bg-ink text-paper"
                  : "border-line text-ink hover:border-ink",
                pending && !current && !activeTarget && "opacity-50",
              )}
            >
              {activeTarget ? <PixelSpinner /> : null}
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
