# Aceite transversal da finalização

Pré-condição: `S4-M7-U2/G7` do pacote `docs/specs/sprint4` concluído. Antes disso, nenhum gate deste arquivo é elegível.

## Regras de validação

- Primeiro teste focal que detecta a regressão da unidade.
- Unit somente para lógica pura nova; integration para API/banco/provider; E2E somente para fluxo visual alterado.
- Não repetir suíte global entre unidades sem mudança transversal.
- `lint`, `typecheck`, testes e builds globais ficam para CG-STAB-01/CG-DEL-01; evidência M5–M7 não é repetida quando o delta S4-C2 não a afeta.
- Teste nunca transforma simulação em integração real nem dado ausente em zero.

## Gates do produto

1. **Contrato:** S4-C2 identifica versão, entidades, períodos, qualidade e proveniência.
2. **Dashboard:** cards usam agregados persistidos do mesmo período e não curvas artificiais.
3. **Energia:** telemetria atual, fluxo, decisão, impacto e política concordam com a mesma amostra.
4. **IA:** dataset tem licença/proveniência; split é temporal; baseline e teste final são registrados; Node reproduz Python dentro da tolerância especificada.
5. **Decisão:** previsão isolada não comanda; regra produz decisão explicável, idempotente e auditável.
6. **Laboratório:** cenário reproduzível altera apenas a fronteira física simulada.
7. **Operação:** alarme, recomendação, decisão e resolução compartilham correlação e evidências reais/simuladas qualificadas.
8. **Integração:** sessão, energia, demanda, previsão, decisão, Admin e PWA convergem sobre IDs e persistência únicos.
9. **Entrega:** runtime reinicia sem perder o que deve persistir; README executa; matriz REAL/SANDBOX/SIMULADO/CONCEITUAL é honesta.

## Condições de bloqueio

- Sem referência visual, LAB-02 e UI-01 param após contratos/estados prontos.
- Sem dataset aceitável, AI-01 não autoriza treino; registra candidatos e bloqueio.
- Sem metodologia citável, DASH-03 mostra indisponibilidade, não inventa indicador.
- Mudança inevitável na PWA para integrar contrato exige regressão demonstrada e escopo mínimo explícito.
