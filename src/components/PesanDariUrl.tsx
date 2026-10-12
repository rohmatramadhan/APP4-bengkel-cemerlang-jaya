"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// Menampilkan pesan dari middleware (?pesan=...) lalu membersihkan URL / Shows the middleware's ?pesan=... message, then cleans the URL
export function PesanDariUrl() {
  const pesan = useSearchParams().get("pesan");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pesan !== "tidak-berhak") return;
    toast.error("Halaman ini tidak tersedia untuk peranmu", { id: pesan });
    router.replace(pathname);
  }, [pesan, pathname, router]);

  return null;
}
