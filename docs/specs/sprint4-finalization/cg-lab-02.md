# CG-LAB-02 — controles de cenário no laboratório

**Classificação:** HUMAN FRONTEND GATE · **Status:** PLANNED · **Tamanho:** MÉDIO · **Risco:** MÉDIO.

## Objetivo e escopo

Permitir ao operador técnico selecionar e observar os perfis de LAB-01 dentro do laboratório existente, sem criar nova navegação ou alterar a experiência comercial.

## Fora de escopo

Definir design sem referência, novo dashboard, pagamento/sessão, simular decisão financeira ou mover controles para Operação.

## Dependências e estado atual

Depende de LAB-01. `AdminSimulatorPage` já opera hardware por carregador e planta; os novos estados lógicos podem ser implementados, mas a composição visual precisa da referência do responsável.

## Arquivos relevantes

`apps/admin-web/src/features/simulator/AdminSimulatorPage.tsx`, `services/commercialSnapshotRepository.ts`, estilos existentes e E2E focal do laboratório.

## Dados e estados necessários

- lista de `scenarioId`, nome, finalidade, versão e proveniência;
- cenário ativo, início, step e status do provider;
- pré-visualização do perfil selecionado para PV/base e importação estimada, separada do estado observado;
- estado observado em tempo real de PV/base/EV/rede, quality e timestamp;
- ações `aplicar`, `perder telemetria`, `recuperar` e `reiniciar dados de teste`, sujeitas aos endpoints técnicos;
- loading, conflito, erro, indisponível e confirmação de aplicação.

## Semântica dos cards

- Os quatro cards no painel esquerdo representam a pré-visualização do cenário selecionado e atualizam ao trocar a seleção, antes de chamar a API de aplicação. São somente leitura: o operador escolhe um perfil reproduzível, não edita seus sinais.
- PV e carga-base usam os perfis definidos no LAB-01: `SOLAR_SURPLUS` = 30/8 kW; `DEMAND_RAMP` = 2 kW e rampa de 8 a 28 kW; `LOW_SOLAR` = 1/12 kW; `RECOVERY` = rampa de 2 a 30 kW e carga-base de 12 kW. Perfis com rampa mostram a faixa do perfil; `TELEMETRY_LOSS` mostra indisponibilidade, sem reutilizar leituras anteriores como valores a aplicar.
- Carga EV não é alterada pelos perfis energéticos do LAB-01; a pré-visualização usa a carga EV observada dos carregadores e a identifica como estimativa atual. Importação estimada usa `max(0, carga-base do perfil + carga EV estimada - PV do perfil)`. Se algum insumo não estiver disponível, o card mostra indisponibilidade em vez de inventar um valor.
- O painel direito permanece a fonte do estado real observado pela API. Seus valores, qualidade, status do provider e timestamp mudam somente depois de a aplicação ser confirmada e a leitura/polling retornar os novos dados. Trocar a seleção não altera o backend.
- Mensagem de erro ao aplicar mantém o painel observado no último estado confirmado; nunca apresenta a pré-visualização como se tivesse sido aplicada.

## HUMAN FRONTEND GATE

Antes de editar TSX/CSS, apresentar ao responsável estes dados/ações e solicitar screenshot, wireframe ou descrição final. Reutilizar a página existente conforme a referência; não inventar layout.

## Critérios de aceite

- Ação visual chama API de LAB-01 e estado observado vem do backend.
- Trocar a seleção atualiza os quatro cards para a pré-visualização do perfil sem executar comando; esses cards não são editáveis.
- Ao aplicar um perfil, a simulação observada no painel direito passa a refletir os dados retornados pela API; falha de validação não altera essa leitura.
- Operação/Energia refletem o cenário sem reload e sem controles artificiais nelas.
- Laboratório permanece identificado como simulação técnica.
- Nenhum registro comercial é criado.

## Testes, documentação e commit

Após o gate: teste de mapper/componente apenas se houver lógica, um E2E focal aplicar→polling e validação manual do responsável. Commit: `feat(admin): control reproducible hardware lab scenarios`.

## Condição de parada

Parar obrigatoriamente antes do frontend se não houver referência visual aprovada.
