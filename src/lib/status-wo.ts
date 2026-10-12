// Status WO PRD 7.1. Warna diambil dari CSS variable di globals.css / WO statuses from PRD 7.1; colors come from the CSS variables in globals.css

export const STATUS_WO = {
  menunggu: { label: "Menunggu", warna: "var(--status-menunggu)" },
  dikerjakan: { label: "Dikerjakan", warna: "var(--status-dikerjakan)" },
  tertunda: { label: "Tertunda", warna: "var(--status-tertunda)" },
  selesai: { label: "Selesai Dikerjakan", warna: "var(--status-selesai)" },
  siap_diambil: { label: "Siap Diambil", warna: "var(--status-siap-diambil)" },
  diambil: { label: "Diambil", warna: "var(--status-diambil)" },
  dibatalkan: { label: "Dibatalkan", warna: "var(--status-dibatalkan)" },
} as const;

export type StatusWO = keyof typeof STATUS_WO;

export function isStatusWO(nilai: string): nilai is StatusWO {
  return nilai in STATUS_WO;
}
