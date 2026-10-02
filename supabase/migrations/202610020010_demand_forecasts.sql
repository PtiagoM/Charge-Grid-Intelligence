create table if not exists commercial_forecasts (
  id text primary key,
  plant_id text not null references commercial_plants(id) on delete cascade,
  model_version text not null,
  input_to timestamptz not null,
  generated_at timestamptz not null,
  expires_at timestamptz not null,
  record jsonb not null,
  unique (plant_id, model_version, input_to)
);

create index if not exists commercial_forecasts_latest_by_plant
  on commercial_forecasts (plant_id, generated_at desc);
