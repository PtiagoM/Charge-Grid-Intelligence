# Regras do Admin Web

Estas instrucoes complementam o `AGENTS.md` da raiz e se aplicam a tudo em `apps/admin-web`.

- Trabalhe no dashboard somente em `develop/admin-web` ou em uma branch `feature/admin-*` derivada dela.
- `codex/admin-web-sems-migration` e uma fotografia da reconstrucao inicial; preserve-a como referencia ate a criacao de `develop/admin-web`.
- Nao altere `apps/driver-pwa` em tarefas exclusivas do Admin.
- Preserve a arquitetura React/TypeScript, os contratos tipados de `packages/shared` e a separacao entre estado, dominio, servicos e interface.
- Mudancas visuais devem ser comparadas nas resolucoes suportadas e acompanhadas por screenshots quando entrarem em PR.
- Para navegacao, mapas ou jornadas criticas, execute os testes E2E correspondentes.
- Antes do PR, execute pelo menos o build do Admin, seus testes unitarios e o lint dos arquivos afetados. Antes da integracao em `main`, execute a suite E2E completa do Admin.
- Nunca introduza implementacao de PWA dentro do Admin para contornar a separacao de produtos.

