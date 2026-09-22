insert into commercial_establishments (id, name, address, latitude, longitude, tariff_cents, qr_slug)
values ('est_aurora_001', 'Hub Solar Aurora', 'Av. Mercurio, 420 - Centro, Sao Paulo', -23.55052, -46.633308, 190, 'aurora')
on conflict (id) do update set
  name = excluded.name,
  address = excluded.address,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  tariff_cents = excluded.tariff_cents,
  qr_slug = excluded.qr_slug,
  published = true;

insert into commercial_chargers (id, code, establishment_id, name, parking_spot, nominal_power_kw, qr_identifier)
values
  ('00000000-0000-4000-8000-000000000001', 'AURORA-01', 'est_aurora_001', 'Aurora 01', 'A01', 7, 'aurora-01'),
  ('00000000-0000-4000-8000-000000000002', 'AURORA-02', 'est_aurora_001', 'Aurora 02', 'B02', 7, 'aurora-02'),
  ('00000000-0000-4000-8000-000000000003', 'AURORA-03', 'est_aurora_001', 'Aurora 03', 'C03', 7, 'aurora-03'),
  ('00000000-0000-4000-8000-000000000004', 'AURORA-04', 'est_aurora_001', 'Aurora 04', 'D04', 7, 'aurora-04'),
  ('00000000-0000-4000-8000-000000000005', 'AURORA-05', 'est_aurora_001', 'Aurora 05', 'A05', 7, 'aurora-05'),
  ('00000000-0000-4000-8000-000000000006', 'AURORA-06', 'est_aurora_001', 'Aurora 06', 'B06', 7, 'aurora-06')
on conflict (id) do update set
  code = excluded.code,
  establishment_id = excluded.establishment_id,
  name = excluded.name,
  parking_spot = excluded.parking_spot,
  nominal_power_kw = excluded.nominal_power_kw,
  qr_identifier = excluded.qr_identifier,
  published = true;
