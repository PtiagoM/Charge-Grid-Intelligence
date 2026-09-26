# M0 — Congelar o contrato do produto

Objetivo: produzir base suficiente para execução sem redescoberta. Tamanho MÉDIO. Entrada: plano aprovado, D1–D6. Saída G0 habilita código futuro; esta redação de specs não prova G0.

Leitura: [spec](spec.md), [decisions](decisions.md), [contracts](contracts.md), [acceptance](acceptance.md). Consultar código somente para confirmar nomes/assinaturas indicados. Limite: documentos, sem produto, migrations ou Git remoto.

## S4-M0-U1 — Ratificação e compatibilidade

- **Resultado:** `S4-C1` congelado em 26/09/2026; I-S01–I-S11 ratificadas pelo responsável antes de execução financeira/energética correspondente. **Estado:** concluído nesta execução documental.
- **Entradas:** `packages/shared/src/{contracts,enums}/index.ts`, `apps/api/src/commercial/repository.ts`, `apps/api/src/payments/routes.ts`, três migrations existentes; plano seções 7/12/13. Não revisar todo o repo.
- **Passos:** confirmar code versus UUID; conferir atual API versus alvo C4; resolver apenas incompatibilidades concretas; registrar mapeamento campos antigos → novos e ordem de migração. Fixar tarifa/idle e limiares dos exemplos; nunca escolher em cada frontend.
- **Aceite:** GIVEN D1–D6 WHEN executor recebe contrato THEN não pede segundo estabelecimento, cloud, top-up ou IAM; GIVEN sessão com quote WHEN tarifa muda THEN contrato explica versão da sessão e da nova oferta.
- **Verificação:** revisão documental de C1–C9; todas rotas novas marcadas futuras, legado com destino; nenhum parâmetro comercial sem unidade/autoridade. Uma revisão de leitura sem contexto deve conseguir resolver os vetores V01–V09.
- **Concluído quando:** inferências ratificadas e nenhuma contradição bloqueante. **Evidência:** aprovação explícita do responsável em 26/09/2026; revisão focal de contratos/rotas/migrations descrita abaixo.
- **Risco:** transformar inferência em regra aprovada; evitar escrevendo a origem no registro.

### Registro de compatibilidade M0-U1

| Item verificado | Estado em `a767f79` | Destino congelado |
|---|---|---|
| `CommercialSessionRecord.chargerId` | `sessionRecord()` preenche com `row.charger_code` | M1-U1 deve selecionar/preservar UUID em `chargerId`; `chargerCode` continua apresentação |
| Migrations comerciais | constructor executa os três SQLs a cada boot; migration inicial faz UPSERT e restaura publicação/tarifa | M1-U1 introduz ledger sequencial e seed explícito não destrutivo, sem editar migrations aplicadas |
| Sincronização Stripe | `GET /payments/:id` chama `recordPayment()` e altera SQL | M1-U5 move reconciliação para webhook/reconsulta Node idempotente; GET se torna observador |
| Checkout e hardware atuais | intent aceita `chargerId` como código; rotas hardware usam `:chargerCode` | M1-U3 migra checkout para UUID/quote; laboratório mantém code somente como resolvedor de fronteira |
| Runtime | PGlite em `.local/commercial-db` quando não há URL; `startCommercialClock()` usa `setInterval` de 1 s | D4 permanece: PGlite + Node contínuo oficial; remoto é opcional |

Ordem de mudança obrigatória: M1-U1 cria ledger/catálogo/campos aditivos → M1-U2 protege ownership → M1-U3 migra quote/checkout → M1-U4 unifica lifecycle físico → M1-U5 liquidação/idle → M1-U6 fila → M1-U7 projeções. Nenhum consumidor recebe contrato novo antes da unidade dona.

## S4-M0-U2 — Pacote de aceite e rastreabilidade

- **Depende:** U1.
- **Resultado:** cada requisito do núcleo tem unidade dona e gate; cada exclusão tem destino honesto de UI.
- **Arquivos:** estes documentos; referenciar `docs/SPRINT4_BEHAVIOR_MATRIX.md` em vez de duplicar inventário.
- **Passos:** conferir valores dos vetores; mapear P1–P12/A1–A12 às unidades em acceptance.md; definir ambiente isolado e comandos; registrar baseline da branch sem confundir testes históricos com execução nova.
- **Aceite:** GIVEN executor de M2 WHEN lê spec+C1–C7+M2 THEN sabe quais endpoints consumir sem inventar API; GIVEN executor de M3 THEN não cria novos papéis/CRUD; GIVEN teste de reset THEN sabe que banco pessoal é proibido.
- **Verificação:** links locais, IDs únicos, dependências acíclicas, fórmulas conferidas. Não rodar suíte do produto para “aprovar” documentação.
- **Concluído quando:** registro G0 em acceptance.md contém revisão e aprovação do contrato; pronta a primeira unidade M1-U1. **Estado:** concluído nesta execução documental.

## Gate G0

Contrato e comportamento conhecidos; não significa implementação. **G0 está aprovado documentalmente:** regras ratificadas, conflitos atuais mapeados, vetores e rastreabilidade revisados. A próxima unidade elegível é M1-U1. Checkpoint sugerido: `docs(sprint4): freeze executable product contract`. Nenhum `npm install`, novo serviço, push ou reset fez parte deste marco.
