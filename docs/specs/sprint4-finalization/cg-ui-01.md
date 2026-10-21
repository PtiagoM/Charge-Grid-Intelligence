# CG-UI-01 — Energia e demanda: leitura operacional e previsão

**Classificação:** HUMAN FRONTEND GATE aprovado e encerrado em 05/10/2026 · **Status:** IMPLEMENTADO — pronto para revisão · **Tamanho:** MÉDIO · **Risco:** MÉDIO.

## Objetivo e escopo

Reorganizar substancialmente a apresentação na tela existente `Energia e demanda`, sem nova rota ou dashboard. A navegação única no topo mantém `Agora`, `Fluxo`, `Decisão`, `Impacto` e `Política`; o bloco escalar de Previsão fica junto da Decisão, sem item de navegação duplicado. O shell GoodWe/SEMS+ e as entidades/contratos existentes permanecem.

A direção visual aprovada em 05/10/2026 é composta como página longa: medidor e estado atual, fluxo de potência/energia, decisão determinística, previsão escalar, sessões/fila e política persistida. A implementação usa SVG/CSS dinâmicos; nenhuma captura de tela foi incorporada como asset.

## Fora de escopo

Nova página de IA, novo dashboard, mudança de regra comercial, alteração da API, controle direto de hardware, refatoração do shell, mudança da PWA ou apresentação de telemetria sintética como real. A previsão nunca cria comandos. A ausência de bateria permanece indisponível, não zero.

## Dependências e fonte de dados

- `GET /commercial/snapshot`: leitura energética, sessões, carregadores e fila persistidos.
- `GET /commercial/plants/:plantId/energy`: política e decisão de admissão produzidas no backend.
- `GET /commercial/plants/:plantId/forecast`: `PlantForecastResponse`, consumido no mesmo polling central de 2 s já mantido por `AdminState`.
- A previsão requer AI-05 e a evidência de decisão do backend já integrada por DEC-01. Falha isolada no endpoint de previsão não descarta a projeção operacional; aparece como erro focal.
- `SIMULATED` e `SIMULATED_COMPOSITE` são identificados como origem simulada; não são telemetria física de Aurora.
- Plantas que só possuem fixture local não exibem esses valores como estado operacional compartilhado.

## Arquivos relevantes

- `apps/admin-web/src/features/energy/EnergyOperationsPage.tsx` e `EnergyOperationsExperience.tsx` — entrada existente e apresentação.
- `apps/admin-web/src/features/energy/EnergyFlowDiagram.tsx` — diagrama responsivo, símbolos vetoriais e conexões vinculadas à potência recebida.
- `apps/admin-web/public/assets/sems/energy/plant-aurora.svg` — ilustração vetorial original da planta, sem texto/dados incorporados.
- `apps/admin-web/src/services/commercialSnapshotRepository.ts` e `energyForecastMapper.ts` — polling/leitura e normalização de forecast.
- `apps/admin-web/src/domain/admin.ts` — projeção tipada usada pela tela.
- `apps/admin-web/src/styles/app.css` — regras responsivas limitadas à superfície Energia.
- `apps/admin-web/tests/unit/energy-forecast-mapper.test.js` e `tests/e2e/energy-demand.spec.js` — estados de forecast e limite entre fixture local e dados integrados.

## Comportamento implementado

- **Agora:** importação da rede (campo operacional `demandKw`), limite, margem, utilização e limiares são apresentados a partir do snapshot/política recebidos. O rótulo explicita que a leitura é importação da rede, grandeza comparada ao limite; o frontend apenas calcula proporções para desenho/aritmética de margem e não replica a regra de admissão. Importação zero em `SOLAR_SURPLUS` é válida quando geração solar cobre a carga.
- **Fluxo:** potência instantânea em kW, energia do registro em kWh e unidades explicitadas. Solar/rede e cargas são agrupados sem alegar rastreamento instantâneo por origem. Bateria sem sinal é “Não integrada”.
- **Decisão:** mostra separadamente a medição, `projectedImportKw`, estado, `reasonCode`, versão, timestamp e evidências retornadas pela decisão do backend. A previsão tem painel próprio e não é usada pela tela para substituir `canAdmit` nem emitir comandos.
- **Previsão:** usa o ponto escalar entregue pelo contrato; não desenha curva, não interpola nem inventa confiança. `MAE`/`RMSE` e janela de teste são rotulados como avaliação histórica offline; provenance SIMULATED fica visível.
- **Estados da previsão:** `LOADING`, `ERROR`, `UNAVAILABLE`, `STALE` e `AVAILABLE`. Ausência/expiração não se torna zero; previsão stale é identificada como último valor, não vigente. Falha de previsão não impede o snapshot/decisão de atualizar.
- **Impacto:** sessões ativas e fila vêm das mesmas projeções comerciais. Estados vazios são explícitos; não são criados motoristas/sessões.
- **Política:** limiares/versão/freshness/estado do provider são apresentados; valores por kW da régua são conversões visuais dos limites persistidos. Provider simulado fica explícito.
- **Acessibilidade/responsividade:** SVG com nome/descrição, conteúdo de estado em texto, foco visível, navegação por âncoras e layouts adaptados a mobile/tablet.

## Critérios de aceite

- [x] Nenhuma nova rota/página/dashboard; PWA e API inalteradas.
- [x] Navegação única no topo com cinco âncoras.
- [x] Payload de decisão permanece autoridade; valor medido, projeção de admissão e forecast não são confundidos.
- [x] Previsão usa dado escalar real do endpoint; sem curva/confiança artificiais e sem zero para indisponibilidade.
- [x] Estados e erros do endpoint não escondem a telemetria/decisão quando estas foram obtidas.
- [x] Sessões/fila vazias não recebem conteúdo fictício.
- [x] Origem simulada e bateria não integrada são identificadas.
- [x] Medidores identificam `demandKw` como importação da rede, sem alterar valor, limiares ou regra do backend.
- [x] Fixtures de outras plantas não são representadas como operação comercial compartilhada.

## Testes, documentação e entrega

- Testes focais executados: `energy-forecast-mapper.test.js`, `energy-demand.test.js`, `commercial-snapshot.test.js`: **14 testes aprovados**, com um worker.
- E2E focal de Energia: **3 testes aprovados**, incluindo navegação interna preservando a rota HashRouter e não promoção de fixture a dado integrado. Usado `PLAYWRIGHT_BASE_URL=http://localhost:5173` para reutilizar o Vite existente, sem iniciar outra instância.
- Build Admin/typecheck aprovado; lint focal aprovado. O build mantém o aviso de chunk acima de 500 kB. Revisão visual continua sendo evidência, não baseline automatizado.
- Atualizar esta SDD, índice mestre e CURRENT_STATE nesta unidade.
- Commit local consolidado com as unidades DEC-01, OPS-01 e INT-01A por formarem a mesma vertical de previsão energética integrada. Sem push, PR ou merge.

## Gate visual

**Encerrado em 05/10/2026:** o responsável aprovou as três referências visuais e autorizou implementação autônoma até ficar pronta para revisão. Nenhuma aprovação adicional é pré-condição desta unidade.

## Correção visual e assets — 05/10/2026

A comparação foi feita com as três referências e capturas separadas da aplicação em **1440 × 1000**, além de inspeção em **390 × 844**. As quatro imagens fornecidas abriram corretamente.

- Medidor ampliado, leitura em kW no centro, ponteiro e limiares persistidos identificados. Agora contém somente um resumo compacto da admissão; a sequência completa fica em Decisão.
- Barra de cinco âncoras única e não flutuante. Cliques rolam a página sem substituir a rota `#/mvp/energy?est=...`.
- Solar/rede → barramento da planta → EV/bateria apresentados com arte vetorial própria. Fluxos de potência positiva têm direção; consumo EV zero e ausência de potência da bateria têm conexão tracejada. Exportação da rede usa direção inversa quando reportada. O desenho não afirma atribuição instantânea solar→EV.
- Sequência de decisão: leitura → incremento (diferença aritmética entre a projeção recebida e a leitura) → projeção → decisão do backend. Não são usados `candidateSessionIds` como contagem de solicitações de admissão.
- Previsão ausente apresenta status e motivo explícitos. Estados e mapper existentes preservados; `SIMULATED_COMPOSITE` identifica o benchmark, não a telemetria física da planta.
- Estados vazios de sessões e fila possuem ilustrações vetoriais e texto próprio. A escala de política usa os limiares persistidos, com marcador da leitura e duração configurada da recuperação.
- Inventário dos assets SEMS+ revisado: fotografias de planta, imagens de carregadores e ícones do shell permanecem em suas superfícies; o diagrama exige ilustração escalável própria. Nenhum recorte de screenshot foi incorporado; nenhuma dependência nova.

Payload observado (somente evidência, não constantes da tela): `plant_aurora_001`, demanda 11 kW, limite 20 kW, projeção 18 kW, PV 1 kW, carga base 12 kW, EV 0 kW; decisão `PROJECTED_LIMIT`, forecast `UNAVAILABLE / FORECAST_NOT_GENERATED`.

Screenshots locais de revisão em `output/playwright/energy-after-*.png` e `energy-mobile-*.png`. Forecast disponível/stale/erro/carregamento foi validado pelos testes focais; o ambiente observado fornecia forecast indisponível. Não foram criadas sessões, pagamentos ou telemetria durante esta revisão. Erros globais anteriores do mapa/IntersectionObserver e resumo de estabelecimento não integrado permanecem fora desta alteração.
