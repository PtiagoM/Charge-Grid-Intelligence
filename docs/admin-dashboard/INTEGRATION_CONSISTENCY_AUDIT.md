# Auditoria de integração e consistência do Admin

**Atualizado em:** 27 de setembro de 2026  
**Escopo operacional validado:** Hub Solar Aurora  
**Autoridade executável mínima:** API ChargeGrid + PGlite persistente

## Resultado

O Hub Solar Aurora passou a ser projetado no SEMS+ a partir da mesma operação comercial persistida. Lista de usinas, Lista de dispositivos, ChargeGrid, Sessões, Energia e demanda, Recomendações, Central de alarmes e Central de relatórios usam os mesmos identificadores e registros da API.

O catálogo técnico histórico do SEMS+ continua disponível como fixture somente para superfícies de referência fora do cenário Aurora. Ele não é apresentado como operação comercial real do Aurora. Métricas sem evidência persistida aparecem como indisponíveis, em vez de receber valores sintéticos.

## Identidade canônica

| Entidade | Identificador canônico | Observação |
| --- | --- | --- |
| Estabelecimento | `est_aurora_001` | Unidade comercial e escopo de autorização |
| Planta | `plant_aurora_001` | Planta energética vinculada ao estabelecimento |
| Carregadores | UUIDs `00000000-0000-4000-8000-000000000001` a `...006` | Chaves internas persistidas |
| Códigos públicos | `AURORA-01` a `AURORA-06` | Identidade exibida e resolvida por código/QR |

Os aliases históricos `plant_demo_aurora_001`, `gw-est_aurora_001` e `cplant-est_aurora_001` não são fontes de verdade. A projeção do Admin substitui esses aliases pela planta canônica sem alterar UUID, código público ou QR dos carregadores.

## Inconsistências encontradas e decisão aplicada

1. **Aurora ausente da Lista de usinas.** A lista lia apenas o catálogo fixture GoodWe. A projeção agora combina esse catálogo com plantas comerciais recebidas da API e identifica a origem `COMMERCIAL_API`.
2. **IDs públicos usados como chaves internas.** Carregadores e sessões eram projetados pelo código público. A projeção preserva UUID em relações e URLs e usa `identifier`/`publicCode` somente para apresentação.
3. **Três representações da planta Aurora.** Aliases de frontend foram removidos da projeção ativa. A relação é `est_aurora_001 -> plant_aurora_001`.
4. **Decisão de demanda recalculada no React.** A tela agora apresenta a política e a decisão persistidas e calculadas pelo backend. O fallback local permanece apenas para fixtures técnicas legadas.
5. **Falha física exibida como manutenção.** `FAULT` possui estado próprio e é exibido como `Falha` em Operação e Lista de dispositivos.
6. **Incidentes recuperados sumiam ou permaneciam como ativos.** O backend preserva alertas que já estiveram ativos; a UI distingue condição recuperada de resolução humana. Criação, atualização e decisão usam timestamps persistidos distintos.
7. **Recomendações sem evidência operacional.** Recomendações Aurora vêm de regras determinísticas da API, com amostra, política, motivo, evidências e ação proposta. Aceitar uma recomendação não executa comando.
8. **Relatórios podiam gerar linhas locais sintéticas.** Para Aurora, sessões, energia, financeiro, carregadores e decisões vêm de `/commercial/reports`. Outros escopos são indicados como indisponíveis no protótipo.
9. **Capacidade FV confundida com soma da potência EV.** Sem capacidade fotovoltaica persistida, o Painel exibe indisponibilidade; os 42 kW dos seis carregadores não são mais rotulados como kWp.
10. **Estado comercial paralelo da fila no contexto Admin.** Ações locais não utilizadas foram retiradas do contexto. A tela operacional observa a fila da API.
11. **“Hub Solar Insight” global sem responsabilidade própria.** O atalho/assistente estático foi removido. Energia permanece em Ferramentas de análise; recomendações ficam na Central de alarmes.

## Matriz final das superfícies

| Superfície | Fonte de dados Aurora | Entidade principal | Estado | Observação |
| --- | --- | --- | --- | --- |
| Painel | snapshot + energia da API | estabelecimento/planta | Integrado | Agregados comerciais reais; capacidade FV não informada fica indisponível |
| Lista de usinas | catálogo técnico + projeção da API | planta | Integrado | Aurora usa `plant_aurora_001` |
| Detalhe da planta | projeção da API | planta/carregador | Integrado | Exibe UUID e código público sem inventar geração FV |
| Lista de dispositivos | snapshot da API | carregador | Integrado | `FAULT`, `OFFLINE`, `CHARGING` e potência usam o mesmo registro |
| ChargeGrid > Operação | snapshot + energia + decisões | carregador/planta | Integrado | Polling de 2 s; sem runtime paralelo |
| ChargeGrid > Sessões | snapshot da API | sessão | Integrado | UUID interno e `publicCode` preservados |
| ChargeGrid > Fila | snapshot da API | entrada de fila | Integrado | Somente leitura; processamento pertence ao backend |
| ChargeGrid > Financeiro | snapshot/pagamentos | pagamento/sessão | Integrado | Stripe sandbox e valores persistidos |
| Energia e demanda | `/commercial/plants/:plantId/energy` | amostra/política/decisão | Integrado | Estado, fluxo, decisão, impacto e política separados visualmente |
| Recomendações | `/commercial/insights` | recomendação | Integrado | Regra determinística explicável, sem autoexecução |
| Central de alarmes | `/commercial/insights` | incidente | Integrado | Falha simulada gera alerta persistido; recuperação precede resolução humana |
| Central de relatórios | `/commercial/reports` | relatório operacional | Integrado para Aurora | Outros locais não recebem números artificiais |
| Laboratório | MockGoodWeProvider -> API | carregador/planta | Simulação legítima | Simula somente hardware e telemetria; não cria sessão, pagamento ou receita |

## Classificação das fontes

- **REAL/PERSISTIDO:** estabelecimentos, plantas comerciais, carregadores, sessões, fila, tarifas, pagamentos, amostras energéticas, políticas, decisões, insights e relatórios Aurora.
- **SANDBOX REAL:** Stripe test quando as credenciais estão configuradas.
- **SIMULAÇÃO DE HARDWARE:** conexão, desconexão, potência, falha, offline e telemetria da planta emitidas pelo laboratório/MockGoodWeProvider e persistidas pela API.
- **FIXTURE DE REFERÊNCIA:** portfólio técnico SEMS+ não Aurora e diagnósticos históricos. Não são usados como evidência operacional Aurora.
- **INDISPONÍVEL/CONCEITUAL:** diagnóstico IV/bateria para Aurora sem equipamentos/dados correspondentes, envio externo de relatórios e integrações GoodWe físicas.

## Cadeia transversal

```text
est_aurora_001
  -> plant_aurora_001
  -> charger UUID / AURORA-01..06
  -> commercial_session
  -> MockGoodWeProvider + telemetria persistida
  -> commercial_energy_samples
  -> commercial_demand_policies + decisão de admissão
  -> commercial_decisions (recomendação/alerta)
  -> relatório operacional da API
```

A cadeia está conectada no cenário Aurora. A fronteira simulada começa no hardware/GoodWe e não no frontend. Não existe telemetria física real; o laboratório injeta os sinais pelo mesmo contrato que a integração futura deverá implementar.

## Evidência de validação

- Lista de usinas exibiu uma única Aurora canônica e abriu `plant_aurora_001`.
- Lista de dispositivos exibiu os seis carregadores e mapeou `FAULT` de `AURORA-01` como falha.
- Operação exibiu os mesmos seis códigos/UUIDs e removeu a falha após `RECOVER` sem reload manual.
- Energia exibiu PV, carga-base, EV, rede, bateria não integrada, política `demand-v1` e decisão de admissão da API.
- Recomendações exibiu excedente solar com valores da amostra persistida e link correto para o estabelecimento.
- Central de alarmes preservou falha e telemetria recuperadas, permitiu resolução humana e exibiu timeline persistida.
- Relatórios ficou limitado a Aurora e aceitou sessões, energia, financeiro e incidentes da API.
- Lint global passou sem erros (duas advertências preexistentes de hooks na PWA).
- Typecheck compartilhado/API/Admin passou.
- Testes Admin passaram: 79 testes em 21 arquivos.
- Testes API passaram: 30 testes em 4 arquivos; Shared passou: 5 testes.
- Build global passou para Shared, Admin, PWA e API.
- E2E Sprint 4 passou: 2 cenários, incluindo a cadeia transversal Aurora e reload persistente.

## Limitações deliberadas

- PGlite é o runtime oficial reproduzível; Supabase/PostgreSQL remoto é opcional enquanto não estiver estável.
- O laboratório é a fonte simulada da telemetria GoodWe e dos eventos físicos.
- A conta administrativa continua sendo autenticação local de protótipo; IAM multi-organização não é pré-requisito.
- O catálogo técnico não Aurora permanece uma referência visual/fixture e não oferece a vertical comercial completa.
- Capacidade FV, bateria e diagnósticos sem medição real não são inferidos a partir da potência dos carregadores.
