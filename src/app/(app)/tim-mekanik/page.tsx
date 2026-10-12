import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ambilProfilSaya } from "@/lib/profil";
import { createClient } from "@/lib/supabase/server";
import { FormMekanik } from "./FormMekanik";

// Definisi "WO aktif" sama dengan dashboard_beban_mekanik di dashboard.sql / Same "active WO" definition as dashboard_beban_mekanik
const STATUS_AKTIF = ["dikerjakan", "tertunda", "selesai"];

export default async function HalamanTimMekanik() {
  const profil = await ambilProfilSaya();
  const supabase = await createClient();

  const [{ data: kepala }, { data: mekanik }, { data: penugasan }] = await Promise.all([
    supabase.from("profiles").select("id, nama").eq("role", "kepala_mekanik").eq("aktif", true).order("nama"),
    supabase.from("mekanik").select("id, nama, aktif, kepala_mekanik_id").order("nama"),
    // Hanya penugasan di WO aktif; jumlahnya dibatasi kapasitas bengkel, bukan umur data.
    // Only assignments on active WOs; bounded by workshop capacity, not by data age.
    supabase
      .from("work_order_mekanik")
      .select("mekanik_id, work_orders!inner(status)")
      .in("work_orders.status", STATUS_AKTIF),
  ]);

  const woAktif = new Map<string, number>();
  penugasan?.forEach((p) => woAktif.set(p.mekanik_id, (woAktif.get(p.mekanik_id) ?? 0) + 1));

  const tim = kepala ?? [];
  // Owner mengelola semua tim; Kepala Mekanik hanya timnya sendiri (dijaga juga oleh RLS mekanik_ubah).
  // Owner manages every team; a Kepala Mekanik only their own (also enforced by the mekanik_ubah RLS policy).
  const bolehKelola = (kepalaId: string) =>
    profil.peran === "owner" || (profil.peran === "kepala_mekanik" && profil.id === kepalaId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text">Tim Mekanik</h1>

      {tim.length === 0 && <p className="text-sm text-muted-foreground">Belum ada Kepala Mekanik yang aktif.</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        {tim.map((k) => {
          const anggota = (mekanik ?? []).filter((m) => m.kepala_mekanik_id === k.id);
          return (
            <Card key={k.id}>
              <CardHeader>
                <CardTitle>Tim {k.nama}</CardTitle>
                {bolehKelola(k.id) && (
                  <CardAction>
                    <FormMekanik kepalaId={k.id} />
                  </CardAction>
                )}
              </CardHeader>
              <CardContent>
                {anggota.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada mekanik di tim ini.</p>
                ) : (
                  <ul className="divide-y">
                    {anggota.map((m) => (
                      <li key={m.id} className="flex items-center gap-3 py-2.5">
                        <span className={m.aktif ? "flex-1 font-medium" : "flex-1 text-muted-foreground line-through"}>
                          {m.nama}
                        </span>
                        {!m.aktif && <Badge variant="outline">Nonaktif</Badge>}
                        <Badge variant="secondary" className="tabular-nums">
                          {woAktif.get(m.id) ?? 0} WO aktif
                        </Badge>
                        {bolehKelola(k.id) && (
                          <FormMekanik
                            kepalaId={k.id}
                            mekanik={m}
                            pilihanTim={profil.peran === "owner" ? tim : undefined}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
