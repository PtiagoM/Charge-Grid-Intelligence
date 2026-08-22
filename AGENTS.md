# Instrucoes para agentes de IA

Este arquivo define regras obrigatorias para qualquer agente de IA que trabalhe neste repositorio. Leia tambem [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md) antes de alterar branches, publicar commits ou abrir Pull Requests.

## Verificacoes iniciais obrigatorias

Antes de editar arquivos:

1. Execute `git status -sb` e confirme a branch ativa.
2. Leia o `AGENTS.md` mais proximo do diretorio que sera alterado.
3. Identifique se a tarefa pertence ao Admin, PWA, API ou contratos compartilhados.
4. Verifique alteracoes locais preexistentes e preserve todo trabalho do usuario.

## Responsabilidade das branches

- `main`: versao integrada e validada. Nunca desenvolver diretamente nela.
- `codex/driver-pwa-mobile`: referencia da entrega do PWA integrada pelo PR #1; antes de novos trabalhos, sincronize-a por fast-forward com `main`.
- `codex/admin-web-sems-migration`: fotografia da migracao nativa no commit `c2aebd6`. Nao usar como nova base de integracao sem consultar o fluxo documentado.
- `develop/admin-web`: linha ativa do dashboard, criada sobre a `main` com o PWA integrado e com a reconstrucao nativa restaurada.
- `feature/admin-*`, `feature/pwa-*`, `fix/*` e `chore/*`: branches curtas e focadas.

O commit `c2aebd6` aparece no historico de `main` por causa do merge `fe28427`, mas seu conteudo foi removido pelo revert `92a2544`. Um merge comum da branch antiga do Admin nao restaura esse conteudo. A restauracao correta ja existe em `develop/admin-web`; nao repita o procedimento nem use a branch antiga como nova base.

## Limites de escopo

- Tarefas do Admin nao devem modificar `apps/driver-pwa`.
- Tarefas do PWA nao devem modificar `apps/admin-web`.
- Mudancas em `packages/shared`, `apps/api`, arquivos raiz ou contratos devem ser tratadas como integracao entre produtos e validadas nos dois frontends.
- Nao misture refatoracoes oportunistas com a entrega solicitada.

## Commits, publicacao e integracao

- Use commits pequenos, coerentes e no formato Conventional Commits: `feat(admin): ...`, `fix(pwa): ...`, `test(api): ...`, `docs(workflow): ...`.
- Nao use `git add .` sem revisar o diff. Confirme o conteudo preparado com `git diff --cached --check` e `git diff --cached --stat`.
- Nunca use `git reset --hard`, force-push ou reescrita de historico compartilhado.
- Nunca faca push, abra PR, aprove, faca merge ou altere `main` sem autorizacao explicita do usuario.
- Toda mudanca em `main` deve entrar por Pull Request com os checks obrigatorios aprovados.
- Informe ao final: branch, hash do commit, arquivos relevantes, testes executados e o que nao foi validado.

## Dependencias e lockfile

- Instale dependencias pelo workspace correto.
- Se `package.json` mudar, regenere `package-lock.json` com `npm install`; nao resolva manualmente blocos conflitantes do lockfile.
- Explique a necessidade de cada dependencia nova.

## Validacao minima

Execute somente a bateria proporcional ao escopo durante o desenvolvimento e a bateria completa antes de integrar em `main`.

- Alteracao compartilhada ou de integracao: `npm run lint`, `npm test` e `npm run build`.
- Admin: build e testes do workspace Admin; execute E2E quando o fluxo visual ou de navegacao mudar.
- PWA: build do PWA e testes relacionados; valide API quando pagamentos, sessoes ou contratos forem afetados.
- Falhas preexistentes devem ser identificadas e documentadas, nunca ocultadas.

## GitHub CLI e Pull Requests

- Confira autenticacao com `gh auth status`.
- Antes de abrir PR, confirme base e head com `gh pr view` ou `gh pr status`.
- Use o template do repositorio e inclua evidencia de validacao.
- Nao habilite auto-merge sem autorizacao explicita.

