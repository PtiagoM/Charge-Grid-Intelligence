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

## S4-M4-U3 — Ofertas, alertas, recomendações e resultados

- **Depende:** U2; **tamanho:** MÉDIO.
- **Arquivos:** quote service/repository, eventos/projeções insights/reports, migration decisions, Admin energy/incidents/recommendations/ManagerShell, PWA plantRecommendations/EstablishmentPage/CheckoutPage.
- **Implementar:** regra oferta solar C8, congelar motivo/amostra/versão; oferta nova170c quando elegível, sessão/quote já aceita190 inalteradas. Sem tarifa por fila/ocupação nem segmentos. API deriva alertas/recomendações mínimos com correlationKey; decisões de revisão persistem. Recomendações sem dados dizem indisponível; orb explica mesmas entradas, não nova IA.
- **Automação versus decisão humana:** aceitar recommendation só marca revisão; policyenabled dispara comandos independentemente da aceitação, com motivo rastreável. Resolver incidente manual não torna equipamento saudável; condição só termina por telemetria.
- **Resultados:** exportar período+EVWh+solarToEvWh+import/exportWh+capturado/refund e decisões; contrafactual demanda sem controle calculado das mesmas entradas, rotulado “analítico”, sem segunda sessão/runtime. Sem economia financeira ou CO₂ sem método/fator.
- **Testes:** V08/V09; oferta stale não favorecida; versão antiga preservada; alerta dedup, decisão recarrega; aceite não invoca provider; soma séries/CSV/UI igual.
- **Aceite:** GIVEN PV20/base10/fresh/NORMAL WHEN nova quote THEN170 e sampleId; GIVEN sessão190 em curso THENcontinua190. GIVEN recomendação aceita THENnenhum Start/Stop adicional; origem e resultado da automação visíveis.
- **Saída/G4:** V08 reproduzível e PWA/Admin revalidados com policyenabled. Commit `feat(energy): connect solar offers and evidence-based recommendations`.

## Não implementar

SetPower real, proteção elétrica, bateria simulada desnecessária, modelo ML, previsão meteorológica, carbono certificado, integração GoodWe real sem acesso, console comercial de cenários. Laboratório é único local técnico de ajuste físico; Operação não recebe “Solar/Pico/Avançar tempo”. Tests podem injetar relógio; usuário não ganha relógio comercial paralelo.
