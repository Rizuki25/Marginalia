import { signOutAction } from "@/lib/actions";

/**
 * Sign out.
 *
 * `iconOnly` is for the mobile top bar, where three labelled buttons do not fit
 * in 390px. The accessible name moves to `aria-label`, so the control keeps
 * working for screen readers and keyboard users.
 */
export function SignOutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  if (iconOnly) {
    return (
      <form action={signOutAction}>
        <button
          type="submit"
          aria-label="Keluar dari akun"
          title="Keluar"
          className="inline-flex size-11 items-center justify-center border border-line text-muted-foreground transition-colors hover:border-ink hover:text-ink"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="square"
          >
            <path d="M15 4H5v16h10" />
            <path d="M14 12h7" />
            <path d="m18 9 3 3-3 3" />
          </svg>
        </button>
      </form>
    );
  }

  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="label-sm inline-flex min-h-11 items-center border border-line px-2.5 text-muted-foreground transition-colors hover:border-ink hover:text-ink"
      >
        Keluar
      </button>
    </form>
  );
}
