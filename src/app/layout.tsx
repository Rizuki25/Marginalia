import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Lora, Playfair_Display } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { PixelCursor } from "@/components/wild/pixel-cursor";
import { THEME_SCRIPT } from "@/components/wild/theme-script";
import "./globals.css";

// Sneak is not available as a free webfont, so Archivo carries the display
// voice: heavy, tight, Swiss. IBM Plex Mono handles labels, numbers and meta
// because a reading log is a ledger.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair-raw",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora-raw",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Marginalia · Pelacak bacaan",
  description:
    "Catat progres bacaan harian, simpan kutipan, dan jaga kebiasaan membaca.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      data-motion="on"
      data-theme="system"
      // The blocking theme script sets `class` and `data-theme` before React
      // hydrates, so those two attributes legitimately differ from the
      // server HTML.
      suppressHydrationWarning
      className={`${archivo.variable} ${plexMono.variable} ${playfair.variable} ${lora.variable} h-full antialiased`}
    >
      <head>
        <script
          // Raw string, injected by the server: it must run before paint and
          // must not be a React-managed script node.
          dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
        />
      </head>
      <body className="min-h-full bg-paper text-ink">
        <PixelCursor />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
