"use client";

import { toast } from "sonner";
import {
  FeedbackPopup,
  type FeedbackKind,
} from "@/components/wild/feedback-popup";

const DEFAULT_DURATION = 4200;

function showFeedback(
  kind: FeedbackKind,
  message: string,
  title?: string,
  duration = DEFAULT_DURATION,
) {
  return toast.custom(
    (toastId) => (
      <FeedbackPopup
        toastId={toastId}
        kind={kind}
        title={title}
        message={message}
        duration={duration}
      />
    ),
    { duration },
  );
}

export function notifyAdded(message: string, title = "Berhasil ditambahkan") {
  return showFeedback("added", message, title);
}

export function notifyUpdated(message: string, title = "Berhasil diperbarui") {
  return showFeedback("updated", message, title);
}

export function notifyDeleted(message: string, title = "Berhasil dihapus") {
  return showFeedback("deleted", message, title);
}

export function notifyDownloaded(message: string, title = "Berhasil diunduh") {
  return showFeedback("downloaded", message, title);
}

export function notifyError(message: string, title = "Gagal memproses") {
  return showFeedback("error", message, title, 5200);
}
