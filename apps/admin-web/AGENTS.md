# Regras do Admin Web

Estas instrucoes complementam o `AGENTS.md` da raiz e se aplicam a tudo em `apps/admin-web`.

- Trabalhe no dashboard somente em `develop/admin-web` ou em uma branch `feature/admin-*` derivada dela.
- `codex/admin-web-sems-migration` e uma fotografia da reconstrucao inicial; preserve-a somente como referencia historica. Todo novo desenvolvimento parte de `develop/admin-web`.
- Nao altere `apps/driver-pwa` em tarefas exclusivas do Admin.
- Preserve a arquitetura React/TypeScript, os contratos tipados de `packages/shared` e a separacao entre estado, dominio, servicos e interface.
- Nesta fase de evolução, não crie snapshots, matriz visual ou asserts de estrutura/texto de tela sem aprovação explícita do produto de que aquela interface está estável. Screenshots podem ser anexados como evidência de revisão, sem virar baseline automatizado.
- Para navegacao, mapas ou jornadas criticas, execute os testes E2E correspondentes.
- Antes do PR, execute build, testes unitários e lint do Admin; execute apenas E2E focal para o fluxo alterado. Antes da integração em `main`, execute a suíte E2E completa do Admin ou acione o workflow manual correspondente.
- Nunca introduza implementacao de PWA dentro do Admin para contornar a separacao de produtos.

