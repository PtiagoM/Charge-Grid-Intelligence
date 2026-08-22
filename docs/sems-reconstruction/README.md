# Reconstrução do Dashboard SEMS+ com módulo ChargeGrid

**Status:** análise histórica concluída; implementação autorizada e iniciada na linha `develop/admin-web`  
**Decisão vigente:** ChargeGrid incorporado como módulo/camada da experiência SEMS+  
**Fora do escopo do Admin:** qualquer alteração na Driver PWA

## 1. Resultado esperado

Ao final da etapa de análise, o repositório deve conter evidência suficiente para responder:

1. Como a experiência observável do SEMS+ está estruturada?
2. Quais partes são necessárias para hospedar o ChargeGrid como módulo?
3. O que é observado, inferido ou ainda desconhecido?
4. Como entidades, permissões e jornadas SEMS+ se relacionam ao domínio ChargeGrid?
5. Qual arquitetura deve ser usada no novo Dashboard?
6. Em qual ordem o Codex deve implementá-lo e como validar fidelidade?

O objetivo não é copiar todo o SEMS+ nem produzir um clone pixel-perfect indiscriminado. É reconstruir uma experiência coerente, limitada ao necessário para o módulo ChargeGrid.

## 2. Estratégia recomendada

### Abordagem escolhida

Usar uma combinação de:

1. **reconhecimento breadth-first:** mapear navegação e páginas antes de aprofundar;
2. **evidence ledger:** cada conclusão ligada a observação, screenshot e nível de confiança;
3. **aprofundamento orientado ao ChargeGrid:** explorar em detalhe plantas, dispositivos, usuários, permissões, energia, alertas e fluxos correlatos;
4. **design system derivado depois da observação:** não definir componentes globais com base em duas telas;
5. **vertical slices na futura implementação:** shell → planta → carregadores/sessões → energia/demanda → financeiro/IA;
6. **comparação visual contínua:** original e reconstruído nos mesmos estados e viewport.

### Por que não “analisar tudo e depois implementar página por página”

Essa estratégia é simples, mas apresenta riscos:

- consome tempo e contexto em áreas sem relação com ChargeGrid;
- transforma páginas em unidade de implementação, mesmo quando a jornada cruza várias delas;
- tende a duplicar componentes antes de descobrir padrões;
- pode copiar aparência sem compreender permissões, estados e relações;
- adia validação visual até o final.

A abordagem híbrida preserva uma visão ampla do SEMS+ e aprofunda somente os domínios relevantes. Na implementação futura, as unidades serão jornadas verticais verificáveis, não páginas isoladas.

## 3. Fronteiras de segurança e propriedade intelectual

Permitido:

- navegar em conta autorizada como usuário real;
- observar UI, conteúdo, URLs visíveis, navegação e comportamento;
- usar árvore de acessibilidade/DOM para compreender elementos visíveis;
- capturar screenshots relevantes;
- criar, editar, ativar, desativar, arquivar e excluir dados de teste no sandbox;
- provocar estados e executar fluxos funcionais usando entidades `CG_ANALYSIS_*`;
- documentar padrões e reconstruí-los com código original.

Proibido:

- buscar ou copiar código-fonte proprietário;
- baixar/inspecionar bundles JavaScript, source maps ou artefatos internos;
- extrair cookies, tokens, credenciais ou armazenamento de sessão;
- persistir senha em arquivo, terminal, screenshot ou log; credenciais podem existir apenas no bloco de runtime da mensagem inicial da nova tarefa;
- usar dados pessoais/reais sem necessidade;
- tentar contornar permissões ou acessar páginas não autorizadas;
- alterar credenciais, billing, propriedade da organização ou configurações que possam bloquear a conta;
- afetar integração externa ou ativo físico caso apareça conectado ao sandbox;
- capturar indiscriminadamente todo o sistema.

Se a aplicação exibir dado sensível, a documentação deve usar descrição anonimizada; screenshots devem ser omitidos ou redigidos.

## 4. Fonte de contexto obrigatória

Antes de navegar, o agente deve ler:

1. `docs/CURRENT_STATE.md`;
2. `docs/product/ChargeGrid_Intelligence_Documento_Final_de_Produto_v1.0.md`;
3. `docs/contracts/ChargeGrid_Intelligence_Contratos_e_Enums_Compartilhados_v1.0.md`;
4. `docs/architecture/ChargeGrid_Intelligence_Stack_e_Arquitetura_MVP_v1.0.md`;
5. `docs/design-system/README.md`;
6. `docs/specs/driver-pwa-mobile/decisions.md` apenas para confirmar a fronteira “PWA não alterar”.

Em conflito, `docs/CURRENT_STATE.md` prevalece. A decisão mais recente é ChargeGrid como módulo/camada do SEMS+; referências a Dashboard ChargeGrid independente são históricas.

## 5. Fases e checkpoints

### Fase 0 — Preparação e guarda de escopo

**Objetivo:** compreender contexto, confirmar ferramentas e preparar documentação vazia.

Entregáveis:

- inventário das ferramentas disponíveis;
- confirmação de que o navegador interativo preserva sessão;
- estrutura `docs/sems-analysis/`;
- convenções de evidência e screenshot;
- registro explícito de que o PWA não será modificado;
- lista inicial de domínios ChargeGrid a procurar.

Parada obrigatória: se login for necessário, abrir a página e pedir ao usuário que o realize diretamente. Nunca pedir credenciais no chat.

**Estimativa:** 45–90 minutos.

### Fase 1 — Reconhecimento amplo do SEMS+

**Objetivo:** criar mapa navegacional sem aprofundar cada tela.

Atividades:

- percorrer sidebar, header, menus, tabs e ações contextuais;
- registrar rotas visíveis, breadcrumbs, drawers e modais;
- identificar páginas dependentes de seleção de planta/dispositivo;
- registrar limitações da conta/permissão;
- capturar apenas shell, menus e páginas-raiz relevantes.

Entregáveis:

- `sitemap.md`;
- `navigation.md`;
- inventário preliminar em `pages.md`;
- `permissions.md` inicial;
- screenshot manifest.

Checkpoint: revisão humana do sitemap antes do aprofundamento.

**Estimativa:** 2–4 horas.

### Fase 2 — Aprofundamento por domínios relevantes

**Objetivo:** observar páginas, estados e fluxos que podem sustentar ChargeGrid.

Prioridade:

1. shell, conta e troca de escopo;
2. plantas e detalhe de planta;
3. dispositivos e carregadores;
4. energia, consumo, bateria, rede e alarmes;
5. usuários, organizações, instaladores e permissões;
6. relatórios, exportações e operações funcionais testáveis no sandbox;
7. configurações relevantes.

Para cada tela:

- propósito e entidade;
- componentes e dados;
- ações e resultado;
- relações com outras páginas;
- estados observados;
- evidência e confiança;
- possíveis encaixes ChargeGrid, ainda sem decidir o design final.

É permitido criar e alterar entidades fictícias para observar estados, validações, confirmações, sucesso, falha, desativação e exclusão. Antes de mudar entidade preexistente, registrar o estado inicial. Excluir somente registros criados pelo agente e nunca usar operações amplas sem conferir os alvos. Possível impacto externo continua bloqueado.

Entregáveis:

- `pages.md` aprofundado;
- `components.md`;
- `states.md`;
- `flows.md`;
- `entities.md` preliminar;
- screenshots seletivos.

**Estimativa:** 6–12 horas. A faixa aumentou porque agora inclui criação/edição controlada de dados para observar estados que não apareceriam em navegação somente leitura.

### Fase 3 — Consolidação da evidência

**Objetivo:** eliminar duplicações e separar fato, inferência e hipótese.

Entregáveis:

- matriz de evidências;
- entidades e relações com confiança;
- permissões observadas versus inferidas;
- padrões reutilizáveis de UI;
- lacunas e contradições;
- `open-questions.md` priorizado.

**Estimativa:** 2–4 horas.

### Fase 4 — Encaixe SEMS+ × ChargeGrid

**Objetivo:** decidir como o módulo entra na experiência observada.

Para cada capacidade ChargeGrid, classificar:

- equivalente SEMS+ existente;
- extensão/adaptação de elemento existente;
- nova página/componente dentro do módulo;
- regra de domínio sem impacto visual direto;
- decisão de negócio pendente.

Capacidades mínimas:

- plantas comerciais;
- carregadores e disponibilidade comercial;
- sessões e recargas;
- fila como contexto operacional, sem alterar PWA;
- tarifa, receita, lucro e comissão demonstrativa;
- pagamento e liquidação;
- controle de demanda;
- energia e sustentabilidade;
- incidentes;
- IA preditiva e recomendações;
- visão GoodWe, estabelecimento e operador.

Entregáveis:

- `chargegrid-fit.md`;
- `scope-candidates.md`;
- `journeys.md`;
- decisão preliminar de navegação do módulo.

**Estimativa:** 2–4 horas.

### Fase 5 — Escopo e jornadas

**Objetivo:** converter descoberta em recorte implementável.

Classificação obrigatória:

- `MUST IMPLEMENT`;
- `SHOULD IMPLEMENT`;
- `REFERENCE ONLY`;
- `OUT OF SCOPE`.

Cada item deve trazer justificativa, ator, dependência e evidência SEMS+/ChargeGrid.

Jornadas devem incluir usuário, objetivo, entrada, páginas, ações, resultado, próxima etapa, permissões, estados de erro e evidências.

**Estimativa:** 2–3 horas.

### Fase 6 — Arquitetura e plano de implementação

**Objetivo:** planejar o novo projeto, sem implementá-lo.

Entregáveis:

- arquitetura frontend e fronteiras de backend;
- rotas e integração do módulo ao shell reconstruído;
- design system e estratégia de temas claro/escuro;
- entidades e contratos;
- autenticação e RBAC simulados/futuros;
- estado, mocks e services;
- estrutura de pastas;
- testes;
- milestones pequenos com critérios de aceitação;
- plano de validação visual;
- riscos, dependências e decisões humanas.

Parada obrigatória: não criar componentes ou iniciar o clone.

**Estimativa:** 3–5 horas.

### Fase 7 — Auditoria final da análise

**Objetivo:** verificar completude, rastreabilidade e ausência de dados sensíveis.

Checklist:

- toda conclusão importante possui evidência ou marca de inferência;
- nenhuma credencial/token/cookie foi salvo;
- PWA não foi alterada;
- páginas não foram incluídas apenas por existirem no SEMS+;
- plano está dividido em tarefas independentes;
- critérios de aceite são observáveis;
- documento final distingue atual, simulado e futuro.

**Estimativa:** 1–2 horas.

## 6. Estimativa total

| Cenário | Esforço de análise | Prazo de calendário provável |
| --- | --- | --- |
| Conta com um papel e navegação moderada | 16–22 horas de agente | 2–3 dias com checkpoints |
| SEMS+ amplo, muitos estados e páginas | 22–30 horas de agente | 3–5 dias |
| Vários papéis/contas ou permissões incompletas | adicionar 4–10 horas | adicionar 1–2 dias |

Essas estimativas cobrem análise, documentação, escopo, arquitetura e plano. Não incluem implementação.

Estimativa preliminar para uma implementação posterior, após aprovação do escopo:

- fundação, shell, temas e design system: 2–4 dias;
- vertical slices MUST IMPLEMENT: 6–12 dias;
- comparação visual, estados e hardening: 3–6 dias;
- total provável: 11–22 dias de trabalho do agente, variando com quantidade de páginas e integrações.

## 7. Modelo e configuração recomendados

### Escolha principal

Usar **GPT-5.6 Sol (`gpt-5.6` / `gpt-5.6-sol`)** no Codex, se disponível na conta, com raciocínio **high** para exploração e síntese.

Motivos:

- tarefa longa, multimodal e orientada a ferramentas;
- exige visão, navegação, julgamento de UI e raciocínio arquitetural;
- a documentação oficial o posiciona como flagship para raciocínio complexo e código;
- a orientação oficial destaca melhoria em estética frontend, layout, hierarquia visual e design judgment;
- o contexto amplo favorece manter documentos, evidências e decisões na mesma tarefa.

Configuração sugerida:

- Fases 0–2: GPT-5.6 Sol, `high`, modo padrão;
- Fases 3–5: GPT-5.6 Sol, `high`;
- Fases 6–7: GPT-5.6 Sol, `xhigh` se disponível e se qualidade justificar latência;
- Pro mode: apenas para auditoria/arquitetura final de alto valor, não para navegação repetitiva;
- alternativa econômica: GPT-5.6 Terra para consolidação mecânica, sem trocar o modelo no meio de uma observação que dependa de contexto.

Fontes oficiais:

- https://developers.openai.com/api/docs/models
- https://developers.openai.com/api/docs/guides/latest-model

Disponibilidade e nomes exibidos no seletor do Codex podem variar por conta; escolher o melhor GPT-5.6 disponível sem substituir por modelo menor durante as decisões arquiteturais.

### Distribuição recomendada da janela de contexto

Não tente gastar 100% dos tokens em uma única resposta. Use a mesma tarefa em vários turnos e deixe o Codex compactar o histórico quando necessário.

| Bloco | Parcela aproximada |
| --- | --- |
| Contexto, setup e convenções | 10% |
| Reconhecimento amplo | 15% |
| Aprofundamento e evidências | 30% |
| Consolidação | 15% |
| Encaixe, escopo e jornadas | 15% |
| Arquitetura, milestones e auditoria | 15% |

Screenshots e descrições repetidas são os maiores consumidores. Capturar por estado representativo e referenciar o manifest, em vez de redescrever a mesma tela em vários arquivos.

### Como executar na outra conta

1. abrir este repositório na nova conta Codex;
2. selecionar GPT-5.6 Sol/flagship com raciocínio high;
3. criar uma única tarefa para a análise;
4. copiar `CODEX_MASTER_PROMPT.md`, substituir os placeholders de runtime na mensagem e enviar; nunca salvar a versão preenchida;
5. deixar o Codex autenticar autonomamente as contas de operador e usuário;
6. revisar o Checkpoint 1 e responder “continue para a Fase 2”;
7. revisar o Checkpoint 2 e responder “continue até a entrega final”;
8. não abrir outra tarefa durante a exploração autenticada, salvo perda irrecuperável da sessão;
9. abrir nova tarefa apenas para a implementação, depois de aprovar escopo e arquitetura.

Recomenda-se usar credenciais temporárias e rotacioná-las ao concluir. O prompt autoriza ferramentas e ações rotineiras antecipadamente, mas não consegue eliminar diálogos de aprovação obrigatórios impostos pelo ambiente Codex.

## 8. Organização de documentação esperada

```text
docs/sems-analysis/
├── README.md
├── evidence-ledger.md
├── sitemap.md
├── navigation.md
├── pages.md
├── entities.md
├── permissions.md
├── components.md
├── states.md
├── flows.md
├── chargegrid-fit.md
├── scope-candidates.md
├── journeys.md
├── architecture-proposal.md
├── implementation-plan.md
├── visual-validation-plan.md
├── open-questions.md
└── screenshots/
    ├── manifest.md
    ├── shell/
    ├── plants/
    ├── plant-details/
    ├── devices/
    ├── users-permissions/
    ├── energy-alerts/
    └── reports-settings/
```

## 9. Convenção de evidência

Cada registro deve usar:

| Campo | Exemplo |
| --- | --- |
| ID | `SEMS-PLANT-014` |
| Classificação | `OBSERVED`, `INFERRED`, `UNKNOWN`, `OPEN QUESTION` |
| Confiança | alta, média, baixa |
| Contexto | papel, planta selecionada, viewport e tema |
| Ação | clique/entrada realizada |
| Resultado | mudança observada |
| Evidência | screenshot e documento/linha |
| Sensibilidade | normal, anonimizar, não capturar |

Rotas podem ser registradas sem query strings sensíveis. IDs reais devem ser substituídos por placeholders.

## 10. Estratégia de validação visual futura

### Durante a análise

Usar o navegador interativo do Codex para a aplicação autorizada. Capturar viewport, tema, página e estado no manifest. Não usar automação de terminal para digitar credenciais.

### Durante a implementação

1. abrir referência SEMS+ autenticada;
2. selecionar viewport/tema/estado definido;
3. capturar referência;
4. abrir rota equivalente local;
5. capturar resultado;
6. comparar geometria, tipografia, espaçamento, cores e hierarquia;
7. registrar divergências por severidade;
8. corrigir e repetir.

Usar Playwright ou navegador automatizado no projeto local/reconstruído. No SEMS+ sandbox, automação também pode ser usada em fluxos autorizados com dados de teste controlados, desde que não registre credenciais nem afete integrações externas.

Critérios objetivos:

- shell, largura da navegação e header;
- grid, alinhamentos e dimensões;
- tipografia e densidade;
- tokens claro/escuro;
- tabelas, filtros, tabs, modais e drawers;
- loading, empty, populated, disabled, error e sucesso;
- responsividade nos viewports realmente necessários;
- comportamento ação → resultado.

## 11. Critério de conclusão da análise

A etapa está concluída somente quando:

- o sitemap está documentado dentro das permissões disponíveis;
- as páginas relevantes possuem ficha e evidência;
- entidades e permissões distinguem observação de inferência;
- o encaixe ChargeGrid está mapeado capacidade por capacidade;
- o escopo possui justificativa;
- jornadas e arquitetura estão definidas;
- milestones são executáveis e testáveis;
- open questions possuem impacto e responsável sugerido;
- nenhuma implementação do clone ou alteração da PWA foi realizada.
