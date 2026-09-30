# Decisões e precedência SDD

**Status em 26/09/2026:** D1–D6 permanecem aprovadas. O responsável ratificou I-S01–I-S11 para a Sprint 4 ao autorizar o Marco 0. Elas formam o contrato técnico congelado `S4-C1`; qualquer mudança exige decisão explícita registrada neste arquivo antes de modificar consumidores.

Precedência: decisão explícita mais recente do responsável → plano aprovado/este contrato congelado em G0 → implementação vigente para fatos → documentação histórica. Uma proposta técnica abaixo não muda silenciosamente produto aprovado.

## Aprovadas pelo responsável

| ID | Decisão | Consequência de execução |
|---|---|---|
| D1 | Somente Aurora integral | IDs existentes; nenhum segundo estabelecimento obrigatório; locais não operacionais não aceitam ações comerciais |
| D2 | Idle backend, 15 min, política aceita; <R$0,50 fora | Implementar idle, não resolver microcaptura; testes reais com consumo suportado |
| D3 | Sem top-up ou segmentos | Imutabilidade da política da sessão; alteração só afeta novas ofertas |
| D4 | PGlite + Node contínuo oficial | Sem bloqueio por conexão SQL remota, cloud ou timer serverless |
| D5 | Núcleo comercial + motorista + planta + demanda + automação + integração | Sem IAM Admin/grants multi-org/helpdesk/IV/bateria/expansão/offline avançado/cloud como gates |
| D6 | PWA/Admin normais, uma API/um banco | Maps e Payment Element reais; simulador só físico; não voltar a `/demo` |

## Inferências técnicas executáveis, ratificadas em M0-U1

Não são novas features. Tornam determinísticos os pontos que o plano deixou qualitativos. Depois de G0, executores menores não escolhem alternativas por conta própria.

| ID | [INFERÊNCIA] adotada | Evidência/motivo | Impacto |
|---|---|---|---|
| I-S01 | Idle: 50 centavos por minuto iniciado após 15 min; máximo 60 min e saldo da garantia | `DriverAppContext` já usa ceil, 0.5, 60 e saldo; mover regra em vez de reinventar | Quote expõe tudo antes do aceite; API calcula; ambas UIs observam |
| I-S02 | Sem reserva exclusiva de verba para idle; ao esgotar garantia não há taxa adicional nem dívida | D2/D3 e teto existente; não adicionar top-up/cobrança externa | Conector continua ocupado até desconexão, mesmo idle limitado a zero |
| I-S03 | Tentativa não paga expira em 10 min; autorização confirmada prevalece sobre timeout de checkout | Recuperação sem prender conector; reusar janela simples | API reconcilia antes de cancelar; sem scheduler extra |
| I-S04 | Quote imutável vale 5 min; oferta nova não altera quote ainda válida | Evitar mudança entre aceite e PaymentIntent | Quote persistida; expirada exige novo aceite, não novo preço silencioso |
| I-S05 | Sem estimativa confiável da fila, `estimatedWaitMinutes=null` | Fórmulas locais 8/18 min divergem | Mostrar posição e “estimativa indisponível”; sem previsão obrigatória |
| I-S06 | Planta canônica `plant_aurora_001`, timezone São Paulo, sem bateria | Aurora SQL não tem vínculo técnico; seis EV não são inversores/baterias | FK mínima; não recriar IDs comerciais nem alegar capacidade FV instalada |
| I-S07 | Demanda usa importação da rede; alerta 80%, crítico 90%, recuperação abaixo de 75% por 30 s, fresh até 15 s | Reutiliza limiares existentes; janela curta demonstrável do provider de 1 s | Regra exata em contracts.md; valores são política de teste, não proteção elétrica |
| I-S08 | Oferta solar inicial 170 c/kWh contra base 190, quando excedente PV−base ≥7 kW e qualidade fresh/NORMAL | Base 190 já seed; desconto é configuração sintética de política, não promessa de mercado | Apenas novas quotes; sessão continua na tarifa aceita; amostra/motivo persistidos |
| I-S09 | Sem continuidade confirmada no restart, não integrar downtime; zerar entrega mock e reavaliar | Não cobrar energia inventada; hardware é simulado | Registros sobrevivem; evento de gap; no real futuro requer medição acumulada |
| I-S10 | Reconciliar pagamentos pendentes a cada 5 s em Node, além de webhook assinado | Runtime local sem dependência de página ou implantação cloud | GET observa; webhook é tratado, reconsulta é recuperação; sem fila distribuída |
| I-S11 | Admin/lab demonstrativos apenas no runtime local controlado | D5 exclui nova autenticação Admin, não autoriza API pública insegura | Bind local por padrão; LAN/publicação exigem proteção explícita separada; CORS não é autenticação |

## Ratificação do M0

Para evitar nova redescoberta, o responsável aprovou os valores abaixo em 26/09/2026. As alternativas já foram descartadas na análise por conflitarem com D1–D6 ou com a implementação existente.

| Regra | Valor proposto | Efeito obrigatório |
|---|---|---|
| Ociosidade | tolerância 15 min; R$ 0,50 por minuto iniciado; máximo 60 min; limitado ao saldo autorizado; sem dívida/top-up | API calcula e persiste; PWA/Admin observam; falha/demanda não iniciam idle |
| Tentativa/quote | tentativa sem pagamento expira em 10 min; quote imutável por 5 min | autorização confirmada prevalece; nova oferta não altera quote aceita |
| Fila | `estimatedWaitMinutes = null` até existir cálculo confiável | posição e atribuição continuam visíveis; nenhuma estimativa fictícia |
| Planta Aurora | `plant_aurora_001`, São Paulo, sem bateria | EV não é capacidade FV; ausência de bateria permanece `null` |
| Demanda | limite 20 kW; ALERT 80%; CRITICAL 90%; recuperação abaixo de 75% por 30 s; telemetria fresh até 15 s | usa importação de rede; bloqueia/admite/corta de modo explicável; valores não são proteção elétrica |
| Oferta solar | 170 c/kWh somente com `PV - base >= 7 kW`, qualidade fresh e NORMAL; base inicial 190 c/kWh | apenas novas quotes; sessão aceita nunca muda |
| Restart | não integrar downtime; preservar acumulados; comando STOP pendente vence qualquer auto-restart | somente sessão sem intenção de parada pode usar `RUNTIME_RECOVERY` |
| Conciliação | reconsulta de pagamentos pendentes a cada 5 s + webhook assinado | GET observa; nenhum retry duplica cobrança |
| Admin/lab | somente runtime local controlado | não criar IAM, grants multi-organização, cloud ou exposição pública implícita |

Essa tabela é o objeto exato da aprovação registrada. M0-U1 pode congelar a versão do contrato e M0-U2 pode concluir a verificação documental; nenhum item autoriza código de produto por si só.

As inferências S01/S02 devem estar escritas nas condições aceitas, não aplicadas retroativamente a sessões antigas. Migração legada preserva tarifa/custos e marca `policyVersion=legacy-s3`, idle desabilitado para aceite antigo ausente. Nenhum marco “corrige” dívida histórica.

## Não fazer

- Trocar PaymentIntents por Checkout Sessions, substituir Maps, atualizar SDK/API version ou instalar stack nova só por preferência.
- Adicionar RLS corporativo, grant manager, credencial Admin nova, cloud scheduler ou segunda organização como dependência.
- Usar mock financeiro no runtime normal, resetar banco pessoal para provar teste, publicar screenshots com PII.
- Reinterpretar cutoff de demanda com prioridade FLEET/ACCESSIBILITY: plano define visitante mais recente, depois motorista mais recente.

## Conflitos a registrar em G0

`CommercialSessionRecord.chargerId` promete ID, mapper atual devolve code; corrigir mapper e consumidores juntos. `COMPLETED`/`ENERGY_FINISHED` não podem virar um único estado funcional `finished`. Migrações atuais reexecutam UPSERT e restauram seed; introduzir ledger sem sobrescrever configuração do banco existente. PWA local e shared calculam idle diferente: S01 é o alvo proposto explícito, não dizer que API já aplica.

Decisão técnica incompatível com o plano: abrir entrada aqui com motivo/impacto antes de executar; não esconder em componente React. D1–D6 não precisam ser perguntadas novamente.

## Transição aprovada em 29/09/2026

Este pacote deve concluir M5–M7/G7 antes da extensão `sprint4-finalization`. U2A–U3 foram concluídas; o responsável confirmou manualmente o fluxo Maps/Stripe test/recarga/liquidação da U3 e a validação de estabilidade G6 em 30/09/2026. M7-U1 foi concluída; a [ordem canônica](../SPRINT4_EXECUTION_ORDER.md) define M7-U2/G7 como próximo passo. A confirmação manual não representa Stripe live nem hardware físico. Depois de G7, `CG-F0-01` inicia S4-C2.
