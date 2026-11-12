"use client";

import { useEffect, useRef } from "react";
import type { FormState } from "@/lib/form-state";

/**
 * Runs a one-shot callback when a Server Action FormState transitions to
 * "success", guarding against duplicate triggers across re-renders.
 */
export function useActionSuccess(
  state: FormState,
  onSuccess: (message: string) => void,
) {
  const handledRef = useRef<FormState | null>(null);
  const callbackRef = useRef(onSuccess);

  useEffect(() => {
    callbackRef.current = onSuccess;
  });

  useEffect(() => {
    if (state.status !== "success") return;
    if (handledRef.current === state) return;
    handledRef.current = state;
    callbackRef.current(state.message);
  }, [state]);
}
