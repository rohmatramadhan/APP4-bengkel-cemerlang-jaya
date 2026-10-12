# PRD App 4: Aplikasi Manajemen Bengkel Cemerlang Jaya Motor

Bootcamp AI Web Programming · Sesi 9 (kelas *offline*) · Ioda Academy · Oktober 2026

> Dokumen ini adalah PRD yang dipakai peserta dan agen AI untuk membangun App 4 dari awal sampai tayang. Isinya: peran pengguna, alur aplikasi, alur setiap fitur, skema database, aturan keamanan, *storage*, dan desain dashboard. Versi ini adalah edisi bootcamp dari PRD lengkap Cemerlang Jaya Motor v3: lingkupnya dipangkas agar selesai dalam satu hari praktik, tetapi alur intinya sama.

---

## Daftar Isi

1. Ringkasan
2. Pengguna dan Peran
3. Tech Stack
4. Peta Halaman
5. Alur Utama Aplikasi
6. Kebutuhan Fungsional per Modul
7. Status Work Order
8. Skema Database
9. Database Function dan Trigger
10. Aturan Akses (RLS)
11. Storage
12. Dashboard
13. Identitas Visual
14. Kebutuhan Non-Fungsional
15. Data Contoh dan Akun Uji
16. Kriteria Selesai
17. Di Luar Lingkup
18. Kamus Istilah

---

## 1. Ringkasan

Cemerlang Jaya Motor adalah bengkel mobil dengan satu Admin di meja depan, dua Kepala Mekanik yang masing-masing memimpin satu tim mekanik, dan satu Owner. Selama ini pekerjaan dicatat di kertas, sehingga Owner sulit mengetahui mobil mana yang terlambat, berapa pendapatan hari ini, dan stok apa yang menipis.

Aplikasi ini mencatat perjalanan satu mobil di bengkel dalam satu **Work Order** (WO): dari mobil datang, dikerjakan, diperiksa, ditagih, sampai diambil pemiliknya.

**Yang membuat aplikasi ini pas untuk Cemerlang Jaya Motor:**

- Satu WO untuk satu kunjungan mobil, dari datang sampai bayar.
- Satu pelanggan bisa punya banyak mobil. Ketik plat nomor, data pelanggan dan mobil langsung terisi.
- Kepala Mekanik mencatat pengerjaan timnya sendiri, dan tidak bisa mengubah WO tim lain.
- Stok spare part berkurang otomatis saat dipakai, tanpa bisa minus walaupun dua orang menambah bersamaan.
- Harga boleh disesuaikan saat menagih, tetapi setiap penyesuaian wajib beralasan dan tercatat.
- Harga modal dan laba hanya terlihat oleh Owner.
- Dashboard dengan grafik untuk setiap peran, sehingga kondisi bengkel terbaca tanpa membuka menu satu per satu.

**Konsep yang dilatih di Sesi 9:**

| Konsep | Tempat dipakai di aplikasi |
|---|---|
| Login dan *route guard* per peran | Tiga peran dengan halaman dan menu berbeda |
| RLS *policy* (Sesi 8) | Semua tabel; harga modal hanya untuk Owner |
| Pemeriksaan hubungan | Kepala Mekanik hanya mengubah WO timnya |
| Aturan perpindahan status / *state machine* (Sesi 8) | Status WO hanya berpindah lewat fungsi |
| *Transaction* (Sesi 8) | Stok spare part, nomor WO, nomor invoice |
| *Audit log* | Status, harga, stok, invoice, pembayaran tercatat otomatis |
| *Storage* publik dan privat | Logo dan galeri bengkel publik; foto STNK dan kondisi mobil privat |
| Hemat *egress* (Sesi 8) | Foto diperkecil, daftar berhalaman, dashboard dihitung di database |

---

## 2. Pengguna dan Peran

### 2.1 Tiga pemegang akun

| Peran | Kode `role` | Siapa | Tugas utama |
|---|---|---|---|
| Owner | `owner` | Pemilik bengkel | Melihat semua data, harga modal, laba, dashboard lengkap, *audit log*; mengelola pengguna, harga, stok, dan setelan bengkel |
| Admin | `admin` | Petugas meja depan merangkap kasir | Menerima mobil, membuat WO, mengelola pelanggan dan kendaraan, menyesuaikan harga, menerbitkan invoice, mencatat pembayaran, menyerahkan mobil |
| Kepala Mekanik | `kepala_mekanik` | Pemimpin satu tim mekanik | Menerima WO untuk timnya, menunjuk mekanik, mengubah status pengerjaan, mencatat spare part dan jasa yang dipakai, memeriksa hasil kerja (QC) |

### 2.2 Mekanik sebagai data

Mekanik **tidak punya akun**. Nama mekanik disimpan sebagai data di menu Tim Mekanik, dan setiap mekanik tergabung dalam tim salah satu Kepala Mekanik. Nama mekanik dipakai saat Kepala Mekanik menunjuk siapa yang mengerjakan sebuah WO.

### 2.3 Hak akses per modul

| Modul | Owner | Admin | Kepala Mekanik |
|---|---|---|---|
| Dashboard | Dashboard Owner | Dashboard Admin | Dashboard Tim |
| Work Order: daftar dan rincian | Lihat semua, ubah semua | Lihat semua, buat, ubah data masuk | Lihat semua, ubah pengerjaan hanya WO timnya |
| Pelanggan dan Kendaraan | Penuh | Penuh | Lihat |
| Inventory: spare part dan jasa | Penuh, termasuk harga modal | Lihat dan tambah item, tanpa harga modal | Lihat, tanpa harga modal |
| Inventory: stok masuk | Ya | Ya | Tidak |
| Inventory: penyesuaian stok | Ya | Tidak | Tidak |
| Tagihan dan Invoice | Penuh | Penuh | Lihat tagihan WO timnya, tanpa harga modal |
| Pembayaran | Ya | Ya | Tidak |
| Tim Mekanik | Penuh | Lihat | Kelola mekanik di timnya |
| Laporan Laba | Ya | Tidak tampil | Tidak tampil |
| *Audit Log* | Ya | Tidak tampil | Tidak tampil |
| Pengguna dan Peran | Ya | Tidak tampil | Tidak tampil |
| Setelan Bengkel (logo, galeri) | Ya | Tidak tampil | Tidak tampil |

**Aturan penting:** menu dan kolom yang tidak boleh dilihat suatu peran **tidak ditampilkan sama sekali**, dan datanya juga **tidak terkirim** dari database (dijaga RLS, bukan hanya disembunyikan di tampilan).

### 2.4 Data yang dirahasiakan dari Admin dan Kepala Mekanik

| Data | Owner | Admin | Kepala Mekanik |
|---|---|---|---|
| Harga jual, total tagihan, pendapatan | Lihat | Lihat | Lihat untuk WO timnya |
| Harga modal, laba, margin | Lihat | Tidak | Tidak |
| *Audit log* | Lihat | Tidak | Tidak |

Harga modal disimpan di **tabel terpisah** (`inventory_costs` dan `billing_item_costs`) yang hanya bisa dibaca Owner. Dengan begitu harga modal tidak ikut terkirim ke *browser* Admin, walaupun Admin membuka tab Network di DevTools.

---

## 3. Tech Stack

| Lapisan | Teknologi | Catatan |
|---|---|---|
| Kerangka aplikasi | **Next.js 15 (App Router) + TypeScript** | Bukan JavaScript. Semua file `.ts` / `.tsx` |
| Tampilan | Tailwind CSS + shadcn/ui | Komponen tabel, dialog, form, tab, *badge* |
| Ikon | lucide-react | |
| Grafik | Recharts lewat komponen Chart dari shadcn/ui | Dashboard |
| Database | Supabase (PostgreSQL) | Tabel, RLS, fungsi, *trigger* |
| Login | Supabase Auth, email dan kata sandi | Login Google sebagai eksplorasi mandiri (lihat Modul Bacaan 6 Sesi 8) |
| Koneksi Supabase | `@supabase/supabase-js` dan `@supabase/ssr` | Client untuk *browser* dan *server* |
| Penyimpanan file | Supabase Storage | Bucket publik dan privat |
| Validasi form | zod + react-hook-form | |
| Kompresi foto | browser-image-compression | Diperkecil sebelum diunggah |
| Tipe data database | Dibuat dari skema Supabase (`supabase gen types` atau MCP `generate_typescript_types`) | Disimpan di `src/types/database.ts` |
| Pengelola database | Supabase MCP di Antigravity | Agen membuat tabel, fungsi, dan *policy* lewat *prompt* |
| Tayang | Netlify | |

### 3.1 Environment variable

Isi `.env.local` (tidak ikut ke GitHub):

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxx
```

Aplikasi **tidak memakai** *secret key* Supabase. Semua aturan dijaga RLS dan *database function*, sehingga aplikasi cukup memakai *publishable key*.

### 3.2 Struktur folder (saran)

```
src/
  app/
    (publik)/page.tsx            halaman depan bengkel (publik)
    login/page.tsx
    (app)/layout.tsx             layout dengan sidebar, butuh login
    (app)/dashboard/page.tsx
    (app)/work-orders/page.tsx
    (app)/work-orders/baru/page.tsx
    (app)/work-orders/[id]/page.tsx
    (app)/work-orders/[id]/tagihan/page.tsx
    (app)/work-orders/[id]/invoice/page.tsx
    (app)/pelanggan/page.tsx
    (app)/pelanggan/[id]/page.tsx
    (app)/inventory/page.tsx
    (app)/tim-mekanik/page.tsx
    (app)/laporan-laba/page.tsx
    (app)/audit-log/page.tsx
    (app)/pengguna/page.tsx
    (app)/setelan/page.tsx
  components/                    komponen shadcn/ui dan komponen aplikasi
  lib/supabase/client.ts         client untuk browser
  lib/supabase/server.ts         client untuk server component
  lib/peran.ts                   daftar menu dan halaman per peran
  middleware.ts                  route guard
  types/database.ts              tipe hasil generate
```

---

## 4. Peta Halaman

| Alamat | Isi | Peran yang boleh membuka |
|---|---|---|
| `/` | Halaman depan bengkel: nama, alamat, layanan, galeri foto, tombol Masuk | Publik |
| `/login` | Form email dan kata sandi | Publik (yang sudah login dialihkan ke `/dashboard`) |
| `/dashboard` | Dashboard sesuai peran | Semua peran |
| `/work-orders` | Daftar WO dengan tab status, pencarian, penyaring | Semua peran |
| `/work-orders/baru` | Form WO baru | Admin, Owner |
| `/work-orders/[id]` | Rincian WO (4 bagian) | Semua peran; tombol mengikuti peran |
| `/work-orders/[id]/tagihan` | Bagian D. Tagihan dari rincian WO, dibuka sebagai tab | Semua peran; Kepala Mekanik hanya WO timnya |
| `/work-orders/[id]/invoice` | Invoice siap cetak | Admin, Owner |
| `/pelanggan` | Daftar pelanggan | Semua peran (Kepala Mekanik hanya lihat) |
| `/pelanggan/[id]` | Rincian pelanggan, kendaraan, riwayat WO | Semua peran |
| `/inventory` | Tab Spare Part, Jasa, Riwayat Stok | Semua peran (kolom dan tombol mengikuti peran) |
| `/tim-mekanik` | Daftar mekanik per tim | Semua peran |
| `/laporan-laba` | Laba per WO dan per periode | Owner |
| `/audit-log` | Riwayat perubahan | Owner |
| `/pengguna` | Daftar akun dan perannya | Owner |
| `/setelan` | Nama bengkel, alamat, logo, galeri | Owner |

### 4.1 Route guard

- `middleware.ts` memeriksa sesi Supabase di setiap permintaan ke halaman dalam grup `(app)`.
- Belum login: dialihkan ke `/login?next=<alamat-asal>`.
- Sudah login tetapi perannya tidak berhak: dialihkan ke `/dashboard` dengan pesan "Halaman ini tidak tersedia untuk peranmu".
- Peran dibaca dari tabel `profiles`, bukan dari data yang dikirim *browser*.
- Akun dengan `aktif = false` tidak bisa masuk; setelah login langsung dikeluarkan dengan pesan "Akunmu dinonaktifkan. Hubungi Owner".
- *Route guard* hanya menjaga halaman. Data tetap dijaga RLS (Bab 10).

### 4.2 Sidebar per peran

| Menu | Owner | Admin | Kepala Mekanik |
|---|---|---|---|
| Dashboard | Ya | Ya | Ya |
| Work Order | Ya | Ya | Ya |
| Pelanggan | Ya | Ya | Ya |
| Inventory | Ya | Ya | Ya |
| Tim Mekanik | Ya | Ya | Ya |
| Laporan Laba | Ya | | |
| Audit Log | Ya | | |
| Pengguna | Ya | | |
| Setelan Bengkel | Ya | | |

Di bagian atas sidebar tampil logo bengkel, dan di bagian bawah tampil nama pengguna, perannya, dan tombol Keluar.

---

## 5. Alur Utama Aplikasi

Satu kunjungan mobil berjalan seperti ini:

```
[Admin]  Mobil datang → ketik plat → data pelanggan & mobil terisi (atau isi baru)
         → isi keluhan, odometer, foto STNK & kondisi awal → pilih tim Kepala Mekanik
         → Simpan → WO "menunggu"
              │
[Kepala Mekanik tim itu]  Buka WO → tunjuk mekanik + tanggal estimasi selesai
         → Mulai Kerjakan → WO "dikerjakan"
         → catat spare part & jasa yang dipakai (stok berkurang otomatis)
         → (bila menunggu part) Tunda → "tertunda" → Lanjutkan → "dikerjakan"
         → Selesai Dikerjakan → "selesai"
         → periksa mobil (QC): Lulus → "siap_diambil"  |  Gagal → kembali "dikerjakan" + catatan
              │
[Admin]  Buka tagihan → periksa baris → sesuaikan harga bila perlu (wajib alasan)
         → Terbitkan Invoice (nomor INV dibuat, tagihan terkunci) → cetak
         → catat pembayaran (tunai/transfer/QRIS; boleh sebagian)
         → setelah lunas: unggah foto kondisi akhir → Serahkan Mobil → "diambil"
              │
[Owner]  Pantau semua lewat Dashboard, Laporan Laba, dan Audit Log
```

Pembatalan: Admin atau Owner dapat membatalkan WO yang belum selesai (`menunggu`, `dikerjakan`, `tertunda`) dengan alasan wajib. Spare part yang sudah tercatat dikembalikan ke stok.

---

## 6. Kebutuhan Fungsional per Modul

Setiap modul ditulis dari sudut pandang pengguna: siapa menekan apa, mengisi apa, dan sistem merespons apa.

### 6.1 Login dan Keluar

**Langkah pengguna masuk:**
1. Pengguna membuka `/login`.
2. Mengisi Email dan Kata Sandi, menekan **Masuk**.
3. Sistem memeriksa ke Supabase Auth.
   - Berhasil dan akun aktif: dialihkan ke `/dashboard` (atau ke alamat `next` bila ada).
   - Email atau kata sandi salah: pesan "Email atau kata sandi salah".
   - Akun nonaktif: pesan "Akunmu dinonaktifkan. Hubungi Owner".
4. Menekan **Keluar** di sidebar: sesi dihapus, dialihkan ke `/login`.

**Catatan:** tidak ada halaman daftar mandiri. Akun dibuat Owner (6.10). Login Google adalah eksplorasi mandiri, bukan bagian wajib.

### 6.2 Halaman Depan Bengkel (publik)

Halaman `/` dibuka tanpa login.

**Isi:** logo, nama bengkel, alamat, telepon, jam buka, daftar layanan (diambil dari jasa yang aktif, maksimal 8), galeri 3 sampai 6 foto bengkel, tombol **Masuk** ke `/login`.

**Sumber gambar:** bucket publik `publik` (Bab 11). Gambar ditampilkan lewat URL publik dengan ukuran yang sudah diperkecil.

**Batasan:** halaman ini tidak menampilkan data pelanggan, WO, atau harga.

### 6.3 Pelanggan dan Kendaraan

Satu pelanggan boleh memiliki banyak kendaraan. Satu kendaraan dimiliki satu pelanggan.

**Daftar pelanggan** (`/pelanggan`): kolom Nama, Telepon, Jumlah Kendaraan, Servis Terakhir. Pencarian berdasarkan nama, telepon, atau plat. Berhalaman 20 baris.

**Langkah Admin menambah pelanggan:**
1. Menekan **+ Pelanggan**.
2. Mengisi Tipe (Perorangan/Perusahaan), Nama\*, Telepon\* (unik), Email, Alamat.
3. Menekan **Simpan**.

**Langkah Admin menambah kendaraan:**
1. Di rincian pelanggan, menekan **+ Kendaraan**.
2. Mengisi Plat Nomor\* (unik, otomatis huruf kapital dan spasi dirapikan), Merek dan Model\*, Tahun, Warna, Transmisi (AT/MT).
3. Menekan **Simpan**.

**Rincian pelanggan** (`/pelanggan/[id]`): kartu data pelanggan, daftar kendaraan, dan tab **Riwayat Servis** berisi semua WO dari semua kendaraannya, terbaru di atas. Mengeklik WO membuka rinciannya.

**Validasi:**
- Nama dan Telepon wajib; Telepon unik, berisi 10 sampai 14 digit angka.
- Plat Nomor wajib dan unik. Bila sudah dipakai: "Plat B 1234 ABC sudah terdaftar atas nama Budi".
- Pelanggan yang masih punya kendaraan tidak bisa dihapus. Kendaraan yang punya riwayat WO tidak bisa dihapus.

### 6.4 Inventory

Tiga tab: **Spare Part**, **Jasa**, **Riwayat Stok**.

**Tab Spare Part:** kolom SKU, Nama, Stok, Stok Minimum, Harga Jual, Harga Modal (hanya Owner), Status (*badge*: Habis / Menipis / Aman). Penyaring status. Berhalaman 20 baris.

**Tab Jasa:** kolom Kode, Nama Jasa, Tarif.

**Langkah menambah spare part (Admin atau Owner):**
1. Menekan **+ Spare Part**.
2. Mengisi Nama\*, Harga Jual\*, Stok Minimum (bawaan 5). SKU terisi otomatis bila kosong (`SP-0001`).
3. Owner juga mengisi Harga Modal\*. Bila Admin yang menambah, Harga Modal diisi Owner kemudian dan item ditandai "Modal belum diisi" di tampilan Owner.
4. Menekan **Simpan**. Item baru berstok 0.

**Langkah menambah jasa:** **+ Jasa** → Nama\*, Tarif\*, Kode (otomatis `JS-0001` bila kosong) → **Simpan**.

**Langkah mencatat stok masuk (Admin atau Owner):**
1. Di baris spare part, menekan **Stok Masuk**.
2. Mengisi Jumlah\* (≥ 1) dan Keterangan (misalnya "Pembelian dari Toko Sinar").
3. Menekan **Simpan**. Sistem memanggil fungsi `catat_stok_masuk`: stok bertambah dan tercatat di riwayat stok.

**Langkah penyesuaian stok (hanya Owner):**
1. Menekan **Sesuaikan Stok** di baris spare part.
2. Mengisi Stok Hasil Hitung Fisik\* dan Alasan\*.
3. Sistem memanggil `sesuaikan_stok`: selisih dicatat sebagai pergerakan "penyesuaian", dan tercatat di *audit log*.

**Langkah Owner mengubah harga:** Edit → ubah Harga Jual atau Harga Modal → Simpan. Harga baru berlaku untuk tagihan berikutnya; tagihan lama tidak berubah karena harga sudah dikunci di setiap baris tagihan.

**Tab Riwayat Stok:** tanggal, item, jenis (masuk/keluar/penyesuaian/kembali), jumlah, keterangan, nomor WO bila ada, pencatat.

**Aturan:** stok **hanya berubah lewat fungsi** (`catat_stok_masuk`, `sesuaikan_stok`, `tambah_item_tagihan`, `hapus_item_tagihan`, `ubah_status_wo` saat batal). Tidak ada yang boleh mengubah kolom `stok` langsung.

**Validasi:** Nama dan Harga Jual wajib, harga ≥ 0, SKU unik.

### 6.5 Tim Mekanik

**Tampilan:** satu kartu per Kepala Mekanik, berisi daftar mekanik timnya, jumlah WO aktif tiap mekanik, dan status aktif.

**Langkah Kepala Mekanik menambah mekanik di timnya:** **+ Mekanik** → Nama\* → **Simpan**. Mekanik otomatis masuk tim Kepala Mekanik yang sedang login.

**Owner** dapat menambah mekanik ke tim mana pun, memindahkan mekanik antartim, dan menonaktifkan mekanik. Mekanik nonaktif tidak muncul sebagai pilihan, tetapi tetap tampil di WO lama.

### 6.6 Work Order: Daftar

**Tampilan** (`/work-orders`):
- Tab status di atas: Semua / Menunggu / Dikerjakan / Tertunda / Selesai / Siap Diambil / Diambil / Dibatalkan. Setiap tab menampilkan jumlah WO.
- Kolom: No WO, Plat, Pelanggan, Tim (Kepala Mekanik), Estimasi Selesai, Total, Status.
- WO yang tanggal estimasinya sudah lewat tetapi belum `selesai` diberi *badge* merah **Terlambat**.
- Pencarian berdasarkan nomor WO, plat, atau nama pelanggan. Penyaring tim dan rentang tanggal.
- Berhalaman 20 baris, hanya mengambil kolom yang ditampilkan.
- Tombol **+ Work Order** hanya tampil untuk Admin dan Owner.
- Kepala Mekanik melihat semua WO, tetapi tab bawaannya disaring ke **Tim Saya**.

### 6.7 Work Order: Buat Baru

**Kondisi 1, plat sudah terdaftar:**
1. Admin menekan **+ Work Order**.
2. Kursor ada di kolom **Plat Nomor**. Admin mengetik `B 1234 ABC`.
3. Sistem mencari. Bila ketemu, kartu Pelanggan dan Kendaraan terisi dan dikunci (ada tombol **Ubah** bila perlu koreksi).

**Kondisi 2, plat belum terdaftar:**
1. Sistem menampilkan "Plat belum terdaftar".
2. Form Pelanggan muncul: Admin bisa mencari pelanggan lama berdasarkan telepon, atau mengisi pelanggan baru.
3. Form Kendaraan muncul dengan plat sudah terisi.

**Bagian Data Masuk:**
1. Odometer\* (angka ≥ 0).
2. Keluhan\* (teks).
3. Foto STNK\* (1 foto).
4. Foto Kondisi Awal\* (1 sampai 6 foto, ditampilkan sebagai kisi).
5. Tim Kepala Mekanik\* (pilihan dua nama, disertai jumlah WO aktif tiap tim).
6. Menekan **Simpan**.

**Respons sistem:**
- Nomor WO dibuat otomatis dalam satu *transaction*: `WO-YYMM-0001` (contoh `WO-2610-0007`), tidak pernah ganda walaupun dua Admin menyimpan bersamaan.
- Status `menunggu`.
- Foto diperkecil di *browser* lalu diunggah ke bucket privat `foto-wo`.
- Dialihkan ke rincian WO.

**Validasi:** Plat, Odometer, Keluhan, Tim, Foto STNK, dan minimal 1 Foto Kondisi Awal wajib. Tombol Simpan tidak aktif sebelum lengkap, disertai pesan bagian yang belum diisi.

### 6.8 Work Order: Rincian (4 bagian)

Empat bagian berurutan. Bagian A sampai C ada di `/work-orders/[id]`, sedangkan Bagian D. Tagihan ada di `/work-orders/[id]/tagihan` yang dibuka sebagai tab dari halaman rincian, supaya kedua halaman bisa dikerjakan anggota kelompok yang berbeda. Di atas: nomor WO, *badge* status, *badge* Terlambat bila ada, dan tombol aksi yang sesuai status dan peran (Bab 7).

**Bagian A. Data Masuk**
- Kartu Pelanggan (nama, telepon dengan tombol WhatsApp) dan Kendaraan (plat, merek model, tahun).
- Odometer, Keluhan, Diagnosis, Foto STNK, Foto Kondisi Awal.
- Admin dan Owner dapat mengubah Keluhan dan Odometer selama status `menunggu`.
- Kepala Mekanik tim WO itu dapat mengisi **Diagnosis** selama `dikerjakan` atau `tertunda`.

**Bagian B. Penugasan** (diisi Kepala Mekanik tim WO itu)
1. Kepala Mekanik membuka WO berstatus `menunggu`.
2. Memilih **Mekanik** (1 sampai 3 nama dari timnya). Daftar diurutkan dari beban paling ringan, contoh: "Andi · 1 WO aktif ★ disarankan".
3. Memilih **Estimasi Selesai\*** (tanggal, tidak boleh sebelum hari ini).
4. Menekan **Mulai Kerjakan**. Status menjadi `dikerjakan`.

Owner juga dapat melakukan penugasan untuk tim mana pun. Admin tidak menunjuk mekanik, tetapi dapat **memindahkan WO ke tim lain** selama status `menunggu`.

**Bagian C. Pengerjaan** (Kepala Mekanik tim WO itu, atau Owner)
1. **+ Spare Part**: mencari spare part, mengisi jumlah, menekan Tambah.
   - Sistem memanggil `tambah_item_tagihan` dalam satu *transaction*: mengunci baris stok, memeriksa stok cukup, mengurangi stok, mencatat pergerakan "keluar" dengan nomor WO, menyimpan baris tagihan dengan harga jual saat itu, dan (di tabel rahasia) harga modal saat itu.
   - Stok kurang: ditolak dengan pesan "Stok Kampas Rem hanya 1".
2. **+ Jasa**: memilih jasa, jumlah bawaan 1, menekan Tambah.
3. Menghapus baris (tombol tong sampah) selama status `dikerjakan`: stok spare part dikembalikan.
4. **Tunda** (wajib catatan, misalnya "Menunggu kampas rem datang") → `tertunda`. **Lanjutkan** → `dikerjakan`.
5. **Selesai Dikerjakan** → `selesai`. Tombol tidak aktif bila Bagian C masih kosong: "Catat minimal 1 jasa atau spare part".

**Pemeriksaan hasil kerja (QC)** oleh Kepala Mekanik tim WO itu:
1. Membuka WO berstatus `selesai`, memeriksa mobil secara fisik.
2. **QC Lulus** → `siap_diambil`.
3. **QC Gagal** → wajib catatan (misalnya "Rem masih berbunyi") → kembali `dikerjakan`. Catatan tampil di riwayat WO.

**Bagian D. Tagihan** (Admin dan Owner; Kepala Mekanik hanya melihat)
- Tabel baris: Item, Jenis, Jumlah, Harga Master, Harga Dipakai, Subtotal. Baris yang harganya disesuaikan diberi ikon penanda; mengekliknya menampilkan alasan, pengubah, dan waktu.
- Ringkasan: Subtotal, Diskon, Total, Sudah Dibayar, Sisa.
- Owner juga melihat kolom Harga Modal dan Laba per baris, serta Laba WO.

**Penyesuaian harga** (Admin atau Owner, sebelum invoice terbit):
1. Menekan ikon pensil di baris → mengisi Harga Dipakai dan memilih **Alasan\***: Harga khusus pelanggan / Negosiasi / Harga paket / Koreksi harga master / Lainnya (wajib teks).
2. Sistem memanggil `sesuaikan_harga_item`. Harga master tidak berubah. Perubahan tercatat di *audit log*.
3. Bila harga dipakai di bawah harga modal, sistem memberi peringatan "Harga ini di bawah modal" tanpa menampilkan angka modal kepada Admin. Peringatan tidak menghalangi.

**Diskon total** (Admin atau Owner, sebelum invoice terbit): mengisi nominal diskon dan alasan.

**Menerbitkan invoice** (Admin atau Owner, status `siap_diambil`):
1. Menekan **Terbitkan Invoice**.
2. Sistem memanggil `terbitkan_invoice` dalam satu *transaction*: menghitung total, membuat nomor `INV-YYYYMM-0001`, mengunci tagihan.
3. Setelah terbit, baris tagihan dan diskon tidak bisa diubah lagi.
4. Tombol **Lihat Invoice** membuka `/work-orders/[id]/invoice` yang siap dicetak atau disimpan sebagai PDF lewat dialog cetak *browser*.

**Mencatat pembayaran** (Admin atau Owner, invoice sudah terbit):
1. Menekan **+ Pembayaran** → memilih Metode (Tunai / Transfer / QRIS) → mengisi Jumlah\*.
2. Sistem memanggil `catat_pembayaran`: status invoice menjadi `sebagian` atau `lunas`.
3. Jumlah tidak boleh melebihi sisa tagihan.

**Menyerahkan mobil** (Admin atau Owner):
1. Syarat: invoice `lunas`.
2. Mengunggah **Foto Kondisi Akhir\*** (1 sampai 4 foto).
3. Menekan **Serahkan Mobil** → status `diambil`, waktu diambil tercatat.

**Riwayat WO:** di bagian bawah rincian ada linimasa perubahan status (waktu, pelaku, dari, ke, catatan), diambil dari `wo_status_history`.

### 6.9 Invoice (halaman cetak)

Ukuran A4, berisi: logo dan data bengkel, nomor invoice, tanggal, nomor WO, data pelanggan dan kendaraan, tabel baris (item, jumlah, harga, subtotal), subtotal, diskon, total, status pembayaran, dan tanda tangan. **Tidak memuat** penanda penyesuaian harga, harga master, maupun harga modal.

### 6.10 Pengguna (hanya Owner)

**Tampilan:** Nama, Email, Peran, Aktif, Dibuat.

**Langkah Owner menambah pengguna:**
1. Owner membuat akun di Supabase Dashboard › Authentication › Users › **Add user** (email dan kata sandi sementara, centang *Auto Confirm User*).
2. *Trigger* membuat baris `profiles` dengan peran bawaan `kepala_mekanik` dan `aktif = false`.
3. Di halaman `/pengguna`, Owner mengisi Nama, memilih Peran, dan mengaktifkan akun.

**Aturan:** hanya Owner yang dapat mengubah peran dan status aktif. Pengguna tidak bisa mengubah perannya sendiri. Owner terakhir tidak bisa dinonaktifkan atau diturunkan perannya.

### 6.11 Setelan Bengkel (hanya Owner)

- Nama Bengkel\*, Alamat\*, Telepon\*, Jam Buka.
- **Logo**: diunggah ke bucket publik `publik/logo/`, dipakai di sidebar, halaman depan, dan invoice.
- **Galeri halaman depan**: 3 sampai 6 foto di `publik/galeri/`, bisa diurutkan dan dihapus.

### 6.12 Laporan Laba (hanya Owner)

- Penyaring periode (bawaan bulan ini).
- Kartu ringkasan: Pendapatan, Modal Spare Part, Laba Kotor, Margin %.
- Tabel per WO: No WO, Tanggal Invoice, Plat, Pendapatan, Modal, Laba, Margin. Laba minus ditandai merah.
- Angka dihitung oleh fungsi `laporan_laba(p_dari, p_sampai)` di database, bukan dihitung di *browser* dari seluruh baris.

### 6.13 Audit Log (hanya Owner)

- Tabel terbaru di atas: Waktu, Pelaku, Peran, Aksi, Data (tabel dan nomor), Sebelum, Sesudah, Alasan.
- Penyaring periode, pelaku, dan jenis aksi. Berhalaman 30 baris.
- Tidak ada tombol ubah atau hapus. Tidak ada peran yang bisa mengubah atau menghapus isinya.

---

## 7. Status Work Order

### 7.1 Daftar status

| Kode | Label | Warna | Arti |
|---|---|---|---|
| `menunggu` | Menunggu | Abu `#9E9E9E` | WO dibuat, belum dikerjakan |
| `dikerjakan` | Dikerjakan | Biru `#2196F3` | Mekanik sudah ditunjuk dan bekerja |
| `tertunda` | Tertunda | Kuning `#F59E0B` | Berhenti sementara, misalnya menunggu part |
| `selesai` | Selesai Dikerjakan | Ungu `#7E57C2` | Pengerjaan selesai, menunggu QC |
| `siap_diambil` | Siap Diambil | Hijau `#4CAF50` | Lulus QC, siap ditagih dan diambil |
| `diambil` | Diambil | Hijau tua `#2E7D32` | Lunas dan mobil sudah diserahkan |
| `dibatalkan` | Dibatalkan | Merah `#E53935` | Dibatalkan dengan alasan |

### 7.2 Perpindahan yang diizinkan

| Dari | Ke | Pelaku | Syarat |
|---|---|---|---|
| `menunggu` | `dikerjakan` | Kepala Mekanik tim WO, Owner | Minimal 1 mekanik dan estimasi selesai terisi |
| `dikerjakan` | `tertunda` | Kepala Mekanik tim WO, Owner | Catatan wajib |
| `tertunda` | `dikerjakan` | Kepala Mekanik tim WO, Owner | |
| `dikerjakan` | `selesai` | Kepala Mekanik tim WO, Owner | Minimal 1 baris tagihan |
| `selesai` | `siap_diambil` | Kepala Mekanik tim WO, Owner | QC lulus |
| `selesai` | `dikerjakan` | Kepala Mekanik tim WO, Owner | QC gagal, catatan wajib |
| `siap_diambil` | `diambil` | Admin, Owner | Invoice `lunas` dan minimal 1 foto kondisi akhir |
| `menunggu`, `dikerjakan`, `tertunda` | `dibatalkan` | Admin, Owner | Alasan wajib; spare part dikembalikan ke stok |

Perpindahan lain **ditolak**, misalnya `menunggu` → `siap_diambil`, `diambil` → apa pun, atau `dibatalkan` → apa pun.

### 7.3 Aturan tambahan

- Status **hanya** berubah lewat fungsi `ubah_status_wo`. Kolom `status` tidak bisa di-*update* langsung oleh siapa pun.
- Tombol status di tampilan hanya muncul untuk perpindahan yang sah bagi peran yang login, tetapi pemeriksaan sebenarnya ada di fungsi.
- Baris tagihan hanya bisa ditambah atau dihapus saat `dikerjakan`.
- Harga hanya bisa disesuaikan sebelum invoice terbit.
- Setiap perpindahan dicatat di `wo_status_history` dan `audit_logs`.

---

## 8. Skema Database

Semua tabel berada di skema `public`, kecuali fungsi bantuan peran di skema `private`. Semua tabel di `public` **wajib RLS menyala**. Uang disimpan sebagai `bigint` dalam rupiah (tanpa desimal).

### 8.1 Diagram relasi

```
auth.users 1──1 profiles ──┐ (kepala_mekanik)
                           ├──< mekanik
                           └──< work_orders >── vehicles >── customers
work_orders 1──< work_order_mekanik >── mekanik
work_orders 1──< work_order_photos
work_orders 1──< billing_items >── inventory_items 1──1 inventory_costs (rahasia)
billing_items 1──1 billing_item_costs (rahasia)
work_orders 1──1 invoices 1──< payments
inventory_items 1──< stock_movements
work_orders 1──< wo_status_history
audit_logs (dari trigger)   number_counters (penomoran)   workshop_settings (1 baris)
```

### 8.2 Tabel

**`profiles`**: satu baris per akun Supabase Auth.

| Kolom | Tipe | Aturan |
|---|---|---|
| `id` | `uuid` | PK, FK ke `auth.users(id)` on delete cascade |
| `nama` | `text` | not null |
| `email` | `text` | not null |
| `role` | `text` | not null, check in (`owner`, `admin`, `kepala_mekanik`) |
| `aktif` | `boolean` | not null, default `false` |
| `created_at` | `timestamptz` | default `now()` |

**`mekanik`**: data mekanik tanpa akun.

| Kolom | Tipe | Aturan |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `nama` | `text` | not null |
| `kepala_mekanik_id` | `uuid` | not null, FK ke `profiles(id)` |
| `aktif` | `boolean` | default `true` |
| `created_at` | `timestamptz` | default `now()` |

**`customers`**

| Kolom | Tipe | Aturan |
|---|---|---|
| `id` | `uuid` | PK |
| `tipe` | `text` | check in (`perorangan`, `perusahaan`), default `perorangan` |
| `nama` | `text` | not null |
| `telepon` | `text` | not null, unique, check `telepon ~ '^[0-9]{10,14}$'` |
| `email` | `text` | |
| `alamat` | `text` | |
| `created_at` | `timestamptz` | default `now()` |

**`vehicles`**

| Kolom | Tipe | Aturan |
|---|---|---|
| `id` | `uuid` | PK |
| `customer_id` | `uuid` | not null, FK ke `customers(id)` on delete restrict |
| `plat` | `text` | not null, unique (disimpan huruf kapital, satu spasi antarbagian) |
| `merek_model` | `text` | not null |
| `tahun` | `int` | check 1980 sampai tahun berjalan + 1 |
| `warna` | `text` | |
| `transmisi` | `text` | check in (`AT`, `MT`) |
| `created_at` | `timestamptz` | default `now()` |

**`inventory_items`**: spare part dan jasa.

| Kolom | Tipe | Aturan |
|---|---|---|
| `id` | `uuid` | PK |
| `kode` | `text` | not null, unique (`SP-0001` / `JS-0001`) |
| `jenis` | `text` | not null, check in (`part`, `jasa`) |
| `nama` | `text` | not null |
| `harga_jual` | `bigint` | not null, check ≥ 0 |
| `stok` | `int` | not null default 0, check ≥ 0; selalu 0 untuk jasa |
| `stok_minimum` | `int` | default 5 |
| `aktif` | `boolean` | default `true` |
| `created_at`, `updated_at` | `timestamptz` | |

**`inventory_costs`** (rahasia, hanya Owner)

| Kolom | Tipe | Aturan |
|---|---|---|
| `item_id` | `uuid` | PK, FK ke `inventory_items(id)` on delete cascade |
| `harga_modal` | `bigint` | not null, check ≥ 0 |
| `updated_at` | `timestamptz` | |

**`stock_movements`**

| Kolom | Tipe | Aturan |
|---|---|---|
| `id` | `bigint` | PK identity |
| `item_id` | `uuid` | not null, FK |
| `jenis` | `text` | check in (`masuk`, `keluar`, `kembali`, `penyesuaian`) |
| `jumlah` | `int` | not null (negatif untuk keluar dan penyesuaian turun) |
| `stok_sesudah` | `int` | not null |
| `keterangan` | `text` | |
| `work_order_id` | `uuid` | FK, boleh null |
| `dicatat_oleh` | `uuid` | FK ke `profiles(id)` |
| `created_at` | `timestamptz` | default `now()` |

**`work_orders`**

| Kolom | Tipe | Aturan |
|---|---|---|
| `id` | `uuid` | PK |
| `nomor` | `text` | not null, unique (`WO-YYMM-0001`) |
| `vehicle_id` | `uuid` | not null, FK ke `vehicles(id)` |
| `customer_id` | `uuid` | not null, FK ke `customers(id)` (pemilik saat WO dibuat) |
| `kepala_mekanik_id` | `uuid` | not null, FK ke `profiles(id)` (tim yang menangani) |
| `odometer` | `int` | not null, check ≥ 0 |
| `keluhan` | `text` | not null |
| `diagnosis` | `text` | |
| `status` | `text` | not null default `menunggu`, check in daftar 7.1 |
| `estimasi_selesai` | `date` | |
| `catatan_status` | `text` | catatan tunda / QC gagal / alasan batal terakhir |
| `diskon` | `bigint` | default 0, check ≥ 0 |
| `alasan_diskon` | `text` | |
| `selesai_at` | `timestamptz` | terisi saat `selesai` |
| `diambil_at` | `timestamptz` | terisi saat `diambil` |
| `dibuat_oleh` | `uuid` | FK ke `profiles(id)` |
| `created_at`, `updated_at` | `timestamptz` | |

**`work_order_mekanik`**

| Kolom | Tipe | Aturan |
|---|---|---|
| `work_order_id` | `uuid` | FK, on delete cascade |
| `mekanik_id` | `uuid` | FK |
| | | PK (`work_order_id`, `mekanik_id`) |

**`work_order_photos`**

| Kolom | Tipe | Aturan |
|---|---|---|
| `id` | `uuid` | PK |
| `work_order_id` | `uuid` | not null, FK on delete cascade |
| `jenis` | `text` | check in (`stnk`, `kondisi_awal`, `kondisi_akhir`, `pengerjaan`) |
| `path` | `text` | not null (path di bucket `foto-wo`, bukan URL) |
| `diunggah_oleh` | `uuid` | FK |
| `created_at` | `timestamptz` | |

**`billing_items`**: baris tagihan.

| Kolom | Tipe | Aturan |
|---|---|---|
| `id` | `uuid` | PK |
| `work_order_id` | `uuid` | not null, FK on delete cascade |
| `item_id` | `uuid` | not null, FK |
| `nama_item` | `text` | salinan nama saat ditambahkan |
| `jenis` | `text` | `part` / `jasa` |
| `jumlah` | `int` | check ≥ 1 |
| `harga_master` | `bigint` | harga jual saat ditambahkan, tidak berubah |
| `harga_dipakai` | `bigint` | awalnya sama dengan harga master |
| `alasan_penyesuaian` | `text` | wajib bila `harga_dipakai` ≠ `harga_master` |
| `disesuaikan_oleh` | `uuid` | FK, boleh null |
| `disesuaikan_at` | `timestamptz` | |
| `ditambah_oleh` | `uuid` | FK |
| `created_at` | `timestamptz` | |

Subtotal baris = `jumlah × harga_dipakai` (dihitung, tidak disimpan).

**`billing_item_costs`** (rahasia, hanya Owner)

| Kolom | Tipe | Aturan |
|---|---|---|
| `billing_item_id` | `uuid` | PK, FK on delete cascade |
| `harga_modal` | `bigint` | harga modal saat baris ditambahkan (jasa = 0) |

**`invoices`**

| Kolom | Tipe | Aturan |
|---|---|---|
| `id` | `uuid` | PK |
| `work_order_id` | `uuid` | not null, unique, FK |
| `nomor` | `text` | not null, unique (`INV-YYYYMM-0001`) |
| `subtotal` | `bigint` | |
| `diskon` | `bigint` | |
| `total` | `bigint` | |
| `terbayar` | `bigint` | default 0 |
| `status_bayar` | `text` | check in (`belum_bayar`, `sebagian`, `lunas`) |
| `diterbitkan_oleh` | `uuid` | FK |
| `diterbitkan_at` | `timestamptz` | |

**`payments`**

| Kolom | Tipe | Aturan |
|---|---|---|
| `id` | `uuid` | PK |
| `invoice_id` | `uuid` | not null, FK |
| `metode` | `text` | check in (`tunai`, `transfer`, `qris`) |
| `jumlah` | `bigint` | check > 0 |
| `dicatat_oleh` | `uuid` | FK |
| `created_at` | `timestamptz` | |

**`wo_status_history`**

| Kolom | Tipe | Aturan |
|---|---|---|
| `id` | `bigint` | PK identity |
| `work_order_id` | `uuid` | FK |
| `dari_status`, `ke_status` | `text` | |
| `catatan` | `text` | |
| `oleh` | `uuid` | FK |
| `created_at` | `timestamptz` | |

**`audit_logs`**

| Kolom | Tipe | Aturan |
|---|---|---|
| `id` | `bigint` | PK identity |
| `waktu` | `timestamptz` | default `now()` |
| `pelaku_id` | `uuid` | `auth.uid()` saat kejadian |
| `pelaku_peran` | `text` | peran saat kejadian |
| `aksi` | `text` | `INSERT` / `UPDATE` / `DELETE` / nama fungsi |
| `tabel` | `text` | |
| `data_id` | `text` | id atau nomor data |
| `sebelum` | `jsonb` | |
| `sesudah` | `jsonb` | |
| `alasan` | `text` | |

**`number_counters`**: penomoran tanpa ganda.

| Kolom | Tipe | Aturan |
|---|---|---|
| `jenis` | `text` | `WO` / `INV` / `SP` / `JS` |
| `periode` | `text` | `2610` untuk WO, `202610` untuk INV, `-` untuk kode item |
| `terakhir` | `int` | default 0 |
| | | PK (`jenis`, `periode`) |

**`workshop_settings`**: satu baris (`id = 1`).

| Kolom | Tipe |
|---|---|
| `id` | `int` PK, check `id = 1` |
| `nama`, `alamat`, `telepon`, `jam_buka` | `text` |
| `logo_path` | `text` (path di bucket `publik`) |
| `galeri_paths` | `text[]` |
| `updated_at` | `timestamptz` |

### 8.3 Indeks

- `work_orders (status)`, `work_orders (kepala_mekanik_id, status)`, `work_orders (created_at desc)`
- `vehicles (customer_id)`, `billing_items (work_order_id)`, `stock_movements (item_id, created_at desc)`
- `audit_logs (waktu desc)`, `payments (invoice_id)`

---

## 9. Database Function dan Trigger

Semua fungsi yang mengubah data penting ditulis sebagai fungsi PostgreSQL dan dipanggil dari aplikasi dengan `supabase.rpc()`. Satu panggilan fungsi berjalan sebagai satu *transaction*: semua langkah berhasil, atau semua dibatalkan.

### 9.1 Fungsi bantuan peran

| Fungsi | Isi |
|---|---|
| `private.peran_saya()` returns `text` | Peran pengguna yang login dari `profiles`, hanya bila `aktif = true` |
| `private.tim_wo(wo_id uuid)` returns `uuid` | `kepala_mekanik_id` dari WO |
| `private.nomor_berikut(jenis text, periode text)` returns `int` | Menaikkan dan mengembalikan nomor urut di `number_counters` (baris dikunci, tidak pernah ganda) |

Ketiganya `security definer` dengan `set search_path = ''`, diletakkan di skema `private` agar tidak terbuka lewat Data API, dan `execute` dicabut dari `anon`.

### 9.2 Fungsi bisnis

| Fungsi | Dipanggil oleh | Isi singkat |
|---|---|---|
| `buat_work_order(p_vehicle_id, p_kepala_mekanik_id, p_odometer, p_keluhan)` returns `uuid` | Admin, Owner | Kunci baris `number_counters` (WO, periode bulan ini), naikkan nomor, buat WO `menunggu`, catat riwayat |
| `tugaskan_mekanik(p_wo, p_mekanik uuid[], p_estimasi date)` | Kepala Mekanik tim WO, Owner | Periksa hubungan: pemanggil adalah `kepala_mekanik_id` WO (atau Owner), semua mekanik dari tim itu dan aktif, status `menunggu`. Simpan mekanik dan estimasi |
| `ubah_status_wo(p_wo, p_status, p_catatan)` | Sesuai Bab 7.2 | Kunci baris WO (`for update`), cocokkan pasangan status dan pelaku dengan tabel 7.2, periksa syarat, ubah status, isi `selesai_at` / `diambil_at`, catat riwayat. Saat `dibatalkan`: kembalikan stok semua baris part |
| `tambah_item_tagihan(p_wo, p_item, p_jumlah)` | Kepala Mekanik tim WO, Owner | Status harus `dikerjakan`. Kunci baris item (`for update`), cek stok, kurangi stok, catat `stock_movements` (keluar), simpan `billing_items` dengan `harga_master = harga_dipakai = harga_jual`, simpan `billing_item_costs` dengan harga modal saat itu |
| `hapus_item_tagihan(p_billing_item)` | Kepala Mekanik tim WO, Owner | Status harus `dikerjakan`. Kembalikan stok (`kembali`), hapus baris |
| `sesuaikan_harga_item(p_billing_item, p_harga, p_alasan)` | Admin, Owner | Invoice belum terbit, alasan wajib, `harga_baru ≥ 0`. Mengembalikan `true` bila di bawah modal (tanpa mengirim angka modal) |
| `atur_diskon(p_wo, p_diskon, p_alasan)` | Admin, Owner | Invoice belum terbit, diskon ≤ subtotal |
| `terbitkan_invoice(p_wo)` returns `uuid` | Admin, Owner | Status `siap_diambil`, belum ada invoice. Kunci `number_counters` (INV), hitung subtotal, diskon, total, buat invoice `belum_bayar` |
| `catat_pembayaran(p_invoice, p_metode, p_jumlah)` | Admin, Owner | Jumlah ≤ sisa. Tambah `payments`, perbarui `terbayar` dan `status_bayar` |
| `catat_stok_masuk(p_item, p_jumlah, p_keterangan)` | Admin, Owner | Item `part`, jumlah ≥ 1. Kunci item, tambah stok, catat pergerakan |
| `sesuaikan_stok(p_item, p_stok_fisik, p_alasan)` | Owner | Hitung selisih, ubah stok, catat pergerakan `penyesuaian` |

Nama parameter memakai awalan `p_` dan harus **persis** seperti di tabel, karena `supabase.rpc()` mencocokkan argumen berdasarkan nama parameter. Contohnya `supabase.rpc('ubah_status_wo', { p_wo: id, p_status: 'dikerjakan' })`.

Setiap fungsi di atas: `security definer`, `set search_path = ''`, memeriksa peran lewat `private.peran_saya()` di baris pertama, dan menolak dengan pesan berbahasa Indonesia, misalnya `raise exception 'Hanya Kepala Mekanik tim ini yang boleh mengubah status WO ini'`. `execute` dicabut dari `public` dan `anon`, diberikan ke `authenticated`.

### 9.3 Fungsi dashboard dan laporan

Agregasi dihitung di database dan dikirim sebagai angka ringkas, bukan seluruh baris (hemat *egress*).

| Fungsi | Untuk | Mengembalikan |
|---|---|---|
| `dashboard_ringkasan(p_dari, p_sampai)` | Semua peran (isi disesuaikan peran) | `jsonb` berisi angka kartu KPI |
| `dashboard_pendapatan_harian(p_dari, p_sampai)` | Owner, Admin | Baris `tanggal, pendapatan_jasa, pendapatan_part` |
| `dashboard_wo_per_status(p_tim uuid default null)` | Semua | Baris `status, jumlah` |
| `dashboard_beban_mekanik(p_dari, p_sampai, p_tim uuid default null)` | Owner, Kepala Mekanik | Baris `mekanik, tim, wo_aktif, wo_selesai` |
| `dashboard_wo_selesai_harian(p_dari, p_sampai)` | Owner, Kepala Mekanik | Baris `tanggal, jumlah` |
| `dashboard_top_item(p_dari, p_sampai, p_jenis)` | Owner, Admin | 5 item terbanyak terjual: `nama, jumlah, pendapatan` |
| `dashboard_laba_harian(p_dari, p_sampai)` | Owner | Baris `tanggal, pendapatan, modal, laba` |
| `laporan_laba(p_dari, p_sampai)` | Owner | Baris per WO: nomor, tanggal invoice, plat, pendapatan, modal, laba, margin |

Fungsi yang memuat modal atau laba menolak bila pemanggil bukan Owner. Kepala Mekanik hanya menerima data timnya.

Semua fungsi di 9.3 **sudah disediakan di starter** (`supabase/dashboard.sql`) dan dipasang lewat *prompt* MCP. Peserta fokus membangun tampilan dashboard-nya.

### 9.4 Trigger

| Trigger | Tabel | Isi |
|---|---|---|
| `on_auth_user_created` | `auth.users` after insert | Buat `profiles` (nama dari email, `role = kepala_mekanik`, `aktif = false`) |
| `set_updated_at` | tabel yang punya `updated_at` | Isi `updated_at = now()` |
| `rapikan_plat` | `vehicles` before insert/update | Plat menjadi huruf kapital, spasi ganda dirapikan |
| `set_kode_item` | `inventory_items` before insert | Isi `kode` otomatis (`SP-0001` / `JS-0001`) lewat `private.nomor_berikut` bila kosong |
| `jaga_profil` | `profiles` before update | Hanya Owner yang boleh mengubah `role` dan `aktif`; Owner terakhir tidak boleh diturunkan atau dinonaktifkan |
| `jaga_wo` | `work_orders` before update | Update langsung hanya untuk kolom yang diizinkan Bab 10.2: `keluhan`, `odometer`, `kepala_mekanik_id` oleh Admin atau Owner saat `menunggu`; `diagnosis` oleh Kepala Mekanik tim WO atau Owner saat `dikerjakan`/`tertunda` |
| `catat_audit` | `work_orders`, `billing_items`, `billing_item_costs`, `inventory_items`, `inventory_costs`, `invoices`, `payments`, `stock_movements`, `profiles` after insert/update/delete | Tulis baris ke `audit_logs`: pelaku, peran, aksi, tabel, id, sebelum, sesudah, alasan (diambil dari kolom alasan bila ada) |

Fungsi *trigger* `jaga_profil` dan `jaga_wo` ditulis **tanpa** `security definer`. Keduanya memeriksa `current_user` untuk mengetahui apakah perubahan datang dari aplikasi (`authenticated`) atau dari fungsi Bab 9.2, sehingga harus berjalan dengan hak pengguna yang memicunya.

---

## 10. Aturan Akses (RLS)

### 10.1 Prinsip

1. RLS menyala di **semua** tabel `public`.
2. Tidak ada *policy* `using (true)` untuk operasi tulis.
3. Perubahan penting (status, stok, tagihan, invoice, pembayaran) **tidak lewat `update` langsung**. Hak `insert/update/delete` untuk tabel itu dicabut dari `authenticated`; perubahan hanya lewat fungsi Bab 9.
4. Peran dibaca dengan `(select private.peran_saya())` di dalam *policy*.
5. Akun nonaktif tidak lolos *policy* apa pun karena `peran_saya()` mengembalikan `null`.

### 10.2 Matriks

Keterangan: **S** = select, **I** = insert, **U** = update, **D** = delete, **F** = hanya lewat fungsi, **-** = tidak boleh.

| Tabel | Owner | Admin | Kepala Mekanik |
|---|---|---|---|
| `profiles` | S semua, U (role/aktif/nama) | S semua (nama dan peran saja dipakai), U nama sendiri | S semua, U nama sendiri |
| `mekanik` | S, I, U | S | S, I dan U untuk timnya (`kepala_mekanik_id = auth.uid()`) |
| `customers` | S, I, U, D | S, I, U, D | S |
| `vehicles` | S, I, U, D | S, I, U, D | S |
| `inventory_items` | S, I, U (kecuali `stok`) | S, I (kecuali `stok`) | S |
| `inventory_costs` | S, I, U | - | - |
| `stock_movements` | S, F | S, F | S |
| `work_orders` | S, F | S, F, U `keluhan`/`odometer`/`kepala_mekanik_id` saat `menunggu` | S, F, U `diagnosis` bila timnya dan status `dikerjakan`/`tertunda` |
| `work_order_mekanik` | S, F | S | S, F |
| `work_order_photos` | S, I, D | S, I | S, I bila timnya |
| `billing_items` | S, F | S, F | S bila timnya, F |
| `billing_item_costs` | S | - | - |
| `invoices` | S, F | S, F | S bila timnya |
| `payments` | S, F | S, F | - |
| `wo_status_history` | S | S | S |
| `audit_logs` | S | - | - |
| `number_counters` | - (hanya fungsi) | - | - |
| `workshop_settings` | S, U | S | S |

`workshop_settings` juga boleh di-*select* oleh `anon` (dibutuhkan halaman depan publik), terbatas pada kolom nama, alamat, telepon, jam buka, logo, dan galeri.

Kolom `inventory_items.stok` dicabut dari hak `update` semua peran (*column privilege*); stok hanya berubah lewat fungsi.

### 10.3 Uji akses wajib

| Uji | Akun | Hasil yang benar |
|---|---|---|
| Kepala Mekanik tim A mengubah status WO tim B lewat Console | Pak Joko | Ditolak |
| Admin membaca `inventory_costs` lewat Console | Rina | 0 baris |
| Admin mengubah `status` WO langsung lewat `update` | Rina | Ditolak |
| Dua tab menambah stok terakhir spare part bersamaan | Pak Joko | Satu berhasil, satu "Stok ... hanya 0" |
| Siapa pun menghapus baris `audit_logs` | Semua | Ditolak |
| Kepala Mekanik mengubah perannya sendiri jadi `owner` | Pak Joko | Ditolak |
| Membuka URL foto STNK tanpa login | Publik | Ditolak |

---

## 11. Storage

### 11.1 Bucket

| Bucket | Jenis | Isi | Path |
|---|---|---|---|
| `publik` | **Publik** | Logo bengkel dan galeri halaman depan | `logo/<nama-file>`, `galeri/<nama-file>` |
| `foto-wo` | **Privat** | Foto STNK, kondisi awal, pengerjaan, kondisi akhir | `<work_order_id>/<jenis>/<uuid>.webp` |

**Kenapa dibedakan:** logo dan galeri memang untuk dilihat siapa saja, jadi disajikan lewat URL publik tanpa login. Foto STNK memuat data pribadi pemilik kendaraan, dan foto kondisi mobil adalah bukti pekerjaan, jadi hanya boleh dibuka pengguna yang login dan berhak.

**Pengaturan bucket:**

| Bucket | Batas ukuran per file | Tipe file |
|---|---|---|
| `publik` | 1 MB | `image/webp`, `image/jpeg`, `image/png` |
| `foto-wo` | 1 MB | `image/webp`, `image/jpeg` |

### 11.2 Policy di `storage.objects`

| Bucket | Operasi | Boleh |
|---|---|---|
| `publik` | Unduh / tampil | Siapa pun (bucket publik, tanpa *policy* select) |
| `publik` | Unggah, ganti, hapus | Owner |
| `foto-wo` | Lihat (select) | Semua pengguna login yang aktif |
| `foto-wo` | Unggah `stnk`, `kondisi_awal` | Admin dan Owner, saat WO `menunggu` |
| `foto-wo` | Unggah `kondisi_akhir` | Admin dan Owner, saat WO `siap_diambil` |
| `foto-wo` | Unggah foto pengerjaan (opsional, folder `pengerjaan`) | Kepala Mekanik tim WO itu, saat `dikerjakan` |
| `foto-wo` | Hapus | Owner |

Folder pertama path (`storage.foldername(name)[1]`) adalah `work_order_id`, dipakai *policy* untuk mencocokkan WO dan timnya.

### 11.3 Cara aplikasi menampilkan foto

- Bucket `publik`: `getPublicUrl(path)`.
- Bucket `foto-wo`: `createSignedUrls(paths, 600)` (berlaku 10 menit), dipanggil sekali untuk semua foto di satu WO.
- Tabel menyimpan **path**, bukan URL.

### 11.4 Hemat ukuran dan *egress*

- Foto diperkecil di *browser* sebelum diunggah: sisi terpanjang maksimal 1600 px, format WebP, mutu 0,8. Target di bawah 400 KB.
- Daftar dan kisi foto memakai *thumbnail* kecil (lebar 320 px) yang dibuat saat unggah dan disimpan di subfolder `thumb/`; foto ukuran penuh hanya dimuat saat diklik.
- `cacheControl: '31536000'` untuk file di bucket `publik` (logo dan galeri jarang berubah; ganti nama file bila diperbarui).

---

## 12. Dashboard

Dashboard adalah halaman pertama setelah login. Isinya berbeda per peran, tetapi bahasa visualnya sama: kartu KPI di atas, grafik di tengah, daftar tindakan di bawah. Semua angka dihitung *database function* (Bab 9.3).

### 12.1 Prinsip desain

- **Imersif dan intuitif:** angka penting terbaca dalam 5 detik; setiap kartu dan grafik bisa diklik untuk menuju data sumbernya (misalnya klik batang "Tertunda" membuka daftar WO tertunda).
- **Penyaring periode** di kanan atas: Hari ini / 7 hari / 30 hari / Bulan ini / Rentang khusus. Semua kartu dan grafik ikut berubah.
- **Kartu KPI** menampilkan angka besar, label, dan perbandingan dengan periode sebelumnya (panah naik/turun hijau atau merah, misalnya "▲ 12% dari minggu lalu"), serta *sparkline* kecil 7 hari.
- **Grafik** memakai Recharts lewat komponen Chart shadcn/ui: *tooltip* saat diarahkan, legenda bisa diklik untuk menyembunyikan seri, animasi halus saat dimuat, warna konsisten dengan warna status (Bab 7.1).
- **Kerangka (*skeleton*)** saat memuat, dan **status kosong** yang ramah bila belum ada data ("Belum ada WO di periode ini").
- **Responsif:** di layar sempit kartu menjadi 2 kolom, grafik bertumpuk.
- Angka uang memakai format `Rp12.500.000` dan versi ringkas di sumbu grafik (`12,5 jt`). Angka memakai `tabular-nums`.

### 12.2 Dashboard Owner

| Bagian | Isi | Bentuk |
|---|---|---|
| Kartu KPI (6) | Pendapatan, Laba Kotor, Margin %, WO Aktif, WO Terlambat, Piutang | Kartu dengan perbandingan periode dan *sparkline* |
| Pendapatan dan laba | Pendapatan harian (jasa dan spare part bertumpuk) dengan garis laba | *Area chart* bertumpuk + garis |
| Komposisi pendapatan | Jasa vs spare part | *Donut chart* dengan total di tengah |
| WO per status | Jumlah WO di setiap status | *Bar chart* horizontal dengan warna status, bisa diklik |
| Beban tim | WO aktif per mekanik, dikelompokkan per tim Kepala Mekanik | *Bar chart* bertumpuk |
| Top 5 spare part dan jasa | Item terlaris dan pendapatannya | Daftar peringkat dengan batang kecil |
| Perhatian | WO terlambat, stok habis/menipis, baris tagihan di bawah modal | Daftar dengan *badge* merah/kuning, bisa diklik |
| Aktivitas terbaru | 8 baris terakhir dari *audit log* | Linimasa |

### 12.3 Dashboard Admin

Tanpa harga modal, laba, dan margin.

| Bagian | Isi | Bentuk |
|---|---|---|
| Aksi cepat | Tombol **+ Work Order** dan kolom cari plat | Baris atas |
| Kartu KPI (4) | Mobil masuk hari ini, Siap Diambil, Perlu Ditagih, Pendapatan hari ini | Kartu |
| Pendapatan 7 hari | Pendapatan harian | *Bar chart* |
| WO per status | Komposisi status | *Donut chart* |
| Perlu Ditagih | WO `siap_diambil` yang invoice-nya belum terbit atau belum lunas | Tabel ringkas dengan tombol buka |
| Siap Diserahkan | WO lunas yang belum `diambil` | Tabel ringkas |
| Stok menipis | Spare part dengan stok ≤ stok minimum | Daftar dengan *progress bar* stok vs minimum |

### 12.4 Dashboard Kepala Mekanik

Hanya data timnya. Tanpa harga modal dan laba.

| Bagian | Isi | Bentuk |
|---|---|---|
| Kartu KPI (4) | Menunggu Ditugaskan, Sedang Dikerjakan, Menunggu QC, Terlambat | Kartu |
| Beban mekanik | WO aktif dan WO selesai periode ini per mekanik di timnya | *Bar chart* berkelompok |
| WO selesai per hari | Jumlah WO tim yang mencapai `selesai` per hari | *Line chart* |
| Antrean tim | WO tim berstatus `menunggu`, `dikerjakan`, `tertunda`, `selesai`, diurutkan estimasi terdekat, dengan *badge* Terlambat | Papan kolom (*kanban* baca saja) atau tabel |
| QC hari ini | WO `selesai` yang menunggu QC | Daftar dengan tombol QC |

---

## 13. Identitas Visual

Mengikuti PRD Cemerlang Jaya Motor v3: tema terang, sidebar dengan ikon, panel putih, aksen biru.

| Token | Nilai | Pakai untuk |
|---|---|---|
| `--primary` | `#2196F3` | Tombol utama, tab aktif, tautan |
| `--primary-strong` | `#1976D2` | Ikon aktif, teks di atas latar biru muda |
| `--primary-soft` | `#DCEBFB` | Menu aktif, tombol lunak |
| `--bg-app` | `#F2F9FE` | Latar aplikasi dan sidebar |
| `--bg-panel` | `#FFFFFF` | Panel dan kartu |
| `--border` | `#EAF2FA` | Garis |
| `--text` | `#212121` | Teks utama |
| `--text-body` | `#4A5565` | Teks isi |
| `--text-muted` | `#757575` | Label kecil |
| `--success` | `#2E7D32` | Lunas, naik |
| `--warning` | `#F59E0B` | Tertunda, menipis |
| `--danger` | `#E53935` | Terlambat, ditolak, turun |

- Font: Inter (400, 500, 600, 700).
- Radius: kartu 12 px, tombol 10 px, *badge* bulat penuh.
- Bayangan kartu: `0 1px 4px rgba(16,24,40,.06)`.
- Warna status WO mengikuti tabel 7.1, dipakai sama di *badge*, tab, dan grafik.

---

## 14. Kebutuhan Non-Fungsional

| Aspek | Ketentuan |
|---|---|
| Keamanan | Semua aturan akses di database (RLS dan fungsi), bukan hanya di tampilan. Tidak ada *secret key* di kode. `.env.local` tidak ikut ke GitHub |
| Hemat *egress* | Ambil kolom yang ditampilkan saja; daftar berhalaman 20 baris; dashboard dari fungsi agregasi; foto diperkecil dan memakai *thumbnail* |
| Kinerja | Halaman daftar terbuka di bawah 2 detik dengan 500 WO |
| Bahasa | Antarmuka berbahasa Indonesia |
| Perangkat | Nyaman di laptop; tetap terbaca di tablet |
| Pesan error | Bahasa Indonesia, menjelaskan apa yang salah dan apa yang bisa dilakukan |
| Tipe data | Semua kode TypeScript dengan tipe dari `src/types/database.ts`; tidak memakai `any` |

---

## 15. Data Contoh dan Akun Uji

### 15.1 Akun uji

Dibuat di Supabase Dashboard › Authentication › Users › Add user (centang *Auto Confirm User*), lalu peran diisi lewat *prompt* MCP.

| Nama | Email | Kata sandi | Peran | Tim |
|---|---|---|---|---|
| Pak Darto | `owner@cemerlangjaya.test` | `Bengkel123!` | `owner` | |
| Rina | `admin@cemerlangjaya.test` | `Bengkel123!` | `admin` | |
| Pak Joko | `joko@cemerlangjaya.test` | `Bengkel123!` | `kepala_mekanik` | Tim A |
| Pak Slamet | `slamet@cemerlangjaya.test` | `Bengkel123!` | `kepala_mekanik` | Tim B |

Kata sandi ini hanya untuk latihan di kelas, jangan dipakai untuk aplikasi sungguhan.

### 15.2 Mekanik

| Nama | Tim |
|---|---|
| Andi, Bayu | Pak Joko (Tim A) |
| Dedi, Eko | Pak Slamet (Tim B) |

### 15.3 Data awal

- **Spare part (10):** Oli Mesin 4L (Rp450.000, modal Rp360.000, stok 20), Filter Oli (Rp75.000 / Rp50.000 / 15), Kampas Rem Depan (Rp350.000 / Rp260.000 / 6), Aki 45Ah (Rp950.000 / Rp780.000 / 2), Busi Iridium (Rp120.000 / Rp85.000 / 24), Filter Udara (Rp110.000 / Rp70.000 / 8), Minyak Rem (Rp65.000 / Rp40.000 / 4), V-Belt (Rp280.000 / Rp200.000 / 3), Wiper Blade (Rp95.000 / Rp60.000 / 10), Lampu H4 (Rp85.000 / Rp55.000 / 1).
- **Jasa (6):** Ganti Oli (Rp50.000), Tune-up (Rp350.000), Servis Rem (Rp150.000), Spooring dan Balancing (Rp250.000), Cek Kelistrikan (Rp100.000), Servis AC (Rp300.000).
- **Pelanggan (5) dan kendaraan (7)**, salah satu pelanggan punya 3 mobil.
- **WO contoh (12)** tersebar di semua status dalam 30 hari terakhir: 5 diambil (invoice lunas), 1 dibatalkan, 2 siap diambil (1 invoice sebagian, 1 belum ditagih), 1 selesai menunggu QC, 1 dikerjakan dan 1 tertunda (keduanya terlambat), 1 menunggu. Dashboard langsung berisi grafik.

Semua tabel Bab 8, fungsi bantuan 9.1, *trigger* dasar, dan RLS Bab 10 disediakan di starter (`supabase/migrations/01_dasar.sql`). Data awal juga disediakan (`supabase/seed.sql`). Ketua kelompok menjalankan keduanya lewat *prompt* MCP saat persiapan: `01_dasar.sql` dulu, lalu empat akun uji diberi peran, lalu `seed.sql`. Nama tabel dan kolom tidak boleh diubah karena `seed.sql` dan `dashboard.sql` bergantung padanya.

### 15.4 Pembagian fitur untuk kelompok

Di Sesi 9 aplikasi dibangun kelompok empat orang. Setiap anggota melengkapi kerangka halaman satu fitur di *branch* sendiri, lalu menggabungkannya lewat *pull request*.

| Fitur | Halaman | *Database function* dan lainnya | *Branch* |
|---|---|---|---|
| A. *Work Order* | `/work-orders`, `/work-orders/baru`, `/work-orders/[id]` | `buat_work_order`, `tugaskan_mekanik`, `ubah_status_wo`, *trigger* `jaga_wo`, *bucket* `foto-wo` | `fitur/work-order` |
| B. Tagihan dan *Invoice* | `/work-orders/[id]/tagihan`, `/work-orders/[id]/invoice` | `tambah_item_tagihan`, `hapus_item_tagihan`, `sesuaikan_harga_item`, `atur_diskon`, `terbitkan_invoice`, `catat_pembayaran` | `fitur/tagihan` |
| C. Inventory dan Pengguna | `/inventory`, `/pengguna`, `/setelan` | `catat_stok_masuk`, `sesuaikan_stok`, *bucket* `publik` | `fitur/inventory` |
| D. *Dashboard* dan *Audit Log* | `/dashboard`, `/audit-log`, `/laporan-laba` | isi `dashboard.sql`, *trigger* `catat_audit` | `fitur/dashboard` |

Setiap SQL fitur disimpan di `supabase/migrations/fitur_<nama>.sql` supaya ikut terlihat di *pull request*. Halaman depan publik (6.2) dikerjakan setelah sesi.

---

## 16. Kriteria Selesai

| Modul | Selesai bila |
|---|---|
| Login dan *route guard* | Empat akun bisa masuk; menu sidebar berbeda per peran; membuka `/audit-log` sebagai Rina dialihkan ke dashboard; akun nonaktif tidak bisa masuk |
| Pelanggan dan kendaraan | Bisa menambah pelanggan dengan 2 mobil; plat ganda ditolak; riwayat servis tampil |
| Inventory | Rina tidak melihat kolom harga modal dan `inventory_costs` kosong untuknya di Console; stok masuk menambah stok dan tercatat di riwayat |
| Work Order | WO baru dari plat lama terisi otomatis; nomor WO berurutan; foto STNK tidak bisa dibuka tanpa login |
| Pengerjaan | Pak Joko bisa memulai dan mencatat part di WO Tim A, ditolak di WO Tim B; stok berkurang; dua tab bersamaan untuk stok terakhir hanya satu yang berhasil |
| Status | Semua perpindahan di tabel 7.2 berjalan; perpindahan lain ditolak oleh fungsi walaupun dipanggil lewat Console |
| Tagihan dan invoice | Penyesuaian harga tanpa alasan ditolak; nomor invoice tidak ganda; tagihan terkunci setelah terbit; invoice tercetak rapi |
| Pembayaran dan penyerahan | Pembayaran sebagian lalu lunas; WO hanya bisa `diambil` setelah lunas dan foto kondisi akhir terunggah |
| *Audit log* | Perubahan status, harga, stok, invoice, dan pembayaran tercatat; tidak ada peran yang bisa menghapusnya |
| Dashboard | Tiga dashboard berbeda per peran; grafik berubah saat periode diganti; klik grafik membuka data sumber |
| Halaman depan | Logo dan galeri tampil tanpa login dari bucket `publik` |
| Tayang | Aplikasi terbuka di URL Netlify dan bisa login |

---

## 17. Di Luar Lingkup

| Tidak dibangun | Alasan |
|---|---|
| Akun untuk mekanik | Mekanik dicatat sebagai data; Kepala Mekanik yang memegang aplikasi |
| Login Google | Eksplorasi mandiri (Modul Bacaan 6 Sesi 8) |
| Purchase Order, pemasok, dan biaya operasional | Diganti fitur Stok Masuk yang sederhana |
| Laba bersih dan buku kas | Cukup laba kotor per WO dan per periode |
| Kalender, pengingat servis, email, WhatsApp | Tahap berikutnya |
| Portal pelanggan dan booking online | Pelanggan tidak login |
| Multi-cabang | Satu bengkel |
| Pencadangan otomatis dan ekspor Excel | Tahap berikutnya |

---

## 18. Kamus Istilah

| Istilah | Arti |
|---|---|
| Work Order (WO) | Satu dokumen untuk satu kunjungan mobil, dari datang sampai diambil |
| Tim | Kelompok mekanik di bawah satu Kepala Mekanik |
| QC | Pemeriksaan hasil kerja oleh Kepala Mekanik sebelum mobil siap diambil |
| Harga master | Harga jual baku di Inventory |
| Harga dipakai | Harga di baris tagihan, boleh berbeda dari harga master dengan alasan |
| Harga modal | Harga beli spare part, hanya terlihat oleh Owner |
| Laba kotor | Pendapatan dikurangi harga modal spare part |
| Invoice | Tagihan resmi bernomor yang dicetak untuk pelanggan setelah QC lulus |
| *Audit log* | Catatan otomatis siapa mengubah apa, kapan, sebelum, sesudah, dan alasannya |
| Pemeriksaan hubungan | Memastikan pengguna bukan hanya punya peran yang tepat, tetapi juga terhubung dengan data yang diubahnya (WO timnya sendiri) |
| *Transaction* | Beberapa langkah yang berjalan sebagai satu kesatuan: semua berhasil atau semua dibatalkan |
| Bucket publik / privat | Wadah file di Supabase Storage; publik bisa diunduh siapa pun, privat hanya oleh pengguna yang lolos *policy* |
| Path | Alamat file di dalam bucket, misalnya `8f2c.../stnk/a1b2.webp` |
| *Signed URL* | Alamat file privat yang berlaku sementara |
| *Egress* | Jumlah data yang keluar dari Supabase ke pengguna, dihitung per bulan |
