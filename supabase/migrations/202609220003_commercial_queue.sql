create table if not exists commercial_queue_entries (
  id uuid primary key,
  driver_id text not null,
  driver_name text not null,
  driver_vehicle text not null,
  establishment_id text not null references commercial_establishments(id),
  status text not null,
  charger_id uuid references commercial_chargers(id),
  joined_at timestamptz not null default now(),
  called_at timestamptz,
  assignment_expires_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create unique index if not exists commercial_queue_one_active_per_driver
  on commercial_queue_entries (driver_id)
  where status in ('WAITING', 'CALLED', 'ASSIGNED');
