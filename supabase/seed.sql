TRUNCATE TABLE public.pengguna, public.admin_tl_assignments, public.proyek, public.unit, public.lead, public.transaksi, public.skema_komisi, public.komisi_item, public.kpi_logs, public.konten_ai, public.aktivitas, public.agenda, public.pengingat_agenda, public.pekerjaan, public.log_audit, public.permintaan_perubahan_lead, public.tautan_analitik, public.rute RESTART IDENTITY CASCADE;

DO $$
DECLARE
  dir_id uuid; sm_id uuid; tl1 uuid; tl2 uuid; se1 uuid; se2 uuid; se3 uuid; se4 uuid; dm_id uuid; adm_id uuid;
  p1 uuid; p2 uuid; u1 uuid; u2 uuid; t1 uuid;
  rec record; i int;
BEGIN
  INSERT INTO public.pengguna (nama, email, peran) VALUES ('Direktur', 'dir@andara.id', 'DIREKSI') RETURNING id INTO dir_id;
  INSERT INTO public.pengguna (nama, email, peran) VALUES ('Sales Manager', 'sm@andara.id', 'SALES_MANAGER') RETURNING id INTO sm_id;
  INSERT INTO public.pengguna (nama, email, peran, staff_code, sm_id) VALUES ('Angga', 'tl1@andara.id', 'TEAM_LEADER', '001', sm_id) RETURNING id INTO tl1;
  INSERT INTO public.pengguna (nama, email, peran, staff_code, sm_id) VALUES ('Budi', 'tl2@andara.id', 'TEAM_LEADER', '002', sm_id) RETURNING id INTO tl2;
  INSERT INTO public.pengguna (nama, email, peran, staff_code, team_leader_id) VALUES ('Dian', 'se1@andara.id', 'SALES', '004', tl1) RETURNING id INTO se1;
  INSERT INTO public.pengguna (nama, email, peran, staff_code, team_leader_id) VALUES ('Rina', 'se2@andara.id', 'SALES', '005', tl1) RETURNING id INTO se2;
  INSERT INTO public.pengguna (nama, email, peran, staff_code, team_leader_id) VALUES ('Joko', 'se3@andara.id', 'SALES', '006', tl2) RETURNING id INTO se3;
  INSERT INTO public.pengguna (nama, email, peran, staff_code, team_leader_id) VALUES ('Sari', 'se4@andara.id', 'SALES', '007', tl2) RETURNING id INTO se4;
  INSERT INTO public.pengguna (nama, email, peran) VALUES ('Digital Marketing', 'dm@andara.id', 'DIGITAL_MARKETING') RETURNING id INTO dm_id;
  INSERT INTO public.pengguna (nama, email, peran) VALUES ('Admin Sales', 'adm@andara.id', 'ADMIN') RETURNING id INTO adm_id;

  INSERT INTO public.proyek (kode, nama, kategori_harga, sm_id, admin_id, target_omzet) VALUES ('GG', 'Green Gumulan', 'menengah', sm_id, adm_id, 1000000000) RETURNING id INTO p1;
  INSERT INTO public.proyek (kode, nama, kategori_harga, sm_id, admin_id, target_omzet) VALUES ('PA', 'Puri Alam Gayamprit', 'ekonomis', sm_id, adm_id, 500000000) RETURNING id INTO p2;

  INSERT INTO public.unit (proyek_id, kode_unit, tipe, luas_tanah, luas_bangunan, harga_dasar) VALUES (p1, 'GG-01', 'Tipe 29', 60, 29, 166000000) RETURNING id INTO u1;
  INSERT INTO public.unit (proyek_id, kode_unit, tipe, luas_tanah, luas_bangunan, harga_dasar) VALUES (p2, 'PA-01', 'Tipe 29', 82, 29, 199000000) RETURNING id INTO u2;

  FOR rec IN SELECT id, staff_code, nama FROM public.pengguna WHERE peran = 'SALES' ORDER BY staff_code LOOP
    FOR i IN 1..5 LOOP
      INSERT INTO public.lead (kode, nama, telepon, alamat, sumber_lead, origin, proyek_id, pemilik_id, tahap)
      VALUES (
        'L-' || rec.staff_code || '-' || i,
        'Prospek ' || rec.nama || ' ' || i,
        '0812' || (10000000 + rec.staff_code::int * 100 + i)::text,
        'Klaten',
        (ARRAY['Call','Chat','Posting','Indoor','Day-to-day'])[i],
        (ARRAY['LP','LP','LM','PP','LP'])[i]::public.origin_lead,
        CASE WHEN i % 2 = 1 THEN p1 ELSE p2 END,
        rec.id,
        (ARRAY['HOT','QL','LEAD','BOOK','VISIT'])[i]::public.status_pipeline
      );
    END LOOP;
  END LOOP;

  FOR rec IN SELECT id FROM public.pengguna WHERE peran = 'SALES' LOOP
    INSERT INTO public.aktivitas (pengguna_id, proyek_id, jenis, catatan) VALUES (rec.id, p1, 'Call', 'Follow-up prospek'), (rec.id, p2, 'Chat', 'Kirim pricelist');
    INSERT INTO public.kpi_logs (pengguna_id, jenis_aktivitas, skor) VALUES (rec.id, 'Kunjungan', 5);
  END LOOP;

  INSERT INTO public.rute (pengguna_id, tanggal, urutan, jam, nama, alamat, pintu, status) VALUES (se1, current_date, 1, '09.00', 'Perum Griya', 'Klaten Tengah', 14, 'nanti'), (se2, current_date, 2, '13.00', 'Pasar Gayamprit', 'Klaten Selatan', 18, 'nanti');

  SELECT id INTO t1 FROM public.lead WHERE kode = 'L-004-1';
  INSERT INTO public.transaksi (kode_transaksi, lead_id, proyek_id, unit_id, sales_id, harga_jual, metode_bayar, dokumen_lengkap, status) VALUES ('T-001', t1, p1, u1, se1, 180000000, 'CASH_KERAS', true, 'CV');

  INSERT INTO public.skema_komisi (proyek_id, peran, origin, rate_dasar, addon_cash_keras) VALUES (p1, 'SALES', 'LM', 0.0250, 0.0050), (p1, 'SALES', 'LP', 0.0125, 0.0050), (p1, 'SALES', 'PP', 0.0100, 0.0050), (p1, 'SALES', 'HP', 0.0075, 0.0050), (p1, 'TEAM_LEADER', 'LP', 0.0025, 0), (p1, 'SALES_MANAGER', 'LP', 0.0025, 0), (p1, 'ADMIN', 'LP', 0.0015, 0), (p1, 'DIGITAL_MARKETING', 'LP', 0.0025, 0);

  PERFORM public.hitung_komisi_transaksi((SELECT id FROM public.transaksi WHERE kode_transaksi = 'T-001'), dir_id);
END $$;