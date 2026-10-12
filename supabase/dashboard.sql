-- =============================================================
-- App 4 Cemerlang Jaya Motor · FUNGSI DASHBOARD DAN LAPORAN (PRD 9.3)
-- Dipasang di Praktik 5, SETELAH semua tabel PRD Bab 8 dan fungsi
-- private.peran_saya() (PRD 9.1) sudah ada.
-- Angka dihitung di database; aplikasi hanya menerima ringkasannya
-- (hemat egress). Tanggal memakai zona waktu Asia/Jakarta.
-- =============================================================

-- ---------- Kartu KPI, isi menyesuaikan peran ----------
create or replace function public.dashboard_ringkasan(p_dari date, p_sampai date)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  v_peran text := private.peran_saya();
  v_lama int := (p_sampai - p_dari) + 1;
  v_dari0 date := p_dari - ((p_sampai - p_dari) + 1);
  v_sampai0 date := p_dari - 1;
  v_hari_ini date := (now() at time zone 'Asia/Jakarta')::date;
  hasil jsonb;
begin
  if v_peran is null then raise exception 'Akun tidak aktif'; end if;

  if v_peran = 'owner' then
    with inv as (
      select i.total, (i.diterbitkan_at at time zone 'Asia/Jakarta')::date tgl,
             (select coalesce(sum(b.jumlah * c.harga_modal), 0) from public.billing_items b
                join public.billing_item_costs c on c.billing_item_id = b.id where b.work_order_id = i.work_order_id) modal
      from public.invoices i
    )
    select jsonb_build_object(
      'pendapatan',            coalesce(sum(total) filter (where tgl between p_dari and p_sampai), 0),
      'pendapatan_sebelumnya', coalesce(sum(total) filter (where tgl between v_dari0 and v_sampai0), 0),
      'laba_kotor',            coalesce(sum(total - modal) filter (where tgl between p_dari and p_sampai), 0),
      'laba_kotor_sebelumnya', coalesce(sum(total - modal) filter (where tgl between v_dari0 and v_sampai0), 0),
      'margin_persen', case when coalesce(sum(total) filter (where tgl between p_dari and p_sampai), 0) = 0 then 0
                       else round(100.0 * sum(total - modal) filter (where tgl between p_dari and p_sampai)
                                  / sum(total) filter (where tgl between p_dari and p_sampai), 1) end)
    into hasil from inv;
    hasil := hasil || jsonb_build_object(
      'wo_aktif', (select count(*) from public.work_orders where status in ('menunggu', 'dikerjakan', 'tertunda', 'selesai', 'siap_diambil')),
      'wo_terlambat', (select count(*) from public.work_orders where status in ('dikerjakan', 'tertunda') and estimasi_selesai < v_hari_ini),
      'piutang', (select coalesce(sum(total - terbayar), 0) from public.invoices where status_bayar <> 'lunas'));

  elsif v_peran = 'admin' then
    hasil := jsonb_build_object(
      'mobil_masuk_hari_ini', (select count(*) from public.work_orders where (created_at at time zone 'Asia/Jakarta')::date = v_hari_ini),
      'siap_diambil', (select count(*) from public.work_orders where status = 'siap_diambil'),
      'perlu_ditagih', (select count(*) from public.work_orders w where w.status = 'siap_diambil'
                         and not exists (select 1 from public.invoices i where i.work_order_id = w.id and i.status_bayar = 'lunas')),
      'pendapatan_hari_ini', (select coalesce(sum(total), 0) from public.invoices where (diterbitkan_at at time zone 'Asia/Jakarta')::date = v_hari_ini),
      'pendapatan', (select coalesce(sum(total), 0) from public.invoices where (diterbitkan_at at time zone 'Asia/Jakarta')::date between p_dari and p_sampai),
      'pendapatan_sebelumnya', (select coalesce(sum(total), 0) from public.invoices where (diterbitkan_at at time zone 'Asia/Jakarta')::date between v_dari0 and v_sampai0));

  else -- kepala_mekanik: hanya timnya
    select jsonb_build_object(
      'menunggu_ditugaskan', count(*) filter (where status = 'menunggu'),
      'sedang_dikerjakan',   count(*) filter (where status in ('dikerjakan', 'tertunda')),
      'menunggu_qc',         count(*) filter (where status = 'selesai'),
      'terlambat',           count(*) filter (where status in ('dikerjakan', 'tertunda') and estimasi_selesai < v_hari_ini),
      'selesai_periode',     count(*) filter (where (selesai_at at time zone 'Asia/Jakarta')::date between p_dari and p_sampai),
      'selesai_sebelumnya',  count(*) filter (where (selesai_at at time zone 'Asia/Jakarta')::date between v_dari0 and v_sampai0))
    into hasil from public.work_orders where kepala_mekanik_id = auth.uid();
  end if;
  return hasil || jsonb_build_object('peran', v_peran, 'lama_hari', v_lama);
end $$;

-- ---------- Pendapatan harian: jasa vs spare part ----------
create or replace function public.dashboard_pendapatan_harian(p_dari date, p_sampai date)
returns table (tanggal date, pendapatan_jasa bigint, pendapatan_part bigint)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if private.peran_saya() not in ('owner', 'admin') or private.peran_saya() is null then raise exception 'Tidak diizinkan'; end if;
  return query
  select d::date,
    coalesce(sum(b.jumlah * b.harga_dipakai) filter (where b.jenis = 'jasa'), 0)::bigint,
    coalesce(sum(b.jumlah * b.harga_dipakai) filter (where b.jenis = 'part'), 0)::bigint
  from generate_series(p_dari, p_sampai, interval '1 day') d
  left join public.invoices i on (i.diterbitkan_at at time zone 'Asia/Jakarta')::date = d::date
  left join public.billing_items b on b.work_order_id = i.work_order_id
  group by d order by d;
end $$;

-- ---------- Laba harian (Owner) ----------
create or replace function public.dashboard_laba_harian(p_dari date, p_sampai date)
returns table (tanggal date, pendapatan bigint, modal bigint, laba bigint)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if private.peran_saya() is distinct from 'owner' then raise exception 'Hanya Owner'; end if;
  return query
  with per_inv as (
    select (i.diterbitkan_at at time zone 'Asia/Jakarta')::date tgl, i.total,
           (select coalesce(sum(b.jumlah * c.harga_modal), 0) from public.billing_items b
              join public.billing_item_costs c on c.billing_item_id = b.id where b.work_order_id = i.work_order_id) modal
    from public.invoices i)
  select d::date, coalesce(sum(p.total), 0)::bigint, coalesce(sum(p.modal), 0)::bigint, coalesce(sum(p.total - p.modal), 0)::bigint
  from generate_series(p_dari, p_sampai, interval '1 day') d
  left join per_inv p on p.tgl = d::date
  group by d order by d;
end $$;

-- ---------- WO per status (Kepala Mekanik otomatis hanya timnya) ----------
create or replace function public.dashboard_wo_per_status(p_tim uuid default null)
returns table (status text, jumlah int)
language plpgsql stable security definer set search_path = ''
as $$
declare v_peran text := private.peran_saya(); v_tim uuid := p_tim;
begin
  if v_peran is null then raise exception 'Akun tidak aktif'; end if;
  if v_peran = 'kepala_mekanik' then v_tim := auth.uid(); end if;
  return query
  select s.status, coalesce(count(w.id), 0)::int
  from unnest(array['menunggu', 'dikerjakan', 'tertunda', 'selesai', 'siap_diambil', 'diambil', 'dibatalkan']) with ordinality s(status, urut)
  left join public.work_orders w on w.status = s.status and (v_tim is null or w.kepala_mekanik_id = v_tim)
  group by s.status, s.urut order by s.urut;
end $$;

-- ---------- Beban mekanik ----------
create or replace function public.dashboard_beban_mekanik(p_dari date, p_sampai date, p_tim uuid default null)
returns table (mekanik text, tim text, wo_aktif int, wo_selesai int)
language plpgsql stable security definer set search_path = ''
as $$
declare v_peran text := private.peran_saya(); v_tim uuid := p_tim;
begin
  if v_peran not in ('owner', 'kepala_mekanik') or v_peran is null then raise exception 'Tidak diizinkan'; end if;
  if v_peran = 'kepala_mekanik' then v_tim := auth.uid(); end if;
  return query
  select m.nama, p.nama,
    (count(w.id) filter (where w.status in ('dikerjakan', 'tertunda', 'selesai')))::int,
    (count(w.id) filter (where (w.selesai_at at time zone 'Asia/Jakarta')::date between p_dari and p_sampai))::int
  from public.mekanik m
  join public.profiles p on p.id = m.kepala_mekanik_id
  left join public.work_order_mekanik wm on wm.mekanik_id = m.id
  left join public.work_orders w on w.id = wm.work_order_id
  where m.aktif and (v_tim is null or m.kepala_mekanik_id = v_tim)
  group by m.id, m.nama, p.nama order by p.nama, m.nama;
end $$;

-- ---------- WO selesai per hari (Kepala Mekanik: timnya; Owner: semua) ----------
create or replace function public.dashboard_wo_selesai_harian(p_dari date, p_sampai date)
returns table (tanggal date, jumlah int)
language plpgsql stable security definer set search_path = ''
as $$
declare v_peran text := private.peran_saya();
begin
  if v_peran not in ('owner', 'kepala_mekanik') or v_peran is null then raise exception 'Tidak diizinkan'; end if;
  return query
  select d::date, count(w.id)::int
  from generate_series(p_dari, p_sampai, interval '1 day') d
  left join public.work_orders w on (w.selesai_at at time zone 'Asia/Jakarta')::date = d::date
    and (v_peran = 'owner' or w.kepala_mekanik_id = auth.uid())
  group by d order by d;
end $$;

-- ---------- 5 item terlaris ----------
create or replace function public.dashboard_top_item(p_dari date, p_sampai date, p_jenis text default 'part')
returns table (nama text, jumlah bigint, pendapatan bigint)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if private.peran_saya() not in ('owner', 'admin') or private.peran_saya() is null then raise exception 'Tidak diizinkan'; end if;
  return query
  select b.nama_item, sum(b.jumlah)::bigint, sum(b.jumlah * b.harga_dipakai)::bigint
  from public.billing_items b
  join public.invoices i on i.work_order_id = b.work_order_id
  where b.jenis = p_jenis and (i.diterbitkan_at at time zone 'Asia/Jakarta')::date between p_dari and p_sampai
  group by b.nama_item order by 3 desc limit 5;
end $$;

-- ---------- Laporan laba per WO (Owner) ----------
create or replace function public.laporan_laba(p_dari date, p_sampai date)
returns table (work_order_id uuid, nomor_wo text, nomor_invoice text, tanggal date, plat text,
               pendapatan bigint, modal bigint, laba bigint, margin_persen numeric)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if private.peran_saya() is distinct from 'owner' then raise exception 'Hanya Owner'; end if;
  return query
  select w.id, w.nomor, i.nomor, (i.diterbitkan_at at time zone 'Asia/Jakarta')::date, v.plat, i.total, x.modal, i.total - x.modal,
         case when i.total = 0 then 0 else round(100.0 * (i.total - x.modal) / i.total, 1) end
  from public.invoices i
  join public.work_orders w on w.id = i.work_order_id
  join public.vehicles v on v.id = w.vehicle_id
  cross join lateral (select coalesce(sum(b.jumlah * c.harga_modal), 0)::bigint modal from public.billing_items b
                      join public.billing_item_costs c on c.billing_item_id = b.id where b.work_order_id = w.id) x
  where (i.diterbitkan_at at time zone 'Asia/Jakarta')::date between p_dari and p_sampai
  order by i.diterbitkan_at desc;
end $$;

-- ---------- Hak eksekusi ----------
do $$
declare f text;
begin
  foreach f in array array[
    'dashboard_ringkasan(date, date)', 'dashboard_pendapatan_harian(date, date)', 'dashboard_laba_harian(date, date)',
    'dashboard_wo_per_status(uuid)', 'dashboard_beban_mekanik(date, date, uuid)', 'dashboard_wo_selesai_harian(date, date)',
    'dashboard_top_item(date, date, text)', 'laporan_laba(date, date)'] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
