# Trabalho restante do Dashboard Admin

**Atualizado em:** 27 de agosto de 2026  
**Documento de origem:** [`NEXT_EXECUTION_PLAN.md`](NEXT_EXECUTION_PLAN.md)  
**Base avaliada:** conteúdo das PRs #11 → #15, consolidado para `develop/admin-web` pela PR #16  
**Objetivo:** separar o que já está demonstrável no frontend, o que ainda precisa de validação e o que depende de backend ou integração produtiva.

## Resumo executivo

A fundação compartilhada (F0) está concluída e a experiência principal do proprietário comercial (F1) está em estágio avançado. Painel agregado, listas de usinas e dispositivos e a entrada operacional ChargeGrid já foram implementados. A operação local inclui carrossel de vagas, indicadores, alarmes, gráfico, sessões, fila automática, detalhe do carregador, detalhe da sessão e detalhe do pagamento.

O próximo trabalho não é reconstruir novamente essas superfícies. A prioridade é fechar as lacunas restantes do proprietário comercial, validar integralmente as personas sem operação comercial e só então concluir consultor, Central, delegações e acabamento visual.

```text
fechar F1 do proprietário comercial
→ validar F4 e F5 como regressão da camada aditiva
→ concluir F2 do consultor
→ concluir F3 da Central
→ aplicar F6 de delegações e restrições
→ executar F7 de acabamento e regressão integral
```

## Estado por fase

| Fase | Estado em 27/08/2026 | O que já existe | O que falta para o gate |
| --- | --- | --- | --- |
| F0 — Fundação compartilhada | Concluída | personas, escopos, capacidades, navegação contextual, filtros reais e separação SEMS+/ChargeGrid | apenas regressão contínua |
| F1 — Proprietário comercial | Avançada, gate ainda aberto | Painel, listas, detalhe de carregador, Operação ChargeGrid, Sessões, Fila, Financeiro, detalhes de sessão e pagamento | fechar detalhe de planta, superfícies organizacionais restantes, alarmes/recomendações/relatórios/serviço e jornada completa contrato→financeiro |
| F2 — Consultor GoodWe | Fundação disponível | persona, carteira explícita, navegação e agregados básicos | completar jornada contrato→ativação→qualidade→oportunidade e validar ausência de operação local |
| F3 — Central GoodWe | Fundação disponível | persona, escopo amplo, governança e acesso básicos | filtros de rede, drill-down de exceções, gestão em volume e validação de diferenças em relação ao consultor |
| F4 — Instalador sem ChargeGrid | Parcial | conta demonstrativa e ocultação comercial | validar as sete superfícies técnicas e seus estados principais ponta a ponta |
| F5 — Proprietário SEMS+ comum | Parcial | conta demonstrativa e ausência da entrada ChargeGrid | validar as sete superfícies, criação/listagem técnica e estados vazios |
| F6 — Delegações | Pendente por decisão de sequência | papéis e capacidades de domínio já existem | aplicar as experiências prontas a operador, financeiro/relatórios, navegador e suporte sem redesenhar as telas principais |
| F7 — Finalização visual | Pendente | direção visual SEMS+ consolidada nas telas trabalhadas | login, responsividade ampla, design system final, referências restantes, matriz visual e E2E integral antes de `main` |

## O que já está concluído

### Fundação e navegação

- cinco personas principais com distinção entre tipo de conta, função organizacional, vínculo ChargeGrid, papel, escopo e capacidade;
- entrada `ChargeGrid` somente para proprietário com operação comercial própria;
- sete superfícies SEMS+ preservadas para instalador e proprietário comum;
- contexto de estabelecimento e recurso preservado em URL e breadcrumb;
- estado ativo correto nas abas de Sessões e Resumo financeiro ao abrir seus detalhes;
- proteção contra acesso direto a carregador fora do escopo.

### Painel e inventários

- Painel agregado com mapa, Economia e Monitoramento de energia/comercial;
- lista de usinas alinhada à referência SEMS+, com pesquisa e filtros funcionais;
- lista de dispositivos alinhada à referência, agrupamento por usina, filtros e ações corretas;
- detalhe reconstruído somente para carregadores, conforme a decisão de produto.

### Operação ChargeGrid

- carrossel de vagas e veículos com estados operacionais e seleção de carregador;
- escala visual alinhada ao Painel para carros, indicadores, tipografia, cards e gráfico;
- alarmes/atenção antes da performance comercial;
- remoção dos blocos redundantes `Sessões recentes` e `Fila atual` do dashboard operacional;
- fila automática e somente leitura, sem ações manuais de chamar, admitir ou registrar no-show;
- controles de contingência limitados a `Liberar recarga` e `Parar recarga`;
- detalhe de sessão com progresso, energia, contexto, pagamento e linha do tempo auditável;
- detalhe de pagamento com autorização, captura, liquidação, composição, referências, conciliação, reembolso e histórico;
- navegação bidirecional entre sessão, pagamento e resumo financeiro.

### Evidência já executada

- lint raiz aprovado;
- build do workspace Admin aprovado;
- 20 arquivos e 76 testes unitários aprovados;
- 13 E2E focais de fila, carregador, sessões e financeiro aprovados na rodada operacional;
- 5 E2E focais de financeiro e sessões aprovados após o redesenho do pagamento;
- inspeção visual com Playwright em `1440 × 1000` para Operação, Fila, carregador, sessão e pagamento;
- CI de lint, testes e build aprovado nos PRs da cadeia; regressão E2E integral continua deliberadamente fora do workflow automático atual.

## Pendências imediatas para fechar F1

### 1. Detalhe de planta

Reconstruir e validar o detalhe da planta com referências SEMS+ adicionais. A tela deve:

- manter a leitura técnica como núcleo;
- exibir estado ChargeGrid somente na planta contratada;
- manter plantas não comerciais sem conteúdo comercial residual;
- ligar prontidão, contrato, ativação e carregadores sem criar uma central operacional duplicada.

**Gate:** planta comercial e planta comum funcionam na mesma conta sem mistura de responsabilidades.

### 2. Gestão da organização do proprietário

Revisar a experiência completa de:

- informações da organização;
- contratos e ativações;
- política tarifária;
- delegações locais apresentadas, ainda sem aprofundar toda a F6;
- auditoria associada às alterações.

**Gate:** a sequência contrato → ativação → configuração → publicação pode ser percorrida sem rota órfã nem dado redigitado indevidamente.

### 3. Alarmes e recomendações

- revisar inbox e detalhe de alarmes no padrão visual atual;
- garantir pesquisa, filtros e estados vazios/erro;
- reformular recomendações com causa, evidência, impacto, confiança e ação real;
- evitar qualquer alegação de IA ou automação que os dados não sustentem.

**Gate:** uma falha técnica relevante pode ser entendida e encaminhada sem misturar operação local com suporte GoodWe.

### 4. Relatórios e Centro de serviço

- confirmar tipos de relatório, geração, tarefa, download e histórico;
- decidir se assinatura por e-mail entra nesta versão ou permanece deferida;
- manter o Centro de serviço reconhecível como SEMS+;
- não inventar documentos comerciais ou fluxos internos GoodWe sem referência.

**Gate:** todos os links visíveis possuem destino funcional e estados representados.

### 5. Jornada consolidada do proprietário

Executar uma bateria única cobrindo:

```text
contrato
→ ativação
→ configuração/publicação do carregador
→ operação automática
→ sessão
→ pagamento/conciliação/reembolso
→ alarme e relatório relacionados
```

Esta bateria encerra o Gate F1. Não é necessário criar baseline visual antes da aprovação explícita das últimas superfícies.

## Trabalho após F1

### F4 e F5 — regressão da natureza aditiva

Validar primeiro instalador sem ChargeGrid e proprietário comum. Essa ordem antecipa vazamentos de autorização antes de ampliar as jornadas GoodWe.

- percorrer Painel, Usinas, Dispositivos, Alarmes, Relatórios, Análises e Serviço;
- verificar ausência de contrato, tarifa, fila, sessão, pagamento e inteligência comercial;
- representar estados populado, vazio, bloqueado e erro relevantes;
- confirmar que nenhuma mudança de F1 converte automaticamente plantas comuns.

### F2 — consultor GoodWe

- consolidar Painel de carteira e Lista de usinas no escopo concedido;
- completar contrato, ativação, pendência, qualidade comercial e oportunidade;
- mostrar recomendações com evidência e decisão comercial real;
- impedir usuários/funções globais, operação local, fila, sessões, comandos e financeiro detalhado;
- decidir a utilidade de uma entrada ChargeGrid GoodWe somente depois das superfícies atuais estarem completas.

### F3 — Central GoodWe

- derivar a tela do consultor, sem criar um produto paralelo;
- adicionar filtros por região, carteira, parceiro e consultor;
- permitir drill-down de exceções a partir de agregados de rede;
- revisar gestão de usuários, funções, carteiras e auditoria para grande volume;
- manter toda diferença visível explicável por função, responsabilidade, escopo ou capacidade.

### F6 — delegações e restrições

Aplicar remoção de capacidades sobre experiências já aprovadas:

- operador local: monitoramento, sessões e contingência, sem governança financeira;
- analista/financeiro: leitura financeira, relatórios e conciliação conforme capacidade, sem comandos operacionais;
- navegador profissional: leitura organizacional limitada;
- técnico/suporte: telemetria, alarmes, diagnóstico e serviço, sem dados comerciais sensíveis.

## F7 — acabamento e integração

- alinhar login à referência SEMS+;
- revisar tipografia, densidade, ícones, alinhamento, tema escuro e responsividade;
- remover componentes legados que deixarem de ter consumidores;
- concluir o design system a partir das superfícies aprovadas;
- obter as referências visuais ainda bloqueantes;
- criar matriz visual e snapshots somente após aprovação explícita;
- executar lint, unitários, build e E2E integral do Admin;
- revisar e integrar a PR consolidada #16 em `develop/admin-web`;
- abrir PR de integração de `develop/admin-web` para `main` apenas após decisão humana.

## Fora do escopo imediato

Estes itens continuam pendentes para produção, mas não bloqueiam o fechamento visual do frontend:

- autenticação e provisionamento produtivos;
- autorização backend, RLS e políticas de API;
- CRM, ERP e sistema contratual GoodWe;
- emissão, expiração, revogação e resgate seguro de código no servidor;
- telemetria, comandos, notificações, relatórios e pagamentos produtivos;
- armazenamento real de relatórios;
- homologação final das capacidades OpenAPI/HCA G2 no Brasil;
- observabilidade, performance com volume real e estratégia de rollout.

## Ordem recomendada de branches

1. `feature/admin-plant-detail-reference`
2. `feature/admin-owner-governance`
3. `feature/admin-alerts-recommendations`
4. `feature/admin-reports-service`
5. `test/admin-owner-commercial-journey`
6. `test/admin-sems-personas`
7. `feature/admin-consultant-journey`
8. `feature/admin-central-governance`
9. `feature/admin-delegated-roles`
10. `chore/admin-visual-finalization`

Cada branch deve partir da linha integrada mais recente, preservar o Driver PWA e usar validação proporcional durante o desenvolvimento. A regressão completa é obrigatória antes da integração em `main`.
