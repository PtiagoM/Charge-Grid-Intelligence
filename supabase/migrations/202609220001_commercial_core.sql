create table if not exists commercial_establishments (
  id text primary key,
  name text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  tariff_cents integer not null check (tariff_cents >= 0),
  qr_slug text not null unique,
  published boolean not null default true
);

create table if not exists commercial_chargers (
  id uuid primary key,
  code text not null unique,
  establishment_id text not null references commercial_establishments(id),
  name text not null,
  parking_spot text,
  nominal_power_kw numeric(8, 2) not null check (nominal_power_kw > 0),
  physical_status text not null default 'AVAILABLE',
  commercial_status text not null default 'AVAILABLE_TO_START',
  published boolean not null default true,
  qr_identifier text not null unique,
  updated_at timestamptz not null default now()
);

create table if not exists commercial_sessions (
  id uuid primary key,
  public_code text not null unique,
  driver_id text,
  driver_name text not null,
  driver_email text,
  establishment_id text not null references commercial_establishments(id),
  charger_id uuid not null references commercial_chargers(id),
  status text not null,
  tariff_cents integer not null,
  authorized_cents integer not null,
  energy_wh bigint not null default 0,
  cost_cents integer not null default 0,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists commercial_payments (
  id uuid primary key,
  session_id uuid not null unique references commercial_sessions(id),
  payment_intent_id text unique,
  method text not null,
  status text not null,
  provider_status text,
  authorized_cents integer not null,
  captured_cents integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
