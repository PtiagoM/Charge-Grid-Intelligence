# CG-AI-04 — artefato versionado e paridade Node

**Classificação:** BACKEND ONLY · **Status:** PLANNED · **Tamanho:** MÉDIO · **Risco:** ALTO.

## Objetivo e escopo

Executar no processo Node a mesma transformação e inferência aprovadas em Python, sem FastAPI.

## Fora de escopo

Persistir forecast, scheduler, Decision Engine, UI ou nova infraestrutura de serving.

## Dependências e estado atual

Depende de AI-03B. Artefato e pré-processamento estão congelados.

## Arquivos relevantes

`apps/api/src/ai/`, artefato versionado em `ml/forecasting/artifacts/`, contratos shared e vetor dourado exportado pelo Python.

## Comportamento esperado

- Loader valida `modelVersion`, schema, features, unidades e checksum; falha fechada em incompatibilidade.
- Inferência recebe série/features já ordenadas e devolve pontos no contrato S4-C2.
- Pré-processamento Node replica valores ausentes, escala e ordem das features do artefato.
- Sem “confidence” arbitrária: publicar métricas históricas do model card e estado `UNAVAILABLE` quando inputs não atendem cobertura/freshness.
- Não instalar runtime Python/FastAPI no servidor. Dependência Node nova só se necessária e justificada; preferir artefato JSON simples.

## Critérios de aceite

- Vetores dourados Python/Node coincidem na tolerância numérica documentada.
- Artefato incompatível não derruba API nem gera previsão falsa.
- Nenhum comando GoodWe é emitido.

## Testes, documentação e commit

Contract/parity test com vetores versionados e teste de artefato inválido. Atualizar README de AI/API. Commit: `feat(api): run versioned demand forecast inference`.

## Condição de parada

Parar se a paridade exigir serviço Python permanente ou custom runtime complexo; retornar a AI-03B e escolher artefato mais simples.

