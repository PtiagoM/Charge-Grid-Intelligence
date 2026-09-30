# CG-DASH-03 — sustentabilidade e economia verificáveis

**Classificação:** PEQUENO AJUSTE NO FRONT · **Status:** PLANNED · **Tamanho:** MÉDIO · **Risco:** ALTO.

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

Unit pequeno para fórmula/unidades e integration do payload; E2E só se estado visual mudar. Criar metodologia versionada e atualizar README técnico. Commit: `feat(dashboard): derive sustainability metrics transparently`.

## Condição de parada

Sem fonte aplicável e citável, implementar apenas o estado indisponível e registrar a limitação; não escolher fator arbitrário.

