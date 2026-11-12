import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSessionUser } from "@/lib/supabase/session";
import { Wordmark } from "@/components/shell/sidebar";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk · Marginalia",
};

export default async function LoginPage() {
  if (!isSupabaseConfigured) redirect("/");

  const user = await getSessionUser();
  if (user) redirect("/");

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col justify-between bg-ink px-6 py-10 text-paper md:px-12 md:py-14">
        <Wordmark onDark />
        <div className="mt-16 lg:mt-0">
          <p className="label-sm text-paper/60">Pelacak bacaan pribadi</p>
          <p className="display mt-4 max-w-md text-[clamp(34px,4.4vw,58px)] text-paper">
            Catatan pinggir untuk setiap buku yang kamu baca.
          </p>
          <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-paper/70">
            Progres halaman, rentetan hari, dan kutipan tersimpan dalam satu
            catatan yang rapi.
          </p>
        </div>
        <p className="label-sm mt-16 text-paper/70 lg:mt-0">
          Catatan pinggir buku
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-12 md:px-12">
        <div className="w-full max-w-sm">
          <p className="label text-muted-foreground">Masuk</p>
          <h1 className="display-2 mt-3 text-[32px]">Selamat membaca lagi.</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
            Masuk dengan email dan kata sandi yang kamu daftarkan.
          </p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
