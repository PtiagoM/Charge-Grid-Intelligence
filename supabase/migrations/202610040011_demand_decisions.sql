create table if not exists commercial_demand_decisions (
  correlation_key text primary key,
  plant_id text not null references commercial_plants(id) on delete cascade,
  forecast_id text not null references commercial_forecasts(id) on delete cascade,
  record jsonb not null,
  created_at timestamptz not null default now(),
  check (record->>'contractVersion' = 'S4-C2'),
  check (record->>'correlationKey' = correlation_key),
  check (record->>'forecastId' = forecast_id)
);

create index if not exists commercial_demand_decisions_latest_by_plant
  on commercial_demand_decisions (plant_id, created_at desc);
