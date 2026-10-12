import { Badge } from "@/components/ui/badge";
import { isStatusWO, STATUS_WO } from "@/lib/status-wo";

// Titik berwarna + teks gelap: warna abu dan kuning tidak terbaca sebagai latar teks putih.
// Colored dot + dark text: the grey and yellow statuses are unreadable behind white text.
export function BadgeStatus({ status }: { status: string }) {
  const info = isStatusWO(status) ? STATUS_WO[status] : { label: status, warna: "var(--text-muted)" };

  return (
    <Badge variant="outline" className="gap-1.5 bg-card text-text">
      <span className="size-2 rounded-full" style={{ backgroundColor: info.warna }} aria-hidden />
      {info.label}
    </Badge>
  );
}
