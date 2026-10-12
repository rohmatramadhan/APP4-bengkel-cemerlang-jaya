"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";

const tahunMaks = new Date().getFullYear() + 1;

const skema = z.object({
  plat: z.string().trim().min(1, "Plat nomor wajib diisi"),
  merek_model: z.string().trim().min(1, "Merek dan model wajib diisi"),
  tahun: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || (/^\d{4}$/.test(v) && Number(v) >= 1980 && Number(v) <= tahunMaks),
      `Tahun antara 1980 dan ${tahunMaks}`,
    ),
  warna: z.string().trim(),
  transmisi: z.enum(["AT", "MT"]).optional(),
});
type DataKendaraan = z.infer<typeof skema>;

type Kendaraan = Pick<Tables<"vehicles">, "id" | "plat" | "merek_model" | "tahun" | "warna" | "transmisi">;

// Sama dengan trigger rapikan_plat; dipakai untuk mencari pemilik plat yang bentrok.
// Mirrors the rapikan_plat trigger; used to look up the owner of a clashing plate.
const rapikanPlat = (plat: string) => plat.trim().replace(/\s+/g, " ").toUpperCase();

export function FormKendaraan({ customerId, kendaraan }: { customerId: string; kendaraan?: Kendaraan }) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const form = useForm<DataKendaraan>({
    resolver: zodResolver(skema),
    defaultValues: {
      plat: kendaraan?.plat ?? "",
      merek_model: kendaraan?.merek_model ?? "",
      tahun: kendaraan?.tahun ? String(kendaraan.tahun) : "",
      warna: kendaraan?.warna ?? "",
      transmisi: kendaraan?.transmisi === "AT" || kendaraan?.transmisi === "MT" ? kendaraan.transmisi : undefined,
    },
  });

  async function simpan(data: DataKendaraan) {
    const supabase = createClient();
    const plat = rapikanPlat(data.plat);
    const baris = {
      customer_id: customerId,
      plat,
      merek_model: data.merek_model,
      tahun: data.tahun ? Number(data.tahun) : null,
      warna: data.warna || null,
      transmisi: data.transmisi ?? null,
    };

    const { error } = kendaraan
      ? await supabase.from("vehicles").update(baris).eq("id", kendaraan.id)
      : await supabase.from("vehicles").insert(baris);

    if (error) {
      if (error.code === "23505") {
        // Pesan PRD 6.3 menyebut nama pemilik plat / The PRD 6.3 message names the plate's owner
        const { data: pemilik } = await supabase
          .from("vehicles")
          .select("customers(nama)")
          .eq("plat", plat)
          .maybeSingle();
        const nama = pemilik?.customers?.nama;
        form.setError("plat", {
          message: nama ? `Plat ${plat} sudah terdaftar atas nama ${nama}` : `Plat ${plat} sudah terdaftar`,
        });
      } else {
        toast.error("Kendaraan gagal disimpan. Periksa isian lalu coba lagi.");
      }
      return;
    }

    toast.success(kendaraan ? "Data kendaraan diperbarui" : "Kendaraan ditambahkan");
    setBuka(false);
    form.reset();
    router.refresh();
  }

  return (
    <Dialog
      open={buka}
      onOpenChange={(v) => {
        setBuka(v);
        if (!v) form.reset();
      }}
    >
      <DialogTrigger asChild>
        {kendaraan ? (
          <Button variant="ghost" size="icon-sm" aria-label={`Ubah ${kendaraan.plat}`}>
            <Pencil />
          </Button>
        ) : (
          <Button size="sm">
            <Plus />
            Kendaraan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{kendaraan ? "Ubah Kendaraan" : "Tambah Kendaraan"}</DialogTitle>
        </DialogHeader>
        <form id="form-kendaraan" onSubmit={form.handleSubmit(simpan)} noValidate>
          <FieldGroup className="gap-4">
            <Controller
              name="plat"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="plat">Plat Nomor *</FieldLabel>
                  <Input {...field} id="plat" placeholder="B 1234 ABC" className="uppercase" aria-invalid={fieldState.invalid} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="merek_model"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="merek_model">Merek dan Model *</FieldLabel>
                  <Input {...field} id="merek_model" placeholder="Toyota Avanza" aria-invalid={fieldState.invalid} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="tahun"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="tahun">Tahun</FieldLabel>
                    <Input {...field} id="tahun" inputMode="numeric" aria-invalid={fieldState.invalid} />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                name="warna"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="warna">Warna</FieldLabel>
                    <Input {...field} id="warna" />
                  </Field>
                )}
              />
            </div>
            <Controller
              name="transmisi"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="transmisi">Transmisi</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="transmisi" className="w-full">
                      <SelectValue placeholder="Pilih transmisi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AT">AT (otomatis)</SelectItem>
                      <SelectItem value="MT">MT (manual)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="submit" form="form-kendaraan" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
