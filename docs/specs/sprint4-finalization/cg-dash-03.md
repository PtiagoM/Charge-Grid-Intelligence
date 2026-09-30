# CG-DASH-03 — sustentabilidade e economia verificáveis

**Classificação:** PEQUENO AJUSTE NO FRONT · **Status:** DONE · **Tamanho:** MÉDIO · **Risco:** ALTO.

## Objetivo e escopo

Tornar `Contribuições ambientais` e `Economia` honestos: calcular apenas indicadores sustentados por energia persistida e fatores versionados, ou exibir indisponibilidade.

## Fora de escopo

Certificação de carbono, crédito de carbono, ROI completo, bateria, valores de marketing ou nova página.

## Dependências e estado atual

Depende de DASH-01. Existem helpers/fixtures de sustentabilidade, mas a entrega não pode tratar equivalências locais como resultados medidos sem método e fonte.

## Arquivos relevantes

`apps/admin-web/src/core/sustainability.ts`, `features/dashboard/AdminDashboardPage.tsx`, API commercial summary, shared contracts, `docs/` de metodologia a criar na unidade.

## Lógica obrigatória

1. Pesquisar e registrar fonte pública, região, ano, unidade, licença e data de acesso para cada fator.
2. CO₂ evitado só pode usar `solarToEvKWh` confirmado × fator marginal/médio explicitamente escolhido; não usar geração total como se alimentasse EV.
3. Economia só pode usar autoconsumo confirmado × diferença tarifária documentada. Tarifa cobrada do motorista não é custo evitado da rede.
4. Persistir/expor `methodologyVersion` e inputs no payload derivado ou devolver `null` com motivo.
5. UI existente mostra período e rótulo “estimativa derivada”, sem animação/tendência inventada.

## Critérios de aceite

- Recalcular manualmente com inputs do payload reproduz o card.
- Ausência de fator ou `solarToEvKWh` produz indisponível.
- Fonte e fórmula estão linkadas na documentação.
- Nenhuma fixture ambiental participa do Aurora runtime.

## Testes, documentação e commit

Não foi encontrada uma base temporal suficiente para habilitar emissões ou economia monetária sem inventar fator: o endpoint agrega energia solar→EV por janela, a planilha MCTI 2026 não foi inspecionada/versionada e não há custo de importação/compensação registrado. Portanto, conforme a condição de parada, os impactos são explicitamente indisponíveis. Os cards existentes agora exibem solar→EV, energia EV e exportação somente a partir do payload, usando a janela selecionada; métricas sem entrada/método permanecem indisponíveis. Foram removidos os multiplicadores ambientais e o cálculo fixo de receita que vinham de estado agregado local, além do seletor artificial de semana/ano.

E2E focal verifica energia solar→EV/EV, ausência de cálculo de CO₂/economia e os agregados controlados; typecheck e lint passam. Atualizados README e metodologia com fontes, unidade, limitações e fórmula candidata. Commit: `feat(dashboard): derive sustainability metrics transparently`.

## Condição de parada

Se a fonte/fator ou a compatibilidade temporal mudar, abrir unidade própria para versionar a planilha e os buckets mensais antes de calcular impactos; não escolher fator arbitrário dentro desta unidade.
