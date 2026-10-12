import Link from "next/link";
import { Search } from "lucide-react";
import { Paginasi } from "@/components/Paginasi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { tanggal } from "@/lib/format";
import { ambilProfilSaya } from "@/lib/profil";
import { createClient } from "@/lib/supabase/server";
import { FormPelanggan } from "./FormPelanggan";

const PER_HALAMAN = 20;

export default async function HalamanPelanggan({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; hal?: string }>;
}) {
  const { q = "", hal } = await searchParams;
  const halaman = Math.max(1, Number(hal) || 1);
  // Koma, kurung, dan bintang punya arti khusus di filter .or() PostgREST / Commas, parentheses and asterisks are syntax inside PostgREST .or()
  const cari = q.replace(/[,()*%\\]/g, " ").trim();

  const profil = await ambilProfilSaya();
  const supabase = await createClient();

  // Hanya kolom yang tampil. Jumlah kendaraan dihitung database, servis terakhir cukup 1 WO terbaru per pelanggan.
  // Only displayed columns. Vehicle count is computed by the database; last service needs just the newest WO per customer.
  let kueri = supabase
    .from("customers")
    .select("id, nama, telepon, vehicles(count), work_orders(created_at)", { count: "exact" });

  if (cari) {
    // Pencarian plat lewat tabel vehicles, lalu digabung dengan nama dan telepon / Plate search goes through vehicles, then joins name and phone
    const { data: cocokPlat } = await supabase
      .from("vehicles")
      .select("customer_id")
      .ilike("plat", `%${cari}%`)
      .limit(50);
    const syarat = [`nama.ilike.%${cari}%`, `telepon.ilike.%${cari}%`];
    const ids = [...new Set((cocokPlat ?? []).map((v) => v.customer_id))];
    if (ids.length) syarat.push(`id.in.(${ids.join(",")})`);
    kueri = kueri.or(syarat.join(","));
  }

  const { data: pelanggan, count, error } = await kueri
    .order("nama")
    .order("created_at", { referencedTable: "work_orders", ascending: false })
    .limit(1, { referencedTable: "work_orders" })
    .range((halaman - 1) * PER_HALAMAN, halaman * PER_HALAMAN - 1);

  const bolehUbah = profil.peran === "admin" || profil.peran === "owner";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-text">Pelanggan</h1>
        {bolehUbah && <FormPelanggan />}
      </div>

      <form className="flex max-w-md gap-2" role="search">
        <Input name="q" defaultValue={q} placeholder="Cari nama, telepon, atau plat" aria-label="Cari pelanggan" />
        <Button type="submit" variant="outline">
          <Search />
          Cari
        </Button>
      </form>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Nama</TableHead>
              <TableHead>Telepon</TableHead>
              <TableHead className="text-right">Jumlah Kendaraan</TableHead>
              <TableHead className="pr-4">Servis Terakhir</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {error && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-danger">
                  Data pelanggan gagal dimuat. Muat ulang halaman ini.
                </TableCell>
              </TableRow>
            )}
            {!error && pelanggan?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  {cari ? `Tidak ada pelanggan yang cocok dengan "${cari}".` : "Belum ada pelanggan."}
                </TableCell>
              </TableRow>
            )}
            {pelanggan?.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="pl-4 font-medium">
                  <Link href={`/pelanggan/${p.id}`} className="text-primary hover:underline">
                    {p.nama}
                  </Link>
                </TableCell>
                <TableCell className="tabular-nums">{p.telepon}</TableCell>
                <TableCell className="text-right tabular-nums">{p.vehicles[0]?.count ?? 0}</TableCell>
                <TableCell className="pr-4">
                  {p.work_orders[0] ? tanggal(p.work_orders[0].created_at) : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Paginasi halaman={halaman} totalBaris={count ?? 0} perHalaman={PER_HALAMAN} params={{ q: cari }} />
    </div>
  );
}
