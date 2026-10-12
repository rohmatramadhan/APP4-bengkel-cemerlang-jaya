-- =============================================================
-- App 4 Cemerlang Jaya Motor · 01 Dasar (disediakan di starter)
-- Tabel PRD Bab 8, fungsi bantuan 9.1, trigger dasar 9.4, RLS Bab 10.
-- Dijalankan ketua kelompok saat persiapan, sebelum seed.sql.
-- =============================================================

create schema if not exists private;

-- ---------- Akun dan peran ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  email text not null,
  role text not null default 'kepala_mekanik'
    check (role in ('owner', 'admin', 'kepala_mekanik')),
  aktif boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.mekanik (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  kepala_mekanik_id uuid not null references public.profiles(id),
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- Pelanggan dan kendaraan ----------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  tipe text not null default 'perorangan' check (tipe in ('perorangan', 'perusahaan')),
  nama text not null,
  telepon text not null unique check (telepon ~ '^[0-9]{10,14}$'),
  email text,
  alamat text,
  created_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete restrict,
  plat text not null unique,
  merek_model text not null,
  tahun int check (tahun between 1980 and extract(year from now())::int + 1),
  warna text,
  transmisi text check (transmisi in ('AT', 'MT')),
  created_at timestamptz not null default now()
);

-- ---------- Inventory ----------
create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  kode text not null unique,
  jenis text not null check (jenis in ('part', 'jasa')),
  nama text not null,
  harga_jual bigint not null check (harga_jual >= 0),
  stok int not null default 0 check (stok >= 0),
  stok_minimum int not null default 5,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jasa_tanpa_stok check (jenis = 'part' or stok = 0)
);

create table public.inventory_costs (
  item_id uuid primary key references public.inventory_items(id) on delete cascade,
  harga_modal bigint not null check (harga_modal >= 0),
  updated_at timestamptz not null default now()
);

-- ---------- Work order ----------
create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  nomor text not null unique,
  vehicle_id uuid not null references public.vehicles(id),
  customer_id uuid not null references public.customers(id),
  kepala_mekanik_id uuid not null references public.profiles(id),
  odometer int not null check (odometer >= 0),
  keluhan text not null,
  diagnosis text,
  status text not null default 'menunggu'
    check (status in ('menunggu', 'dikerjakan', 'tertunda', 'selesai', 'siap_diambil', 'diambil', 'dibatalkan')),
  estimasi_selesai date,
  catatan_status text,
  diskon bigint not null default 0 check (diskon >= 0),
  alasan_diskon text,
  selesai_at timestamptz,
  diambil_at timestamptz,
  dibuat_oleh uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.work_order_mekanik (
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  mekanik_id uuid not null references public.mekanik(id),
  primary key (work_order_id, mekanik_id)
);

create table public.work_order_photos (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  jenis text not null check (jenis in ('stnk', 'kondisi_awal', 'kondisi_akhir', 'pengerjaan')),
  path text not null,
  diunggah_oleh uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.stock_movements (
  id bigint generated always as identity primary key,
  item_id uuid not null references public.inventory_items(id),
  jenis text not null check (jenis in ('masuk', 'keluar', 'kembali', 'penyesuaian')),
  jumlah int not null,
  stok_sesudah int not null,
  keterangan text,
  work_order_id uuid references public.work_orders(id),
  dicatat_oleh uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- Tagihan ----------
create table public.billing_items (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  item_id uuid not null references public.inventory_items(id),
  nama_item text not null,
  jenis text not null check (jenis in ('part', 'jasa')),
  jumlah int not null check (jumlah >= 1),
  harga_master bigint not null check (harga_master >= 0),
  harga_dipakai bigint not null check (harga_dipakai >= 0),
  alasan_penyesuaian text,
  disesuaikan_oleh uuid references public.profiles(id),
  disesuaikan_at timestamptz,
  ditambah_oleh uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint alasan_bila_disesuaikan check (harga_dipakai = harga_master or alasan_penyesuaian is not null)
);

create table public.billing_item_costs (
  billing_item_id uuid primary key references public.billing_items(id) on delete cascade,
  harga_modal bigint not null default 0
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null unique references public.work_orders(id),
  nomor text not null unique,
  subtotal bigint not null,
  diskon bigint not null default 0,
  total bigint not null,
  terbayar bigint not null default 0,
  status_bayar text not null default 'belum_bayar' check (status_bayar in ('belum_bayar', 'sebagian', 'lunas')),
  diterbitkan_oleh uuid references public.profiles(id),
  diterbitkan_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id),
  metode text not null check (metode in ('tunai', 'transfer', 'qris')),
  jumlah bigint not null check (jumlah > 0),
  dicatat_oleh uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- Riwayat dan pendukung ----------
create table public.wo_status_history (
  id bigint generated always as identity primary key,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  dari_status text,
  ke_status text not null,
  catatan text,
  oleh uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  waktu timestamptz not null default now(),
  pelaku_id uuid,
  pelaku_peran text,
  aksi text not null,
  tabel text not null,
  data_id text,
  sebelum jsonb,
  sesudah jsonb,
  alasan text
);

create table public.number_counters (
  jenis text not null,
  periode text not null,
  terakhir int not null default 0,
  primary key (jenis, periode)
);

create table public.workshop_settings (
  id int primary key default 1 check (id = 1),
  nama text not null default 'Cemerlang Jaya Motor',
  alamat text not null default '',
  telepon text not null default '',
  jam_buka text,
  logo_path text,
  galeri_paths text[] not null default '{}',
  updated_at timestamptz not null default now()
);
insert into public.workshop_settings (id) values (1);

-- ---------- Indeks ----------
create index on public.work_orders (status);
create index on public.work_orders (kepala_mekanik_id, status);
create index on public.work_orders (created_at desc);
create index on public.vehicles (customer_id);
create index on public.billing_items (work_order_id);
create index on public.stock_movements (item_id, created_at desc);
create index on public.audit_logs (waktu desc);
create index on public.payments (invoice_id);
create index on public.mekanik (kepala_mekanik_id);
create index on public.work_order_photos (work_order_id);

-- ---------- RLS menyala di semua tabel ----------
alter table public.profiles enable row level security;
alter table public.mekanik enable row level security;
alter table public.customers enable row level security;
alter table public.vehicles enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_costs enable row level security;
alter table public.work_orders enable row level security;
alter table public.work_order_mekanik enable row level security;
alter table public.work_order_photos enable row level security;
alter table public.stock_movements enable row level security;
alter table public.billing_items enable row level security;
alter table public.billing_item_costs enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.wo_status_history enable row level security;
alter table public.audit_logs enable row level security;
alter table public.number_counters enable row level security;
alter table public.workshop_settings enable row level security;


-- ---------- 9.1 Fungsi bantuan (skema private, tidak terbuka lewat Data API) ----------
create or replace function private.peran_saya()
returns text language sql stable security definer set search_path = ''
as $$
  select p.role from public.profiles p where p.id = auth.uid() and p.aktif
$$;

create or replace function private.tim_wo(p_wo uuid)
returns uuid language sql stable security definer set search_path = ''
as $$
  select w.kepala_mekanik_id from public.work_orders w where w.id = p_wo
$$;

-- nomor urut tanpa ganda: baris counter dikunci oleh upsert
create or replace function private.nomor_berikut(p_jenis text, p_periode text)
returns int language plpgsql security definer set search_path = ''
as $$
declare v int;
begin
  insert into public.number_counters (jenis, periode, terakhir) values (p_jenis, p_periode, 1)
  on conflict (jenis, periode) do update set terakhir = public.number_counters.terakhir + 1
  returning terakhir into v;
  return v;
end $$;

grant usage on schema private to authenticated;
revoke all on all functions in schema private from public, anon;
grant execute on function private.peran_saya() to authenticated;
grant execute on function private.tim_wo(uuid) to authenticated;
revoke execute on function private.nomor_berikut(text, text) from authenticated;

-- ---------- Profil otomatis saat akun dibuat ----------
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, nama, email, role, aktif)
  values (new.id, coalesce(new.raw_user_meta_data->>'nama', split_part(new.email, '@', 1)), new.email, 'kepala_mekanik', false)
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function private.handle_new_user();

-- ---------- updated_at ----------
create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at := now(); return new; end $$;
create trigger set_updated_at before update on public.inventory_items for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.inventory_costs for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.work_orders for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.workshop_settings for each row execute function private.set_updated_at();

-- ---------- Plat rapi ----------
create or replace function private.rapikan_plat()
returns trigger language plpgsql set search_path = ''
as $$ begin new.plat := upper(regexp_replace(trim(new.plat), '\s+', ' ', 'g')); return new; end $$;
create trigger rapikan_plat before insert or update of plat on public.vehicles
for each row execute function private.rapikan_plat();

-- ---------- Kode item otomatis (SP-0001 / JS-0001) ----------
create or replace function private.set_kode_item()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v int;
begin
  if coalesce(trim(new.kode), '') = '' then
    v := private.nomor_berikut(case when new.jenis = 'part' then 'SP' else 'JS' end, '-');
    new.kode := (case when new.jenis = 'part' then 'SP-' else 'JS-' end) || lpad(v::text, 4, '0');
  end if;
  return new;
end $$;
create trigger set_kode_item before insert on public.inventory_items
for each row execute function private.set_kode_item();

-- ---------- Jaga profil: hanya Owner yang mengubah peran dan status aktif ----------
-- security invoker (bukan definer) agar current_user menunjukkan siapa yang mengubah
create or replace function private.jaga_profil()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if current_user = 'authenticated' then
    if (new.role is distinct from old.role or new.aktif is distinct from old.aktif or new.email is distinct from old.email)
       and private.peran_saya() is distinct from 'owner' then
      raise exception 'Hanya Owner yang boleh mengubah peran atau status akun';
    end if;
  end if;
  if old.role = 'owner' and old.aktif and (new.role <> 'owner' or not new.aktif)
     and not exists (select 1 from public.profiles where role = 'owner' and aktif and id <> old.id) then
    raise exception 'Owner terakhir tidak boleh diturunkan atau dinonaktifkan';
  end if;
  return new;
end $$;
create trigger jaga_profil before update on public.profiles
for each row execute function private.jaga_profil();

-- ---------- Hak tabel (grant) ----------
revoke all on all tables in schema public from anon, authenticated;

grant select on public.workshop_settings to anon;

grant select on public.profiles to authenticated;
grant update (nama, role, aktif) on public.profiles to authenticated;
grant select, insert, update on public.mekanik to authenticated;
grant select, insert, update, delete on public.customers, public.vehicles to authenticated;
grant select on public.inventory_items to authenticated;
grant insert (kode, jenis, nama, harga_jual, stok_minimum, aktif) on public.inventory_items to authenticated;
grant update (nama, harga_jual, stok_minimum, aktif) on public.inventory_items to authenticated;   -- stok tidak bisa diubah langsung
grant select, insert, update on public.inventory_costs to authenticated;
grant select on public.stock_movements to authenticated;
grant select on public.work_orders to authenticated;
grant update (keluhan, odometer, kepala_mekanik_id, diagnosis) on public.work_orders to authenticated;  -- status hanya lewat fungsi
grant select on public.work_order_mekanik to authenticated;
grant select, insert, delete on public.work_order_photos to authenticated;
grant select on public.billing_items, public.billing_item_costs, public.invoices, public.payments to authenticated;
grant select on public.wo_status_history, public.audit_logs to authenticated;
grant select on public.workshop_settings to authenticated;
grant update (nama, alamat, telepon, jam_buka, logo_path, galeri_paths) on public.workshop_settings to authenticated;
-- number_counters: tidak ada hak sama sekali, hanya fungsi

-- ---------- Policy ----------
-- profiles
create policy "profil_baca" on public.profiles for select to authenticated
  using ((select private.peran_saya()) is not null or id = (select auth.uid()));
create policy "profil_ubah" on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select private.peran_saya()) = 'owner')
  with check (id = (select auth.uid()) or (select private.peran_saya()) = 'owner');

-- mekanik
create policy "mekanik_baca" on public.mekanik for select to authenticated
  using ((select private.peran_saya()) is not null);
create policy "mekanik_tambah" on public.mekanik for insert to authenticated
  with check ((select private.peran_saya()) = 'owner'
    or ((select private.peran_saya()) = 'kepala_mekanik' and kepala_mekanik_id = (select auth.uid())));
create policy "mekanik_ubah" on public.mekanik for update to authenticated
  using ((select private.peran_saya()) = 'owner'
    or ((select private.peran_saya()) = 'kepala_mekanik' and kepala_mekanik_id = (select auth.uid())))
  with check ((select private.peran_saya()) = 'owner'
    or ((select private.peran_saya()) = 'kepala_mekanik' and kepala_mekanik_id = (select auth.uid())));

-- customers dan vehicles
create policy "pelanggan_baca" on public.customers for select to authenticated using ((select private.peran_saya()) is not null);
create policy "pelanggan_tambah" on public.customers for insert to authenticated with check ((select private.peran_saya()) in ('admin', 'owner'));
create policy "pelanggan_ubah" on public.customers for update to authenticated
  using ((select private.peran_saya()) in ('admin', 'owner')) with check ((select private.peran_saya()) in ('admin', 'owner'));
create policy "pelanggan_hapus" on public.customers for delete to authenticated using ((select private.peran_saya()) in ('admin', 'owner'));
create policy "kendaraan_baca" on public.vehicles for select to authenticated using ((select private.peran_saya()) is not null);
create policy "kendaraan_tambah" on public.vehicles for insert to authenticated with check ((select private.peran_saya()) in ('admin', 'owner'));
create policy "kendaraan_ubah" on public.vehicles for update to authenticated
  using ((select private.peran_saya()) in ('admin', 'owner')) with check ((select private.peran_saya()) in ('admin', 'owner'));
create policy "kendaraan_hapus" on public.vehicles for delete to authenticated using ((select private.peran_saya()) in ('admin', 'owner'));

-- inventory
create policy "item_baca" on public.inventory_items for select to authenticated using ((select private.peran_saya()) is not null);
create policy "item_tambah" on public.inventory_items for insert to authenticated with check ((select private.peran_saya()) in ('admin', 'owner'));
create policy "item_ubah" on public.inventory_items for update to authenticated
  using ((select private.peran_saya()) = 'owner') with check ((select private.peran_saya()) = 'owner');
create policy "modal_owner_baca" on public.inventory_costs for select to authenticated using ((select private.peran_saya()) = 'owner');
create policy "modal_owner_tambah" on public.inventory_costs for insert to authenticated with check ((select private.peran_saya()) = 'owner');
create policy "modal_owner_ubah" on public.inventory_costs for update to authenticated
  using ((select private.peran_saya()) = 'owner') with check ((select private.peran_saya()) = 'owner');
create policy "riwayat_stok_baca" on public.stock_movements for select to authenticated using ((select private.peran_saya()) is not null);

-- work order
create policy "wo_baca" on public.work_orders for select to authenticated using ((select private.peran_saya()) is not null);
create policy "wo_ubah" on public.work_orders for update to authenticated
  using ((select private.peran_saya()) in ('admin', 'owner')
    or ((select private.peran_saya()) = 'kepala_mekanik' and kepala_mekanik_id = (select auth.uid())))
  with check ((select private.peran_saya()) in ('admin', 'owner')
    or ((select private.peran_saya()) = 'kepala_mekanik' and kepala_mekanik_id = (select auth.uid())));
create policy "wo_mekanik_baca" on public.work_order_mekanik for select to authenticated using ((select private.peran_saya()) is not null);
create policy "wo_foto_baca" on public.work_order_photos for select to authenticated using ((select private.peran_saya()) is not null);
create policy "wo_foto_tambah" on public.work_order_photos for insert to authenticated
  with check (
    ((select private.peran_saya()) in ('admin', 'owner') and jenis in ('stnk', 'kondisi_awal', 'kondisi_akhir'))
    or ((select private.peran_saya()) = 'kepala_mekanik' and jenis = 'pengerjaan' and private.tim_wo(work_order_id) = (select auth.uid())));
create policy "wo_foto_hapus" on public.work_order_photos for delete to authenticated using ((select private.peran_saya()) = 'owner');
create policy "riwayat_status_baca" on public.wo_status_history for select to authenticated using ((select private.peran_saya()) is not null);

-- tagihan
create policy "tagihan_baca" on public.billing_items for select to authenticated
  using ((select private.peran_saya()) in ('admin', 'owner')
    or ((select private.peran_saya()) = 'kepala_mekanik' and private.tim_wo(work_order_id) = (select auth.uid())));
create policy "modal_tagihan_owner" on public.billing_item_costs for select to authenticated using ((select private.peran_saya()) = 'owner');
create policy "invoice_baca" on public.invoices for select to authenticated
  using ((select private.peran_saya()) in ('admin', 'owner')
    or ((select private.peran_saya()) = 'kepala_mekanik' and private.tim_wo(work_order_id) = (select auth.uid())));
create policy "bayar_baca" on public.payments for select to authenticated using ((select private.peran_saya()) in ('admin', 'owner'));

-- audit dan setelan
create policy "audit_owner" on public.audit_logs for select to authenticated using ((select private.peran_saya()) = 'owner');
create policy "setelan_baca" on public.workshop_settings for select to anon, authenticated using (true);
create policy "setelan_ubah" on public.workshop_settings for update to authenticated
  using ((select private.peran_saya()) = 'owner') with check ((select private.peran_saya()) = 'owner');
