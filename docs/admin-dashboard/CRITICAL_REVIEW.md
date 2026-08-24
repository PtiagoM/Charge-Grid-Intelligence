# Revisão crítica e direção do Dashboard Admin

**Data:** 22 de agosto de 2026  
**Status:** decisão vigente para a reconstrução  
**Base:** análise observacional do SEMS+, `CURRENT_STATE.md`, proposta de arquitetura, plano M0–M9 e inspeção do Admin importado

## Veredito

O dashboard importado é uma boa referência visual e uma prova de conceito React/TypeScript, mas não é uma base de produto pronta para expansão. Ele reproduz a superfície do SEMS+ sem reproduzir sua lógica de contexto, hierarquia, progressão e operação. O resultado parece artificial porque oferece muitos destinos laterais, poucas jornadas completas, números demonstrativos apresentados como certezas e controles que não correspondem a capacidades reais.

A reconstrução não será uma cópia de código nem uma coleção de telas sem comportamento. O shell, a densidade, os padrões e as funções SEMS+ reconstruídas são preservados; o ChargeGrid acrescenta jornadas comerciais sem substituir a experiência técnica.

### Refinamento de produto — 23/08/2026

O ChargeGrid foi definido literalmente como camada aditiva por planta. Habilitá-lo não troca o shell, não remove funções SEMS+ e não transforma toda a conta. Contrato e membership são por planta; uma conta pode manter plantas técnicas e comerciais simultaneamente. O fluxo completo, os papéis GoodWe e as regras de ativação estão em [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md).

## Modelo operacional canônico

```text
GoodWe / organização
└── cliente comercial
    └── estabelecimento
        └── planta GoodWe / ponto de recarga
            ├── carregadores
            │   ├── telemetria e capacidade técnica
            │   ├── disponibilidade comercial
            │   └── comandos auditáveis
            ├── sessões
            ├── fila
            ├── energia e demanda
            └── incidentes
```

`Planta` é a entidade técnica existente na GoodWe. `Ponto de recarga` é sua projeção comercial no ChargeGrid. O onboarding não recadastra a planta nem inventa localização paralela: contrato por planta e código autorizado pelo consultor vinculam a entidade SEMS+, detectam equipamentos e complementam apenas dados comerciais. Resgatar o código não publica sem prontidão.

## Problemas encontrados

### 1. Navegação lateral excessiva

O perfil GoodWe recebe dezesseis itens laterais e o estabelecimento doze. A sidebar funciona como inventário de funcionalidades, não como orientação de trabalho. Conceitos relacionados ficam separados artificialmente: operação, sessões, energia, tarifa, financeiro, relatórios e auditoria competem no mesmo nível.

**Decisão atualizada em 23/08/2026:** a lateral não cria domínios abstratos. Ela preserva as sete superfícies observadas no SEMS+: Painel, Lista de usinas, Lista de dispositivos, Central de alarmes, Central de relatórios, Ferramentas de análise e Centro de serviço. Configurações, acesso e auditoria pertencem ao menu da conta ou à área administrativa secundária. Contratos, ativações, sessões, fila, energia comercial e financeiro entram como navegação contextual na superfície correspondente.

### 2. Falta de navegação contextual e vertical

As telas mostram blocos independentes, mas raramente conduzem o usuário do resumo para diagnóstico e ação. Tabs internas são âncoras inconsistentes; algumas apontam para seções inexistentes. O detalhe selecionado costuma surgir abaixo de uma tabela, fora da área visível.

**Decisão:** cada domínio deve possuir rotas mestre/detalhe e tabs contextuais no conteúdo. A sidebar escolhe o domínio; breadcrumbs, tabs, filtros e CTAs conduzem a jornada dentro dele.

Exemplo:

```text
Rede → cliente → estabelecimento → planta → carregador
                                      ├── resumo
                                      ├── sessões
                                      ├── energia
                                      ├── incidentes
                                      └── comandos
```

### 3. Controles de carregador ausentes ou enganosos

O estabelecimento não consegue solicitar start/stop, limitar disponibilidade ou diagnosticar o equipamento. Adicionar botões locais agora seria incorreto: os contratos GoodWe e a matriz de capacidades ainda não estão homologados.

**Decisão:** controles são obrigatórios no detalhe do carregador quando a capacidade permitir, com:

- ação autorizada por papel e planta;
- motivo obrigatório;
- chave de idempotência e correlação;
- estado `solicitado`, `confirmado`, `falhou` ou `expirou`;
- confirmação por telemetria/evento, nunca apenas pelo HTTP;
- autor, horário e resultado no histórico de comandos;
- mensagem clara quando o perfil só pode monitorar.

### 4. Sessões sem semântica operacional

Não fica claro se a área mostra sessão de recarga, conexão física, cobrança, incidente ou apenas histórico. Estados terminados aparecem como “resolvidos”, linguagem herdada de alarmes. O detalhe não possui timeline nem relação explícita com comando, pagamento e energia.

**Decisão:** sessão comercial terá lista “Ao vivo” e “Histórico” e detalhe próprio com timeline:

```text
pagamento autorizado → início solicitado → energia confirmada
→ recarga em andamento → encerramento → captura/conciliação
```

Falhas e dados antigos devem aparecer como estados, não desaparecer. A sessão sempre liga planta, carregador, motorista/visitante, tarifa aceita, energia, pagamento e eventos técnicos.

### 5. Informação sem hierarquia

Há muitos KPIs equivalentes, cards genéricos e textos explicativos. Métricas essenciais, alertas e ações competem visualmente. Vários percentuais, health scores, demanda, comissão e previsões são constantes de fixture sem origem visível.

**Decisão:** cada tela responde, nesta ordem:

1. Qual é o escopo e a situação atual?
2. O que exige atenção?
3. Qual evidência explica isso?
4. Qual ação autorizada pode ser tomada?
5. Onde consultar histórico e detalhes?

Hipóteses comerciais e previsões não homologadas permanecem em fixtures/documentação e não podem parecer políticas GoodWe.

### 6. Onboarding e cadastros artificiais

Cliente, estabelecimento, ponto e carregador são cadastrados por formulários independentes, sem wizard, validação assíncrona, descoberta GoodWe ou resumo de publicação. O fluxo permite criar estruturas impossíveis.

**Decisão:** o onboarding seguirá etapas:

1. selecionar cliente/estabelecimento;
2. localizar planta GoodWe autorizada;
3. validar vínculo e detectar carregadores;
4. preencher somente o perfil comercial;
5. revisar horários, acesso, tarifa e responsáveis;
6. publicar ou salvar rascunho.

Carregadores GoodWe são descobertos e vinculados. Cadastro manual genérico só poderá existir para uma categoria externa explicitamente suportada.

### 7. Detalhe do carregador sem identidade própria

A página tentou copiar agrupamentos do SEMS+ sem estabelecer uma hierarquia ChargeGrid. O detalhe atual é um conjunto de quatro cards após uma tabela e não suporta diagnóstico, sessão ao vivo, comandos, incidentes ou histórico.

**Decisão:** o detalhe será uma vertical slice própria. Ele preservará o contexto visual do SEMS+, mas organizará conteúdo por necessidade operacional:

- identidade, planta, conector e frescor da telemetria;
- estado técnico versus disponibilidade comercial;
- sessão atual e fila relacionada;
- potência, energia e restrição de demanda;
- incidentes e diagnóstico;
- comandos disponíveis e trilha de auditoria;
- histórico de sessões e manutenção.

### 8. IA e recomendações parecem cenográficas

O assistente apresenta textos fixos e previsões sem fonte, confiança ou fallback. Isso aumenta a sensação de protótipo artificial.

**Decisão:** recomendações começam determinísticas, com regra, evidência, impacto e próxima ação. IA externa só entra após baseline, observabilidade e governança; nunca autoexecuta comandos.

## Avaliação contra o plano M0–M9

| Marco | Situação observada | Decisão |
| --- | --- | --- |
| M0 — fundação | árvore, fixtures e serviço de estado consolidados; contratos reais ainda dependem da API | preservar uma única arquitetura e substituir mocks por repositories sem reabrir a fronteira PWA |
| M1 — shell/RBAC | sete superfícies SEMS+ preservadas, navegação contextual ChargeGrid, escopo em URL e capability map tipado | conectar capacidades a autorização de ação/API; tema claro e papéis adicionais permanecem pendentes |
| M2 — planta/onboarding | portfólio, detalhe somente leitura e wizard de vínculo implementados sobre catálogo GoodWe mockado | homologar provider/SSO reais e mover publicação/autorização para a API |
| M3 — carregadores/sessões | vertical funcional local: inventário, detalhe, telemetria, sessão/timeline e comandos auditáveis | homologar provider GoodWe real e mover autorização para a API sem perder idempotência/frescor |
| M4 — fila | fluxo local funcional com FIFO, compatibilidade, janela de chamada, admissão e no-show | integrar eventos originados na PWA e notificações reais sem transformar chamada em reserva |
| M5 — energia | snapshot tipado, frescor, limiares, bloqueio de início e recomendação determinística implementados localmente | homologar granularidade/latência GoodWe e método de atribuição por origem |
| M6 — financeiro | tarifa versionada, cálculo em centavos, estados de pagamento, reembolso e conciliação implementados no sandbox local | homologar split, fiscalidade, custo energético e lifecycle Stripe real |
| M7 — incidentes/recomendações | inbox e detalhe com correlação/deduplicação, responsável, resolução, timeline e recomendação determinística explicável | integrar sinais/providers reais, notificações e SLA sem transformar o Admin em help desk técnico |
| M8 — acesso/relatórios | papéis e escopos aplicados na navegação, rota e domínio; concessão/revogação auditável; relatórios assíncronos com CSV sanitizado, download, falha, retentativa e assinatura | migrar enforcement para API/RLS e conectar armazenamento e entrega agendada reais |
| M9 — validação | hardening local concluído com matriz dos quatro papéis, teclado, 390/1280/1440 px, correção de overflow e E2E crítico focado | repetir regressão visual integral somente após o próximo redesenho de telas e fluxos |

O estado atual deve ser tratado como **fundação M0 consolidada e verticais M1–M9 funcionais e endurecidas sobre providers locais**, ainda sem autorização backend/RLS. A administração e as exportações do M8 são completas no sandbox, não equivalem a provisionamento de identidade, armazenamento ou entrega agendada reais. O M9 fecha a qualidade proporcional desta versão; a regressão visual integral foi conscientemente adiada porque o produto seguirá para um redesenho amplo.

## Fundação corrigida nesta etapa

- Admin e Driver PWA separados também no roteamento, estado, testes e CSS;
- uma única árvore Admin executável;
- organização em `app`, `domain`, `fixtures`, `features`, `components`, `layouts` e `services`;
- estado local atrás de um repository substituível;
- escopo GoodWe explícito e persistido na URL;
- sidebar reduzida de dezesseis/doze itens para as sete superfícies principais do SEMS+;
- navegação contextual dentro de cada domínio e títulos que explicam o propósito da seção;
- capability map tipado separando portfólio GoodWe e autosserviço do estabelecimento;
- lateral expandida com rótulos em desktop e recolhida apenas em viewports menores;
- rolagem reiniciada na mudança de rota/escopo;
- métricas de cliente derivadas da fonte de dados;
- sessão de fixture vinculada a carregador existente;
- energia agregada por escopo e fila calculada pelo domínio compartilhado;
- mapa migrado do `google.maps.Marker` depreciado para overlays nativos sem dependência de Map ID público;
- documentação atualizada para refletir implementação iniciada.

## Ordem da reconstrução funcional

1. **M1 hardening:** aplicar o capability map também a ações e respostas da API quando os endpoints entrarem; não criar controles locais fictícios.
2. **M2 concluído no mock:** portfólio, detalhe, pré-condições, rascunho retomável e publicação derivada da planta GoodWe; integração real permanece pendente.
3. **M3 concluído no mock:** carregadores, telemetria fresca, start/stop com motivo, idempotência, confirmação assíncrona e sessões/timeline.
4. **M4 concluído no mock:** fila por estabelecimento, FIFO, compatibilidade, chamada sem reserva, comparecimento e no-show auditáveis.
5. **M5 concluído no mock:** snapshot fresco, política por estabelecimento, bloqueio fail-closed, atribuição calculável e recomendação explicada.
6. **M6 concluído no sandbox local:** tarifa versionada, ociosidade, pagamento, reembolso idempotente, participação parametrizada e conciliação.
7. **M7 concluído no mock:** correlação e deduplicação de sinais, inbox, atribuição, resolução e recomendações determinísticas sem autoexecução.
8. **M8 concluído no sandbox:** acesso por papel/escopo, revogação, auditoria, tarefas de relatório, CSV sanitizado, download, retentativa e assinatura.
9. **M9 concluído no escopo vigente:** implementações paralelas removidas, contratos derivados da fonte canônica, responsividade corrigida, matriz de papéis/viewports e regressão crítica focal validadas. A suíte visual integral deve ser recriada após o próximo redesenho, evitando manter snapshots descartáveis.

Cada etapa nasce em `feature/admin-*`, retorna por PR para `develop/admin-web` e só segue para `main` após validação e aprovação humana.

## Critério para começar o redesenho

O próximo trabalho visual deve partir deste documento e responder a uma vertical slice, não a uma aba isolada. Nenhuma tela é aceita apenas por parecer com o SEMS+: ela precisa demonstrar contexto, estado, evidência, ação, retorno e permissão.
