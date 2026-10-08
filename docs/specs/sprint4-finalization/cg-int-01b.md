# CG-INT-01B — gate visual/manual e evidências

**Classificação:** INTEGRAÇÃO — API + pequenos ajustes Admin/PWA · **Status:** DONE — validado pelo responsável em 08/10/2026 · **Tamanho:** MÉDIO · **Risco:** MÉDIO.

## Objetivo e escopo

Validar em navegador as superfícies reais e registrar evidência reproduzível dos cenários aprovados.

## Fora de escopo

Implementação, redesign, automação redundante ou declarar Stripe/Maps reais sem execução real.

## Dependências e estado atual

Depende de INT-01A, LAB-02 e UI-01, incluindo aprovação visual humana dessas duas unidades.

## Arquivos relevantes

Documentos de evidência, CURRENT_STATE e roteiro final; nenhum arquivo de produto deve ser alterado durante o gate.

## Roteiro obrigatório

1. Iniciar runtime oficial; reset controlado Aurora.
2. PWA normal: Maps → Aurora → AURORA-01 → Stripe test → sessão; confirmar Admin/DB.
3. Laboratório conecta/inicia hardware; verificar Operação, Sessões, Dashboard, Energia e Financeiro.
4. Aplicar solar surplus; observar oferta/fluxo/agregados.
5. Aplicar demand ramp; observar forecast, recomendação, bloqueio de nova admissão, pico real e recuperação.
6. Simular perda/falha e recuperação; confirmar Central de alarmes e histórico.
7. Encerrar/liquidar; confirmar relatórios e reload/restart.
8. Validar fila apenas como regressão do fluxo já entregue.

Registrar versões, timestamps, IDs e classificação REAL/SANDBOX/SIMULATED. Sanitizar PII/client secrets.

## Critérios de aceite

- Responsável valida visualmente Admin e PWA.
- Nenhuma tela exige reload manual para propagação normal.
- Valores relacionados são reconciliáveis pelo mesmo período/ID.
- Limitações aparecem explicitamente.

## Testes, documentação e commit

Manual demo gate; screenshots/logs somente se seguros. Atualizar ledger/roteiro, não código. Commit: `docs(sprint4): record final integration evidence`.

## Condição de parada

Falha funcional retorna à unidade proprietária. Não corrigir durante o gate sem novo ciclo focal e registro.

## Correções focais identificadas no gate — 06/10/2026

- Aplicar outro cenário agora força nova inferência para a planta, mesmo no intervalo normal corrente de 15 minutos. A deduplicação do clock continua valendo para o ciclo normal; os forecasts anteriores permanecem no histórico e a evidência decisória referencia o ID novo. As amostras sintéticas de aquecimento sobrepostas são atualizadas para representar o cenário recém-aplicado.
- Medidores da tela Energia e demanda identificam explicitamente `demandKw` como importação da rede; números, limiares e decisão continuam vindos do backend. `SOLAR_SURPLUS` pode mostrar `0 kW` importados.
- A PWA informa que `SUSPENDED_BY_DEMAND` é uma pausa por excesso de demanda com possível retomada automática quando as condições de energia melhorarem.
- Limitação confirmada no fluxo atual: desconectar o veículo enquanto a sessão está `SUSPENDED_BY_DEMAND` não altera seu estado nem habilita liquidação. Esta unidade não muda o ciclo; a mensagem não afirma que a desconexão encerra a sessão.

## Retomada obrigatória do gate manual

Após reiniciar API/Admin/PWA com as migrations aplicadas:

1. Aplicar `SOLAR_SURPLUS`, anotar o ID/`generatedAt` do forecast e confirmar que importação da rede pode ser `0 kW`.
2. Ainda no mesmo intervalo de 15 minutos, aplicar `DEMAND_RAMP`; confirmar novo ID/`generatedAt`, mesmo `inputTo`, forecast mais recente no Admin e decisão apontando para o novo ID.
3. Conferir os rótulos “Importação medida da rede” e “Importação atual da rede” sem mudança nos valores/limiares.
4. No fluxo PWA de sessão em `SUSPENDED_BY_DEMAND`, confirmar a mensagem de pausa e possível retomada automática. Não testar liquidação por desconexão como parte desta correção; o limite permanece registrado acima.

## Resultado do gate — 08/10/2026

O responsável confirmou a validação manual após as correções: atualização da previsão ao trocar cenário, leitura/rótulos de importação da rede e mensagem da PWA para `SUSPENDED_BY_DEMAND`. CG-INT-01B está concluída.

Validações automatizadas desta rodada: builds do Admin e PWA e lint focal passaram; a API teve build focal aprovado em uma tentativa. As tentativas dos testes focais e de repetição de build foram impedidas por esgotamento de memória do Node antes da execução; o E2E de regressão foi atualizado, mas não rodou neste ambiente. Essa limitação fica para a validação global de CG-STAB-01, sem reabrir o gate manual validado.

A limitação de desconexão durante `SUSPENDED_BY_DEMAND` permanece conhecida e fora desta correção: desconectar não muda o estado nem habilita liquidação. Não afirmar o contrário na demonstração.
