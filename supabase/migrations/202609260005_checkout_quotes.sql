create unique index if not exists commercial_sessions_one_per_quote
  on commercial_sessions (quote_id)
  where quote_id is not null;
