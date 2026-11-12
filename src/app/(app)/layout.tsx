import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSessionUser } from "@/lib/supabase/session";
import {
  MobileBottomNav,
  MobileTopBar,
  Sidebar,
} from "@/components/shell/sidebar";
import { FlashToast } from "@/components/wild/flash-toast";

/**
 * The reader identity is all the shell needs. How the data is stored stays out
 * of the interface: a reader sees one product, not the stack behind it.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  let readerName = "Pembaca";
  let readerEmail = "pembaca@marginalia.app";
  let signedIn = false;

  if (isSupabaseConfigured) {
    const user = await getSessionUser();
    if (!user) redirect("/login");

    readerName = user.name;
    readerEmail = user.email;
    signedIn = true;
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar
        readerName={readerName}
        readerEmail={readerEmail}
        signedIn={signedIn}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar signedIn={signedIn} />
        <main className="flex-1 pb-24 md:pb-0">{children}</main>
      </div>
      <MobileBottomNav />
      <FlashToast />
    </div>
  );
}
