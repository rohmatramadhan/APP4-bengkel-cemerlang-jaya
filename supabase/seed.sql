-- =============================================================
-- App 4 Cemerlang Jaya Motor · DATA CONTOH (PRD Bab 15)
-- Dijalankan di Praktik 2, SETELAH:
--   1. semua tabel PRD Bab 8 sudah dibuat dengan nama kolom yang sama persis,
--   2. empat akun uji sudah dibuat dan perannya sudah diisi.
-- Aman dijalankan satu kali. Bila sudah ada data contoh, skrip berhenti.
-- =============================================================

do $$
declare
  v_owner uuid; v_admin uuid; v_joko uuid; v_slamet uuid;
  m_andi uuid; m_bayu uuid; m_dedi uuid; m_eko uuid;
  c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid;
  k1 uuid; k2 uuid; k3 uuid; k4 uuid; k5 uuid; k6 uuid; k7 uuid;
  wo uuid; inv uuid; bi uuid;
  r record; v_stok int;
begin
  -- ---------- prasyarat ----------
  select id into v_owner  from public.profiles where email = 'owner@cemerlangjaya.test'  and role = 'owner';
  select id into v_admin  from public.profiles where email = 'admin@cemerlangjaya.test'  and role = 'admin';
  select id into v_joko   from public.profiles where email = 'joko@cemerlangjaya.test'   and role = 'kepala_mekanik';
  select id into v_slamet from public.profiles where email = 'slamet@cemerlangjaya.test' and role = 'kepala_mekanik';
  if v_owner is null or v_admin is null or v_joko is null or v_slamet is null then
    raise exception 'Akun uji belum lengkap. Buat 4 akun dan isi perannya dulu (PRD 15.1).';
  end if;
  if exists (select 1 from public.customers where telepon = '081234500001') then
    raise exception 'Data contoh sudah pernah dimasukkan.';
  end if;

  update public.profiles set nama = 'Pak Darto', aktif = true where id = v_owner;
  update public.profiles set nama = 'Rina', aktif = true where id = v_admin;
  update public.profiles set nama = 'Pak Joko', aktif = true where id = v_joko;
  update public.profiles set nama = 'Pak Slamet', aktif = true where id = v_slamet;

  update public.workshop_settings set nama = 'Cemerlang Jaya Motor', alamat = 'Jl. Raya Cibubur No. 88, Jakarta Timur',
    telepon = '021-8770 1234', jam_buka = 'Senin sampai Sabtu, 08.00 sampai 17.00' where id = 1;

  -- ---------- mekanik ----------
  insert into public.mekanik (nama, kepala_mekanik_id) values ('Andi', v_joko) returning id into m_andi;
  insert into public.mekanik (nama, kepala_mekanik_id) values ('Bayu', v_joko) returning id into m_bayu;
  insert into public.mekanik (nama, kepala_mekanik_id) values ('Dedi', v_slamet) returning id into m_dedi;
  insert into public.mekanik (nama, kepala_mekanik_id) values ('Eko', v_slamet) returning id into m_eko;

  -- ---------- inventory (stok di sini = stok akhir PRD 15.3) ----------
  insert into public.inventory_items (kode, jenis, nama, harga_jual, stok, stok_minimum) values
    ('SP-0001', 'part', 'Oli Mesin 4L', 450000, 20, 5),
    ('SP-0002', 'part', 'Filter Oli', 75000, 15, 5),
    ('SP-0003', 'part', 'Kampas Rem Depan', 350000, 6, 3),
    ('SP-0004', 'part', 'Aki 45Ah', 950000, 2, 2),
    ('SP-0005', 'part', 'Busi Iridium', 120000, 24, 8),
    ('SP-0006', 'part', 'Filter Udara', 110000, 8, 3),
    ('SP-0007', 'part', 'Minyak Rem', 65000, 4, 5),
    ('SP-0008', 'part', 'V-Belt', 280000, 3, 2),
    ('SP-0009', 'part', 'Wiper Blade', 95000, 10, 4),
    ('SP-0010', 'part', 'Lampu H4', 85000, 1, 3),
    ('JS-0001', 'jasa', 'Ganti Oli', 50000, 0, 0),
    ('JS-0002', 'jasa', 'Tune-up', 350000, 0, 0),
    ('JS-0003', 'jasa', 'Servis Rem', 150000, 0, 0),
    ('JS-0004', 'jasa', 'Spooring dan Balancing', 250000, 0, 0),
    ('JS-0005', 'jasa', 'Cek Kelistrikan', 100000, 0, 0),
    ('JS-0006', 'jasa', 'Servis AC', 300000, 0, 0);
  insert into public.inventory_costs (item_id, harga_modal)
  select i.id, m.modal from public.inventory_items i join (values
    ('SP-0001', 360000), ('SP-0002', 50000), ('SP-0003', 260000), ('SP-0004', 780000), ('SP-0005', 85000),
    ('SP-0006', 70000), ('SP-0007', 40000), ('SP-0008', 200000), ('SP-0009', 60000), ('SP-0010', 55000)) m(kode, modal)
  on m.kode = i.kode;
  insert into public.number_counters (jenis, periode, terakhir) values ('SP', '-', 10), ('JS', '-', 6)
  on conflict (jenis, periode) do update set terakhir = greatest(public.number_counters.terakhir, excluded.terakhir);

  -- ---------- pelanggan dan kendaraan ----------
  insert into public.customers (tipe, nama, telepon, email, alamat) values ('perorangan', 'Budi Santoso', '081234500001', 'budi@contoh.test', 'Cibubur') returning id into c1;
  insert into public.customers (tipe, nama, telepon, email, alamat) values ('perorangan', 'Siti Rahma', '081234500002', null, 'Cimanggis') returning id into c2;
  insert into public.customers (tipe, nama, telepon, email, alamat) values ('perusahaan', 'CV Maju Logistik', '081234500003', 'armada@majulog.test', 'Cileungsi') returning id into c3;
  insert into public.customers (tipe, nama, telepon, email, alamat) values ('perorangan', 'Agus Pratama', '081234500004', null, 'Kranggan') returning id into c4;
  insert into public.customers (tipe, nama, telepon, email, alamat) values ('perorangan', 'Dewi Lestari', '081234500005', 'dewi@contoh.test', 'Jatisampurna') returning id into c5;
  insert into public.vehicles (customer_id, plat, merek_model, tahun, warna, transmisi) values (c1, 'B 1234 ABC', 'Toyota Innova', 2020, 'Putih', 'MT') returning id into k1;
  insert into public.vehicles (customer_id, plat, merek_model, tahun, warna, transmisi) values (c1, 'B 5678 DEF', 'Honda Brio', 2019, 'Merah', 'AT') returning id into k2;
  insert into public.vehicles (customer_id, plat, merek_model, tahun, warna, transmisi) values (c2, 'B 2468 GHI', 'Daihatsu Xenia', 2018, 'Silver', 'MT') returning id into k3;
  insert into public.vehicles (customer_id, plat, merek_model, tahun, warna, transmisi) values (c3, 'B 9001 MJL', 'Mitsubishi L300', 2021, 'Hitam', 'MT') returning id into k4;
  insert into public.vehicles (customer_id, plat, merek_model, tahun, warna, transmisi) values (c3, 'B 9002 MJL', 'Suzuki Carry', 2022, 'Putih', 'MT') returning id into k5;
  insert into public.vehicles (customer_id, plat, merek_model, tahun, warna, transmisi) values (c3, 'B 9003 MJL', 'Toyota Hilux', 2020, 'Abu-abu', 'MT') returning id into k6;
  insert into public.vehicles (customer_id, plat, merek_model, tahun, warna, transmisi) values (c4, 'F 1357 JKL', 'Honda HR-V', 2022, 'Biru', 'AT') returning id into k7;

  -- ---------- 12 work order (PRD 15.3) ----------
  create temp table _wo (n int, id uuid, kendaraan uuid, pelanggan uuid, tim uuid, mek uuid[], hari int, status text,
                         keluhan text, km int, est int, catatan text, diskon bigint, alasan_diskon text,
                         invoice text, bayar bigint) on commit drop;
  insert into _wo values
    (1,  null, k1, c1, v_joko,   array[m_andi],        28, 'diambil',      'Servis berkala 100.000 km',          100150, 1,  null, 0, null, 'lunas', null),
    (2,  null, k3, c2, v_slamet, array[m_dedi],        25, 'diambil',      'Mesin brebet saat pagi',             87200,  1,  null, 0, null, 'lunas', null),
    (3,  null, k2, c1, v_joko,   array[m_bayu],        21, 'diambil',      'Rem berbunyi saat mengerem',         54300,  1,  null, 50000, 'Negosiasi', 'lunas', null),
    (4,  null, k4, c3, v_slamet, array[m_eko],         18, 'diambil',      'Mobil sulit dinyalakan',             120400, 1,  null, 0, null, 'lunas', null),
    (5,  null, k5, c3, v_joko,   array[m_andi],        14, 'dibatalkan',   'Cek suara kaki-kaki',                45000,  2,  'Pelanggan membatalkan, mobil dibawa ke dealer', 0, null, null, null),
    (6,  null, k6, c3, v_slamet, array[m_dedi, m_eko], 10, 'diambil',      'AC tidak dingin',                    76500,  1,  null, 0, null, 'lunas', null),
    (7,  null, k7, c4, v_joko,   array[m_bayu],         3, 'siap_diambil', 'Ganti oli dan cek umum',             30100,  1,  null, 0, null, 'sebagian', 300000),
    (8,  null, k1, c1, v_slamet, array[m_dedi],         1, 'siap_diambil', 'Tarikan berat di tanjakan',          101200, 1,  null, 0, null, null, null),
    (9,  null, k3, c2, v_joko,   array[m_andi],         2, 'selesai',      'Lampu depan kiri mati',              87900,  1,  null, 0, null, null, null),
    (10, null, k4, c3, v_slamet, array[m_eko],          5, 'dikerjakan',   'Kopling selip',                      121000, -2, null, 0, null, null, null),
    (11, null, k2, c1, v_joko,   array[m_bayu],         4, 'tertunda',     'Wiper macet dan rem kurang pakem',   55000,  -1, 'Menunggu minyak rem datang', 0, null, null, null),
    (12, null, k7, c4, v_slamet, null,                  0, 'menunggu',     'Getaran di setir kecepatan 80 km/j', 30500,  null, null, 0, null, null, null);

  alter table _wo add column no_wo int, add column no_inv int;
  update _wo t set no_wo = x.rn from (select n, row_number() over (partition by to_char(now() - make_interval(days => hari), 'YYMM') order by hari desc, n) rn from _wo) x where x.n = t.n;
  update _wo t set no_inv = x.rn from (select n, row_number() over (partition by to_char(now() - make_interval(days => hari), 'YYYYMM') order by hari desc, n) rn from _wo where invoice is not null) x where x.n = t.n;

  for r in select * from _wo order by n loop
    insert into public.work_orders (nomor, vehicle_id, customer_id, kepala_mekanik_id, odometer, keluhan, status,
      estimasi_selesai, catatan_status, diskon, alasan_diskon, dibuat_oleh, created_at, updated_at,
      selesai_at, diambil_at)
    values ('WO-' || to_char(now() - make_interval(days => r.hari), 'YYMM') || '-' || lpad(r.no_wo::text, 4, '0'),
      r.kendaraan, r.pelanggan, r.tim, r.km, r.keluhan, r.status,
      case when r.est is null then null else (now() - make_interval(days => r.hari))::date + r.est end,
      r.catatan, r.diskon, r.alasan_diskon, v_admin,
      now() - make_interval(days => r.hari) + interval '8 hours', now() - make_interval(days => r.hari) + interval '8 hours',
      case when r.status in ('selesai', 'siap_diambil', 'diambil') then now() - make_interval(days => r.hari) + interval '15 hours' end,
      case when r.status = 'diambil' then now() - make_interval(days => r.hari) + interval '17 hours' end)
    returning id into wo;
    update _wo set id = wo where n = r.n;
    if r.mek is not null then
      insert into public.work_order_mekanik (work_order_id, mekanik_id) select wo, unnest(r.mek);
    end if;
    insert into public.wo_status_history (work_order_id, dari_status, ke_status, oleh, created_at)
    values (wo, null, 'menunggu', v_admin, now() - make_interval(days => r.hari) + interval '8 hours');
    if r.status <> 'menunggu' then
      insert into public.wo_status_history (work_order_id, dari_status, ke_status, catatan, oleh, created_at)
      values (wo, 'menunggu', case when r.status = 'dibatalkan' then 'dibatalkan' else 'dikerjakan' end,
              case when r.status = 'dibatalkan' then r.catatan end,
              case when r.status = 'dibatalkan' then v_admin else r.tim end,
              now() - make_interval(days => r.hari) + interval '9 hours');
    end if;
    if r.status = 'tertunda' then
      insert into public.wo_status_history (work_order_id, dari_status, ke_status, catatan, oleh, created_at)
      values (wo, 'dikerjakan', 'tertunda', r.catatan, r.tim, now() - make_interval(days => r.hari) + interval '13 hours');
    end if;
    if r.status in ('selesai', 'siap_diambil', 'diambil') then
      insert into public.wo_status_history (work_order_id, dari_status, ke_status, oleh, created_at)
      values (wo, 'dikerjakan', 'selesai', r.tim, now() - make_interval(days => r.hari) + interval '15 hours');
    end if;
    if r.status in ('siap_diambil', 'diambil') then
      insert into public.wo_status_history (work_order_id, dari_status, ke_status, oleh, created_at)
      values (wo, 'selesai', 'siap_diambil', r.tim, now() - make_interval(days => r.hari) + interval '15 hours 30 minutes');
    end if;
    if r.status = 'diambil' then
      insert into public.wo_status_history (work_order_id, dari_status, ke_status, oleh, created_at)
      values (wo, 'siap_diambil', 'diambil', v_admin, now() - make_interval(days => r.hari) + interval '17 hours');
    end if;
  end loop;

  -- ---------- baris tagihan (n WO, kode item, jumlah, harga dipakai bila disesuaikan, alasan) ----------
  create temp table _bi (n int, kode text, jumlah int, harga bigint, alasan text) on commit drop;
  insert into _bi values
    (1, 'SP-0001', 1, null, null), (1, 'SP-0002', 1, null, null), (1, 'JS-0001', 1, null, null), (1, 'SP-0009', 2, null, null),
    (2, 'JS-0002', 1, null, null), (2, 'SP-0005', 4, null, null), (2, 'SP-0006', 1, null, null),
    (3, 'SP-0003', 1, null, null), (3, 'JS-0003', 1, null, null), (3, 'SP-0007', 1, null, null),
    (4, 'SP-0004', 1, null, null), (4, 'JS-0005', 1, null, null),
    (6, 'JS-0006', 1, null, null), (6, 'SP-0006', 1, null, null), (6, 'SP-0008', 1, null, null),
    (7, 'SP-0001', 1, 420000, 'Harga khusus pelanggan'), (7, 'SP-0002', 1, null, null), (7, 'JS-0001', 1, null, null),
    (8, 'JS-0002', 1, null, null), (8, 'SP-0005', 4, null, null), (8, 'JS-0004', 1, null, null),
    (9, 'SP-0010', 1, null, null), (9, 'JS-0005', 1, null, null),
    (10, 'JS-0005', 1, null, null), (10, 'SP-0001', 1, null, null),
    (11, 'SP-0009', 2, null, null);

  for r in select b.*, w.id wo_id, w.hari, w.tim, i.id item_id, i.nama, i.jenis, i.harga_jual, coalesce(c.harga_modal, 0) modal
           from _bi b join _wo w on w.n = b.n join public.inventory_items i on i.kode = b.kode
           left join public.inventory_costs c on c.item_id = i.id order by b.n loop
    insert into public.billing_items (work_order_id, item_id, nama_item, jenis, jumlah, harga_master, harga_dipakai,
      alasan_penyesuaian, disesuaikan_oleh, disesuaikan_at, ditambah_oleh, created_at)
    values (r.wo_id, r.item_id, r.nama, r.jenis, r.jumlah, r.harga_jual, coalesce(r.harga, r.harga_jual),
      r.alasan, case when r.harga is not null then v_admin end,
      case when r.harga is not null then now() - make_interval(days => r.hari) + interval '16 hours' end,
      r.tim, now() - make_interval(days => r.hari) + interval '11 hours')
    returning id into bi;
    insert into public.billing_item_costs (billing_item_id, harga_modal) values (bi, case when r.jenis = 'part' then r.modal else 0 end);
  end loop;

  -- ---------- riwayat stok: stok awal 35 hari lalu, lalu keluar per WO ----------
  for r in select i.id, i.stok + coalesce(sum(b.jumlah), 0) as awal
           from public.inventory_items i left join _bi b on b.kode = i.kode
           where i.jenis = 'part' group by i.id, i.stok loop
    insert into public.stock_movements (item_id, jenis, jumlah, stok_sesudah, keterangan, dicatat_oleh, created_at)
    values (r.id, 'masuk', r.awal, r.awal, 'Stok awal', v_owner, now() - interval '35 days');
  end loop;
  for r in select bi2.item_id, bi2.jumlah, bi2.work_order_id, bi2.created_at, w.nomor, bi2.ditambah_oleh
           from public.billing_items bi2 join public.work_orders w on w.id = bi2.work_order_id
           where bi2.jenis = 'part' order by bi2.created_at loop
    select stok_sesudah into v_stok from public.stock_movements where item_id = r.item_id order by created_at desc, id desc limit 1;
    insert into public.stock_movements (item_id, jenis, jumlah, stok_sesudah, keterangan, work_order_id, dicatat_oleh, created_at)
    values (r.item_id, 'keluar', -r.jumlah, v_stok - r.jumlah, 'Dipakai di ' || r.nomor, r.work_order_id, r.ditambah_oleh, r.created_at);
  end loop;

  -- ---------- invoice dan pembayaran ----------
  for r in select w.*, wo2.nomor wo_nomor from _wo w join public.work_orders wo2 on wo2.id = w.id where w.invoice is not null order by w.n loop
    insert into public.invoices (work_order_id, nomor, subtotal, diskon, total, terbayar, status_bayar, diterbitkan_oleh, diterbitkan_at)
    select r.id, 'INV-' || to_char(now() - make_interval(days => r.hari), 'YYYYMM') || '-' || lpad(r.no_inv::text, 4, '0'),
           s.sub, r.diskon, s.sub - r.diskon,
           case when r.invoice = 'lunas' then s.sub - r.diskon else r.bayar end, r.invoice, v_admin,
           now() - make_interval(days => r.hari) + interval '16 hours'
    from (select coalesce(sum(jumlah * harga_dipakai), 0) sub from public.billing_items where work_order_id = r.id) s
    returning id into inv;
    insert into public.payments (invoice_id, metode, jumlah, dicatat_oleh, created_at)
    select inv, (array['tunai', 'transfer', 'qris'])[1 + r.n % 3], i.terbayar, v_admin, now() - make_interval(days => r.hari) + interval '16 hours 30 minutes'
    from public.invoices i where i.id = inv and i.terbayar > 0;
  end loop;

  -- ---------- foto (path contoh; berkasnya tidak ada di bucket) ----------
  insert into public.work_order_photos (work_order_id, jenis, path, diunggah_oleh, created_at)
  select w.id, 'stnk', w.id || '/stnk/contoh.webp', v_admin, now() - make_interval(days => w.hari) from _wo w;

  -- ---------- penomoran berikutnya tidak bentrok ----------
  insert into public.number_counters (jenis, periode, terakhir)
  select 'WO', to_char(now() - make_interval(days => hari), 'YYMM'), max(no_wo) from _wo group by 2
  on conflict (jenis, periode) do update set terakhir = greatest(public.number_counters.terakhir, excluded.terakhir);
  insert into public.number_counters (jenis, periode, terakhir)
  select 'INV', to_char(now() - make_interval(days => hari), 'YYYYMM'), max(no_inv) from _wo where invoice is not null group by 2
  on conflict (jenis, periode) do update set terakhir = greatest(public.number_counters.terakhir, excluded.terakhir);

  -- ---------- audit log dari proses seed tidak perlu ----------
  delete from public.audit_logs where pelaku_id is null;

  raise notice 'Data contoh berhasil dimasukkan: 4 mekanik, 16 item, 5 pelanggan, 7 kendaraan, 12 work order.';
end $$;
