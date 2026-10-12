"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

const skema = z.object({
  nama: z.string().trim().min(1, "Nama wajib diisi"),
  kepala_mekanik_id: z.string().min(1),
  aktif: z.boolean(),
});
type DataMekanik = z.infer<typeof skema>;

type Mekanik = Pick<Tables<"mekanik">, "id" | "nama" | "aktif" | "kepala_mekanik_id">;

/**
 * Tambah (tanpa `mekanik`) atau ubah mekanik. `pilihanTim` hanya dikirim untuk Owner,
 * karena hanya Owner yang boleh memindahkan mekanik antartim (PRD 6.5).
 *
 * Create (without `mekanik`) or edit a mechanic. `pilihanTim` is only passed for the Owner,
 * because only the Owner may move mechanics between teams (PRD 6.5).
 */
export function FormMekanik({
  kepalaId,
  mekanik,
  pilihanTim,
}: {
  kepalaId: string;
  mekanik?: Mekanik;
  pilihanTim?: { id: string; nama: string }[];
}) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const form = useForm<DataMekanik>({
    resolver: zodResolver(skema),
    defaultValues: {
      nama: mekanik?.nama ?? "",
      kepala_mekanik_id: mekanik?.kepala_mekanik_id ?? kepalaId,
      aktif: mekanik?.aktif ?? true,
    },
  });

  async function simpan(data: DataMekanik) {
    const supabase = createClient();
    const { error } = mekanik
      ? await supabase.from("mekanik").update(data).eq("id", mekanik.id)
      : await supabase.from("mekanik").insert({ nama: data.nama, kepala_mekanik_id: data.kepala_mekanik_id });

    if (error) {
      toast.error("Mekanik gagal disimpan. Pastikan mekanik ini ada di timmu.");
      return;
    }
    toast.success(mekanik ? "Data mekanik diperbarui" : "Mekanik ditambahkan");
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
        {mekanik ? (
          <Button variant="ghost" size="icon-sm" aria-label={`Ubah ${mekanik.nama}`}>
            <Pencil />
          </Button>
        ) : (
          <Button size="sm">
            <Plus />
            Mekanik
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mekanik ? "Ubah Mekanik" : "Tambah Mekanik"}</DialogTitle>
        </DialogHeader>
        <form id="form-mekanik" onSubmit={form.handleSubmit(simpan)} noValidate>
          <FieldGroup className="gap-4">
            <Controller
              name="nama"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="nama-mekanik">Nama *</FieldLabel>
                  <Input {...field} id="nama-mekanik" aria-invalid={fieldState.invalid} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            {pilihanTim && (
              <Controller
                name="kepala_mekanik_id"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="tim">Tim</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="tim" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {pilihanTim.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            Tim {t.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            )}
            {mekanik && (
              <Controller
                name="aktif"
                control={form.control}
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <Checkbox id="aktif" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                    <FieldLabel htmlFor="aktif" className="font-normal">
                      Aktif (mekanik nonaktif tidak muncul sebagai pilihan saat penugasan)
                    </FieldLabel>
                  </Field>
                )}
              />
            )}
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="submit" form="form-mekanik" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
