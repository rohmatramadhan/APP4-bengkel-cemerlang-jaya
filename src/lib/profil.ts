import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPeran, type Peran } from "@/lib/peran";

/**
 * Profil pengguna yang sedang login. cache() membuat layout dan halaman
 * dalam satu permintaan berbagi satu kueri saja.
 *
 * The signed-in user's profile. cache() lets the layout and the page
 * share a single query within one request.
 */
export const ambilProfilSaya = cache(
  async (): Promise<{ id: string; nama: string; peran: Peran }> => {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims.sub;
    if (!userId) redirect("/login");

    const { data: profil } = await supabase
      .from("profiles")
      .select("id, nama, role")
      .eq("id", userId)
      .maybeSingle();
    // Middleware sudah menyaring akun nonaktif; ini hanya jaring pengaman / The middleware already filters inactive accounts; this is a safety net
    if (!profil || !isPeran(profil.role)) redirect("/login");

    return { id: profil.id, nama: profil.nama, peran: profil.role };
  },
);
