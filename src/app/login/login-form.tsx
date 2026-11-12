"use client";

import { useActionState, useState, useTransition } from "react";
import { signInAction, signUpAction } from "@/lib/actions";
import { signInWithGoogleAction } from "@/lib/actions-auth";
import { idleFormState, type FormState } from "@/lib/form-state";
import { notifyAdded } from "@/lib/notify";
import { useActionSuccess } from "@/lib/use-action-feedback";
import { PendingSweep, PixelSpinner } from "@/components/wild/feedback-popup";
import { Field, FormMessage, TextInput } from "@/components/wild/field";

type Mode = "signin" | "signup";

function GoogleIcon() {
  // The four-colour G, drawn inline so there is no extra image request.
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"
      />
    </svg>
  );
}

export function LoginForm({ errorMessage }: { errorMessage: string | null }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [googlePending, startGoogleTransition] = useTransition();

  return (
    <div className="mt-8">
      {errorMessage ? (
        <p
          role="alert"
          className="mb-5 border-l-2 border-danger-fill pl-3 text-[13px] leading-snug text-danger"
        >
          {errorMessage}
        </p>
      ) : null}

      <form
        action={() => {
          startGoogleTransition(async () => {
            await signInWithGoogleAction();
          });
        }}
        aria-busy={googlePending}
      >
        <button
          type="submit"
          disabled={googlePending}
          className="inline-flex h-11 w-full items-center justify-center gap-2.5 border border-ink bg-paper font-sans text-[14px] font-medium text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-50"
        >
          {googlePending ? <PixelSpinner /> : <GoogleIcon />}
          {googlePending ? "Mengarahkan ke Google..." : "Lanjutkan dengan Google"}
        </button>
      </form>

      <div className="mt-6 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        <span className="label-sm text-muted-foreground">atau</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="flex border border-ink" role="group" aria-label="Pilih mode akun">
        <button
          type="button"
          onClick={() => setMode("signin")}
          aria-pressed={mode === "signin"}
          className={
            mode === "signin"
              ? "label h-11 flex-1 bg-ink text-paper"
              : "label h-11 flex-1 bg-paper text-ink hover:bg-ink/5"
          }
        >
          Masuk
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          aria-pressed={mode === "signup"}
          className={
            mode === "signup"
              ? "label h-11 flex-1 border-l border-ink bg-ink text-paper"
              : "label h-11 flex-1 border-l border-ink bg-paper text-ink hover:bg-ink/5"
          }
        >
          Daftar
        </button>
      </div>

      <AuthForm key={mode} mode={mode} />
    </div>
  );
}

function AuthForm({ mode }: { mode: Mode }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    mode === "signin" ? signInAction : signUpAction,
    idleFormState,
  );

  useActionSuccess(state, (message) => {
    notifyAdded(message, "Akun dibuat");
  });

  return (
    <form action={formAction} aria-busy={pending} className="mt-6 flex flex-col gap-5">
      <PendingSweep active={pending} label="Memproses autentikasi..." />
      {mode === "signup" ? (
        <Field label="Nama" htmlFor="auth-name">
          <TextInput
            id="auth-name"
            name="name"
            autoComplete="name"
            required
            placeholder="Nama kamu"
          />
        </Field>
      ) : null}

      <Field label="Email" htmlFor="auth-email">
        <TextInput
          id="auth-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="nama@email.com"
        />
      </Field>

      <Field
        label="Kata sandi"
        hint={mode === "signup" ? "min. 6 karakter" : undefined}
        htmlFor="auth-password"
      >
        <TextInput
          id="auth-password"
          name="password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          minLength={6}
          required
          placeholder="••••••••"
        />
      </Field>

      <FormMessage status={state.status} message={state.message} />

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-[6px] border border-ink bg-neon px-5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-on-accent transition-colors hover:bg-[#c6eb00] disabled:opacity-40"
      >
        {pending ? (
          <>
            <PixelSpinner />
            <span>Memproses...</span>
          </>
        ) : mode === "signin" ? (
          "Masuk ke dashboard"
        ) : (
          "Buat akun"
        )}
      </button>
    </form>
  );
}
