"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { navItems } from "./nav-items";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col">
      {navItems.map((item) => {
        if (!item.enabled) {
          return (
            <li key={item.href}>
              <span
                aria-disabled="true"
                className="flex min-h-11 items-center gap-3 border border-transparent px-3 py-3 text-muted-foreground"
              >
                <span className="num text-[10px]">{item.index}</span>
                <span className="label">{item.label}</span>
                <span className="label-sm ml-auto border border-line px-1.5 py-0.5 text-[9px]">
                  Segera
                </span>
              </span>
            </li>
          );
        }

        const active = isActive(pathname, item.href);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 border px-3 py-3 transition-colors",
                active
                  ? "border-ink bg-ink text-paper"
                  : "border-transparent text-ink hover:bg-ink/[0.06]",
              )}
            >
              <span
                className={cn(
                  "num text-[10px]",
                  active ? "text-paper/60" : "text-muted-foreground",
                )}
              >
                {item.index}
              </span>
              <span className="label">{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <ul className="grid grid-cols-4">
      {navItems.map((item) => {
        if (!item.enabled) {
          return (
            <li key={item.href}>
              <span
                aria-disabled="true"
                className="flex h-16 flex-col items-center justify-center gap-1 border-t-2 border-transparent text-muted-foreground"
              >
                <span className="num text-[9px]">{item.index}</span>
                <span className="label text-[10px]">{item.label}</span>
              </span>
            </li>
          );
        }

        const active = isActive(pathname, item.href);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 border-t-2",
                active
                  ? "border-ink text-ink"
                  : "border-transparent text-muted-foreground",
              )}
            >
              <span className="num text-[9px]">{item.index}</span>
              <span className={cn("label text-[10px]", active && "text-ink")}>
                {item.label}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
