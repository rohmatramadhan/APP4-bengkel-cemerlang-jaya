import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BadgeStatus } from "@/components/BadgeStatus";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { tanggal } from "@/lib/format";
import { ambilProfilSaya } from "@/lib/profil";
import { createClient } from "@/lib/supabase/server";
import { FormKendaraan } from "../FormKendaraan";
import { FormPelanggan } from "../FormPelanggan";
import { TombolHapus } from "../TombolHapus";

// ponytail: riwayat dibatasi 50 WO terbaru; tambahkan paginasi bila ada pelanggan armada dengan ratusan WO.
// ponytail: history capped at the newest 50 WOs; add pagination if fleet customers reach hundreds of WOs.
const BATAS_RIWAYAT = 50;

export default async function RincianPelanggan({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profil = await ambilProfilSaya();
  const supabase = await createClient();

  // Tiga kueri independen dijalankan bersamaan / Three independent queries run in parallel
  const [{ data: pelanggan }, { data: kendaraan }, { data: riwayat }] = await Promise.all([
    supabase.from("customers").select("id, tipe, nama, telepon, email, alamat").eq("id", id).maybeSingle(),
    supabase
      .from("vehicles")
      .select("id, plat, merek_model, tahun, warna, transmisi")
      .eq("customer_id", id)
      .order("created_at"),
    supabase
      .from("work_orders")
      .select("id, nomor, status, created_at, vehicles(plat)")
      .eq("customer_id", id)
      .order("created_at", { ascending: false })
      .limit(BATAS_RIWAYAT),
  ]);

  // id yang bukan uuid juga berakhir di sini karena kuerinya gagal / Non-uuid ids also land here because the query fails
  if (!pelanggan) notFound();

  const bolehUbah = profil.peran === "admin" || profil.peran === "owner";

  return (
    <div className="space-y-6">
      <Link href="/pelanggan" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-text">
        <ArrowLeft className="size-4" />
        Daftar pelanggan
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{pelanggan.nama}</CardTitle>
          {bolehUbah && (
            <CardAction className="flex gap-1">
              <FormPelanggan pelanggan={pelanggan} />
              <TombolHapus jenis="pelanggan" id={pelanggan.id} nama={pelanggan.nama} sesudahnya="/pelanggan" />
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Tipe" isi={pelanggan.tipe === "perusahaan" ? "Perusahaan" : "Perorangan"} />
            <Info label="Telepon" isi={pelanggan.telepon} />
            <Info label="Email" isi={pelanggan.email} />
            <Info label="Alamat" isi={pelanggan.alamat} />
          </dl>
        </CardContent>
      </Card>

      <Tabs defaultValue="kendaraan">
        <TabsList>
          <TabsTrigger value="kendaraan">Kendaraan ({kendaraan?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="riwayat">Riwayat Servis</TabsTrigger>
        </TabsList>

        <TabsContent value="kendaraan" className="space-y-3">
          {bolehUbah && (
            <div className="flex justify-end">
              <FormKendaraan customerId={pelanggan.id} />
            </div>
          )}
          <Card className="py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Plat</TableHead>
                  <TableHead>Merek dan Model</TableHead>
                  <TableHead>Tahun</TableHead>
                  <TableHead>Warna</TableHead>
                  <TableHead>Transmisi</TableHead>
                  {bolehUbah && <TableHead className="pr-4 text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {kendaraan?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      Belum ada kendaraan.
                    </TableCell>
                  </TableRow>
                )}
                {kendaraan?.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="pl-4 font-medium">{k.plat}</TableCell>
                    <TableCell>{k.merek_model}</TableCell>
                    <TableCell className="tabular-nums">{k.tahun ?? "-"}</TableCell>
                    <TableCell>{k.warna ?? "-"}</TableCell>
                    <TableCell>{k.transmisi ?? "-"}</TableCell>
                    {bolehUbah && (
                      <TableCell className="pr-4 text-right">
                        <FormKendaraan customerId={pelanggan.id} kendaraan={k} />
                        <TombolHapus jenis="kendaraan" id={k.id} nama={k.plat} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="riwayat">
          <Card className="py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">No WO</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Plat</TableHead>
                  <TableHead className="pr-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riwayat?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      Belum ada riwayat servis.
                    </TableCell>
                  </TableRow>
                )}
                {riwayat?.map((wo) => (
                  <TableRow key={wo.id}>
                    <TableCell className="pl-4 font-medium">
                      <Link href={`/work-orders/${wo.id}`} className="text-primary hover:underline">
                        {wo.nomor}
                      </Link>
                    </TableCell>
                    <TableCell>{tanggal(wo.created_at)}</TableCell>
                    <TableCell>{wo.vehicles?.plat ?? "-"}</TableCell>
                    <TableCell className="pr-4">
                      <BadgeStatus status={wo.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Info({ label, isi }: { label: string; isi: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-text">{isi || "-"}</dd>
    </div>
  );
}
