# CG-DASH-01 — agregados temporais canônicos

**Classificação:** BACKEND ONLY · **Status:** PLANNED · **Tamanho:** MÉDIO · **Risco:** ALTO.

## Objetivo e escopo

Entregar um agregado único do Aurora para alimentar os cards existentes com energia, receita, demanda, utilização e disponibilidade honestas no período solicitado.

## Fora de escopo

Novo dashboard, séries interpoladas, previsão, CO₂/economia sem metodologia e migração das demais plantas.

## Dependências e estado atual

Depende de F0-02. Energia, relatórios, financeiro e snapshot já saem da API, mas o Dashboard ainda combina projeções/fixtures e não possui um contrato temporal único.

## Arquivos relevantes

`apps/api/src/commercial/repository.ts`, `routes.ts`, testes comerciais, `packages/shared/src/contracts/index.ts`, migrations somente se uma consulta não puder ser derivada das tabelas atuais.

## Comportamento e API

Criar `GET /commercial/dashboard-summary?establishmentId&from&to` usando `CommercialDashboardSummary` S4-C2. Período é UTC `[from,to)`, máximo 31 dias. A resposta deriva:

- energia de `commercial_energy_samples`/relatório vigente;
- financeiro somente de capturado menos devolvido; autorizado não é receita;
- demanda atual e pico de importação medida, com limite/política vigentes;
- utilização de duração confirmada de sessões sobre capacidade publicada no período;
- contagens de sessões/carregadores a partir das entidades persistidas;
- `null + reason` quando cobertura de amostras for insuficiente.

GET não cria amostra, tick, decisão nem sessão. Reutilizar queries do relatório quando equivalentes; não duplicar cálculo no React.

## Critérios de aceite

- Mesmo período no relatório e summary produz mesmos Wh/centavos.
- Janela vazia retorna zeros apenas para somas comprovadamente vazias; medição sem cobertura retorna indisponível.
- Reload/restart preserva resultado.
- Outro establishment não recebe dados Aurora.

## Testes, documentação e commit

Integration focal para período, receita, cobertura e isolamento; unit apenas para cálculo temporal extraído. Atualizar contrato e API docs. Commit: `feat(api): expose canonical dashboard aggregates`.

## Condição de parada

Parar se for necessário inventar série histórica ou valor ambiental para satisfazer um card.

