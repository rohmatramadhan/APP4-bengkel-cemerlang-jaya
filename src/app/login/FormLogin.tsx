"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

const skema = z.object({
  email: z.email("Format email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});
type DataLogin = z.infer<typeof skema>;

export function FormLogin({ tujuan, pesanAwal }: { tujuan: string; pesanAwal: string | null }) {
  const router = useRouter();
  const [pesan, setPesan] = useState(pesanAwal);
  const form = useForm<DataLogin>({
    resolver: zodResolver(skema),
    defaultValues: { email: "", password: "" },
  });

  async function masuk(data: DataLogin) {
    setPesan(null);
    const supabase = createClient();
    const { data: hasil, error } = await supabase.auth.signInWithPassword(data);
    if (error || !hasil.user) {
      setPesan("Email atau kata sandi salah");
      return;
    }

    const { data: profil } = await supabase
      .from("profiles")
      .select("aktif")
      .eq("id", hasil.user.id)
      .maybeSingle();
    if (!profil?.aktif) {
      await supabase.auth.signOut({ scope: "local" });
      setPesan("Akunmu dinonaktifkan. Hubungi Owner");
      return;
    }

    router.replace(tujuan);
    router.refresh();
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={form.handleSubmit(masuk)} noValidate>
          <FieldGroup className="gap-5">
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input {...field} id="email" type="email" autoComplete="email" autoFocus aria-invalid={fieldState.invalid} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="password">Kata Sandi</FieldLabel>
                  <Input {...field} id="password" type="password" autoComplete="current-password" aria-invalid={fieldState.invalid} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            {pesan && (
              <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
                {pesan}
              </p>
            )}
            <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Memeriksa..." : "Masuk"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
