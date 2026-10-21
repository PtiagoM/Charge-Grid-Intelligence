alter table commercial_decisions
  add column if not exists was_active boolean not null default false;

update commercial_decisions
set was_active = condition_active
where was_active = false;
