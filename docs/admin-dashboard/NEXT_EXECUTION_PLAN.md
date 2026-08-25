# Plano de execução — próxima rodada do Admin

**Status:** `APROVADO PARA EXECUÇÃO`  
**Data:** 25 de agosto de 2026  
**Linha de integração:** `develop/admin-web`  
**Escopo:** frontend Admin, fixtures, estados locais, navegação, UI/UX e testes proporcionais. Backend, RLS, emissão segura de código e integrações produtivas permanecem fora desta rodada.

## Objetivo

Concluir primeiro as experiências principais de usuário, com identidade visual SEMS+ consistente e camada ChargeGrid corretamente posicionada, antes de implementar delegações restritas ou ampliar o escopo.

Ordem de prioridade:

```text
proprietário comercial
→ consultor GoodWe
→ Central GoodWe
→ instalador SEMS+ sem ChargeGrid
→ proprietário comum
→ operador, analista e demais funções restritas
```

Consultor é construído antes da Central porque contrato, ativação e carteira formam a jornada de origem da operação comercial. A Central é derivada da mesma experiência, adicionando função organizacional de administrador e escopo completo.

## Definição de perfil completamente pronto

Um perfil só é concluído quando:

- entra pela conta de demonstração correspondente e mantém contexto após navegação/reload quando aplicável;
- vê apenas superfícies compatíveis com tipo de conta, função organizacional, vínculo ChargeGrid, responsabilidade e escopo;
- todas as entradas, botões, filtros, pesquisas, tabs e links visíveis funcionam;
- nenhuma rota visível termina em página órfã, contexto ausente ou grid quebrado;
- estados vazio, carregando, populado, bloqueado e erro relevante estão representados;
- telas prioritárias foram comparadas manualmente com referências SEMS+ no viewport adequado;
- lint e build passam; testes de domínio e E2E focal passam quando a jornada alterada exigir;
- o produto revisou visualmente as telas principais do perfil;
- não existe dependência de snapshot ou baseline ainda não aprovado.

Não avançar ao perfil seguinte deixando defeitos conhecidos de estrutura, contexto ou navegação no perfil atual. Ajustes puramente cosméticos explicitamente deferidos podem permanecer registrados no backlog.

## Fase 0 — Fundação compartilhada

### Identidade e fixtures

- representar proprietário comercial como proprietário da planta e administrador por definição;
- representar consultor como colaborador profissional GoodWe com responsabilidade ChargeGrid e carteira explícita;
- representar Central como consultor + função SEMS+ de administrador + escopo completo, sem papel-mestre implícito;
- criar conta de demonstração de instalador profissional sem qualquer papel ou conteúdo ChargeGrid;
- preservar `usuario@teste.com` como proprietário SEMS+ comum;
- manter operador e analista existentes fora da validação principal até a fase de delegações.

### Navegação e contexto

- preservar as sete superfícies SEMS+ para identidades sem operação comercial própria;
- adicionar `ChargeGrid` logo abaixo de Lista de dispositivos somente ao proprietário com planta comercial;
- remover o seletor global de escopo do topo;
- selecionar planta, dispositivo, período e demais contextos dentro da página correspondente;
- preservar contexto em URL/breadcrumb quando o usuário abre um recurso;
- retirar Ativações/Contratos de Usinas, Sessões/Fila de Dispositivos e Financeiro/Tarifa de Relatórios;
- garantir estado ativo correto de navegação e estabilidade do grid em toda troca de rota.

### Controles compartilhados

- implementar pesquisa e filtros reais em Usinas, Dispositivos e Alarmes;
- eliminar filtros duplicados ou decorativos;
- normalizar dropdowns, tabs, botões, estados ativos e ícones usando componentes SEMS+ reutilizáveis;
- não iniciar baseline visual nesta fase.

**Gate F0:** cinco personas principais autenticam; menus e rotas refletem a matriz aprovada; nenhuma superfície principal possui link órfão; filtros compartilhados básicos funcionam.

### Registro de execução — 25/08/2026

**Estado:** `CONSOLIDADA — revisão de fluxo e coerência visual aprovada pelo produto`

- separação explícita entre escopo técnico SEMS+ e concessão comercial ChargeGrid nos fixtures e no estado local;
- nova conta demonstrativa `instalador@teste.com`, profissional aprovada sem qualquer papel ChargeGrid;
- Central GoodWe derivada do consultor: mesma leitura comercial de carteira, contratos e ativações; administrador organizacional e escopo completo apenas por função, capacidade e concessão explícitas;
- proprietário comercial recebe `ChargeGrid` abaixo de Dispositivos; Central, consultor, instalador puro e proprietário comum mantêm as sete superfícies SEMS+;
- seletor global de escopo removido; seleção de contexto permanece dentro de cada vertical e é preservada ao abrir recursos;
- Ativações/Contratos foram para Gestão da organização; Sessões/Fila/Financeiro para a entrada ChargeGrid; Tarifa para a organização; Relatórios ficaram restritos a geração e exportação;
- buscas e filtros de usinas, dispositivos e alarmes agora alteram a lista apresentada; controles duplicados ou apenas decorativos foram removidos.

Validação automatizada registrada nesta rodada: build, lint, 76 testes unitários e E2E focal das personas, dos filtros e do painel. A revisão do produto confirmou a coerência dos fluxos e das superfícies principais; a criação de baseline, snapshots e matriz visual continua reservada para a finalização visual, conforme definido no workflow.

## Fase 1 — Proprietário comercial

### Painel

- preservar composição SEMS+;
- melhorar Economia e Monitoramento com leitura comercial clara;
- avaliar alternância entre energia da planta e operação ChargeGrid no gráfico;
- usar série derivada dos dados, período funcional e tooltip numérico;
- evitar cards genéricos e números sem contexto.

### Usinas e planta

- reconstruir lista com barra única de pesquisa/filtros e estado visual SEMS+;
- remover subnavegação de contratos/ativação;
- reconstruir detalhe da planta a partir das referências SEMS+;
- mostrar estado ChargeGrid apenas na planta contratada;
- manter plantas não comerciais completamente normais.

### Dispositivos e carregador

- preservar inventário técnico e corrigir filtros, pesquisa e ícones;
- manter detalhe apenas do carregador nesta fase;
- aplicar ajustes pontuais no detalhe já aprovado como boa base;
- preservar configuração/publicação/suspensão individual.

### Entrada ChargeGrid

- criar visão operacional local;
- incluir Sessões, Fila e Resumo financeiro;
- manter comandos e publicação nos contextos corretos do carregador;
- não mover política tarifária para esta entrada.

### Gestão da organização

- preservar Informações da organização e Contratos e ativações;
- posicionar Política tarifária como configuração da organização comercial;
- apresentar delegações locais sem tratá-las como prioridade de implementação completa;
- manter assinaturas e documentos comerciais deferidos.

### Alarmes, recomendações, relatórios e serviço

- preservar inbox de alarmes e corrigir filtros/pesquisa;
- reprojetar recomendações com evidência, impacto, confiança e ação compreensível;
- manter Relatórios como geração/exportação;
- manter Centro de serviço SEMS+ e não inventar documentos comerciais.

**Gate F1:** contrato → ativação → configuração → publicação → sessão/fila → leitura financeira funciona visual e estruturalmente para o proprietário, sem afetar plantas SEMS+ comuns.

## Fase 2 — Consultor GoodWe

- usar as mesmas sete superfícies SEMS+ e a mesma composição visual;
- Painel mostra carteira agregada, ativações, qualidade comercial e oportunidades sem operação local;
- Lista de usinas limita dados à carteira e exibe estados comerciais contextuais;
- Gestão da organização preserva Informações e Contratos e ativações;
- usuários/funções e atribuição global de carteiras não aparecem como poder do consultor;
- recomendações e oportunidades precisam ter evidência e ação comercial real;
- não exibir fila, sessões, comandos locais, financeiro detalhado ou chamado externo para a GoodWe;
- não criar entrada ChargeGrid própria nesta fase.

**Gate F2:** o consultor acompanha do contrato à ativação e expansão somente da carteira atribuída, sem receber gestão organizacional ou operação local.

## Fase 3 — Central GoodWe

- derivar a experiência do consultor, sem criar shell ou conjunto arbitrário de páginas;
- ampliar o escopo para a rede completa;
- permitir filtros por região, carteira, parceiro e consultor dentro das páginas;
- apresentar agregados de rede no Painel e permitir drill-down de exceção;
- habilitar Gestão da organização, usuários, funções, atribuição de carteiras e auditoria;
- desenhar concessão/alteração de responsabilidade para grande volume, com busca, filtros, seleção explícita e confirmação;
- manter contratos e ativações acessíveis conforme escopo;
- não exibir operação local como conteúdo principal nem criar poder-mestre implícito;
- avaliar entrada ChargeGrid GoodWe somente depois de Visão geral e Oportunidades estarem prontas nas superfícies atuais.

**Gate F3:** Central reproduz a experiência do consultor em escopo completo e governa colaboradores/carteiras; toda diferença visível é explicada por função, responsabilidade, escopo ou capacidade documentada.

## Fase 4 — Instalador SEMS+ sem ChargeGrid

- criar persona de demonstração profissional sem papel ChargeGrid;
- preservar Painel, Usinas, Dispositivos, Alarmes, Relatórios, Análises e Serviço do SEMS+;
- limitar Gestão da organização conforme função SEMS+ demonstrada;
- excluir contrato, ativação, operação ChargeGrid, sessões, fila, tarifa, financeiro, inteligência comercial e oportunidades;
- validar plantas, dispositivos, alarmes e diagnóstico como experiência técnica independente.

**Gate F4:** a conta profissional funciona integralmente como instalador SEMS+ e não recebe nenhum conteúdo comercial por consequência do tipo de conta.

## Fase 5 — Proprietário SEMS+ comum

- validar `usuario@teste.com` em todas as sete superfícies;
- garantir ausência total da entrada ChargeGrid e de informações comerciais;
- confirmar criação/listagem técnica de plantas e estados vazios de dispositivos;
- usar o perfil como regressão obrigatória da natureza aditiva do ChargeGrid.

**Gate F5:** experiência SEMS+ comum permanece íntegra depois de todas as alterações comerciais.

## Fase 6 — Delegações e restrições

Somente após F0–F5 aprovadas:

- operador local;
- analista/financeiro;
- Navegador de organização profissional;
- Técnico/suporte;
- outras combinações realmente necessárias.

Esses perfis reutilizam as experiências concluídas e apenas removem ou limitam capacidades. Não serão usados para descobrir o desenho principal das telas.

## Fase 7 — Finalização visual

- corrigir login para maior fidelidade ao SEMS+;
- concluir design system a partir dos componentes efetivamente aprovados;
- revisar tema escuro, ícones, tipografia, densidade, alinhamento e responsividade;
- decidir e concluir assinaturas, documentos comerciais e fluxos restantes do Centro de serviço;
- somente após aprovação explícita das telas, criar baseline, snapshots e matriz visual proporcional;
- executar regressão integral antes de qualquer integração em `main`.

## Referências visuais prioritárias

Solicitar ao produto, na ordem em que bloquearem execução:

1. detalhe de planta SEMS+ nos principais estados;
2. Central de relatórios: tipos, geração, tarefa/download e assinatura;
3. Ferramentas de análise e sua navegação interna;
4. comportamento do gráfico SEMS+ com período e tooltip;
5. Gestão da organização em grande volume de usuários;
6. estados adicionais de carregador apenas quando necessários aos ajustes finais.

Toda nova captura recebida segue `reference-screenshots/REFERENCE_WORKFLOW.md` antes de orientar implementação.

## Validação por rodada

- mudanças somente documentais: `git diff --check`;
- UI/navegação: lint, build e E2E focal da jornada alterada;
- regra de domínio em fixture: unitários do domínio + E2E focal;
- perfil declarado completo: revisão manual nas telas principais e bateria focal consolidada do perfil;
- sem snapshot ou baseline até aprovação visual explícita;
- usar um worker/processo por vez quando possível para preservar memória da máquina local.

## Fora do escopo imediato

- autenticação produtiva e provisionamento real de colaboradores;
- autorização backend, RLS e políticas de API;
- integração com CRM, ERP ou sistema contratual GoodWe;
- emissão e resgate seguro de código no servidor;
- telemetria, notificações, relatórios e pagamentos produtivos;
- CRM, fila comercial ou gestão de tarefas de consultores;
- detalhes próprios para inversores, dongles ou dispositivos não relacionados diretamente ao ChargeGrid.
