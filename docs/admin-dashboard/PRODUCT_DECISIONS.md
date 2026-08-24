# Decisoes de produto — SEMS+ com camada ChargeGrid

**Status:** `VIGENTE`  
**Data:** 23 de agosto de 2026  
**Escopo:** identidade, papeis, ativacao comercial, entidades, permissoes e integracao de interface do Admin Web

Este documento registra as decisoes posteriores a `docs/CURRENT_STATE.md` de 22/08/2026. Em caso de conflito com hipoteses anteriores do Dashboard, estas decisoes prevalecem. Evidencias observadas do SEMS+ continuam documentadas em `docs/sems-analysis/`; este arquivo define como o ChargeGrid se incorpora ao produto.

## Decisao central

```text
SEMS+ = plataforma e verdade tecnica
ChargeGrid = camada comercial e operacional por planta
```

Ativar o ChargeGrid amplia as capacidades disponiveis, mas nao troca a interface por outro produto, nao remove funcionalidades do SEMS+ e nao altera silenciosamente seus fluxos tecnicos. A integracao deve usar o mesmo shell, contexto, identidade visual e entidades tecnicas, acrescentando cards, indicadores, filtros, abas contextuais e, quando nao houver encaixe coerente, paginas novas dentro da mesma experiencia.

Se a camada comercial for desativada, a planta continua existindo e funcionando no SEMS+.

## Tipos de conta SEMS+

O sistema preserva os dois tipos de conta observados:

| Tipo | Regra confirmada | Papel na experiencia |
| --- | --- | --- |
| `Proprietario` | cadastro comum por autosservico; pode criar e administrar plantas proprias conforme o SEMS+ | usuario final da experiencia tecnica; pode receber vinculo comercial por planta |
| `Distribuidor/Instalador` | conta profissional/organizacional sujeita a aprovacao e codigo da organizacao | instalacao, organizacao, comissionamento, suporte e escopo tecnico conforme o SEMS+ |

A conta `Distribuidor/Instalador` registrada diretamente representa a administracao da organizacao. Usuarios tecnicos ou comerciais subordinados podem ser criados pela gestao organizacional. O codigo profissional identifica uma organizacao aprovada; ele nao concede, por si so, acesso comercial ChargeGrid.

O ChargeGrid nao cria um terceiro tipo publico de login. Ele adiciona vinculos e capacidades a uma identidade SEMS+ existente.

## Usuario comercial e escopo por planta

`Usuario comercial` e um estado derivado, nao um tipo permanente de conta:

```text
usuario com acesso comercial a uma ou mais plantas
→ experiencia ChargeGrid habilitada para essas plantas
```

Uma mesma conta pode manter plantas tecnicas e comerciais simultaneamente:

```text
Conta do usuario
├── Planta A — somente SEMS+
├── Planta B — somente SEMS+
├── Planta C — ChargeGrid ativa
└── Planta D — ChargeGrid em ativacao
```

Criar uma nova planta nao a torna comercial. Cada planta precisa de contrato e ativacao proprios.

O compartilhamento SEMS+ (`Monitoramento` ou `Monitoramento + Controle`) nao concede automaticamente acesso a contrato, tarifa, sessoes, fila, pagamentos ou financeiro. Acesso tecnico e acesso comercial sao autorizacoes independentes.

## Papeis ChargeGrid

Os papeis comerciais nao substituem os papeis SEMS+:

| Papel | Escopo e responsabilidade |
| --- | --- |
| Administrador do estabelecimento | configura e publica a operacao comercial das plantas contratadas; administra politica comercial e usuarios autorizados |
| Operador do estabelecimento | conduz sessoes, fila e rotina local sem alterar contrato, tarifa sensivel ou governanca |
| Gestor de carteira/consultor GoodWe | conduz contratos e ativacoes, acompanha pendencias, qualidade comercial, relacionamento e expansao dentro da carteira atribuida |
| Central GoodWe | consulta indicadores agregados por regiao, carteira ou parceiro para governanca e estrategia |

O tecnico/instalador permanece no plano tecnico SEMS+. Resultado de instalacao, conectividade e telemetria pode alimentar a prontidao ChargeGrid, mas o papel tecnico nao recebe dados comerciais automaticamente.

A GoodWe nao e modelada como um unico superadministrador nacional. Cada usuario interno recebe escopo explicito de carteira, regiao, parceiro ou plantas. A visao nacional e uma capacidade estrategica adicional, agregada por padrao, e nao a permissao inicial de todos.

Autorizacao administrativa combina:

```text
identidade + organizacao + papel + escopo + capacidade
```

## Contrato e ativacao comercial

Decisoes confirmadas:

- o estabelecimento figura como parte contratante;
- cada contrato cobre exatamente uma planta;
- uma planta pode ter contratos historicos, mas somente um contrato comercial vigente para a mesma operacao;
- o consultor GoodWe que conduziu o contrato autoriza a emissao do codigo;
- o backend gera o codigo; o consultor nao escolhe nem digita seu valor;
- o codigo vincula o contrato do mundo real ao ChargeGrid e registra estabelecimento, consultor, vigencia, status e planta quando conhecida;
- dados contratuais entram por um sistema comercial/contratual ou backoffice restrito, nao por redigitacao do usuario no SEMS+;
- resgatar o codigo inicia o onboarding; nao publica a planta imediatamente.

Fluxo canônico:

```text
interesse do estabelecimento
→ consultor GoodWe
→ contrato externo assinado
→ instalacao ou validacao tecnica SEMS+
→ consultor autoriza codigo
→ backend emite codigo
→ estabelecimento resgata o codigo
→ contrato e planta sao vinculados
→ configuracao comercial
→ revisao de prontidao
→ publicacao ChargeGrid
```

Se a planta ainda nao existir quando o contrato for assinado, o codigo nasce vinculado ao contrato e ao estabelecimento. A planta propria e selecionada e vinculada depois da instalacao. Para uma planta existente, o onboarding apenas valida e vincula a entidade SEMS+; ele nao recadastra tecnicamente a planta.

## Codigo de ativacao

O codigo ChargeGrid se inspira no antecedente do codigo organizacional do instalador, mas possui finalidade e seguranca independentes.

| Codigo | O que comprova |
| --- | --- |
| Codigo da organizacao SEMS+ | organizacao profissional aprovada pela GoodWe |
| Codigo de ativacao ChargeGrid | contrato comercial elegivel para uma planta de um estabelecimento |

O codigo ChargeGrid deve ser aleatorio, de uso unico, temporario, revogavel, auditado e armazenado de forma protegida. Ele nao deve ser o numero do contrato. Seu resgate exige usuario autenticado, correspondencia com o estabelecimento e propriedade ou autorizacao suficiente sobre a planta.

Reemissao invalida o codigo anterior. Tentativas repetidas devem ser limitadas. Um codigo vazado nao pode ativar uma planta arbitraria.

## Estados de ativacao

```text
PROSPECCAO
→ CONTRATO_PENDENTE
→ CONTRATADO
→ VALIDACAO_TECNICA
→ CODIGO_EMITIDO
→ CODIGO_RESGATADO
→ CONFIGURACAO_COMERCIAL
→ EM_REVISAO
→ ATIVO
```

Estados de excecao incluem `PENDENCIA_TECNICA`, `PENDENCIA_CONTRATUAL`, `CODIGO_EXPIRADO`, `REPROVADO`, `SUSPENSO_COMERCIALMENTE` e `CONTRATO_ENCERRADO`.

Encerrar ou suspender um contrato bloqueia novas operacoes e retira a publicacao ChargeGrid daquela planta, mas preserva planta, dispositivos, telemetria e funcoes SEMS+. Historico comercial permanece disponivel apenas aos usuarios autorizados.

## Carregadores da planta contratada

O contrato torna os carregadores compativeis da planta elegiveis para a camada comercial, mas nao os publica automaticamente. Cada carregador possui estado comercial proprio:

```text
ELEGIVEL → CONFIGURADO → PUBLICADO → SUSPENSO
```

Um carregador adicionado posteriormente fica elegivel sob o contrato vigente da planta e precisa de configuracao/revisao antes da publicacao. Estado tecnico e disponibilidade comercial permanecem separados.

## Entidades e fontes de verdade

```text
SEMS+
├── conta e organizacao
├── planta
├── dispositivo/carregador
├── telemetria
└── alarme

ChargeGrid
├── estabelecimento
├── vinculo comercial da planta
├── contrato comercial
├── caso e convite de ativacao
├── perfil/publicacao comercial
├── sessao e fila
├── tarifa e pagamento
├── incidente comercial
└── oportunidade de expansao

GoodWe comercial
├── carteira
├── regiao/territorio
├── parceiro
├── atribuicao do consultor
└── indicadores agregados
```

Nao criar `GoodWePlant`, `GoodWeDevice` ou outra copia da verdade tecnica. Entidades ChargeGrid guardam IDs internos separados e referencias aos IDs externos SEMS+.

O sistema comercial/contratual externo permanece fonte do contrato. O ChargeGrid mantem a projecao minima necessaria e o estado do convite/ativacao. GoodWe permanece fonte tecnica; gateway + ChargeGrid permanecem fonte financeira.

## Integracao de interface

Regras obrigatorias:

1. preservar funcionalidades e rotas SEMS+ ja reconstruidas;
2. nao substituir o shell quando o ChargeGrid for habilitado;
3. adicionar contexto comercial na entidade tecnica correspondente sempre que houver encaixe;
4. criar pagina nova somente para uma jornada sem equivalente coerente, como ativacoes, sessoes, fila, contratos ou pagamentos;
5. manter plantas nao comerciais com a experiencia SEMS+ normal;
6. permitir que o Painel inicial priorize a responsabilidade do usuario sem remover destinos autorizados;
7. nunca usar filtro de interface como barreira de seguranca; o backend aplica papel, escopo e capacidade.
8. nesta fase, somente o carregador recebe uma tela de detalhe reconstruida; inversores, dongles e dispositivos de terceiros permanecem no inventario SEMS+, pois nao exigem extensao ChargeGrid propria.

Encaixes preferenciais:

| Superficie SEMS+ | Extensao ChargeGrid |
| --- | --- |
| Painel | ativacoes, utilizacao, risco comercial e expansao conforme o papel |
| Lista de usinas | badge, estado comercial, pendencias e filtros adicionais |
| Detalhe da usina | aba `ChargeGrid` ou `Operacao comercial` |
| Detalhe do carregador | disponibilidade comercial, sessao, fila e historico correlacionado |
| Alarmes | vinculo com impacto/incidente comercial sem substituir o alarme tecnico |
| Relatorios | modelos ChargeGrid e tarefas dentro da central existente |
| Analise | qualidade comercial e oportunidades, com energia como evidencia |

## Energia na visao GoodWe comercial

Sem SLA contratado, energia nao domina o Painel comercial GoodWe. Ela funciona como evidencia para decisao:

```text
telemetria ausente → bloquear publicacao ou acionar suporte
restricao recorrente → risco de disponibilidade/adequacao
alta utilizacao com limite → oportunidade de charger, solar, bateria ou meter
```

Diagnostico detalhado, alarmes, equipamentos e energia continuam nas superficies tecnicas SEMS+.

## Contrato de navegação, responsabilidade e apresentação

A navegação principal deve reproduzir as superfícies reconhecíveis do SEMS+: `Painel`, `Lista de usinas`, `Lista de dispositivos`, `Central de alarmes`, `Central de relatórios`, `Ferramentas de análise` e `Centro de serviço`. Gestão da organização permanece como destino secundário da conta. As jornadas ChargeGrid aparecem como navegação contextual dentro dessas superfícies, sem recriar uma lateral paralela de domínios comerciais.

A composição visível segue esta matriz:

| Responsabilidade | Núcleo SEMS+ preservado | Extensão ChargeGrid visível |
| --- | --- | --- |
| Proprietário sem vínculo ChargeGrid | painel, usinas, dispositivos, alarmes, relatórios, análise técnica e serviço | nenhuma |
| Técnico/suporte | inventário, telemetria, alarmes, diagnóstico, comandos técnicos autorizados e serviço | prontidão técnica, sem sessões, motorista, contrato, tarifa ou financeiro |
| Consultor GoodWe | núcleo técnico do escopo e plantas da carteira | contratos, ativações, pendências, qualidade e expansão; sem operação local de sessões/fila |
| Central GoodWe | núcleo técnico e indicadores agregados autorizados | governança, tendências e exceções; não recebe operação detalhada como padrão |
| Administrador do estabelecimento | núcleo técnico das plantas próprias | contrato por planta, publicação individual, operação, tarifa, financeiro e usuários locais |
| Operador do estabelecimento | núcleo técnico das plantas próprias | sessões, fila, incidentes e comandos locais; sem contrato, tarifa sensível ou governança |

A autorização conceitual deve permanecer separada em seis dimensões, mesmo quando a demonstração local ainda usa fixtures:

```text
tipo de conta SEMS+
→ função organizacional SEMS+
→ existência do vínculo ChargeGrid
→ papel ChargeGrid
→ escopo explícito
→ capacidade da ação
```

### Qualidade da apresentação

ChargeGrid não deve ser representado por padrão como uma sequência de cards grandes, coloridos e equivalentes contendo apenas um número. A referência SEMS+ privilegia densidade, hierarquia e continuidade de trabalho. Portanto:

- usar tabelas, listas, gráficos, resumos compactos, estados inline e blocos contextuais quando eles explicarem melhor a situação;
- reservar cards grandes para métricas realmente prioritárias e sustentadas pela referência visual ou pela decisão que o usuário precisa tomar;
- apresentar contexto, exceção, evidência e ação antes de multiplicar KPIs;
- manter estado técnico e estado comercial próximos, porém visual e semanticamente separados;
- não executar uma varredura visual genérica sem novas referências; corrigir inconsistências proporcionais durante cada jornada e validar visualmente quando a tela for declarada pronta pelo produto.

Esta regra é uma decisão de produto e design, não uma autorização para criar snapshots ou baselines nesta fase.

## Consequencias para o produto atual

- `GOODWE_ADMIN` nao deve continuar como persona unica de produto; fixtures e codigo futuros devem evoluir para papel, escopo e capacidades explicitos;
- `ESTABLISHMENT_ADMIN` e `ESTABLISHMENT_OPERATOR` continuam uteis como papeis ChargeGrid, sempre vinculados a plantas comerciais autorizadas;
- a ativacao comercial nao pode ser um botao irrestrito disponivel a qualquer proprietario;
- uma entrada publica pode apenas apresentar o ChargeGrid ou encaminhar contato comercial;
- a lista de plantas precisa suportar portfolio misto, sem converter automaticamente novas plantas;
- nenhum compartilhamento SEMS+ deve vazar contrato, tarifa, sessoes ou financeiro.

## Pontos ainda tecnicos, sem reabrir a decisao de negocio

- sistema comercial/contratual que originara os eventos em producao;
- formato e prazo final do codigo;
- checklist exato de prontidao tecnica e comercial;
- politica de reatribuicao de consultor e tratamento de excecoes;
- capacidades OpenAPI/HCA G2 homologadas no Brasil;
- schema, RLS, auditoria e integracao produtiva.

Esses pontos definem implementacao e operacao, mas nao alteram o modelo vigente: contrato por planta, estabelecimento contratante, consultor autorizador e ChargeGrid como camada aditiva do SEMS+.
