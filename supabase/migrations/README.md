# Supabase migrations

O Driver PWA já usa Supabase Auth, mas nenhuma migration comercial foi criada. Este diretório deverá receber schema, constraints, índices e policies RLS para `profiles`, `vehicles` e demais entidades somente após a spec `supabase-commercial-persistence`.

Até lá, `user_metadata` atende apenas ao perfil básico de autenticação e não substitui banco de produto, RLS ou autorização da API. Consulte `docs/CURRENT_STATE.md`.
