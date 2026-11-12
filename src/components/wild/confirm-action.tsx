"use client";

import { useState, useTransition } from "react";
import { notifyDeleted } from "@/lib/notify";
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

/**
 * Confirmation for destructive actions. It is a real dialog rather than
 * `window.confirm`, so it can be closed with Escape and reads as part of the
 * page. The action runs only after the second click.
 */
export function ConfirmAction({
  triggerLabel,
  triggerClassName,
  title,
  description,
  confirmLabel,
  successMessage,
  action,
  hidden,
}: {
  triggerLabel: string;
  triggerClassName?: string;
  title: string;
  description: string;
  confirmLabel: string;
  successMessage: string;
  action: (formData: FormData) => Promise<void>;
  hidden: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const run = (formData: FormData) => {
    startTransition(async () => {
      await action(formData);
      setOpen(false);
      notifyDeleted(successMessage);
    });
  };

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
              "label-sm inline-flex min-h-11 items-center border border-line px-2.5 text-muted-foreground transition-colors hover:border-danger-fill hover:text-danger"
            }
          />
        }
      >
        {triggerLabel}
      </DialogTrigger>

      <DialogContent showCloseButton={!pending} className="sm:max-w-md">
        <PendingSweep active={pending} label="Sedang menghapus..." />
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form action={run} aria-busy={pending}>
          {Object.entries(hidden).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}

          <DialogFooter className="mt-5">
            <DialogClose
              render={<Button variant="ghost" type="button" disabled={pending} />}
            >
              Batal
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? (
                <>
                  <PixelSpinner />
                  <span>Menghapus...</span>
                </>
              ) : (
                confirmLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
