// Format angka dan tanggal PRD 12.1, dipakai semua fitur / Number and date formats from PRD 12.1, shared by every feature

const fmtRupiah = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
const fmtRingkas = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });
const fmtTanggal = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

/** 12500000 → "Rp12.500.000" */
export function rupiah(nilai: number) {
  return `${nilai < 0 ? "-" : ""}Rp${fmtRupiah.format(Math.abs(nilai))}`;
}

/** 12500000 → "12,5 jt", untuk sumbu grafik / for chart axes */
export function rupiahRingkas(nilai: number) {
  return fmtRingkas.format(nilai);
}

/** "2026-10-07T03:00:00Z" atau "2026-10-07" → "7 Okt 2026" */
export function tanggal(iso: string) {
  return fmtTanggal.format(new Date(iso));
}
