import { signOutAction } from "@/lib/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="label-sm border border-line px-2 py-1 text-muted-foreground transition-colors hover:border-ink hover:text-ink"
      >
        Keluar
      </button>
    </form>
  );
}
