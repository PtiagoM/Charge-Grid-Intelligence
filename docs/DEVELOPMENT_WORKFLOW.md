# Fluxo de desenvolvimento e integracao

Este documento e a fonte canonica para branches, commits, Pull Requests, validacao e integracao do ChargeGrid Intelligence. Ele se aplica a pessoas e agentes de IA.

## Objetivo

Manter o Dashboard Admin e o Driver PWA evoluindo em linhas independentes, com integracao controlada na `main` somente depois de validacao automatizada e decisao humana.

## Estado historico relevante

| Referencia | Papel atual |
| --- | --- |
| `main` / `92a2544` | Conteudo equivalente ao baseline `c404b77`; contem no historico o merge e o revert do Admin |
| `codex/driver-pwa-mobile` / `f304c43` | PWA quase completo; [PR #1](https://github.com/PtiagoM/Charge-Grid-Intelligence/pull/1) aberto para `main` |
| `codex/admin-web-sems-migration` / `c2aebd6` | Fotografia validada da primeira reconstrucao nativa do Admin |

O merge `fe28427` tornou `c2aebd6` ancestral da `main`. O revert `92a2544` removeu seus arquivos sem remover essa ancestralidade. Por isso, `git merge codex/admin-web-sems-migration` pode responder que nao ha nada para integrar enquanto o dashboard continua ausente.

## Modelo de branches

### Branch protegida

- `main`: estado integrado, publicavel e recuperavel. Recebe somente Pull Requests.

### Linhas de produto

- `codex/driver-pwa-mobile`: linha atual do PWA ate seu PR ser integrado.
- `develop/admin-web`: futura linha principal do dashboard.

### Branches curtas

- `feature/admin-<descricao>`
- `feature/pwa-<descricao>`
- `fix/<descricao>`
- `chore/<descricao>`
- `docs/<descricao>`

Branches curtas devem nascer da linha do produto correspondente e retornar a ela por PR. Nao acumule Admin e PWA na mesma feature branch.

## Sequencia para organizar o estado atual

1. Integrar esta governanca e o CI na `main` por Pull Request.
2. Rodar os checks no PR de `codex/driver-pwa-mobile`.
3. Corrigir falhas, revisar impactos em API e pagamentos e integrar o PWA na `main`.
4. Criar `develop/admin-web` a partir da `main` ja atualizada.
5. Em `develop/admin-web`, executar `git revert 92a2544` para reverter o revert e restaurar a arvore do Admin.
6. Comparar a area do Admin com `c2aebd6` e validar build, unitarios e E2E.
7. Continuar o dashboard em `develop/admin-web` ou em features derivadas dela.
8. Abrir PR do Admin para `main` somente quando o dashboard estiver validado.

Nao crie a nova linha ativa do Admin diretamente a partir de `codex/admin-web-sems-migration`: isso conserva a ancestralidade problematica e faz o Git omitir a migracao em um merge futuro.

## Rotina antes de editar

```bash
git status -sb
git branch --show-current
git log -5 --oneline --decorate
```

Confirme que nao existem mudancas locais de outra pessoa e que a branch corresponde ao produto solicitado.

## Commits

Use Conventional Commits e indique o escopo:

- `feat(admin): add charger provisioning flow`
- `fix(pwa): preserve session after route reload`
- `test(api): cover payment confirmation failure`
- `docs(workflow): document release checks`

Antes do commit:

```bash
git diff
git diff --cached --check
git diff --cached --stat
```

Nao misture formatacao ampla, arquivos gerados e alteracoes funcionais sem necessidade. Nao reescreva commits que ja foram compartilhados.

## Push e Pull Request

Push e PR sao mudancas externas: agentes de IA precisam de autorizacao explicita do usuario.

```bash
git push -u origin <branch>
gh pr create --base <destino> --head <branch> --fill
gh pr checks --watch
```

O PR deve informar:

- objetivo e escopo;
- aplicacoes afetadas;
- riscos e decisoes;
- comandos de validacao executados;
- screenshots para mudancas visuais;
- migracoes, variaveis ou configuracoes necessarias;
- estrategia de rollback.

## Regras de merge

- Nunca fazer push direto em `main`.
- Aguardar todos os checks obrigatorios.
- Resolver todas as conversas.
- Quando o autor for outro desenvolvedor, solicitar ao menos uma revisao humana.
- Quando houver apenas um mantenedor e ele for o autor, a decisao de merge continua manual, mas sem exigir autoaprovacao impossivel no GitHub.
- Preferir squash merge para branches curtas.
- Preservar merge commits quando eles representarem a integracao auditavel de uma linha longa de produto.
- Nunca habilitar auto-merge sem autorizacao explicita.

## Dependencias e `package-lock.json`

Admin e PWA compartilham o lockfile raiz. Se os dois lados o alterarem:

1. Resolva primeiro os `package.json`.
2. Remova apenas os marcadores de conflito necessarios.
3. Execute `npm install` na raiz para regenerar o lockfile.
4. Execute `npm ci` para confirmar reproducibilidade.
5. Rode build e testes dos workspaces afetados.

Nao escolha manualmente um dos lockfiles completos e nao edite versoes internas do lockfile sem regeneracao.

## Matriz de validacao

| Escopo | Validacao durante desenvolvimento | Validacao antes de `main` |
| --- | --- | --- |
| Documentacao | links, comandos e diff | CI geral |
| Admin | build e testes focados | lint, unitarios, build e E2E do Admin |
| PWA | build e testes focados | lint, testes, build do PWA e fluxos moveis |
| API/pagamentos | testes da API | lint, testes da API e integracao com o consumidor |
| `packages/shared` ou raiz | consumidores afetados | suite e build completos do monorepo |

## GitHub CLI

Configuracao inicial:

```bash
gh auth login --hostname github.com --git-protocol https --web
gh auth setup-git
gh repo set-default PtiagoM/Charge-Grid-Intelligence
gh auth status
```

Comandos usuais:

```bash
gh pr status
gh pr view <numero> --web
gh pr checks <numero> --watch
gh pr diff <numero>
```

## Checklist de entrega de uma IA

Ao terminar, informe sempre:

- branch ativa e destino esperado;
- hash do commit, se criado;
- se houve push ou PR;
- testes executados e resultados;
- validacoes nao executadas;
- alteracoes externas realizadas;
- riscos ou passos manuais restantes.
