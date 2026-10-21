create table if not exists commercial_energy_samples (
  id uuid primary key,
  plant_id text not null references commercial_plants(id),
  observed_at timestamptz not null,
  source text not null check (source in ('SIMULATED')),
  quality text not null check (quality in ('FRESH', 'STALE', 'UNKNOWN')),
  pv_kw numeric(12, 6) not null check (pv_kw >= 0),
  building_load_kw numeric(12, 6) not null check (building_load_kw >= 0),
  ev_load_kw numeric(12, 6) not null check (ev_load_kw >= 0),
  grid_import_kw numeric(12, 6) not null check (grid_import_kw >= 0),
  grid_export_kw numeric(12, 6) not null check (grid_export_kw >= 0),
  ev_wh numeric(20, 9) not null default 0 check (ev_wh >= 0),
  grid_import_wh numeric(20, 9) not null default 0 check (grid_import_wh >= 0),
  grid_export_wh numeric(20, 9) not null default 0 check (grid_export_wh >= 0),
  solar_to_ev_wh numeric(20, 9) not null default 0 check (solar_to_ev_wh >= 0),
  created_at timestamptz not null default now(),
  unique (plant_id, observed_at)
);

create index if not exists commercial_energy_samples_plant_observed_at
  on commercial_energy_samples (plant_id, observed_at desc);

update commercial_plants
set provider_config = '{"online":false,"pvKw":0,"buildingLoadKw":0}'::jsonb,
    updated_at = now()
where provider_config = '{}'::jsonb;
