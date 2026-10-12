/**
 * Daftar menu sidebar (PRD 4.2) dan halaman yang boleh dibuka tiap peran (PRD 4).
 * Dibaca middleware untuk route guard, jadi jangan mengimpor komponen React di sini.
 *
 * Sidebar menu (PRD 4.2) and the pages each role may open (PRD 4).
 * Read by the middleware for the route guard, so do not import React components here.
 */

export const PERAN = ["owner", "admin", "kepala_mekanik"] as const;
export type Peran = (typeof PERAN)[number];

export const LABEL_PERAN: Record<Peran, string> = {
  owner: "Owner",
  admin: "Admin",
  kepala_mekanik: "Kepala Mekanik",
};

export function isPeran(nilai: string | null | undefined): nilai is Peran {
  return PERAN.includes(nilai as Peran);
}

const SEMUA: readonly Peran[] = PERAN;
const ADMIN_OWNER: readonly Peran[] = ["admin", "owner"];
const OWNER: readonly Peran[] = ["owner"];

export const MENU: { href: string; label: string; peran: readonly Peran[] }[] = [
  { href: "/dashboard", label: "Dashboard", peran: SEMUA },
  { href: "/work-orders", label: "Work Order", peran: SEMUA },
  { href: "/pelanggan", label: "Pelanggan", peran: SEMUA },
  { href: "/inventory", label: "Inventory", peran: SEMUA },
  { href: "/tim-mekanik", label: "Tim Mekanik", peran: SEMUA },
  { href: "/laporan-laba", label: "Laporan Laba", peran: OWNER },
  { href: "/audit-log", label: "Audit Log", peran: OWNER },
  { href: "/pengguna", label: "Pengguna", peran: OWNER },
  { href: "/setelan", label: "Setelan Bengkel", peran: OWNER },
];

// Urutan penting: "/work-orders/baru" harus di atas "/work-orders/[id]" karena "[id]" juga cocok dengan "baru".
// Order matters: "/work-orders/baru" must precede "/work-orders/[id]" because "[id]" also matches "baru".
const HALAMAN: { pola: string; peran: readonly Peran[] }[] = [
  { pola: "/dashboard", peran: SEMUA },
  { pola: "/work-orders", peran: SEMUA },
  { pola: "/work-orders/baru", peran: ADMIN_OWNER },
  { pola: "/work-orders/[id]", peran: SEMUA },
  // Kepala Mekanik hanya WO timnya: dijaga RLS, bukan di sini / Team-only access is enforced by RLS, not here
  { pola: "/work-orders/[id]/tagihan", peran: SEMUA },
  { pola: "/work-orders/[id]/invoice", peran: ADMIN_OWNER },
  { pola: "/pelanggan", peran: SEMUA },
  { pola: "/pelanggan/[id]", peran: SEMUA },
  { pola: "/inventory", peran: SEMUA },
  { pola: "/tim-mekanik", peran: SEMUA },
  { pola: "/laporan-laba", peran: OWNER },
  { pola: "/audit-log", peran: OWNER },
  { pola: "/pengguna", peran: OWNER },
  { pola: "/setelan", peran: OWNER },
];

const POLA = HALAMAN.map((h) => ({
  regex: new RegExp(`^${h.pola.replace(/\[[^\]]+\]/g, "[^/]+")}/?$`),
  peran: h.peran,
}));

/** null berarti alamat itu bukan halaman aplikasi / null means the path is not an app page */
export function peranUntukHalaman(pathname: string): readonly Peran[] | null {
  return POLA.find((p) => p.regex.test(pathname))?.peran ?? null;
}

export function menuUntuk(peran: Peran) {
  return MENU.filter((m) => m.peran.includes(peran));
}
