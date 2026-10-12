import { Wrench } from "lucide-react";
import { FormLogin } from "./FormLogin";

export default async function HalamanLogin({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; pesan?: string }>;
}) {
  const { next, pesan } = await searchParams;

  // Diurai dengan URL karena peramban membaca "/\evil.com" sebagai "//evil.com"; hanya alamat internal yang lolos.
  // Parsed with URL because browsers read "/\evil.com" as "//evil.com"; only same-origin paths pass.
  const url = next?.startsWith("/") && URL.canParse(next, "http://lokal") ? new URL(next, "http://lokal") : null;
  const tujuan = url?.origin === "http://lokal" ? url.pathname + url.search : "/dashboard";

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
