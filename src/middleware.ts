import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isPeran, peranUntukHalaman } from "@/lib/peran";
import type { Database } from "@/types/database";

/**
 * Route guard PRD 4.1. Hanya menjaga halaman; data tetap dijaga RLS.
 * Peran dibaca dari tabel profiles, bukan dari data yang dikirim peramban.
 *
 * Route guard for PRD 4.1. It only guards pages; data is still protected by RLS.
 * The role is read from the profiles table, never from anything the browser sends.
 */
export async function middleware(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "Supabase belum tersambung. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY di .env.local, lalu jalankan ulang npm run dev.",
    );
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Pengalihan harus membawa cookie sesi yang baru diperbarui / Redirects must carry the freshly refreshed session cookies
  const alihkan = (alamat: string, params: Record<string, string> = {}) => {
    const url = new URL(alamat, request.url);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  };

  const { pathname, search } = request.nextUrl;
  const halamanLogin = pathname === "/login";
  const peranBoleh = peranUntukHalaman(pathname);

  // getClaims juga memperbarui token yang kedaluwarsa, jadi tetap dipanggil sebelum keluar lebih awal.
  // getClaims also refreshes expired tokens, so it runs before any early return.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;

  // Halaman depan dan alamat yang tidak dikenal (404) tidak dijaga / The landing page and unknown paths (404) are not guarded
  if (!peranBoleh && !halamanLogin) return response;

  if (!userId) {
    return halamanLogin ? response : alihkan("/login", { next: pathname + search });
  }

  const { data: profil, error } = await supabase
    .from("profiles")
    .select("role, aktif")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;

  if (!profil?.aktif || !isPeran(profil.role)) {
    await supabase.auth.signOut({ scope: "local" });
    return alihkan("/login", { pesan: "nonaktif" });
  }

  if (halamanLogin) return alihkan("/dashboard");

  if (peranBoleh && !peranBoleh.includes(profil.role)) {
    return alihkan("/dashboard", { pesan: "tidak-berhak" });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
