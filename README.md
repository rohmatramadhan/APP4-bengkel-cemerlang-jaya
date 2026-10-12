# App 4 Cemerlang Jaya Motor: *Starter* Kelompok Sesi 9

Repositori ini menjadi titik awal kelompok empat orang di Sesi 9 Bootcamp AI Web Programming. Login, *route guard*, sidebar per peran, semua tabel dan RLS, serta dua halaman contoh sudah jadi. Setiap anggota melengkapi satu fitur di *branch* sendiri, lalu menggabungkannya ke `main` lewat *pull request*.

Sumber kebenaran ada di `docs/PRD.md`. Aturan kerja agen AI ada di `AGENTS.md`.

## Isi *Starter*

### Bagian yang sudah jadi

| Bagian | Lokasi |
|---|---|
| Login dan keluar | `src/app/login`, tombol Keluar di sidebar |
| *Route guard* per peran | `src/middleware.ts`, daftar halaman di `src/lib/peran.ts` |
| Layout dan sidebar per peran | `src/app/(app)/layout.tsx`, `src/components/Sidebar.tsx` |
| Pelanggan dan kendaraan | `/pelanggan`, `/pelanggan/[id]` |
| Tim Mekanik | `/tim-mekanik` |
| Tabel, fungsi bantuan, *trigger* dasar, dan RLS | `supabase/migrations/01_dasar.sql` |
| Data contoh | `supabase/seed.sql` |
| Fungsi *dashboard* dan laporan | `supabase/dashboard.sql`, dijalankan pemilik Fitur D |
| Tipe database | `src/types/database.ts` |
| Bantuan bersama | `src/lib/format.ts` untuk rupiah dan tanggal, `src/lib/status-wo.ts` dan `BadgeStatus` untuk status WO, `Paginasi` untuk daftar 20 baris |

Halaman Pelanggan dan Tim Mekanik adalah pola yang ditiru: kueri di *server component*, form di komponen klien dengan zod dan react-hook-form, tombol mengikuti peran.

### Halaman kerangka per fitur

Halaman berikut sudah lolos *route guard* tetapi isinya masih komponen `KerangkaFitur`.

| Fitur | Halaman | *Database function* dan lainnya | *Branch* |
|---|---|---|---|
| A. *Work Order* | `/work-orders`, `/work-orders/baru`, `/work-orders/[id]` | `buat_work_order`, `tugaskan_mekanik`, `ubah_status_wo`, *trigger* `jaga_wo`, *bucket* `foto-wo` | `fitur/work-order` |
| B. Tagihan dan *Invoice* | `/work-orders/[id]/tagihan`, `/work-orders/[id]/invoice` | `tambah_item_tagihan`, `hapus_item_tagihan`, `sesuaikan_harga_item`, `atur_diskon`, `terbitkan_invoice`, `catat_pembayaran` | `fitur/tagihan` |
| C. Inventory dan Pengguna | `/inventory`, `/pengguna`, `/setelan` | `catat_stok_masuk`, `sesuaikan_stok`, *bucket* `publik` | `fitur/inventory` |
| D. *Dashboard* dan *Audit Log* | `/dashboard`, `/audit-log`, `/laporan-laba` | isi `dashboard.sql`, *trigger* `catat_audit` | `fitur/dashboard` |

Rincian WO dan Tagihan memakai tab "Rincian | Tagihan" dari `src/components/TabWorkOrder.tsx`. Kedua halaman itu terpisah supaya Fitur A dan Fitur B tidak mengubah file yang sama.

## Persiapan Ketua

1. Buka repositori *starter*, tekan **Use this template**, lalu buat repositori kelompok.
2. Undang tiga anggota sebagai *collaborator* lewat **Settings › Collaborators**.
3. Buat proyek Supabase `cemerlang-jaya-kN` di organisasi milikmu. Ganti `N` dengan nomor kelompok.
4. Undang tiga anggota ke organisasi itu sebagai **Administrator**.
5. Salin `.env.example` menjadi `.env.local`, lalu isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` lewat Supabase MCP.
6. Jalankan `supabase/migrations/01_dasar.sql` lewat MCP `apply_migration` tanpa mengubah isinya.
7. Buat empat akun uji di Supabase Dashboard › Authentication › Users › **Add user**, dengan *Auto Confirm User* dicentang.
8. Isi peran dan `aktif = true` keempat akun lewat MCP `execute_sql`.
9. Jalankan `supabase/seed.sql` lewat MCP.
10. Buat ulang `src/types/database.ts` lewat MCP `generate_typescript_types`, lalu *commit* dan *push* ke `main`.

Akun uji PRD 15.1:

| Nama | Email | Peran | Tim |
|---|---|---|---|
| Pak Darto | `owner@cemerlangjaya.test` | `owner` | |
| Rina | `admin@cemerlangjaya.test` | `admin` | |
| Pak Joko | `joko@cemerlangjaya.test` | `kepala_mekanik` | Tim A |
| Pak Slamet | `slamet@cemerlangjaya.test` | `kepala_mekanik` | Tim B |

Kata sandi keempat akun `Bengkel123!`. Kata sandi ini hanya untuk latihan di kelas.

## Persiapan Anggota

1. Terima undangan GitHub dan undangan organisasi Supabase.
2. *Clone* repositori kelompok, lalu jalankan `npm install`.
3. Salin `.env.example` menjadi `.env.local` dan isi lewat Supabase MCP dari proyek kelompok.
4. Buat ulang `src/types/database.ts` lewat MCP `generate_typescript_types`.
5. Buat *branch* fitur, misalnya `git checkout -b fitur/work-order`.
6. Jalankan `npm run dev`, lalu buka `http://localhost:3000`.

## Aturan Kelompok

Satu fitur, satu *branch*

Setiap anggota hanya mengubah file milik fiturnya. Perubahan pada file bersama seperti sidebar, layout, atau `src/lib/peran.ts` dibicarakan dulu dengan kelompok.

SQL fitur disimpan

Setiap SQL yang disetujui dan berhasil dijalankan disimpan ke `supabase/migrations/fitur_<nama>.sql` supaya ikut terlihat di *pull request*.

*Pull request* ditinjau teman

Satu anggota lain meninjau setiap *pull request*. Ketua yang melakukan *merge* ke `main`.

Tipe database tidak digabung manual

Bila `src/types/database.ts` bentrok saat *merge*, buat ulang lewat `generate_typescript_types`.

## Perintah

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Menjalankan aplikasi di `http://localhost:3000` |
| `npm run build` | Memeriksa aplikasi bisa dibangun untuk tayang |
| `npx tsc --noEmit` | Memeriksa tipe TypeScript |
| `npm run lint` | Memeriksa gaya kode |

## PERINGATAN KEAMANAN

Jangan pernah menulis, menyalin, atau meminta *secret key* Supabase, baik di kode, di `.env.local`, di *chat*, maupun di *commit*. Aplikasi ini cukup memakai *publishable key* karena semua aturan akses dijaga RLS dan *database function*. File `.env.local` tidak ikut ke GitHub.
