import Link from "next/link";
import { cn } from "cn";
import { MotionToggle } from "@/components/wild/motion-toggle";
import { ThemeToggle } from "@/components/wild/theme-toggle";
import { BottomNav, SidebarNav } from "./nav-links";
import { SignOutButton } from "./sign-out-button";

export function Wordmark({
  compact = false,
  onDark = false,
}: {
  compact?: boolean;
  onDark?: boolean;
}) {
  return (
    <Link
      href="/"
      className="group inline-flex min-h-11 items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      aria-label="Marginalia, ke dashboard"
    >
      <span
        className={cn(
          "font-sans font-extrabold leading-none tracking-[-0.045em]",
          onDark ? "text-paper" : "text-ink",
          compact ? "text-[20px]" : "text-[26px]",
        )}
      >
        Marginalia
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "size-2 translate-y-[-2px]",
          onDark ? "bg-paper" : "bg-ink",
        )}
      />
    </Link>
  );
}

export function Sidebar({
  readerName,
  readerEmail,
  signedIn,
}: {
  readerName: string;
  readerEmail: string;
  signedIn: boolean;
}) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-line md:flex">
      <div className="border-b border-line px-7 py-7">
        <Wordmark />
        <p className="label-sm mt-3 text-muted-foreground">Catatan pinggir buku</p>
      </div>

      <nav aria-label="Navigasi utama" className="px-4 py-6">
        <SidebarNav />
      </nav>

      <div className="mt-auto border-t border-line px-7 py-6">
        <p className="label-sm text-muted-foreground">Pembaca</p>
        <p className="mt-1.5 truncate font-sans text-[15px] font-semibold tracking-[-0.01em]">
          {readerName}
        </p>
        <p className="truncate font-mono text-[11px] text-muted-foreground">
          {readerEmail}
        </p>
        {signedIn ? (
          <div className="mt-4">
            <SignOutButton />
          </div>
        ) : null}
        <div className="mt-3 flex flex-col gap-2">
          <ThemeToggle />
          <MotionToggle />
        </div>
      </div>
    </aside>
  );
}

export function MobileTopBar() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper px-5 py-3 md:hidden">
      <Wordmark compact />
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <MotionToggle />
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper md:hidden"
    >
      <BottomNav />
    </nav>
  );
}
