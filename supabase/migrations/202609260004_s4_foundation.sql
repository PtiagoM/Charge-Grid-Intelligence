alter table commercial_establishments
  add column if not exists timezone text not null default 'America/Sao_Paulo',
  add column if not exists opening_hours jsonb not null default '[{"day":0,"opens":"00:00","closes":"24:00"},{"day":1,"opens":"00:00","closes":"24:00"},{"day":2,"opens":"00:00","closes":"24:00"},{"day":3,"opens":"00:00","closes":"24:00"},{"day":4,"opens":"00:00","closes":"24:00"},{"day":5,"opens":"00:00","closes":"24:00"},{"day":6,"opens":"00:00","closes":"24:00"}]'::jsonb;

create table if not exists commercial_plants (
  id text primary key,
  establishment_id text not null unique references commercial_establishments(id),
  energy_policy jsonb not null default '{}'::jsonb,
  provider_config jsonb not null default '{}'::jsonb,
  battery_capacity_kwh numeric(12, 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into commercial_plants (id, establishment_id)
values ('plant_aurora_001', 'est_aurora_001')
on conflict (id) do nothing;

alter table commercial_chargers
  add column if not exists plant_id text references commercial_plants(id),
  add column if not exists current_session_id uuid references commercial_sessions(id),
  add column if not exists assignment_id uuid references commercial_queue_entries(id);

update commercial_chargers
set plant_id = 'plant_aurora_001'
where establishment_id = 'est_aurora_001' and plant_id is null;

create table if not exists commercial_tariff_versions (
  id text primary key,
  establishment_id text not null references commercial_establishments(id),
  energy_cents_per_kwh integer not null check (energy_cents_per_kwh >= 0),
  solar_energy_cents_per_kwh integer check (solar_energy_cents_per_kwh is null or solar_energy_cents_per_kwh >= 0),
  idle_grace_minutes integer not null default 15 check (idle_grace_minutes >= 0),
  idle_cents_per_minute integer not null default 50 check (idle_cents_per_minute >= 0),
  idle_max_minutes integer not null default 60 check (idle_max_minutes >= 0),
  idle_enabled boolean not null default true,
  valid_from timestamptz not null default now(),
  created_at timestamptz not null default now(),
  reason text not null
);

insert into commercial_tariff_versions (id, establishment_id, energy_cents_per_kwh, idle_grace_minutes, idle_cents_per_minute, idle_max_minutes, idle_enabled, reason)
values ('tariff_aurora_base_s4', 'est_aurora_001', 190, 15, 50, 60, true, 'Tarifa base Aurora Sprint 4')
on conflict (id) do nothing;

create table if not exists commercial_quotes (
  id uuid primary key,
  charger_id uuid not null references commercial_chargers(id),
  establishment_id text not null references commercial_establishments(id),
  tariff_version_id text not null references commercial_tariff_versions(id),
  policy_version text not null,
  energy_cents_per_kwh integer not null check (energy_cents_per_kwh >= 0),
  idle_grace_minutes integer not null check (idle_grace_minutes >= 0),
  idle_cents_per_minute integer not null check (idle_cents_per_minute >= 0),
  idle_max_minutes integer not null check (idle_max_minutes >= 0),
  idle_enabled boolean not null,
  offered_at timestamptz not null default now(),
  expires_at timestamptz not null,
  reason_code text not null,
  energy_sample_id text,
  driver_id text,
  guest_token_hash text
);

alter table commercial_sessions
  alter column energy_wh type numeric(20, 9) using energy_wh::numeric,
  add column if not exists actor_type text not null default 'GUEST',
  add column if not exists quote_id uuid references commercial_quotes(id),
  add column if not exists quote jsonb,
  add column if not exists policy_version text not null default 'legacy-s3',
  add column if not exists energy_cost_cents integer,
  add column if not exists idle_cost_cents integer not null default 0,
  add column if not exists total_cost_cents integer,
  add column if not exists energy_ended_at timestamptz,
  add column if not exists disconnected_at timestamptz,
  add column if not exists settled_at timestamptz,
  add column if not exists idle_grace_ends_at timestamptz,
  add column if not exists end_reason text,
  add column if not exists transition_reason text,
  add column if not exists pending_command_id uuid,
  add column if not exists guest_token_hash text,
  add column if not exists expires_at timestamptz,
  add column if not exists idle_enabled boolean not null default false;

update commercial_sessions
set actor_type = case when driver_id is null then 'GUEST' else 'DRIVER' end,
    policy_version = coalesce(policy_version, 'legacy-s3'),
    energy_cost_cents = coalesce(energy_cost_cents, cost_cents),
    total_cost_cents = coalesce(total_cost_cents, cost_cents),
    idle_cost_cents = coalesce(idle_cost_cents, 0),
    idle_enabled = false
where policy_version = 'legacy-s3';

alter table commercial_payments
  add column if not exists refunded_cents integer not null default 0,
  add column if not exists pending_operation text,
  add column if not exists last_error_code text;

alter table commercial_queue_entries
  add column if not exists session_id uuid references commercial_sessions(id),
  add column if not exists estimated_wait_minutes integer;

create unique index if not exists commercial_queue_one_active_assignment_per_charger
  on commercial_queue_entries (charger_id)
  where status in ('CALLED', 'ASSIGNED');

with active_sessions as (
  select charger_id, min(id::text)::uuid as session_id
  from commercial_sessions
  where status not in ('COMPLETED', 'PAYMENT_FAILED', 'START_FAILED', 'FAULTED', 'CANCELLED')
  group by charger_id
  having count(*) = 1
)
update commercial_chargers c
set current_session_id = active_sessions.session_id
from active_sessions
where c.id = active_sessions.charger_id and c.current_session_id is null;

with ambiguous_sessions as (
  select charger_id
  from commercial_sessions
  where status not in ('COMPLETED', 'PAYMENT_FAILED', 'START_FAILED', 'FAULTED', 'CANCELLED')
  group by charger_id
  having count(*) > 1
)
update commercial_chargers c
set current_session_id = null,
    commercial_status = 'UNKNOWN',
    updated_at = now()
from ambiguous_sessions
where c.id = ambiguous_sessions.charger_id;
