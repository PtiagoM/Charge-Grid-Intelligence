create table if not exists commercial_decisions (
  id text primary key,
  correlation_key text not null unique,
  establishment_id text not null references commercial_establishments(id) on delete cascade,
  kind text not null check (kind in ('ALERT', 'RECOMMENDATION')),
  type text not null,
  entity_id text not null,
  source_event_id text,
  sample_id uuid references commercial_energy_samples(id) on delete set null,
  policy_version text,
  condition_active boolean not null,
  severity text not null check (severity in ('INFO', 'WARNING', 'CRITICAL')),
  reason_code text not null,
  message text not null,
  evidence jsonb not null default '[]'::jsonb,
  suggested_action text,
  review_state text not null,
  decided_at timestamptz,
  decided_by text,
  decision_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists commercial_decisions_establishment_updated_idx
  on commercial_decisions (establishment_id, updated_at desc);
