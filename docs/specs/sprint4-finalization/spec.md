# Sprint 4 — pacote final de execução

Status: **PLANEJADO**. Este pacote transforma o plano mestre aprovado em unidades executáveis. Ele não registra implementação nova.

## Como usar

1. Ler [CURRENT_STATE](../../CURRENT_STATE.md), o [contrato S4-C1](../sprint4/contracts.md) e as [decisões deste pacote](decisions.md).
2. Executar somente uma unidade marcada `READY` e suas dependências concluídas.
3. Não decidir arquitetura, produto ou interface fora do SDD. Divergência exige parar e registrar decisão.
4. Atualizar código, teste proporcional, documentação e um commit coerente na mesma unidade.
5. Não executar os pais `CG-AI-03` e `CG-INT-01`; usar suas subunidades.

## Invariantes

- PWA está finalizada; alterá-la apenas por regressão ou contrato inevitável.
- Aurora é o único cenário integral obrigatório; IDs canônicos existentes não mudam.
- PGlite + Node contínuo é o runtime mínimo oficial. Supabase remoto é opcional.
- Admin, PWA e laboratório observam a mesma API e persistência.
- Laboratório simula somente GoodWe/hardware; não cria sessão, pagamento ou receita.
- Dashboard preserva cards existentes; Energia preserva `Agora`, `Fluxo`, `Decisão`, `Impacto` e `Política`.
- Bateria permanece fora do escopo obrigatório. Ausência é `null`/indisponível, nunca valor inventado.
- IA: dados reais → treino offline Python → artefato versionado → inferência Node → previsão → regras → Decision Engine.
- Sem FastAPI no runtime inicial; previsão não comanda hardware diretamente.
- Métrica sem série, metodologia ou fonte aparece indisponível.
- Nova tela, seção, fluxo ou refatoração visual relevante exige `HUMAN FRONTEND GATE`.

## Índice mestre

| ID | SDD | Dependências | Tamanho | Risco | Frontend Gate | Testes | Status |
|---|---|---|---|---|---|---|---|
| CG-F0-01 | [Base Git e evidências](cg-f0-01.md) | — | PEQUENO | MÉDIO | BACKEND ONLY | Git/docs | READY |
| CG-F0-02 | [Contrato final S4-C2](cg-f0-02.md) | F0-01 | MÉDIO | ALTO | BACKEND ONLY | contrato | PLANNED |
| CG-DASH-01 | [Agregados temporais canônicos](cg-dash-01.md) | F0-02 | MÉDIO | ALTO | BACKEND ONLY | unit/integration | PLANNED |
| CG-DASH-02 | [Cards do Dashboard](cg-dash-02.md) | DASH-01 | MÉDIO | MÉDIO | PEQUENO AJUSTE NO FRONT | unit/E2E focal | PLANNED |
| CG-DASH-03 | [Sustentabilidade e economia](cg-dash-03.md) | DASH-01 | MÉDIO | ALTO | PEQUENO AJUSTE NO FRONT | unit/integration | PLANNED |
| CG-AI-01 | [Due diligence de datasets](cg-ai-01.md) | F0-02 | MÉDIO | ALTO | BACKEND ONLY | validação documental | PLANNED |
| CG-AI-02 | [Pipeline reproduzível](cg-ai-02.md) | AI-01 | MÉDIO | ALTO | BACKEND ONLY | pipeline | PLANNED |
| CG-AI-03 | [Treino e seleção — pai](cg-ai-03.md) | AI-02 | GRANDE | ALTO | BACKEND ONLY | executar A/B | PLANNED |
| CG-AI-03A | [Baselines e protocolo](cg-ai-03a.md) | AI-02 | MÉDIO | ALTO | BACKEND ONLY | treino offline | PLANNED |
| CG-AI-03B | [Modelo e model card](cg-ai-03b.md) | AI-03A | MÉDIO | ALTO | BACKEND ONLY | treino offline | PLANNED |
| CG-AI-04 | [Artefato e paridade Node](cg-ai-04.md) | AI-03B | MÉDIO | ALTO | BACKEND ONLY | parity/contract | PLANNED |
| CG-AI-05 | [Persistência e API de previsão](cg-ai-05.md) | AI-04, F0-02 | MÉDIO | ALTO | BACKEND ONLY | integration | PLANNED |
| CG-DEC-01 | [Previsão no Decision Engine](cg-dec-01.md) | AI-05 | MÉDIO | ALTO | BACKEND ONLY | unit/integration | PLANNED |
| CG-LAB-01 | [Perfis energéticos reproduzíveis](cg-lab-01.md) | F0-02 | MÉDIO | MÉDIO | BACKEND ONLY | integration | PLANNED |
| CG-LAB-02 | [Controles de cenário](cg-lab-02.md) | LAB-01 | MÉDIO | MÉDIO | HUMAN FRONTEND GATE | E2E/manual | PLANNED |
| CG-UI-01 | [Apresentação da previsão](cg-ui-01.md) | AI-05 | MÉDIO | MÉDIO | HUMAN FRONTEND GATE | component/E2E/manual | PLANNED |
| CG-OPS-01 | [Alarmes e recomendações preditivas](cg-ops-01.md) | DEC-01 | MÉDIO | ALTO | PEQUENO AJUSTE NO FRONT | unit/integration/E2E focal | PLANNED |
| CG-INT-01 | [Prova integrada — pai](cg-int-01.md) | DASH-03, LAB-02, UI-01, OPS-01 | GRANDE | ALTO | BACKEND ONLY | executar A/B | PLANNED |
| CG-INT-01A | [Prova automatizada](cg-int-01a.md) | DASH-03, LAB-01, DEC-01, OPS-01 | MÉDIO | ALTO | BACKEND ONLY | integration/E2E | PLANNED |
| CG-INT-01B | [Gate visual e evidências](cg-int-01b.md) | INT-01A, LAB-02, UI-01 | MÉDIO | MÉDIO | BACKEND ONLY | manual | PLANNED |
| CG-STAB-01 | [Hardening mínimo](cg-stab-01.md) | INT-01B | MÉDIO | MÉDIO | PEQUENO AJUSTE NO FRONT | regressões focais/global gate | PLANNED |
| CG-DEL-01 | [Entrega final](cg-del-01.md) | STAB-01 | MÉDIO | MÉDIO | BACKEND ONLY | suíte final/manual | PLANNED |

## Ordem obrigatória

`F0-01 → F0-02 → {DASH-01, AI-01, LAB-01} → DASH-02/DASH-03 → AI-02 → AI-03A → AI-03B → AI-04 → AI-05 → DEC-01 → {LAB-02, UI-01, OPS-01} → INT-01A → INT-01B → STAB-01 → DEL-01`.

AI e laboratório podem avançar em paralelo depois de F0-02. Nenhum executor antecipa UI bloqueada por gate humano.
