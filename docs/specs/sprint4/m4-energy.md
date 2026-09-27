# M4 — Energia, demanda e automação explicável

Objetivo: provar renováveis+recarga+eficiência, sem EMS industrial. GRANDE, três unidades. Entrada G1; G2/G3 antes do aceite visual. Ler C5/C6/C8/C9 e I-S06–10 ratificadas em G0. Nenhum hardware real obrigatório. Frontends continuam observadores.

## S4-M4-U1 — Planta simulada e amostras persistidas

- **Depende:** G1; **tamanho:** MÉDIO.
- **Arquivos:** API GoodWeProvider/mock, commercial clock/repository/routes, migration energy samples, shared PlantEnergySnapshot; AdminSimulatorPage e EnergyOperationsPage; PWA só indicador de qualidade existente.
- **Implementar:** lab define PV/base/online da mesma plantaAurora; sinais persistidos como provider_config. `getPlantTelemetry` deixa de devolver null quando simulador online. EV soma entregas confirmadas do mesmo backend; jamais campo editável pelo laboratório. Tick1s gera C8 com fonteSIMULATED e quality; persistir amostra única por timestamp.
- **Matemática:** C8 exata; ausência bateria=null, não SOC fake. PV/base≥0 finitos; nominalEV7kW por conector; rejeitar NaN/negativo. Integração Wh cobre apenas intervalos confirmados; restart não extrapola downtime. Query energy/series observa dados, não avança relógio.
- **Apresentação:** reutilizar diagrama e cards Energia, não novo dashboard. Telemetria simulada identificada; série por janela real de amostras. CapacityPV desconhecida indisponível, não42kWp. Metadata técnica que não participa da regra pode continuar fixture identificada.
- **Testes:** V08; unit conservação e Wh; integration samples antes/depois restart; GET repetido não cria amostra. V-API,V-ADMIN,V-PWA e V-GLOBAL no checkpoint compartilhado.
- **Aceite:** GIVEN PV20/base10/EV7 WHEN dez minutos confirmados THENimport0/export3, EV1166,667Wh, solarToEv1166,667Wh; GIVEN offline THEN qualityindisponível, não novo zero medido.
- **Saída:** mesma energia alimenta Admin/PWA/API; dados quantitativos reproduzíveis. Commit `feat(energy): persist coherent simulated plant telemetry`.

### Checkpoint implementado

- `commercial_energy_samples` persiste somente leituras do provider simulado online; ausência do provider mantém a última leitura como `STALE`, sem criar uma medição zero.
- O relógio da API avança energia comercial e telemetria da planta; `GET` apenas observa. O laboratório persiste `online`, solar e carga-base do Aurora pelo endpoint de hardware da planta.
- A API deriva EV da potência dos carregadores em `CHARGING`; para uma planta sem bateria, calcula importação/exportação e Wh de cada intervalo pela mesma amostra. A tela Energia do Admin recebe a projeção da API e identifica o provider como simulado.
- Validado por tipo nos três pacotes e pelos testes focais de conservação (20/10/7 kW por 10 min) e persistência após reinício. A oferta solar, admissões por demanda e o indicador da PWA seguem para U2/U3.

## S4-M4-U2 — Admissão, corte e retomada

- **Depende:** U1 e lifecycle G1; **tamanho:** GRANDE.
- **Arquivos:** regra pequena em API/shared reaproveitando matemática válida de `apps/admin-web/src/domain/energyDemand.ts`, commercial lifecycle/clock, C8 types, EnergyOperationsPage e operations projeções. Não importar runtime Admin na API.
- **Implementar:** habilitar demandControlEnabled para cenário final após amostra fresh; servidor usa limiares/projeção C8 em todos Starts, incluindo contingência e lab. Considerar potência dos Starts pendentes para evitar admitir dois sobre mesma margem. UNKNOWN/STALE bloqueiam novos starts com motivo; antesM4 flagfalse era estágio transitório, não opção secreta para gate.
- **Corte:** um candidato por vez, visitante mais recente depois driver mais recente; registrar sampleId/policyVersion/projeção/comando/efeito. Esperar Stop confirmado antes de computar queda. Suspensão retém sessão/quote/garantia, não gera idle; teto e driver stop continuam prioritários. Sem candidatos, declarar insuficiência de controle.
- **Retomada:** recovery<75% por30s, projeção<90%, uma sessão mais antiga suspensa de cada vez; check financeiro/conector antes Start. Não retomar COMPLETED/FAULTED, veículo desconectado, garantia perdida ou equipamento offline.
- **Erros:** provider falhou→comando FAILED/alerta, não afirmar demanda reduzida; retry explícito por política após estado reavaliado, sem loop de comandos a cada tick. Duplicar amostra/evento não duplica decisão/comando.
- **Testes:** V08 incluindo dois Starts concorrentes, prioridade com guest/driver, boundary80/90/75, stale15s, recuperação30s, base sozinha>limite, stopfalho, sem idle suspenso. Testar orquestração, não apenas função de porcentagem.
- **Aceite:** GIVEN PV0/base8/EV7/limite20 WHEN pede segundo7 THEN projeção22 bloqueia; GIVEN base sobe com doisEV THEN Stop candidato diminui importação real mock, estado SUSPENDED_BY_DEMAND igual nos clientes.
- **Saída:** G4 não aprovado por boolean UI; requer evento + comando + efeito. Commit `feat(energy): enforce explainable demand admission and recovery`.

### Checkpoint implementado

- A política permanece desativada até o laboratório colocar o provider online; essa ativação fica persistida no banco. A partir daí, início de energia exige amostra `FRESH` de até 15 s e projeção abaixo de 90% do limite de 20 kW.
- O backend considera potência já admitida sobre a mesma amostra. Em crítico, interrompe somente uma sessão elegível, preserva pagamento/quote e a marca como `SUSPENDED_BY_DEMAND`; após 30 s abaixo de 75%, tenta retomada individual com as mesmas pré-condições.
- PWA já apresenta esse enum e o Admin agora o projeta como sessão suspensa na operação e em Energia. O teste de orquestração foi incluído; o runner Vitest local voltou a encerrar o worker por memória antes de concluir essa execução, enquanto tipo e build do Admin passam.

## S4-M4-U3 — Ofertas, alertas, recomendações e resultados

- **Depende:** U2; **tamanho:** MÉDIO.
- **Arquivos:** quote service/repository, eventos/projeções insights/reports, migration decisions, Admin energy/incidents/recommendations/ManagerShell, PWA plantRecommendations/EstablishmentPage/CheckoutPage.
- **Implementar:** regra oferta solar C8, congelar motivo/amostra/versão; oferta nova170c quando elegível, sessão/quote já aceita190 inalteradas. Sem tarifa por fila/ocupação nem segmentos. API deriva alertas/recomendações mínimos com correlationKey; decisões de revisão persistem. Recomendações sem dados dizem indisponível; orb explica mesmas entradas, não nova IA.
- **Automação versus decisão humana:** aceitar recommendation só marca revisão; policyenabled dispara comandos independentemente da aceitação, com motivo rastreável. Resolver incidente manual não torna equipamento saudável; condição só termina por telemetria.
- **Resultados:** exportar período+EVWh+solarToEvWh+import/exportWh+capturado/refund e decisões; contrafactual demanda sem controle calculado das mesmas entradas, rotulado “analítico”, sem segunda sessão/runtime. Sem economia financeira ou CO₂ sem método/fator.
- **Testes:** V08/V09; oferta stale não favorecida; versão antiga preservada; alerta dedup, decisão recarrega; aceite não invoca provider; soma séries/CSV/UI igual.
- **Aceite:** GIVEN PV20/base10/fresh/NORMAL WHEN nova quote THEN170 e sampleId; GIVEN sessão190 em curso THENcontinua190. GIVEN recomendação aceita THENnenhum Start/Stop adicional; origem e resultado da automação visíveis.
- **Saída/G4:** V08 reproduzível e PWA/Admin revalidados com policyenabled. Commit `feat(energy): connect solar offers and evidence-based recommendations`.

### Checkpoint parcial implementado

- A API consulta a última amostra persistida da planta do carregador ao criar uma nova cotação. Com telemetria `FRESH`, estado normal e excedente solar de ao menos 7 kW, oferece 170 c/kWh; fora dessa condição, preserva a tarifa vigente.
- `reasonCode` e `energySampleId` ficam gravados na cotação, e a sessão reutiliza a mesma cotação congelada. Uma mudança de telemetria posterior, portanto, não altera o preço aceito.
- O catálogo público entrega a mesma condição à PWA; o selo já existente de energia favorável e a ordenação de locais deixam de depender de fixture para o Hub Solar Aurora.
- O teste focal cobre PV 20 kW, carga-base 10 kW e verifica a oferta solar persistida e a sessão com a mesma tarifa. Alertas, recomendações e relatório de resultados permanecem nesta unidade.

## Não implementar

SetPower real, proteção elétrica, bateria simulada desnecessária, modelo ML, previsão meteorológica, carbono certificado, integração GoodWe real sem acesso, console comercial de cenários. Laboratório é único local técnico de ajuste físico; Operação não recebe “Solar/Pico/Avançar tempo”. Tests podem injetar relógio; usuário não ganha relógio comercial paralelo.
