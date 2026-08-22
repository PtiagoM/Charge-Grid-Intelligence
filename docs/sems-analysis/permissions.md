# Permissões e escopo observável

## Papéis efetivos

- Conta A: `Distribuidor/Instalador` — `OBSERVED`, confiança alta.
- Conta B: `Proprietário` — `OBSERVED`, confiança alta.

## Matriz consolidada do que foi visível/testado

| Capacidade/escopo | Distribuidor/Instalador | Proprietário | Conclusão |
| --- | --- | --- | --- |
| sete páginas-raiz | visíveis | visíveis | `OBSERVED`, alta |
| plantas próprias de teste | duas em construção | duas em construção | `OBSERVED`, alta |
| planta compartilhada em operação | visível | não visível | `OBSERVED`, alta |
| lista global de dispositivos | inversor e EV Charger visíveis | `Sem dados` | `OBSERVED`, alta |
| alarmes históricos | 80 resolvidos | zero | `OBSERVED`, alta |
| criar nova usina | botão visível; não testado nessa conta | criação e exclusão controladas confirmadas | `OBSERVED` na conta A; `TESTED IN SANDBOX` na conta B |
| adicionar dispositivo em planta própria vazia | visível; não testado | fluxo aberto e identificador EV inválido testado | `OBSERVED` na conta A; `TESTED IN SANDBOX` na conta B |
| atualização de dispositivo | tab na planta própria; ausente na compartilhada | não aprofundado | diferença `OBSERVED`; restrição `INFERRED` |
| gestão de organização/usuários/logs | informações, usuários e logs | somente assinatura de mensagens no submenu; logs acessíveis | `OBSERVED`, alta |
| relatórios e ferramentas analíticas | acessíveis | acessíveis | `OBSERVED`, alta |
| funções criáveis na organização | `ADMINISTRATOR` e `BROWSER` | criação organizacional não apresentada | `OBSERVED`, alta |
| compartilhar planta | usuário/organização; monitoramento ou controle | mesmas opções observadas na planta fictícia | `OBSERVED`, alta |
| EV compartilhado | telemetria e histórico; edição/exclusão visíveis na lista | não visível | visibilidade `OBSERVED`; execução não confirmada |

## Limite da conclusão

A visibilidade diferente demonstra escopo de dados e de UI, mas não prova por si só que uma operação seria negada pelo backend. Nenhum controle de planta compartilhada ou dispositivo em operação foi acionado. Essas ações permanecem `NOT TESTED — EXTERNAL IMPACT RISK`.

Não houve tentativa de acesso por URL a uma área invisível para contornar RBAC; a única rota direta de configuração testada permaneceu dentro da sessão autorizada e não revelou o conteúdo administrativo da outra conta.

## Modelo de permissão observado

O SEMS+ combina três camadas:

1. papel da conta/organização;
2. propriedade ou compartilhamento da planta;
3. permissão do compartilhamento (`Monitoramento` ou `Monitoramento + Controle`) com prazo.

`INFERRED`, confiança média: esse modelo é um bom antecedente conceitual para o RBAC ChargeGrid, mas as capacidades exatas de backend ainda precisam de uma matriz controlada. A presença de uma ação na interface não garante autorização efetiva.

## RBAC ChargeGrid proposto

| Capacidade | GoodWe admin | Estabelecimento admin | Operador | Classificação |
| --- | --- | --- | --- | --- |
| rede e agregados | rede autorizada | próprias plantas | próprias plantas operacionais | `INFERRED`, alta |
| perfil comercial | supervisiona/assiste | cria e altera | leitura | `INFERRED`, alta |
| tarifa, ociosidade e usuários | somente quando contratualmente autorizado | altera | sem acesso de escrita | `INFERRED`, alta |
| sessões e fila | agregado/auditoria | próprias plantas | opera próprias plantas | `INFERRED`, alta |
| comandos | capacidade explícita | capacidade explícita | somente ação operacional concedida | `INFERRED`, média |
| financeiro | agregado/comissão autorizada | detalhe local | estado operacional mínimo | `INFERRED`, alta |
| incidentes | rede conforme escopo | administra localmente | trata rotina | `INFERRED`, alta |

A matriz final permanece `OPEN QUESTION`. Toda autorização deve existir no backend/RLS; `PermissionBoundary` na UI serve apenas para experiência.
