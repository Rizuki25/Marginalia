export interface NavItem {
  href: string;
  label: string;
  index: string;
  enabled: boolean;
}

// Every entry has a real page behind it. A nav item with no destination is a
// dead control, so a section is added here only once its route exists.
export const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", index: "01", enabled: true },
  { href: "/books", label: "Koleksi", index: "02", enabled: true },
  { href: "/quotes", label: "Quotes", index: "03", enabled: true },
  { href: "/logs", label: "Riwayat", index: "04", enabled: true },
];
