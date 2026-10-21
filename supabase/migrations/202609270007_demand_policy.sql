update commercial_plants
set energy_policy = '{"demandControlEnabled":false,"limitKw":20,"freshSeconds":15,"recoverySeconds":30}'::jsonb,
    updated_at = now()
where energy_policy = '{}'::jsonb;
