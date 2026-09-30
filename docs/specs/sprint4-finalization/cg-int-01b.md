# CG-INT-01B — gate visual/manual e evidências

**Classificação:** BACKEND ONLY · **Status:** PLANNED · **Tamanho:** MÉDIO · **Risco:** MÉDIO.

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
