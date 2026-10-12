import { Wrench } from "lucide-react";
import { FormLogin } from "./FormLogin";

export default async function HalamanLogin({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; pesan?: string }>;
}) {
  const { next, pesan } = await searchParams;

  // Hanya alamat internal agar tidak bisa dipakai untuk open redirect / Internal paths only, to prevent open redirects
  const tujuan = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wrench className="size-6" />
          </div>
          <h1 className="text-xl font-semibold">Cemerlang Jaya Motor</h1>
          <p className="text-sm text-muted-foreground">Masuk untuk mengelola bengkel</p>
        </div>
        <FormLogin
          tujuan={tujuan}
          pesanAwal={pesan === "nonaktif" ? "Akunmu dinonaktifkan. Hubungi Owner" : null}
        />
      </div>
    </main>
  );
}
