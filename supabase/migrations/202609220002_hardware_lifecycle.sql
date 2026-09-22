alter table commercial_chargers
  add column if not exists current_power_kw numeric(8, 3) not null default 0;

alter table commercial_sessions
  alter column energy_wh type numeric(14, 3) using energy_wh::numeric,
  add column if not exists last_energy_at timestamptz;

update commercial_sessions
set energy_wh = least(energy_wh, authorized_cents * 1000.0 / nullif(tariff_cents, 0))
where tariff_cents > 0 and energy_wh * tariff_cents / 1000 > authorized_cents;
