# Metodologia ambiental e econômica do Dashboard

Status: **conservadora; sem CO₂ evitado ou economia de fatura calculados**. Metodologia atualizada em 30/09/2026 como parte de CG-DASH-03; interface revisada em 08/10/2026.

Métricas indisponíveis exibem o motivo conhecido. O monitoramento explica que o contrato atual oferece agregados do período, não pontos temporais. Nenhuma série é inventada para preencher o gráfico.

## Dados disponíveis

Os cards ambientais/econômicos usam `GET /commercial/dashboard-summary` para o estabelecimento e a janela selecionados. `solarToEvWh`, `evWh` e `gridExportWh` são agregados persistidos/derivados da telemetria no backend e exibidos em kWh, convertendo Wh ÷ 1.000. São dados da janela, não valores “desde o início”.

O contrato atual não contém energia fotovoltaica total por período, tarifa de importação evitada, tarifa de injeção nem energia de bateria. Esses campos permanecem indisponíveis; a tarifa cobrada do motorista não é usada como custo de energia evitado.

## Emissões

O MCTI/SIRENE publica fatores médios de CO₂ do Sistema Interligado Nacional (SIN) para inventários corporativos. A página distingue esse fator médio — média da geração de todas as usinas em operação — do fator de margem de operação voltado a projetos de MDL. A planilha “Inventários Corporativos — 2026” está listada publicamente. Fonte consultada em 30/09/2026: [Fatores de emissão MCTI/SIRENE](https://www.gov.br/mcti/pt-br/acompanhe-o-mcti/sirene/dados-e-ferramentas/fatores-de-emissao); contexto do MCTI sobre o fator médio: [SIRENE — fator de emissão de 2023](https://www.gov.br/mcti/pt-br/acompanhe-o-mcti/noticias/2024/02/fator-de-emissao-de-co2-na-geracao-de-energia-eletrica-no-brasil-em-2023-e-o-menor-em-12-anos).

A unidade publicada para fatores de inventário é tCO₂/MWh. A página pública não declara licença específica de redistribuição. A planilha 2026 não foi incorporada/versionada neste repositório, e a API fornece energia solar→EV agregada por janela, sem distribuição temporal mensal que permita casar corretamente períodos que cruzam meses com fatores variáveis. Por isso, nenhum fator numérico é embutido e o card mostra “Indisponível”.

Fórmula candidata, não executada: `solarToEvMWh[mês] × fatorMCTI_médio[tCO₂/MWh]`, somado por mês e rotulado como estimativa de emissões de rede potencialmente evitadas — nunca como emissão medida nem como crédito de carbono. Antes de ativá-la, a planilha precisa ser inspecionada/versionada com ano, mês, valor, unidade, origem/licença e data de acesso, e a API deve fornecer os mesmos buckets mensais de energia.

Equivalência em árvores ou combustíveis não é exibida sem método, fonte e fator próprios.

## Economia

Economia de fatura exigiria autoconsumo solar confirmado e diferença entre custo marginal de importação e valor/compensação da energia solar no local. A API não registra essa tarifa de importação/compensação nem uma baseline de fatura. Receita do Stripe é receita comercial de recarga, não economia energética; portanto, ela não é reinterpretada como economia. Economia, receita por exportação e métricas de bateria ficam indisponíveis.

## O que o protótipo pode afirmar hoje

- Solar destinado à recarga, energia entregue a EV e exportação: agregados do backend no período selecionado.
- CO₂ evitado, equivalências ambientais e economia monetária: indisponíveis até que entradas e método acima sejam versionados e testados.
- Nenhuma fixture de sustentabilidade ou multiplicador fixo participa destes cards.
