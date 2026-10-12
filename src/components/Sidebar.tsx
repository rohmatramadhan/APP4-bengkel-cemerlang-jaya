"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardList,
  HardHat,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ScrollText,
  Settings,
  TrendingUp,
  UserCog,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LABEL_PERAN, menuUntuk, type Peran } from "@/lib/peran";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// Ikon disimpan di sini, bukan di peran.ts, agar middleware tidak ikut memuat lucide-react.
// Icons live here, not in peran.ts, so the middleware does not bundle lucide-react.
const IKON: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/work-orders": ClipboardList,
  "/pelanggan": Users,
  "/inventory": Package,
  "/tim-mekanik": HardHat,
  "/laporan-laba": TrendingUp,
  "/audit-log": ScrollText,
  "/pengguna": UserCog,
  "/setelan": Settings,
};

type Props = { namaBengkel: string; logoUrl: string | null; nama: string; peran: Peran };

export function Sidebar(props: Props) {
  const [menuBuka, setMenuBuka] = useState(false);

  return (
    <>
      <aside className="sticky top-0 hidden h-dvh border-r bg-sidebar md:flex">
        <IsiSidebar {...props} />
      </aside>

      {/* Layar sempit: menu di dalam Sheet / Narrow screens: the menu lives inside a Sheet */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-sidebar px-4 py-3 md:hidden">
        <Sheet open={menuBuka} onOpenChange={setMenuBuka}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Buka menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-sidebar p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <IsiSidebar {...props} onPilih={() => setMenuBuka(false)} />
          </SheetContent>
        </Sheet>
        <span className="font-semibold">{props.namaBengkel}</span>
      </header>
    </>
  );
}

function IsiSidebar({ namaBengkel, logoUrl, nama, peran, onPilih }: Props & { onPilih?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  async function keluar() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex w-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- logo dari bucket publik, sudah diperkecil saat unggah
          <img src={logoUrl} alt="" className="size-9 rounded-lg object-cover" />
        ) : (
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wrench className="size-5" />
          </div>
        )}
        <span className="text-sm leading-tight font-semibold text-text">{namaBengkel}</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {menuUntuk(peran).map((menu) => {
          const Ikon = IKON[menu.href];
          const aktif = pathname === menu.href || pathname.startsWith(`${menu.href}/`);
          return (
            <Link
              key={menu.href}
              href={menu.href}
              onClick={onPilih}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-primary-soft/60",
                aktif && "bg-primary-soft text-primary-strong",
              )}
            >
              <Ikon className="size-4" />
              {menu.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-5 py-4">
        <p className="truncate text-sm font-medium text-text">{nama}</p>
        <p className="text-xs text-muted-foreground">{LABEL_PERAN[peran]}</p>
        <Button variant="outline" size="sm" className="mt-3 w-full" onClick={keluar}>
          <LogOut />
          Keluar
        </Button>
      </div>
    </div>
  );
}
