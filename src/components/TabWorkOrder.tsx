"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Tab "Rincian | Tagihan" di rincian WO. Dua alamat terpisah supaya Fitur A
 * dan Fitur B tidak mengubah file yang sama (PRD 6.8).
 *
 * The "Rincian | Tagihan" tabs on a WO. Two separate routes so that Feature A
 * and Feature B never edit the same file (PRD 6.8).
 */
export function TabWorkOrder({ id }: { id: string }) {
  const pathname = usePathname();
  const tab = [
    { href: `/work-orders/${id}`, label: "Rincian" },
    { href: `/work-orders/${id}/tagihan`, label: "Tagihan" },
  ];

  return (
    <nav className="inline-flex rounded-lg bg-muted p-1" aria-label="Bagian work order">
      {tab.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={pathname === t.href ? "page" : undefined}
          className={cn(
            "rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-text",
            pathname === t.href && "bg-card text-primary shadow-card",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
