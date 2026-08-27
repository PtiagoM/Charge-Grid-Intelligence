# Fluxo de desenvolvimento e integracao

Este documento e a fonte canonica para branches, commits, Pull Requests, validacao e integracao do ChargeGrid Intelligence. Ele se aplica a pessoas e agentes de IA.

## Objetivo

Manter o Dashboard Admin e o Driver PWA evoluindo em linhas independentes, com integracao controlada na `main` somente depois de validacao automatizada e decisao humana.

## Estado historico relevante

| Referencia | Papel atual |
| --- | --- |
| `origin/main` / `8befa41` | Governanca e PWA integrados; a linha Admin ainda não foi promovida para essa branch |
| `codex/driver-pwa-mobile` / `15afdb9` | Referência histórica da entrega do PWA integrada pelo [PR #1](https://github.com/PtiagoM/Charge-Grid-Intelligence/pull/1) |
| `codex/admin-web-sems-migration` / `c2aebd6` | Fotografia validada da primeira reconstrucao nativa do Admin |
| `origin/develop/admin-web` / `97cf69d` | Linha integrada do dashboard após o Painel agregado do PR #11 |
| PR #16 | Rollup ativo de Usinas → Dispositivos → Operação ChargeGrid → consolidação documental para `develop/admin-web` |

O merge `fe28427` tornou `c2aebd6` ancestral da `main`. O revert `92a2544` removeu seus arquivos sem remover essa ancestralidade. Por isso, `git merge codex/admin-web-sems-migration` pode responder que nao ha nada para integrar enquanto o dashboard continua ausente.

O PR #5 e a branch `feature/admin-responsibility-flows` são referências históricas. O PR #8 integrou a auditoria documental, o PR #9 construiu a fundação de personas e o PR #10 integrou essa fundação em `develop/admin-web`. Antes de iniciar nova entrega do Admin, atualize a referência remota. Crie uma branch curta a partir de `origin/develop/admin-web` quando o trabalho for independente ou da ponta declarada da cadeia quando depender dos PRs ainda abertos; uma cópia local atrasada não serve como evidência do estado integrado.

## Modelo de branches

### Branch protegida

- `main`: estado integrado, publicavel e recuperavel. Recebe somente Pull Requests.

### Linhas de produto

- `codex/driver-pwa-mobile`: referencia da entrega integrada do PWA e possivel linha de manutencao depois de sincronizada com `main`.
- `develop/admin-web`: linha principal ativa do dashboard.

### Branches curtas

- `feature/admin-<descricao>`
- `feature/pwa-<descricao>`
- `fix/<descricao>`
- `chore/<descricao>`
- `docs/<descricao>`

Branches curtas devem nascer da linha do produto correspondente e retornar a ela por PR. Nao acumule Admin e PWA na mesma feature branch.

## Estado da organizacao atual

1. Governanca, CI e protecao da `main`: concluidos pelo PR #2.
2. Validacao e integracao do PWA: concluidas pelo PR #1.
3. Restauracao correta do Admin em `develop/admin-web`: concluida.
4. Auditoria, decisões de produto e fundação de personas: integradas até o PR #10.
5. Painel agregado: integrado diretamente em `develop/admin-web` pelo PR #11 (`97cf69d`).
6. PRs #12–#15: integradas nas branches empilhadas e preservadas como histórico de revisão por escopo.
7. PR #16: integração consolidada da ponta mais atual em `develop/admin-web`; é a única PR ainda necessária para concluir esta rodada.
8. Novas alterações independentes do dashboard devem partir de `origin/develop/admin-web` depois da decisão sobre a PR #16.
9. Integração futura do Admin em `main`: somente por PR, após fechamento dos gates do plano, regressão completa e decisão humana.

### Cadeia de integração ativa — 27/08/2026

```text
origin/develop/admin-web (97cf69d, PR #11 integrada)
└── PR #16 feature/admin-current-state
    ├── PR #12 Usinas
    ├── PR #13 Dispositivos
    ├── PR #14 Operação ChargeGrid
    └── PR #15 Documentação consolidada
```

As PRs componentes permanecem como registro auditável; não precisam ser reabertas nem integradas individualmente em `develop/admin-web`. A decisão pendente é somente a revisão e integração manual da PR #16. O estado funcional e o trabalho restante estão em `docs/admin-dashboard/REMAINING_WORK.md`.

Nao recrie a linha ativa do Admin a partir de `codex/admin-web-sems-migration`: isso conserva a ancestralidade problematica e faz o Git omitir a migracao em um merge futuro. Use `develop/admin-web`, onde a recuperacao ja foi registrada corretamente.

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

## Estratégia de testes durante a evolução do produto

Enquanto o Dashboard Admin estiver convergindo para a referência SEMS+ e o modelo de negócio ainda mudar, a prioridade é proteger regras de domínio e jornadas críticas, não congelar uma interface transitória.

- Mantenha testes unitários para cálculo, autorização, escopo, fila, energia, financeiro, idempotência e relatórios.
- Execute E2E somente para o fluxo diretamente alterado; não rode a matriz completa em cada ajuste visual.
- Não crie snapshots, diffs de screenshot ou asserts detalhados de texto/estrutura visual sem aprovação explícita do produto de que a página, viewport e estado estão estáveis.
- Screenshots de PR são evidência de revisão, não baseline automatizado, até essa aprovação existir.
- A matriz visual e a regressão E2E integral entram no gate de PR para `main` ou em acionamento manual, quando a direção visual estiver consolidada.

A estratégia detalhada do Admin está em `docs/admin-dashboard/TESTING_STRATEGY.md`.

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
