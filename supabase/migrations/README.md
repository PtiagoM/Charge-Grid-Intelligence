# Banco comercial

As migrations deste diretório definem o schema comercial compartilhado por API, Admin e PWA. O runtime oficial mínimo aplica-as ao iniciar a API Node sobre PGlite local; PostgreSQL/Supabase remoto é opcional via `CHARGEGRID_DATABASE_URL`.

`202610020010_demand_forecasts.sql` persiste forecasts disponíveis. `202610040011_demand_decisions.sql` persiste `DemandDecisionEvidence` correlacionada de forma idempotente ao forecast. A API é a autoridade das escritas; não executar migrations manualmente contra o banco de demonstração enquanto a API estiver aberta. Consulte `docs/CURRENT_STATE.md` e `apps/api/src/ai/README.md`.
