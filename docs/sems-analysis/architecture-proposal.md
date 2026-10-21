# Proposta de arquitetura — experiência SEMS+ com ChargeGrid incorporado

**Status:** proposta adotada e refinada pelas decisões de produto de 23/08/2026. Consultar `docs/admin-dashboard/PRODUCT_DECISIONS.md` e `docs/admin-dashboard/CRITICAL_REVIEW.md` antes de novas telas.

**Classificação:** `INFERRED`, confiança alta para fronteiras e estratégia; média para integração/SSO GoodWe, que depende de homologação.

## Comparação de estratégias

| Estratégia | Velocidade | Fidelidade | Manutenção | Risco | Uso indicado |
| --- | --- | --- | --- | --- | --- |
| página por página | média | baixa no início | baixa | duplica padrões e chega tarde aos fluxos | evitar como estratégia principal |
| design system primeiro | baixa | média | alta depois | congela tokens com evidência incompleta | usar apenas uma fundação mínima |
| shell primeiro | alta | alta para integração | média | pode produzir casca sem domínio | adotar como primeiro incremento visual |
| implementação por entidades | média | média | alta | jornadas podem ficar fragmentadas | usar na organização interna do domínio |
| implementação por fluxos | alta | alta | média | componentes podem duplicar | usar para critérios de aceite |
| vertical slices | alta | alta | alta | exige contratos mínimos estáveis | adotar como unidade principal de entrega |
| mock-first | alta | alta para estados | média | mock pode divergir da integração | adotar atrás dos mesmos contratos dos adapters |
| combinação híbrida | alta | alta | alta | requer disciplina de escopo | **estratégia escolhida** |

## Estratégia escolhida

```text
contratos e tokens mínimos
→ shell SEMS+ e RBAC
→ vertical slices por jornada
→ mocks substituíveis por adapters
→ validação visual e funcional contínua
```

A combinação une shell-first, contratos mínimos, vertical slices orientados a fluxo e mock-first substituível. Entidades organizam o código, mas cada milestone termina em uma jornada utilizável. O design system cresce a partir dos padrões confirmados, sem tentar clonar todas as páginas do SEMS+.

## Arquitetura de experiência

```text
Experiência SEMS+ reconstruída e preservada
├── contexto: organização, planta, papel, tema e notificações
├── páginas técnicas: painel, plantas, dispositivos, alarmes, relatórios, análise e serviço
└── camada ChargeGrid por planta contratada
    ├── cards, badges, filtros e abas contextuais
    ├── ativação e perfil/publicação comercial
    ├── sessões e fila
    ├── tarifa e financeiro
    ├── incidentes comerciais
    └── carteira, qualidade e expansão GoodWe
```

O ChargeGrid não aparece como outro produto administrativo e não substitui o shell quando habilitado. O ponto de entrada preferencial é contextual; páginas próprias existem apenas para jornadas sem equivalente coerente. Plantas sem contrato preservam a experiência SEMS+ normal.

## Stack do novo projeto

Preservar a stack vigente, salvo incompatibilidade registrada na implementação:

- TypeScript;
- React + Vite, desktop-first;
- React Router;
- Node.js LTS + Express para a ChargeGrid API;
- REST + JSON;
- Supabase/PostgreSQL/Auth/RLS para dados comerciais e identidade;
- polling de 3–5 s por padrão; Realtime apenas com benefício comprovado;
- Stripe em sandbox atrás de Payment Adapter;
- GoodWe atrás de `GoodWeProvider`, começando com mock contratual;
- FastAPI somente para inferência de IA quando necessário;
- Vitest, Supertest e Playwright.

Não introduzir Redux, GraphQL, microserviços, fila distribuída ou ORM dedicado sem necessidade demonstrada.

## Rotas propostas

Rotas são internas do projeto e não tentam reproduzir identificadores/query strings proprietários. Rotas `/chargegrid/*` representam jornadas próprias dentro do mesmo shell, não um Dashboard paralelo; entradas contextuais preservam `plantId` e voltam à entidade SEMS+ correspondente.

| Rota | Função | Escopo |
| --- | --- | --- |
| `/` | dashboard por papel | todos os administrativos |
| `/plants` | portfólio e mapa sanitizado | conforme plantas autorizadas |
| `/plants/:plantId` | detalhe técnico/comercial e tabs | contexto da planta |
| `/chargegrid` | visão geral da operação comercial local | proprietário comercial com capacidade operacional |
| `/chargegrid/onboarding` | vincular planta GoodWe existente | estabelecimento autorizado; ativação contratual é governada pela organização |
| `/chargegrid/chargers` | inventário comercial de EV | usuários com capacidade comercial e escopo explícito |
| `/chargegrid/chargers/:chargerId` | detalhe técnico/comercial, sessão e histórico | todos por capacidade |
| `/chargegrid/sessions` | sessões ao vivo e histórico | estabelecimento; GoodWe somente em leitura agregada quando autorizado |
| `/chargegrid/sessions/:sessionId` | timeline operacional/financeira | por escopo |
| `/chargegrid/queue` | contexto operacional da fila | estabelecimento com capacidade de operação local |
| `/chargegrid/energy` | energia, demanda e sustentabilidade | por planta/portfólio |
| `/chargegrid/finance` | tarifa, receita, pagamentos e liquidação | estabelecimento autorizado; GoodWe somente agregado quando explicitamente permitido |
| `/chargegrid/incidents` | inbox e tratamento | operação/admins |
| `/chargegrid/recommendations` | previsões e recomendações | admins autorizados |
| `/chargegrid/reports` | relatórios, exportações e tarefas | admins autorizados |
| `/settings/access` | usuários, papéis e plantas do módulo | admins |

Quando o usuário entra a partir de uma planta, o módulo preserva `plantId` como contexto de navegação, não como permissão. A API valida escopo independentemente da rota.

## Componentes e design tokens

### Fundação de shell

- `AppShell`, `Sidebar`, `Topbar`, `AccountPopover`, `ScopeSelector`, `Breadcrumbs`;
- `PageHeader`, `ContextTabs`, `FilterBar`, `PeriodSelector`;
- `DataTable`, `StatusBadge`, `KpiCard`, `ChartPanel`, `MapPanel`;
- `EmptyState`, `ErrorState`, `Skeleton`, `PermissionBoundary`;
- `Modal`, `Drawer`, `ConfirmDialog`, `Wizard`, `TaskCenter`.

### Componentes ChargeGrid

- `TechnicalCommercialStatus`;
- `SessionTimeline`, `QueuePanel`, `DemandBanner`;
- `TariffEditor`, `FinancialBreakdown`;
- `IncidentInbox`, `CommandAuditTrail`;
- `RecommendationCard` com confiança e fallback.

Tokens devem ser semânticos (`canvas`, `surface`, `text`, `border`, `status`, `brand`) e oferecer claro/escuro. Componentes administrativos permanecem densos; componentes da PWA não são importados nem modificados.

## Entidades e contratos

Reutilizar os contratos vigentes e manter IDs internos separados dos IDs externos:

- identidade: `UserProfile`, organização, papel e plantas autorizadas;
- ativação: `CommercialContract`, `ActivationCase`, `ActivationInvite`, `PlantCommercialLink` e `CommercialPlantMembership`;
- oferta: `Establishment`, `Plant`, `Charger` e projeções resumidas;
- energia: `PlantEnergySnapshot`, `PlantEnergyStatus`;
- operação: `CommercialSession`, `QueueEntry`, `IdlePolicy`, `Incident`;
- financeiro: `Payment`, `TariffPolicy`, `TariffSegment`;
- gestão: KPIs, `GoodWeCommand`, resultado e `PredictionSummary`.

Enums são identificadores estáveis. A interface suporta valor desconhecido com fallback seguro e nunca persiste label traduzida como fonte de verdade.

## Estado, dados mockados e serviços

Separar quatro tipos de estado:

1. estado de URL: rota, planta, filtros, período e tab;
2. estado remoto: consultas, cache, frescor, polling e erros;
3. estado local: modal aberto, seleção e rascunho de formulário;
4. estado de domínio: produzido pela API, não reconstruído no browser.

Fixtures devem cobrir papel + tema + cenário e usar contratos reais:

- rede vazia/populada;
- planta normal/alerta/crítica;
- carregador disponível, ocupado, manutenção, falha e offline;
- sessão em cada estado principal e exceções;
- fila vazia/populada/chamada expirada;
- pagamento autorizado, falho, pendente e disputado;
- incidente e recomendação com/sem dados suficientes.

Interfaces de serviço propostas:

- `AuthService` e `ScopeService`;
- `ContractProvider` para projeção idempotente do sistema comercial/contratual;
- `GoodWeProvider` (`MockGoodWeProvider` → `OpenApiGoodWeProvider`);
- `ChargeGridApiClient`;
- `PaymentProvider`;
- `PredictionProvider` com fallback determinístico;
- `ReportService` assíncrono.

Mock e integração usam os mesmos DTOs e estados. Nenhum mock pode atribuir à GoodWe um campo que o contrato classifica como ChargeGrid, pagamento ou derivado.

## Autenticação e RBAC

- identidade autenticada resolve tipo de conta SEMS+, organização, status, plantas técnicas e memberships comerciais independentes;
- backend aplica autorização por recurso e capacidade; esconder botão não é segurança;
- Supabase RLS protege leituras diretas que forem deliberadamente expostas;
- gestor/consultor GoodWe recebe carteira, região, parceiro ou plantas atribuídas;
- Central GoodWe recebe agregados estratégicos autorizados; visão nacional não é padrão;
- `ESTABLISHMENT_ADMIN` configura própria organização/plantas;
- `ESTABLISHMENT_OPERATOR` executa rotina sem tarifa, comissão, usuários ou políticas globais;
- técnico/instalador mantém capacidades SEMS+ e não recebe acesso comercial automaticamente;
- compartilhamento SEMS+ nunca implica membership ChargeGrid;
- comandos exigem capacidade explícita, motivo, idempotência, correlação e auditoria;
- motorista/visitante não acessam a aplicação administrativa.

O modelo SEMS+ de papel + propriedade/compartilhamento + nível monitoramento/controle permanece íntegro no plano técnico. O plano comercial adiciona contrato e membership por planta, sem herança automática entre os dois.

## Estrutura de pastas proposta

```text
sems-chargegrid/
├── apps/
│   ├── sems-admin/
│   │   └── src/
│   │       ├── app/            # shell, rotas, providers e temas
│   │       ├── features/       # plants, chargers, sessions, queue, energy...
│   │       ├── components/     # padrões administrativos compartilhados
│   │       ├── services/       # clientes e adapters de frontend
│   │       ├── fixtures/       # cenários por papel/estado
│   │       └── styles/         # tokens e temas
│   └── api/
│       └── src/                # auth, plants, chargers, sessions, payments...
├── packages/
│   └── shared/                 # DTOs, enums e validação compartilhada
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── tests/
│   ├── e2e/
│   └── visual/
└── docs/
```

Este é um novo projeto futuro. Não é autorização para mover ou modificar as aplicações existentes.

## Estratégia de integração futura

```text
GoodWe Cloud / SEMS+ / OpenAPI
              ↓
        GoodWe Adapter
              ↓
        ChargeGrid Core
          /         \
SEMS+ reconstruído   Driver PWA existente
+ módulo ChargeGrid  (separada e congelada nesta etapa)
```

1. iniciar com fixtures contratuais e clock controlável;
2. homologar leitura GoodWe por capacidade, região e frescor;
3. trocar provider sem alterar o domínio/UI;
4. homologar start/stop assíncronos e confirmação por telemetria;
5. integrar gateway sandbox e conciliação;
6. habilitar IA apenas após baseline determinístico e observabilidade.

## Testes e critérios arquiteturais

- unidade: regras de sessão, fila, ociosidade, demanda, tarifa e permissões;
- integração: API + banco + adapters simulados, incluindo idempotência e falhas;
- contrato: frontend, mock e API compartilham versão/enums;
- E2E: onboarding, sessão, fila, demanda, financeiro e incidente por papel;
- visual: matriz de tema, viewport, papel e estado;
- segurança: isolamento de organização/planta, `FORBIDDEN`, ausência de segredo no browser/log/screenshot.

## Riscos principais

| Risco | Mitigação |
| --- | --- |
| SSO/escopo SEMS+ não homologado | adapter de identidade e contrato explícito; não acoplar UI a sessão proprietária |
| mock divergir da GoodWe | matriz de capacidades e testes de contrato por campo/comando |
| duplicar verdade técnica | armazenar referência/frescor; GoodWe permanece fonte |
| UI declarar comando concluído cedo | estado pendente e confirmação técnica obrigatória |
| financeiro confundido com receita energética | módulos, labels e fontes separados |
| PWA sofrer regressão por compartilhamento excessivo | compartilhar contratos, não componentes/jornadas |
