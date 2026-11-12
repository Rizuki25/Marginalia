"use client";

import { useActionState, useState } from "react";
import { signInAction, signUpAction } from "@/lib/actions";
import { idleFormState, type FormState } from "@/lib/form-state";
import { Field, FormMessage, TextInput } from "@/components/wild/field";

type Mode = "signin" | "signup";

export function LoginForm() {
  const [mode, setMode] = useState<Mode>("signin");

  return (
    <div className="mt-8">
      <div className="flex border border-ink" role="group" aria-label="Pilih mode akun">
        <button
          type="button"
          onClick={() => setMode("signin")}
          aria-pressed={mode === "signin"}
          className={
            mode === "signin"
              ? "label h-10 flex-1 bg-ink text-paper"
              : "label h-10 flex-1 bg-paper text-ink hover:bg-ink/5"
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
              ? "label h-10 flex-1 border-l border-ink bg-ink text-paper"
              : "label h-10 flex-1 border-l border-ink bg-paper text-ink hover:bg-ink/5"
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

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-5">
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
        className="inline-flex h-11 items-center justify-center rounded-[6px] border border-ink bg-neon px-5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-on-accent transition-colors hover:bg-[#c6eb00] disabled:opacity-40"
      >
        {pending
          ? "Memproses..."
          : mode === "signin"
            ? "Masuk ke dashboard"
            : "Buat akun"}
      </button>
    </form>
  );
}
