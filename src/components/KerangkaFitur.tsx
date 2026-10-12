import { Construction } from "lucide-react";

/**
 * Penanda halaman fitur yang belum dibangun (PRD 15.4). Pemilik fitur mengganti
 * seluruh isi halaman, termasuk komponen ini, tanpa memindahkan alamatnya.
 *
 * Placeholder for a feature page that is not built yet (PRD 15.4). The feature owner
 * replaces the whole page, including this component, without moving its route.
 */
export function KerangkaFitur({
  fitur,
  judul,
  rujukan,
}: {
  fitur: "A" | "B" | "C" | "D";
  judul: string;
  rujukan: string;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text">{judul}</h1>
      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-warning bg-warning/5 px-6 py-16 text-center">
        <Construction className="size-10 text-warning" aria-hidden />
        <p className="text-lg font-semibold text-text">Halaman ini belum dibangun</p>
        <p className="text-sm text-text-body">
          Fitur {fitur} · PRD {rujukan}
        </p>
      </div>
    </div>
  );
}
