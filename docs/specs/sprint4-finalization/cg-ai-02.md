# CG-AI-02 — pipeline reproduzível de dados

**Classificação:** BACKEND ONLY · **Status:** PLANNED · **Tamanho:** MÉDIO · **Risco:** ALTO.

## Objetivo e escopo

Converter as fontes aprovadas em um dataset temporal reproduzível, com unidades e proveniência explícitas, sem data leakage.

## Fora de escopo

Treino/seleção de modelo, serviço Python, API Node, UI e commit de datasets grandes/licenciados.

## Dependências e estado atual

Depende de AI-01. A decisão de dataset, target, frequência e horizonte deve estar congelada.

## Arquivos relevantes

Criar `ml/forecasting/README.md`, ambiente Python mínimo, `src/prepare.py`, manifests em `data/`, testes pequenos e regras `.gitignore`. Não alterar runtime Node.

## Pipeline obrigatório

- Download é comando explícito ou instrução autenticada; arquivos brutos ficam ignorados.
- Manifest registra URL, versão/data, licença, SHA-256 e linhas usadas.
- Normalizar timezone antes do resample; unidades finais em kW/kWh e intervalo definido em AI-01.
- Features só usam informações disponíveis até o instante da previsão: lags, calendário e variáveis externas aprovadas.
- Split temporal é materializado por timestamp; imputação/escala são ajustadas somente no treino.
- Cada linha mantém colunas de origem (`REAL_*`/`SIMULATED_COMPLEMENT`) e não mistura locais como se fossem Aurora medido.
- Comando único gera dataset processado e relatório de qualidade determinísticos a partir do mesmo input.

## Critérios de aceite

- Duas execuções com mesmos inputs produzem mesmo checksum.
- Não há overlap temporal entre splits nem feature futura.
- Schema, faltantes, outliers e cobertura são reportados.
- Repositório não contém dado bruto proibido ou segredo.

## Testes, documentação e commit

Teste focal com fixture minúscula para timezone, resample, leakage e checksum. Documentar reprodução/licença. Commit: `feat(ai): add reproducible forecasting data pipeline`.

## Condição de parada

Parar se termos proibirem uso/redistribuição ou se a normalização exigir combinação temporal sem base defensável.

