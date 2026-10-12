# Aturan Kerja Agen untuk App 4 Cemerlang Jaya Motor

File ini dibaca agen AI sebelum mengerjakan apa pun di repositori ini. Repositori ini dikerjakan berkelompok: setiap anggota memegang satu fitur di branch sendiri.

## Sumber kebenaran

1. Baca `docs/PRD.md` sebelum mengerjakan permintaan apa pun. Nama tabel, kolom, fungsi, status, peran, halaman, dan aturan akses harus sama persis dengan PRD.
2. Bila permintaan bertentangan dengan PRD, sampaikan perbedaannya dan tanyakan dulu.
3. Tabel sudah lengkap di `supabase/migrations/01_dasar.sql`. Jangan membuat, mengubah, atau menghapus tabel.

## Kerja kelompok

- Kerjakan hanya file milik fitur yang sedang dikerjakan (PRD 15.4). Bila perlu mengubah file bersama seperti sidebar atau layout, sampaikan dulu.
- Halaman fitur sudah ada sebagai kerangka (`KerangkaFitur`). Ganti isinya, jangan memindahkan alamatnya.
- Setiap SQL yang disetujui dan berhasil dijalankan disimpan ke `supabase/migrations/fitur_<nama>.sql`.
- `src/types/database.ts` adalah hasil generate. Bila bentrok saat merge, buat ulang lewat `generate_typescript_types`, jangan digabung manual.
- Sebelum mengubah file saat merge conflict, jelaskan kedua versinya dan tunggu persetujuan.

## Kode

- Next.js 15 App Router, TypeScript strict, tanpa `any`. Tipe dari `src/types/database.ts`.
- Tailwind dan komponen shadcn/ui di `src/components/ui`. Ikuti token warna `src/app/globals.css`.
- Ikuti pola halaman Pelanggan dan Tim Mekanik.
- Teks antarmuka dan pesan error dalam bahasa Indonesia.

## Database lewat Supabase MCP

- Ubah database hanya lewat Supabase MCP. Tampilkan SQL lengkap dulu dan tunggu persetujuan.
- Database function: `security definer`, `set search_path = ''`, peran diperiksa di awal lewat `private.peran_saya()`, baris yang bisa direbut dikunci dengan `for update`, pesan error bahasa Indonesia.
- Status WO, stok, tagihan, invoice, dan pembayaran hanya berubah lewat fungsi PRD 9.2.
- Setelah perubahan, jalankan advisor keamanan dan laporkan hasilnya.

## Keamanan

- Jangan memakai, meminta, atau menuliskan secret key Supabase. Cukup `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Jangan menampilkan isi `.env.local` di chat.

## Hemat egress

- Ambil hanya kolom yang ditampilkan, daftar 20 baris per halaman.
- Angka dashboard dari fungsi `dashboard_*`.
- Foto diperkecil sebelum diunggah (1600 px, WebP, mutu 0,8) dan memakai thumbnail.

## Cara melapor

Setelah selesai, tuliskan: file yang dibuat atau diubah, perubahan database, dan cara mengujinya dengan akun uji PRD 15.1.
