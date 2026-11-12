"use client";

import { useActionState } from "react";
import { cn } from "cn";
import { saveBookReviewAction } from "@/lib/actions-books";
import { idleFormState } from "@/lib/form-state";
import { notifyUpdated } from "@/lib/notify";
import { useActionSuccess } from "@/lib/use-action-feedback";
import { Button } from "@/components/ui/button";
import { PendingSweep, PixelSpinner } from "@/components/wild/feedback-popup";
import { Field, FormMessage, TextArea } from "@/components/wild/field";

export function ReviewForm({
  bookId,
  rating,
  review,
}: {
  bookId: string;
  rating: number | null;
  review: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    saveBookReviewAction,
    idleFormState,
  );

  useActionSuccess(state, (message) => {
    notifyUpdated(message);
  });

  const options: Array<{ value: string; label: string }> = [
    { value: "", label: "Tanpa rating" },
    ...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} bintang` })),
  ];

  return (
    <form action={formAction} aria-busy={pending} className="flex flex-col gap-5">
      <input type="hidden" name="bookId" value={bookId} />
      <PendingSweep active={pending} label="Menyimpan ulasan..." />

      <fieldset>
        <legend className="label text-ink">Rating</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {options.map((option) => (
            <label
              key={option.value}
              className={cn(
                "inline-flex min-h-11 cursor-pointer items-center gap-2 border px-3 transition-colors",
                "border-line text-ink hover:border-ink",
                "has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink",
              )}
            >
              <input
                type="radio"
                name="rating"
                value={option.value}
                defaultChecked={
                  option.value === (rating === null ? "" : String(rating))
                }
                className="sr-only"
              />
              {option.value ? (
                <span aria-hidden="true" className="text-[13px] leading-none">
                  ★
                </span>
              ) : null}
              <span className="label">{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Ulasan" hint="opsional" htmlFor="review-text">
        <TextArea
          id="review-text"
          name="review"
          rows={4}
          maxLength={2000}
          defaultValue={review ?? ""}
          placeholder="Apa yang paling membekas dari buku ini?"
        />
      </Field>

      <FormMessage status={state.status} message={state.message} />

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <PixelSpinner />
              <span>Menyimpan...</span>
            </>
          ) : (
            "Simpan ulasan"
          )}
        </Button>
      </div>
    </form>
  );
}
