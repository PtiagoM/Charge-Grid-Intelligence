# Permissões e escopo observável

## Papéis efetivos

- Conta A: `Distribuidor/Instalador` — `OBSERVED`, confiança alta.
- Conta B: `Proprietário` — `OBSERVED`, confiança alta.

## Cadastro e natureza das contas

- `Proprietário`: conta comum criada por autosserviço. Pode criar e administrar plantas próprias conforme as permissões SEMS+.
- `Distribuidor/Instalador`: conta profissional/organizacional sujeita a aprovação e código da organização. O cadastro direto representa a administração da organização; técnicos e profissionais comerciais subordinados são criados pela gestão organizacional.

A exigência de aprovação/código da conta profissional foi confirmada pelo produto em 23/08/2026 e é coerente com a documentação GoodWe consultada. Ela complementa a evidência observacional da auditoria, que havia registrado os papéis e escopos, mas não formalizado o gate de cadastro.

Atualização observacional de 23/08/2026: uma conta `Distribuidor/Instalador` pode conter usuários internos com funções organizacionais distintas. Em teste realizado pelo produto, um usuário `Navegador` não acessou a área de gestão e encontrou a exclusão de planta bloqueada, embora pudesse consultar a planta compartilhada. Isso confirma que a função interna afeta tanto superfícies visíveis quanto ações. O detalhe da matriz de dispositivos entre `Administrador`, `Navegador` e `Técnico` continua sem evidência suficiente e não deve ser presumido.

Iniciar o cadastro de um dispositivo como `Proprietário` não garante sua inclusão: o fluxo exige identidade técnica válida, como SN/código de verificação. Criar uma planta vazia não cria um ativo técnico legitimado.

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

O SEMS+ combina, ao menos, quatro camadas:

1. papel da conta/organização;
2. função interna do usuário organizacional, quando aplicável;
3. propriedade ou compartilhamento da planta;
4. permissão do compartilhamento (`Monitoramento` ou `Monitoramento + Controle`) com prazo.

`INFERRED`, confiança média: esse modelo é um bom antecedente conceitual para o RBAC ChargeGrid, mas as capacidades exatas de backend ainda precisam de uma matriz controlada. A presença de uma ação na interface não garante autorização efetiva.

## Modelo de acesso ChargeGrid vigente

O ChargeGrid não cria um terceiro tipo público de conta nem substitui o papel SEMS+. O acesso é adicional e por planta:

```text
identidade SEMS+
+ organização
+ papel comercial
+ escopo de plantas/carteira/região/parceiro
+ capacidade
```

`Usuário comercial` é um estado derivado: existe enquanto a identidade possui acesso comercial a pelo menos uma planta. Uma conta pode manter plantas somente SEMS+ e plantas ChargeGrid simultaneamente.

Compartilhamento SEMS+ não concede acesso comercial automaticamente. Monitoramento/controle técnico e contrato/tarifa/sessões/financeiro são autorizações independentes.

## Matriz ChargeGrid consolidada

| Capacidade | Consultor/gestor GoodWe | Central GoodWe | Estabelecimento admin | Operador local | Técnico/instalador SEMS+ |
| --- | --- | --- | --- | --- | --- |
| carteira/rede | carteira, região ou parceiro atribuído | agregado estratégico autorizado | próprias plantas comerciais | próprias plantas operacionais | escopo técnico SEMS+ |
| contrato/ativação | conduz, autoriza código e acompanha | governa exceções/agregados | resgata código e conclui onboarding | sem acesso | sem acesso comercial por padrão |
| perfil/publicação | acompanha e revisa conforme capacidade | políticas agregadas | configura plantas contratadas | leitura operacional | sem acesso comercial por padrão |
| tarifa/usuários | somente se capacidade contratual explícita | agregado autorizado | altera | sem escrita | sem acesso |
| sessões/fila | agregado ou auditoria do escopo | agregado | administra localmente | opera | sem acesso comercial por padrão |
| comandos técnicos | somente capacidade explícita | sem operação por padrão | capacidade explícita | ação concedida | conforme SEMS+ e ativo autorizado |
| financeiro | agregado contratualmente autorizado | agregado estratégico | detalhe local autorizado | estado operacional mínimo | sem acesso |
| incidentes | acompanha qualidade da carteira | tendências/agregados | administra localmente | trata rotina | diagnóstico técnico no SEMS+ |

`GOODWE_ADMIN` deixa de ser uma persona canônica única. Implementações futuras devem decompor responsabilidade, escopo e capacidade. Toda autorização existe no backend/RLS; `PermissionBoundary` na UI serve apenas para experiência.
