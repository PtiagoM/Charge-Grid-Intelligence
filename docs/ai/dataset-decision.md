# CG-AI-01 — decisão de dados e gate de treino

**Status:** `WAITING_FOR_PRODUCT_DECISION`  
**Target semântico congelado:** `gridImportKw`, importação de rede na planta em kW.  
**Resolução/horizonte de treino:** ainda não congelados: não há série de rótulos elegível que os justifique.

## Decisão técnica desta unidade

Não selecionar uma fonte como rótulo operacional e não iniciar pipeline/treino. Nenhum candidato verificado mede `gridImportKw` de um local comercial integrado com carga da planta, geração FV e carregadores EV. A combinação de datasets de instalações distintas só formaria um cenário sintético, nunca uma medição Aurora. A análise e limitações estão em [dataset-evaluation.md](dataset-evaluation.md).

Isso não altera o Decision Engine determinístico já existente: suas decisões continuam baseadas na telemetria e regras atuais. A previsão deve permanecer indisponível até existir um modelo com avaliação honesta, sem confiança inventada.

## Recomendação para a próxima decisão

**Recomendado:** autorizar apenas um benchmark acadêmico/prova do pipeline em `SIMULATED_COMPOSITE`, explicitamente não operacional e não representativo de Aurora, caso a meta da Sprint exija demonstrar o caminho IA → previsão → regra. Os componentes poderiam vir de amostras reais licenciadas de edifício/PV/EV, alinhadas e combinadas por regra física documentada; a série composta, o alvo derivado e qualquer complemento continuariam rotulados simulados. Antes disso, é necessário confirmar licenças específicas das amostras e definir a regra de alinhamento.

Alternativa mais conservadora: não treinar modelo nesta Sprint, manter forecast como indisponível e concluir o projeto com automação determinística; isso preserva fidelidade, mas reduz a demonstração de IA preditiva.

## Decisão solicitada

Escolher uma opção antes de CG-AI-02:

1. **Benchmark simulado (recomendado):** permitir pipeline/avaliação de um composto claramente simulado, sem uso operacional nem alegação de dados do Aurora.
2. **Sem modelo nesta Sprint:** manter previsão indisponível e não executar AI-02 a AI-05; continuar as unidades independentes do laboratório e entrega.
3. **Fornecer telemetria real local:** se houver export de medição Aurora (importação da rede e timestamps, idealmente PV/carga/EV separados), avaliar retenção/licença/qualidade e então decidir resolução/horizonte.

Até a resposta, **não** baixar ou versionar datasets, gerar dados sintéticos, definir horizonte, treinar, criar artefato nem expor previsão na API/UI. AI-02 permanece `PLANNED`; CG-LAB-01 segue independente e elegível.
