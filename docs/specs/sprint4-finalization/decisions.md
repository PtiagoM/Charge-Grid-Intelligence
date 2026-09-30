# Decisões congeladas para a finalização

Este arquivo complementa, sem substituir, [decisions S4-C1](../sprint4/decisions.md).

| ID | Classificação | Decisão |
|---|---|---|
| F-D01 | EXISTENTE | PWA permanece finalizada e fora da frente normal de desenvolvimento. |
| F-D02 | EXISTENTE | Aurora é o único cenário integral; PGlite + Node contínuo é o runtime mínimo. |
| F-D03 | APROVADA | Dashboard mantém seus cards; Energia mantém as cinco seções existentes. |
| F-D04 | APROVADA | Laboratório emite telemetria/eventos pelo MockGoodWeProvider e nunca cria comércio. |
| F-D05 | APROVADA | IA usa treino offline Python, artefato versionado e inferência Node; FastAPI não entra no runtime inicial. |
| F-D06 | APROVADA | Preferência de dados: reais → reais combinados → reais + complemento simulado → totalmente sintéticos. |
| F-D07 | APROVADA | Previsão é evidência; regras interpretam e o Decision Engine decide. Modelo não envia Start/Stop. |
| F-D08 | APROVADA | Bateria não é requisito. Sem telemetria, estado/cálculo deve ser indisponível. |
| F-D09 | APROVADA | CO₂, economia e equivalências exigem fórmula, fator, unidade, período e fonte versionada. |
| F-D10 | APROVADA | Nova composição visual relevante depende de referência do responsável. |
| F-D11 | INFERÊNCIA | Horizonte inicial da previsão será definido em AI-01 pela disponibilidade e pelo valor operacional; não é congelado antes do dataset. |
| F-D12 | INFERÊNCIA | Primeiro modelo elegível é o mais simples que superar baseline temporal no conjunto de teste e mantiver inferência reproduzível em Node. |
| F-D13 | APROVADA | O pacote original `sprint4` deve concluir M5–M7/G7 antes de qualquer unidade `CG-*`; a finalização S4-C2 reutiliza evidências não afetadas da baseline. |
| F-D14 | DECISÃO TÉCNICA | S4-C2 é aditivo: o snapshot comercial existente permanece `S4-C1`; agregados usam `CommercialDashboardSummary`, proveniência não substitui `DataOrigin`, e ausências são null + qualidade/motivo explícitos. |
| F-D15 | DECISÃO TÉCNICA | Contrato de forecast prevê importação da rede da planta em kW (`predictedGridImportKw`) e publica MAE/RMSE vs. baseline sem confiança artificial; horizonte/step permanecem decisão da avaliação AI-01, em minutos. |
| F-D16 | INFERÊNCIA | A utilização Aurora pode usar o inventário publicado atual como capacidade constante no período porque o runtime não possui operação de publicar/despublicar carregador; se esse ciclo de vida mudar, precisa persistir histórico ou indisponibilizar a métrica histórica. |

## Decisões ainda condicionais

1. **Visual do laboratório:** referência necessária antes de CG-LAB-02.
2. **Visual da previsão em Energia:** referência necessária antes de CG-UI-01.
3. **Dataset/horizonte final:** CG-AI-01 avaliou fontes públicas; nenhuma mede diretamente o target integrado `gridImportKw` de Aurora. A decisão para benchmark composto simulado, não treinar nesta Sprint ou avaliar telemetria local está pendente em [`docs/ai/dataset-decision.md`](../../ai/dataset-decision.md). AI-02 permanece bloqueado até decisão explícita; CG-LAB-01 foi concluído sem depender desse gate.
4. **Fatores ambientais/econômicos:** CG-DASH-03 pode escolher apenas fonte pública citável e aplicável ao Brasil/cenário. Sem fonte suficiente, mantém indisponível.

## Governança Git verificada em 30/09/2026

- A linha implementada até M4 está localmente em `feature/admin-sprint3-integration`, HEAD `90afa87`.
- Após atualizar `origin/feature/admin-sprint3-integration`, a branch de trabalho estava 50 commits à frente e 2 atrás, com base comum `a767f79`. Merge normal local `8355c23` incorporou somente os dois commits do link do vídeo; a ref da branch remota permaneceu em `7d5c6de` e não houve push.
- `feature/admin-sprint4` existe apenas localmente em `c8cc21c` e é histórica; não é base da finalização.
- Não há PR aberto/fechado das duas branches no GitHub.
- Este pacote nasce em `docs/sprint4-final-sdds`. Reconciliação/branch final pertence a CG-F0-01 e exige autorização para merge/rebase/push conforme workflow.
