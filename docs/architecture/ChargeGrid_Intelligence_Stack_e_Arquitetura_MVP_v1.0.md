**GOODWE \| CHARGEGRID INTELLIGENCE**

Stack e Arquitetura  
de Software MVP

ChargeGrid Intelligence v1.0

**Baseline técnica para o Spec-Driven Development**

> **Atualização de implementação — 21/08/2026:** leia primeiro `docs/CURRENT_STATE.md`. A Driver PWA, Google Maps real, Supabase Auth e Stripe em modo teste foram implementados depois desta baseline. Esses incrementos prevalecem sobre referências abaixo a pagamento mock, gateway futuro, tema mobile escuro ou PWA apenas demonstrativa.

**Objetivo:** congelar uma arquitetura simples, colaborativa e suficiente para demonstrar o produto de ponta a ponta, sem introduzir complexidade de produção que não agrega valor ao MVP.

| **Status**         | BASELINE MVP COM EMENDAS EM `docs/CURRENT_STATE.md`        |
|--------------------|------------------------------------------------------------|
| **Versão**         | 1.0                                                        |
| **Data**           | 19 de agosto de 2026                                       |
| **Base funcional** | Documento Final de Produto ChargeGrid Intelligence v1.0    |
| **Design visual**  | Identidade GoodWe; Design System documentado separadamente |

# 1. Controle do documento

| **Campo**             | **Definição**                                                                                                                                |
|-----------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| Finalidade            | Definir a stack, a arquitetura e as fronteiras de implementação do ChargeGrid MVP.                                                           |
| Público               | Equipe de desenvolvimento, responsável pela IA, arquitetura, design e stakeholders técnicos.                                                 |
| Relação com o produto | Complementa o Documento Final de Produto v1.0; não altera suas decisões funcionais.                                                          |
| Uso                   | Fonte de verdade técnica para iniciar as specs e organizar o desenvolvimento paralelo.                                                       |
| Regra de mudança      | Mudanças que afetem somente implementação podem ocorrer no SDD; mudanças de fronteira ou stack congelada exigem decisão explícita da equipe. |

## 1.1 Decisões executivas congeladas

- Monorepo único, com dois frontends independentes e uma API única.
- Admin Web e Driver PWA são aplicações React separadas para permitir trabalho paralelo e UXs independentes.
- Supabase é o BaaS principal: PostgreSQL, Auth, Row Level Security e Realtime opcional.
- ChargeGrid API é um backend Node.js + TypeScript + Express, responsável por todas as regras críticas de negócio.
- GoodWe usa adapter com mock substituível; pagamentos usam Stripe PaymentIntents real em modo teste dentro da API.
- A IA é um serviço externo em Python/FastAPI e nunca bloqueia a operação principal.
- Polling simples é o padrão para atualizações; Realtime só entra quando reduzir complexidade de forma clara.
- Nenhum microserviço, Redis, fila distribuída, Kubernetes, Kafka ou arquitetura event-driven é necessário na v1 do MVP.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Princípio central</strong></p>
<p>Arquitetura simples por fora e organizada por dentro: separar responsabilidades suficientes para o time trabalhar em paralelo, sem transformar o MVP em um exercício de infraestrutura.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 2. Princípios arquiteturais

| **Princípio**                      | **Aplicação no MVP**                                                                                      |
|------------------------------------|-----------------------------------------------------------------------------------------------------------|
| Simplicidade primeiro              | Toda tecnologia precisa justificar redução de trabalho ou aumento direto da qualidade da demonstração.    |
| Uma fonte de dados                 | Um único projeto Supabase é compartilhado por Admin, PWA e API.                                           |
| Uma regra crítica, um lugar        | Sessão, pagamento, tarifa, fila, ociosidade, demanda e comandos ficam na ChargeGrid API.                  |
| Frontends independentes            | Admin Web e Driver PWA podem evoluir e ser publicados separadamente.                                      |
| Adapters apenas onde importam      | GoodWe, pagamento e IA são fronteiras externas explícitas; o restante não precisa de camadas artificiais. |
| Mock substituível                  | A simulação GoodWe usa o mesmo contrato interno esperado de uma integração futura.                        |
| Fallback determinístico            | Falha da IA ou de recursos opcionais não impede a operação central.                                       |
| Evolução sem compromisso prematuro | Tecnologias mais robustas só entram quando surgir necessidade concreta.                                   |

## 2.1 O que esta arquitetura otimiza

- Tempo de entrega até as etapas classificatórias.
- Capacidade de quatro desenvolvedores trabalharem simultaneamente com poucos conflitos de Git.
- Demonstração de jornadas completas e regras de produto reais.
- Facilidade de depuração durante apresentação presencial.
- Possibilidade de trocar mocks por integrações reais sem reescrever a lógica comercial.

## 2.2 O que ela não tenta resolver

- Escala de milhões de sessões ou múltiplas regiões de produção.
- Alta disponibilidade distribuída e failover multi-cloud.
- Observabilidade corporativa completa.
- Mensageria distribuída, processamento massivo ou isolamento por microserviço.
- Conformidade produtiva completa de pagamentos, fiscalidade ou operação CPO.

# 3. Visão geral da arquitetura

**Arquitetura oficial do MVP:** dois frontends React independentes, uma API monolítica simples, um único Supabase e integrações externas desacopladas por adapters.


Figura 1 - Arquitetura de software congelada para o ChargeGrid MVP.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th>Admin Web ───────┐<br />
├── REST ──&gt; ChargeGrid API ──&gt; Supabase<br />
Driver PWA ────────┘ │<br />
├── MockGoodWeProvider / futura OpenAPI<br />
├── StripePaymentProvider / modo teste<br />
└── AI API (Python/FastAPI)</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## 3.1 Unidade de deploy

- Admin Web: build/deploy independente.
- Driver PWA: build/deploy independente.
- ChargeGrid API: um único processo Node.js.
- Supabase: serviço gerenciado único.
- AI API: serviço separado, mantido pelo responsável pelo modelo.

# 4. Stack tecnológica congelada

| **Camada**          | **Tecnologia**                     | **Decisão**                                                              |
|---------------------|------------------------------------|--------------------------------------------------------------------------|
| Linguagem principal | TypeScript                         | Compartilhada por frontends e backend.                                   |
| Admin Web           | React + Vite                       | SPA desktop-first para GoodWe e estabelecimento.                         |
| Driver PWA          | React + Vite                       | Aplicação mobile-first com suporte PWA e QR.                             |
| Roteamento          | React Router                       | Rotas independentes em cada frontend.                                    |
| Backend             | Node.js LTS + Express + TypeScript | API REST simples; evita estrutura adicional de frameworks mais pesados.  |
| BaaS / banco        | Supabase + PostgreSQL              | Banco relacional gerenciado, Auth, RLS e recursos opcionais de Realtime. |
| Acesso Supabase     | @supabase/supabase-js              | SDK comum para browser e servidor conforme responsabilidade.             |
| API                 | REST + JSON                        | Contrato explícito e simples entre frontends e backend.                  |
| Atualizações        | Polling 3-5 s como padrão          | Realtime do Supabase somente quando houver ganho claro.                  |
| IA                  | Python + FastAPI                   | Inferência exposta via HTTP; treinamento fica fora do core.              |
| Testes TS           | Vitest + Supertest                 | Unidade e integração da API/frontends.                                   |
| E2E                 | Playwright                         | Quatro jornadas de produto como cenários principais.                     |
| Workspace           | npm workspaces                     | Monorepo sem ferramenta adicional de gerenciamento.                      |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Versões</strong></p>
<p>A arquitetura congela tecnologias e responsabilidades, não números exatos de versão. As specs devem usar versões estáveis/LTS compatíveis no momento da implementação e registrar qualquer incompatibilidade relevante.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## 4.1 Tecnologias deliberadamente não adotadas

- Prisma/ORM dedicado no baseline; Supabase/PostgreSQL e migrations são suficientes.
- Redux global por padrão.
- WebSocket/SSE obrigatórios.
- Redis/BullMQ.
- GraphQL.
- Microserviços.

# 5. Estrutura do monorepo

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th>chargegrid/<br />
├── apps/<br />
│ ├── admin-web/<br />
│ ├── driver-pwa/<br />
│ └── api/<br />
├── packages/<br />
│ └── shared/<br />
├── supabase/<br />
│ ├── migrations/<br />
│ └── seed.sql<br />
├── docs/<br />
│ ├── product/<br />
│ ├── architecture/<br />
│ ├── specs/<br />
│ └── design-system/<br />
├── package.json<br />
└── README.md</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## 5.1 packages/shared

O único pacote compartilhado inicial deve conter somente contratos que realmente precisam ser iguais entre aplicações:

- Enums de estado: SessionStatus, PaymentStatus, ChargerStatus, QueueStatus e UserRole.
- Tipos/DTOs públicos usados pela API e pelos frontends.
- Constantes de domínio não sensíveis e utilitários de formatação.
- Cliente HTTP comum, caso simplifique os dois frontends.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Evitar overengineering</strong></p>
<p>Não criar um design system técnico, biblioteca de domínio completa ou múltiplos packages antes de existir repetição real. Componentes visuais de Admin e PWA ficam em seus próprios apps.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## 5.2 Design System

A identidade visual parte do SEMS+/GoodWe. O Admin mantém a linguagem grafite homologada; a Driver PWA usa tema claro e predominância branca por padrão, com escuro opcional. Ambos compartilham marca, tokens semânticos e assets, mas mantêm componentes e densidades próprios.

# 6. Frontends

## 6.1 Admin Web

- Uma única aplicação administrativa com visões condicionadas por papel.
- GOODWE_ADMIN: visão agregada de plantas, utilização, comissão, incidentes e expansão.
- ESTABLISHMENT_ADMIN / OPERATOR: operação da própria planta, sessões, tarifa, fila, pagamentos, demanda e relatórios.
- Desktop-first, tabelas, gráficos e configurações; não precisa funcionar como PWA.

## 6.2 Driver PWA

- Aplicação separada, mobile-first, acessível por URL/QR sem instalação obrigatória.
- Jornada visitante e jornada cadastrada convivem no mesmo app.
- Google Maps real, fila, sessão, limite financeiro, Stripe sandbox, notificações e histórico.
- PWA pode utilizar manifest/service worker para instalação opcional; detalhes ficam na spec da aplicação.

## 6.3 O que os dois frontends compartilham

| **Compartilhar**              | **Não compartilhar por padrão**                       |
|-------------------------------|-------------------------------------------------------|
| Tipos, DTOs e enums           | Layouts                                               |
| Cliente de API                | Componentes específicos                               |
| Configuração Supabase         | Navegação                                             |
| Tokens visuais GoodWe básicos | Telas e estados de UX                                 |
| Utilitários de formatação     | Design system completo em código antes da necessidade |

# 7. ChargeGrid API

**Escolha congelada:** Node.js + TypeScript + Express. O backend é um monólito simples organizado por módulos de negócio, não por camadas arquiteturais profundas.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th>apps/api/src/<br />
├── auth/<br />
├── plants/<br />
├── chargers/<br />
├── sessions/<br />
├── payments/<br />
├── pricing/<br />
├── queue/<br />
├── idleness/<br />
├── demand/<br />
├── reports/<br />
├── goodwe/<br />
├── ai/<br />
├── shared/<br />
└── server.ts</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## 7.1 Padrão interno de módulo

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th>sessions/<br />
├── session.routes.ts<br />
├── session.service.ts<br />
├── session.repository.ts # somente se necessário<br />
├── session.rules.ts<br />
└── session.types.ts</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

- routes: contrato HTTP e validação superficial.
- service: regra de negócio e coordenação do caso de uso.
- repository: somente quando a consulta ao banco justificar uma abstração reutilizável.
- rules: funções determinísticas importantes e testáveis.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Regra de simplicidade</strong></p>
<p>Não criar Controller + UseCase + DomainService + Repository + Mapper + DTO para toda operação. A organização existe para tornar o código legível, não para satisfazer um padrão arquitetural.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 8. Supabase: dados, autenticação e segurança

## 8.1 Responsabilidades

- PostgreSQL como fonte persistente dos dados comerciais ChargeGrid.
- Supabase Auth para login e identidade de motoristas e usuários administrativos.
- Row Level Security para leituras diretas permitidas aos frontends.
- Realtime disponível, mas não obrigatório.
- Migrations e seed versionados no repositório.

## 8.2 Regra de acesso a dados

| **Tipo de operação**      | **Caminho padrão**                               | **Exemplos**                                                                                                |
|---------------------------|--------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| Leitura simples e segura  | Frontend -\> Supabase com RLS                    | perfil próprio, veículos próprios, estabelecimentos públicos, histórico próprio quando a policy for simples |
| Leitura agregada/complexa | Frontend -\> ChargeGrid API -\> Supabase         | KPIs GoodWe, dashboard financeiro, relatórios, recomendações                                                |
| Operação crítica          | Frontend -\> ChargeGrid API -\> Supabase/Adapter | iniciar/parar sessão, alterar tarifa, entrar em fluxo de pagamento, liquidar sessão, controle de demanda    |
| Integração externa        | ChargeGrid API -\> Provider externo              | GoodWe, gateway de pagamento, IA                                                                            |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Segredo obrigatório</strong></p>
<p>A chave service_role do Supabase nunca é exposta nos frontends. O browser usa apenas credenciais públicas e policies RLS. A API valida o JWT Supabase e reaplica autorização no servidor para operações críticas.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 9. Autenticação, papéis e modelo de dados

## 9.1 Auth e papéis

- Supabase Auth é a fonte remota de identidade. O fallback local da PWA existe somente para desenvolvimento sem credenciais.
- profiles.id referencia auth.users.id.
- Papéis de negócio: GOODWE_ADMIN, ESTABLISHMENT_ADMIN, ESTABLISHMENT_OPERATOR e DRIVER.
- Visitante pode usar identidade anônima/temporária ou token de sessão conforme a spec da PWA.
- Integrador não possui aplicação própria no ChargeGrid v1.

## 9.2 Entidades persistentes mínimas

| **Entidade**                   | **Função principal**                                                       |
|--------------------------------|----------------------------------------------------------------------------|
| profiles                       | Perfil e papel do usuário.                                                 |
| establishments                 | Dados comerciais do estabelecimento.                                       |
| plants                         | Vínculo entre planta GoodWe e perfil comercial ChargeGrid.                 |
| chargers                       | Equipamentos vinculados, identificador GoodWe e disponibilidade comercial. |
| sessions                       | Máquina de estados da sessão comercial.                                    |
| session_events                 | Auditoria cronológica de mudanças importantes.                             |
| payments                       | Garantia, captura, devolução, pendência e disputa.                         |
| tariff_rules / tariff_segments | Configuração e segmentos tarifários efetivamente aplicados.                |
| queue_entries                  | Fila por estabelecimento e prioridade.                                     |
| notifications                  | Avisos relevantes e estado de leitura/entrega.                             |
| plant_settings                 | Parâmetros comerciais/energéticos configuráveis por planta.                |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Modelo de dados</strong></p>
<p>O esquema físico final, chaves, índices, constraints e policies são decisões das specs. Esta lista congela apenas os domínios que precisam existir.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 10. Integrações e adapters

## 10.1 GoodWe Adapter

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th>GoodWeProvider<br />
├── MockGoodWeProvider # MVP<br />
└── OpenApiGoodWeProvider # futuro, mediante credenciais/validação</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

- O mock fica dentro da ChargeGrid API; não é um microserviço separado.
- O provider expõe somente capacidades necessárias ao domínio, como leitura de telemetria, StartCharge, StopCharge e consulta de resultado.
- Payloads externos são traduzidos no adapter e não vazam para as regras comerciais.

## 10.2 Payment Adapter

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th>PaymentProvider<br />
├── StripePaymentProvider # ativo em modo teste<br />
└── MockPaymentProvider # testes unitários/isolados</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

- O MVP chama a Stripe em modo teste para autorização, captura, Pix, devolução e webhook assinado.
- Live é bloqueado até homologação financeira, fiscal e operacional.
- Regras comerciais de limite, settlement e comissão continuam no ChargeGrid, não no provider.

## 10.3 AI API

- Serviço separado em Python/FastAPI, mantido pelo responsável pelo treinamento.
- Integração via HTTP simples; o backend define timeout e fallback.
- A indisponibilidade da IA nunca bloqueia fila, sessão, pagamento ou controle determinístico.
- Contrato de inferência será definido em spec própria, sem acoplar o core ao framework/modelo usado no treinamento.

# 11. Atualização de dados e comportamento de demonstração

## 11.1 Padrão de atualização

- Polling entre 3 e 5 segundos para sessão, telemetria, fila e estados de comando durante o MVP.
- Supabase Realtime pode substituir polling em uma feature quando isso reduzir código ou melhorar claramente a experiência.
- Não haverá WebSocket próprio, SSE próprio ou Redis Pub/Sub na baseline.

## 11.2 Simulação GoodWe

- Estados e valores seguem a lógica definida no Documento Final de Produto e a referência da GoodWe OpenAPI.
- Comandos podem permanecer PENDING por alguns segundos antes de SUCCESS/FAILED para representar a natureza assíncrona.
- Telemetria deve manter coerência entre potência, energia acumulada, duração e estado do carregador.
- Falhas, offline, falta de permissão e perda de comunicação podem ser ativadas como cenários de demonstração.

## 11.3 Auditoria suficiente para o MVP

Em vez de infraestrutura de observabilidade avançada, eventos importantes devem ser gravados em session_events e logs estruturados da API. Isso permite explicar durante a apresentação por que uma sessão iniciou, parou, falhou ou foi liquidada.

# 12. Trabalho em equipe e divisão de responsabilidade

| **Responsável principal** | **Área**        | **Entregas**                                                                                          |
|---------------------------|-----------------|-------------------------------------------------------------------------------------------------------|
| Dev 1                     | Admin Web       | GoodWe, estabelecimento, dashboards, configurações e relatórios.                                      |
| Dev 2                     | Driver PWA      | QR, mapa, fila, sessão, Stripe sandbox, histórico e UX mobile.                                        |
| Dev 3                     | Core API        | Sessões, estados, fila, ociosidade, autorização, regras e persistência central.                       |
| Dev 4                     | Integrações/API | GoodWe mock/adapter, pagamento, tarifação, demanda, relatórios e integração com IA.                   |
| Responsável IA            | AI API          | Dataset, treinamento, avaliação, artefato do modelo e endpoint de inferência combinado com o backend. |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Ownership não é silo</strong></p>
<p>Cada integrante possui uma área principal para reduzir conflitos, mas as specs, contratos compartilhados e revisão de pull requests pertencem ao time. Nenhum app deve depender de conhecimento exclusivo de uma pessoa.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## 12.1 Estratégia mínima de testes

- Vitest: regras puras de tarifa, fila, ociosidade, prioridade e máquina de estados.
- Supertest: endpoints críticos da ChargeGrid API.
- Playwright: quatro jornadas de conclusão do Documento Final de Produto.
- Mocks controláveis para cenários normal, alerta, crítico, falha e pagamento pendente.

# 13. Decisões explicitamente descartadas para o MVP

| **Tecnologia/padrão**             | **Status**    | **Motivo**                                                                     |
|-----------------------------------|---------------|--------------------------------------------------------------------------------|
| Microserviços                     | FORA          | Equipe pequena; mais deploys, contratos e depuração sem ganho na demonstração. |
| Redis / BullMQ                    | FORA          | Banco e lógica simples são suficientes para retries e estados simulados.       |
| Kafka / RabbitMQ / NATS           | FORA          | Não há volume/eventos que justifiquem broker.                                  |
| Kubernetes                        | FORA          | Não existe necessidade de orquestração distribuída.                            |
| WebSocket/SSE próprio             | FORA          | Polling cobre a experiência; Realtime Supabase é opcional.                     |
| Prisma/ORM dedicado               | FORA baseline | Supabase/PostgreSQL e migrations reduzem uma camada.                           |
| GraphQL                           | FORA          | REST atende contratos e debugging com menor custo.                             |
| DDD/Clean Architecture purista    | FORA          | Usar organização pragmática por domínio e adapters externos.                   |
| Event sourcing/CQRS               | FORA          | session_events fornece auditoria suficiente.                                   |
| Aplicação própria para integrador | FORA          | Decisão funcional do produto v1.0.                                             |

# 14. O que está congelado e o que o SDD ainda pode decidir

| **Congelado nesta baseline**              | **Pode ser detalhado nas specs**                           |
|-------------------------------------------|------------------------------------------------------------|
| Dois frontends: Admin Web + Driver PWA    | Estrutura exata de páginas/componentes.                    |
| Uma ChargeGrid API Node/TS/Express        | Middlewares, biblioteca de validação e padrão de erros.    |
| Um projeto Supabase com Postgres/Auth/RLS | Schema físico, índices, constraints e policies.            |
| REST como contrato principal              | Rotas, DTOs, paginação e códigos HTTP.                     |
| Polling como baseline                     | Intervalo específico por tela; adoção pontual de Realtime. |
| GoodWe Adapter com mock no MVP            | Interface exata, payload interno e cenários do simulador.  |
| Stripe Payment Adapter em modo teste      | Live, conciliação persistida e idempotência produtiva.      |
| AI externa em Python/FastAPI              | Endpoints, features, modelo, timeout e fallback preciso.   |
| Monorepo npm workspaces                   | Scripts, lint, CI e convenções de branch.                  |
| Identidade visual GoodWe                  | Design System detalhado em documento separado.             |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Regra para reabrir arquitetura</strong></p>
<p>Uma decisão do SDD pode adicionar uma biblioteca ou detalhe técnico sem reabrir este documento. Porém, separar serviços, trocar Supabase, unificar os frontends ou mover regras críticas para o browser são mudanças arquiteturais e exigem revisão explícita.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 15. Critérios para iniciar a implementação

A arquitetura é considerada pronta para o Spec-Driven Development quando os pontos abaixo estiverem disponíveis no repositório:

1.  Monorepo criado com apps/admin-web, apps/driver-pwa, apps/api e packages/shared.
2.  Projeto Supabase criado e variáveis de ambiente padronizadas em .env.example.
3.  Papéis básicos definidos no banco/Auth e regra de validação do JWT na API.
4.  Primeira migration com entidades essenciais ou esqueleto suficiente para a primeira feature.
5.  GoodWeProvider e MockGoodWeProvider definidos, mesmo que com poucos métodos iniciais.
6.  Contrato mínimo de comunicação com a AI API acordado ou um stub disponível.
7.  Design System SEMS+/GoodWe v2 e documentos de consistência visual mantidos em `docs/design-system/`.
8.  Primeira spec funcional escolhida para implementação vertical.

## Adendo de implementação aprovado — 20 de agosto de 2026

O Admin Web adota a composição visual e os assets SEMS+ autorizados pelo projeto como referência final. A migração preserva a arquitetura congelada: os componentes são portados para `apps/admin-web` em React + TypeScript; não se incorpora o aplicativo JavaScript independente, suas fixtures isoladas nem regras críticas no navegador.

Os tokens portáveis vivem em `packages/shared`; componentes permanecem nos apps. A Driver PWA reutiliza a identidade, sem copiar sidebar, topbar, tabelas ou densidade do Admin. Assets estáticos podem ser distribuídos por app conforme a necessidade da feature, preservando arquivo e mapeamento tipado.

O Admin Web inclui um módulo de mapa operacional com Google Maps JavaScript API. A chave é lida exclusivamente de `VITE_GOOGLE_MAPS_API_KEY`; a variável é pública por natureza do navegador, deve ter restrições configuradas no Google Cloud e nunca é versionada. A ausência ou falha do SDK mantém um fallback de demonstração, sem bloquear o restante do Admin.

O mapa recebe projeções da API/`packages/shared`, agrupadas pelo escopo da conta autenticada. Não há uma arquitetura especial para redes: uma conta pode receber uma ou muitas plantas SEMS+ vinculadas. Dados técnicos continuam na fronteira `GoodWeProvider`; os campos comerciais são produzidos pelo ChargeGrid Core.

# Apêndice A. Registro de decisões arquiteturais

| **ID** | **Decisão**                                                                   | **Status** |
|--------|-------------------------------------------------------------------------------|------------|
| A01    | Monorepo único com npm workspaces.                                            | CONGELADO  |
| A02    | Admin Web e Driver PWA em apps React/Vite separados.                          | CONGELADO  |
| A03    | Backend único Node.js + TypeScript + Express.                                 | CONGELADO  |
| A04    | Supabase único como PostgreSQL + Auth + RLS; Realtime opcional.               | CONGELADO  |
| A05    | Regras críticas passam pela ChargeGrid API.                                   | CONGELADO  |
| A06    | Leituras simples podem ir direto ao Supabase quando RLS for trivial e segura. | CONGELADO  |
| A07    | GoodWe mock dentro da API atrás de GoodWeProvider.                            | CONGELADO  |
| A08    | Pagamento atrás de PaymentProvider; mock no MVP.                              | CONGELADO  |
| A09    | IA como serviço externo Python/FastAPI com fallback.                          | CONGELADO  |
| A10    | Polling 3-5 s como padrão; Realtime pontual.                                  | CONGELADO  |
| A11    | Sem Redis, filas distribuídas, microserviços ou Kubernetes.                   | CONGELADO  |
| A12    | Design System GoodWe documentado separadamente.                               | CONGELADO  |
| A13    | Admin Web usa Google Maps por chave local/restrita e fallback sem SDK.         | APROVADO   |
| A14    | Conta de estabelecimento opera sobre uma ou várias plantas vinculadas.         | APROVADO   |

# Apêndice B. Relação com o Documento Final de Produto

Esta arquitetura implementa a baseline funcional definida no Documento Final de Produto ChargeGrid Intelligence v1.0. Em caso de conflito, a regra é:

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th>Produto define O QUE o ChargeGrid deve fazer.<br />
Este documento define ONDE e COM QUAIS TECNOLOGIAS o MVP será construído.<br />
As specs definem COMO cada feature será implementada e testada.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>
