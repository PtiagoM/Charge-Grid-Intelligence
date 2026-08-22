// @ts-nocheck
import { assets } from '../constants/assets.js';
import { establishmentMetrics, goodweMetrics } from '../state/metrics.js';
import {
  AUTH_PROFILES,
  getAccountsByEstablishment,
  getCurrentAccount,
  getCurrentUser,
  getDocumentsByAccount,
  getEstablishmentsByClient,
  getSupportTicketsByAccount
} from '../state/store.js';
import { badge, kpiCard, sectionHeader, simpleTable } from '../ui/components.js';
import { formatDateTime, formatMoney, formatNumber } from '../ui/format.js';

const emptyState = (title, body, action = '') => `
  <div class="enterprise-empty">
    <span class="enterprise-empty-icon">+</span>
    <h3>${title}</h3><p>${body}</p>${action}
  </div>`;

const statusPill = (value, variant = '') => `<span class="enterprise-status ${variant || String(value).toLowerCase().replace(/\s+/g, '-')}">${value}</span>`;

const breadcrumbs = (items) => `<nav class="enterprise-breadcrumb" aria-label="Navegacao estrutural">${items.map((item, index) => item.href ? `<a href="${item.href}">${item.label}</a>${index < items.length - 1 ? '<span>/</span>' : ''}` : `<strong>${item.label}</strong>`).join('')}</nav>`;

function clientSummary(state, client) {
  const establishments = getEstablishmentsByClient(state, client.id);
  const establishmentIds = new Set(establishments.map((item) => item.id));
  const locations = state.locations.filter((item) => establishmentIds.has(item.establishmentId));
  const chargers = state.chargers.filter((item) => establishmentIds.has(item.establishmentId));
  const activeSessions = state.sessions.filter((item) => establishmentIds.has(item.establishmentId) && item.status === 'active');
  const revenue = state.financeLedger.filter((item) => establishmentIds.has(item.establishmentId)).reduce((sum, item) => sum + Number(item.grossAmount || 0), 0);
  const openTickets = state.supportTickets.filter((item) => item.clientId === client.id && !['Resolvido', 'Fechado'].includes(item.status));
  return { establishments, locations, chargers, activeSessions, revenue, openTickets };
}

export function clientsPage(state) {
  const rows = state.clients.map((client) => {
    const summary = clientSummary(state, client);
    return `
      <article class="enterprise-client-card">
        <img src="${client.image || assets.plant}" alt="${client.name}" />
        <div class="enterprise-client-main">
          <div class="enterprise-card-title"><div><span>${client.tier}</span><h3>${client.name}</h3><p>${client.corporateName}</p></div>${statusPill(client.status)}</div>
          <div class="enterprise-client-metrics"><span><strong>${summary.establishments.length}</strong> estabelecimentos</span><span><strong>${summary.locations.length}</strong> pontos</span><span><strong>${summary.chargers.length}</strong> carregadores</span><span><strong>${summary.openTickets.length}</strong> chamados</span></div>
          <div class="enterprise-card-footer"><span>Responsavel GoodWe: ${client.owner}</span><span>Health ${client.healthScore}/100</span><a class="ghost-button" href="#/mvp/client?client=${client.id}">Abrir cliente</a></div>
        </div>
      </article>`;
  }).join('');

  return `
    ${breadcrumbs([{ label: 'GoodWe' }, { label: 'Clientes' }])}
    <section class="surface panel enterprise-page">
      ${sectionHeader({ title: 'Clientes comerciais', subtitle: 'Relacionamento, contratos, operacao e oportunidades em uma unica pasta.', action: '<a class="sems-primary-action" href="#/mvp/new-client">Cadastrar cliente</a>' })}
      <div class="kpi-grid four-cols">${kpiCard({ label: 'Clientes ativos', value: state.clients.filter((item) => item.status === 'Ativo').length, help: 'carteira atual' })}${kpiCard({ label: 'Em onboarding', value: state.clients.filter((item) => item.lifecycle === 'Onboarding').length, help: 'implantacao comercial' })}${kpiCard({ label: 'Health medio', value: `${Math.round(state.clients.reduce((sum, item) => sum + item.healthScore, 0) / Math.max(1, state.clients.length))}/100`, help: 'saude da carteira', accent: 'good' })}${kpiCard({ label: 'Oportunidades', value: state.expansionOpportunities.length, help: 'expansao identificada', accent: 'warn' })}</div>
      <form class="enterprise-search-row" data-form="enterprise-search"><label><span>Buscar cliente</span><input name="enterpriseSearch" placeholder="Nome, documento ou responsavel" /></label><label><span>Ciclo</span><select><option>Todos</option><option>Onboarding</option><option>Operacao</option><option>Expansao</option></select></label><button type="submit">Aplicar filtros</button></form>
      <div class="enterprise-client-list">${rows || emptyState('Nenhum cliente cadastrado', 'Cadastre a primeira organizacao comercial para iniciar o ciclo GoodWe.', '<a class="sems-primary-action" href="#/mvp/new-client">Cadastrar cliente</a>')}</div>
    </section>`;
}

export function newClientPage() {
  return `
    ${breadcrumbs([{ label: 'Clientes', href: '#/mvp/clients' }, { label: 'Novo cliente' }])}
    <section class="surface panel enterprise-page enterprise-form-page">
      ${sectionHeader({ title: 'Cadastrar cliente comercial', subtitle: 'O cliente e a organizacao que pode reunir varios estabelecimentos, contratos e pontos.' })}
      <form class="entity-form enterprise-step-form" data-form="create-client">
        <fieldset><legend><b>01</b> Identidade empresarial</legend><div class="form-section-grid"><label>Nome comercial<input name="name" required /></label><label>Razao social<input name="corporateName" required /></label><label>Documento / CNPJ<input name="document" required /></label><label>Segmento<select name="segment"><option>Shopping e varejo</option><option>Estacionamentos</option><option>Corporativo</option><option>Energia e mobilidade</option></select></label><label>Categoria<select name="tier"><option>Enterprise</option><option>Strategic</option><option>Growth</option></select></label><label>Fase<select name="lifecycle"><option>Onboarding</option><option>Operacao</option><option>Expansao</option></select></label></div></fieldset>
        <fieldset><legend><b>02</b> Relacionamento GoodWe</legend><div class="form-section-grid"><label>Responsavel GoodWe<input name="owner" required /></label><label>Status<select name="status"><option>Ativo</option><option>Prospect</option><option>Suspenso</option></select></label><label>Cidade<input name="city" /></label><label>Estado<input name="state" /></label><label class="form-span">Imagem principal (URL)<input name="image" /></label></div></fieldset>
        <fieldset><legend><b>03</b> Contato principal</legend><div class="form-section-grid"><label>Nome<input name="contactName" required /></label><label>Cargo<input name="contactRole" /></label><label>Email<input name="contactEmail" type="email" required /></label><label>Telefone<input name="contactPhone" /></label></div></fieldset>
        <fieldset><legend><b>04</b> Governanca</legend><div class="form-section-grid"><label class="form-span">Observacoes internas<textarea name="notes" rows="3"></textarea></label><label class="form-span">Motivo do cadastro<input name="reason" value="Novo relacionamento comercial" required /></label></div></fieldset>
        <div class="form-actions"><a class="ghost-button" href="#/mvp/clients">Cancelar</a><button type="submit">Criar cliente e abrir pasta</button></div>
      </form>
    </section>`;
}

export function clientDetailPage(state, route) {
  const client = state.clients.find((item) => item.id === route.query.client) ?? state.clients[0];
  if (!client) return emptyState('Cliente nao encontrado', 'O registro solicitado nao existe ou foi removido.');
  const summary = clientSummary(state, client);
  const contacts = state.contacts.filter((item) => item.clientId === client.id);
  const contracts = state.contracts.filter((item) => item.clientId === client.id);
  const installations = state.installations.filter((item) => item.clientId === client.id);
  const opportunities = state.expansionOpportunities.filter((item) => item.clientId === client.id);
  const docs = state.documents.filter((item) => item.clientId === client.id);

  return `
    ${breadcrumbs([{ label: 'Clientes', href: '#/mvp/clients' }, { label: client.name }])}
    <section class="enterprise-hero surface">
      <img src="${client.image || assets.plant}" alt="${client.name}" />
      <div><span class="eyebrow">${client.tier} · ${client.lifecycle}</span><h2>${client.name}</h2><p>${client.corporateName} · ${client.document}</p><div class="enterprise-hero-meta">${statusPill(client.status)}<span>Responsavel ${client.owner}</span><span>${client.city}/${client.state}</span><span>Health ${client.healthScore}/100</span></div></div>
      <details class="enterprise-edit"><summary>Editar cliente</summary><form data-form="update-client"><input type="hidden" name="clientId" value="${client.id}" /><label>Nome<input name="name" value="${client.name}" /></label><label>Fase<select name="lifecycle"><option ${client.lifecycle === 'Operacao' ? 'selected' : ''}>Operacao</option><option ${client.lifecycle === 'Onboarding' ? 'selected' : ''}>Onboarding</option><option ${client.lifecycle === 'Expansao' ? 'selected' : ''}>Expansao</option></select></label><label>Status<select name="status"><option>Ativo</option><option>Suspenso</option></select></label><label>Motivo<input name="reason" required /></label><button type="submit">Salvar alteracoes</button></form></details>
    </section>
    <nav class="enterprise-anchor-tabs"><a href="#client-summary">Resumo</a><a href="#client-establishments">Estabelecimentos</a><a href="#client-contracts">Contratos</a><a href="#client-contacts">Contatos</a><a href="#client-installations">Implantacoes</a><a href="#client-history">Historico</a></nav>
    <section id="client-summary" class="surface panel">${sectionHeader({ title: 'Resumo executivo', subtitle: 'Leitura consolidada do relacionamento e da operacao.' })}<div class="kpi-grid four-cols">${kpiCard({ label: 'Estabelecimentos', value: summary.establishments.length, help: 'unidades de negocio' })}${kpiCard({ label: 'Pontos', value: summary.locations.length, help: 'locais fisicos' })}${kpiCard({ label: 'Carregadores', value: summary.chargers.length, help: `${summary.activeSessions.length} sessoes ativas` })}${kpiCard({ label: 'Receita movimentada', value: formatMoney(summary.revenue), help: 'registros financeiros', accent: 'good' })}</div><div class="decision-strip"><div><span>Proxima melhor acao</span><strong>${opportunities[0]?.title || 'Acompanhar desempenho do cliente'}</strong><p>${opportunities[0]?.recommendation || 'Nenhuma acao critica no momento.'}</p></div><a class="ghost-button" href="#/mvp/expansion">Abrir oportunidade</a></div></section>
    <section id="client-establishments" class="surface panel">${sectionHeader({ title: 'Estabelecimentos', subtitle: 'Unidades de negocio vinculadas ao cliente.', action: `<a class="sems-primary-action" href="#/mvp/new-establishment?client=${client.id}">Novo estabelecimento</a>` })}<div class="enterprise-unit-grid">${summary.establishments.map((item) => { const metrics = establishmentMetrics(state, item.id); return `<article><img src="${item.folderImage || assets.plant}" alt="${item.name}" /><div><h3>${item.name}</h3><p>${item.city}/${item.state}</p><span>${metrics.locations.length} pontos · ${metrics.chargers.length} carregadores</span><a href="#/mvp/establishment?est=${item.id}" class="ghost-button">Abrir unidade</a></div></article>`; }).join('') || emptyState('Sem estabelecimentos', 'Crie a primeira unidade operacional deste cliente.')}</div></section>
    <section id="client-contracts" class="surface panel">${sectionHeader({ title: 'Contratos', subtitle: 'Condicoes comerciais e vigencias deste relacionamento.', action: '<a class="ghost-button" href="#/mvp/contracts">Central de contratos</a>' })}${simpleTable({ columns: ['Contrato', 'Modelo', 'Vigencia', 'Renovacao', 'Status', 'Acao'], rows: contracts.map((item) => [`<strong>${item.code || item.id}</strong><span>${item.name || 'Contrato ChargeGrid'}</span>`, item.model, item.startDate, item.renewalDate, statusPill(item.status), `<a href="#/mvp/contract?contract=${item.id}">Abrir</a>`]) })}</section>
    <section id="client-contacts" class="surface panel">${sectionHeader({ title: 'Contatos', subtitle: 'Pessoas responsaveis pela relacao comercial e operacional.' })}${simpleTable({ columns: ['Nome', 'Cargo', 'Email', 'Telefone', 'Tipo'], rows: contacts.map((item) => [item.name, item.role, item.email, item.phone || '--', item.primary ? 'Principal' : 'Contato']) })}</section>
    <section id="client-installations" class="surface panel">${sectionHeader({ title: 'Implantacoes', subtitle: 'Projetos de entrega e comissionamento.' })}<div class="enterprise-progress-list">${installations.map((item) => `<a href="#/mvp/installation?installation=${item.id}"><div><strong>${item.code}</strong><span>${item.owner}</span></div><div class="progress-track"><i style="width:${item.progress}%"></i></div><b>${item.progress}%</b>${statusPill(item.status)}</a>`).join('') || '<p>Nenhuma implantacao vinculada.</p>'}</div></section>
    <section id="client-history" class="surface panel">${sectionHeader({ title: 'Documentos e historico', subtitle: 'Registros reutilizados em todo o ciclo de atendimento.' })}${simpleTable({ columns: ['Documento', 'Tipo', 'Versao', 'Status', 'Atualizacao'], rows: docs.map((item) => [item.name, item.type, item.version, item.status, formatDateTime(item.updatedAt)]) })}</section>`;
}

export function contractsPage(state, scopedEstablishmentId = null) {
  const contracts = scopedEstablishmentId ? state.contracts.filter((item) => item.establishmentId === scopedEstablishmentId) : state.contracts;
  const isGoodwe = getCurrentAccount(state)?.profile === AUTH_PROFILES.GOODWE;
  return `
    ${breadcrumbs([{ label: isGoodwe ? 'GoodWe' : 'Business' }, { label: 'Contratos' }])}
    <section class="surface panel enterprise-page">${sectionHeader({ title: isGoodwe ? 'Contratos comerciais' : 'Meu contrato', subtitle: isGoodwe ? 'Modelos, vigencias, tarifas e obrigacoes da carteira.' : 'Condicoes comerciais vigentes para sua operacao.', action: isGoodwe ? '<button class="sems-primary-action" data-action="toggle-enterprise-form" data-target="contract-create">Novo contrato</button>' : '' })}
      ${isGoodwe ? `<details id="contract-create" class="admin-details"><summary>Novo contrato</summary><form class="entity-form" data-form="create-contract"><div class="form-section-grid"><label>Cliente<select name="clientId">${state.clients.map((item) => `<option value="${item.id}">${item.name}</option>`).join('')}</select></label><label>Estabelecimento<select name="establishmentId"><option value="">Contrato corporativo</option>${state.establishments.map((item) => `<option value="${item.id}">${item.name}</option>`).join('')}</select></label><label>Nome<input name="name" required /></label><label>Modelo<select name="model"><option>Hibrido</option><option>Licenciamento</option><option>Revenue share</option><option>Por carregador</option></select></label><label>Inicio<input name="startDate" type="date" required /></label><label>Renovacao<input name="renewalDate" type="date" required /></label><label>Mensalidade<input name="monthlyFee" type="number" step="0.01" /></label><label>Por carregador<input name="perActiveCharger" type="number" step="0.01" /></label><label>Por sessao<input name="perSession" type="number" step="0.01" /></label><label>Revenue share (%)<input name="revenueSharePercent" type="number" step="0.01" /></label><label>SLA (horas)<input name="slaHours" type="number" value="8" /></label><label>Prazo pagamento (dias)<input name="paymentTermsDays" type="number" value="15" /></label><label class="form-span">Motivo<input name="reason" value="Formalizacao comercial" required /></label></div><div class="form-actions"><button type="submit">Criar contrato</button></div></form></details>` : ''}
      <div class="contract-grid">${contracts.map((contract) => { const client = state.clients.find((item) => item.id === contract.clientId); return `<article class="contract-card"><header><div><span>${contract.code || contract.id}</span><h3>${contract.name || 'Contrato ChargeGrid'}</h3><p>${client?.name || 'Cliente vinculado'}</p></div>${statusPill(contract.status)}</header><dl><div><dt>Modelo</dt><dd>${contract.model}</dd></div><div><dt>Renovacao</dt><dd>${contract.renewalDate}</dd></div><div><dt>SLA</dt><dd>${contract.slaHours || 8} horas</dd></div><div><dt>Participacao</dt><dd>${contract.revenueSharePercent || 0}%</dd></div></dl><a class="ghost-button" href="#/mvp/contract?contract=${contract.id}">Ver condicoes</a></article>`; }).join('') || emptyState('Nenhum contrato disponivel', 'Nao existem contratos vinculados a este escopo.')}</div>
    </section>`;
}

export function contractDetailPage(state, route) {
  const account = getCurrentAccount(state);
  const allowed = account?.profile === AUTH_PROFILES.GOODWE ? state.contracts : state.contracts.filter((item) => item.establishmentId === account?.establishmentId);
  const contract = allowed.find((item) => item.id === route.query.contract) ?? allowed[0];
  if (!contract) return emptyState('Contrato indisponivel', 'Nao existe contrato visivel para este perfil.');
  const client = state.clients.find((item) => item.id === contract.clientId);
  return `${breadcrumbs([{ label: 'Contratos', href: '#/mvp/contracts' }, { label: contract.code || contract.id }])}<section class="surface panel enterprise-page">${sectionHeader({ title: contract.name || 'Contrato ChargeGrid', subtitle: `${contract.code || contract.id} · ${client?.name || 'Relacionamento comercial'}` })}<div class="contract-detail-banner"><div><span>Vigencia</span><strong>${contract.startDate} a ${contract.renewalDate}</strong></div><div><span>Modelo</span><strong>${contract.model}</strong></div><div><span>Ciclo</span><strong>${contract.billingCycle || 'Mensal'}</strong></div><div><span>Status</span>${statusPill(contract.status)}</div></div><div class="enterprise-detail-columns"><section><h3>Condicoes financeiras</h3><dl class="enterprise-definition"><div><dt>Mensalidade</dt><dd>${formatMoney(contract.monthlyFee || 0)}</dd></div><div><dt>Por carregador ativo</dt><dd>${formatMoney(contract.perActiveCharger || 0)}</dd></div><div><dt>Por sessao</dt><dd>${formatMoney(contract.perSession || 0)}</dd></div><div><dt>Revenue share</dt><dd>${contract.revenueSharePercent || 0}%</dd></div><div><dt>Prazo de pagamento</dt><dd>${contract.paymentTermsDays || 15} dias</dd></div></dl></section><section><h3>Servico e governanca</h3><dl class="enterprise-definition"><div><dt>SLA de atendimento</dt><dd>${contract.slaHours || 8} horas</dd></div><div><dt>Renovacao</dt><dd>${contract.renewalDate}</dd></div><div><dt>Escopo</dt><dd>${contract.establishmentId ? 'Estabelecimento' : 'Corporativo'}</dd></div><div><dt>Observacoes</dt><dd>${contract.notes || 'Sem observacoes adicionais.'}</dd></div></dl></section></div></section>`;
}

export function installationsPage(state) {
  return `${breadcrumbs([{ label: 'GoodWe' }, { label: 'Implantacoes' }])}<section class="surface panel enterprise-page">${sectionHeader({ title: 'Implantacoes', subtitle: 'Da vistoria ao aceite: acompanhe responsabilidade, prazo e bloqueios.', action: '<button class="sems-primary-action" data-action="toggle-enterprise-form" data-target="installation-create">Nova implantacao</button>' })}<details id="installation-create" class="admin-details"><summary>Planejar implantacao</summary><form class="entity-form" data-form="create-installation"><div class="form-section-grid"><label>Estabelecimento<select name="establishmentId">${state.establishments.map((item) => `<option value="${item.id}">${item.name}</option>`).join('')}</select></label><label>Ponto<select name="locationId">${state.locations.map((item) => `<option value="${item.id}">${item.name}</option>`).join('')}</select></label><label>Responsavel<input name="owner" required /></label><label>Inicio planejado<input name="plannedStart" type="date" required /></label><label>Entrega planejada<input name="plannedEnd" type="date" required /></label><label>Motivo<input name="reason" value="Novo ponto contratado" required /></label></div><div class="form-actions"><button type="submit">Criar plano</button></div></form></details><div class="installation-board">${['Planejada', 'Em andamento', 'Em acompanhamento', 'Concluida'].map((status) => `<section><header><h3>${status}</h3><span>${state.installations.filter((item) => item.status === status).length}</span></header>${state.installations.filter((item) => item.status === status).map((item) => { const location = state.locations.find((loc) => loc.id === item.locationId); return `<a class="installation-ticket" href="#/mvp/installation?installation=${item.id}"><span>${item.code}</span><strong>${location?.name || 'Ponto'}</strong><p>${item.owner}</p><div class="progress-track"><i style="width:${item.progress}%"></i></div><small>${item.progress}% · entrega ${item.plannedEnd}</small></a>`; }).join('') || '<p class="board-empty">Nenhum projeto</p>'}</section>`).join('')}</div></section>`;
}

export function installationDetailPage(state, route) {
  const installation = state.installations.find((item) => item.id === route.query.installation) ?? state.installations[0];
  if (!installation) return emptyState('Implantacao nao encontrada', 'Nao existe projeto de implantacao neste escopo.');
  const location = state.locations.find((item) => item.id === installation.locationId);
  const establishment = state.establishments.find((item) => item.id === installation.establishmentId);
  return `${breadcrumbs([{ label: 'Implantacoes', href: '#/mvp/installations' }, { label: installation.code }])}<section class="surface panel enterprise-page">${sectionHeader({ title: installation.code, subtitle: `${establishment?.name} · ${location?.name}` })}<div class="installation-overview"><div><span>Progresso geral</span><strong>${installation.progress}%</strong><div class="progress-track"><i style="width:${installation.progress}%"></i></div></div><dl><div><dt>Status</dt><dd>${installation.status}</dd></div><div><dt>Responsavel</dt><dd>${installation.owner}</dd></div><div><dt>Inicio</dt><dd>${installation.plannedStart}</dd></div><div><dt>Entrega</dt><dd>${installation.plannedEnd}</dd></div></dl></div><div class="installation-checklist">${installation.checklist.map((step, index) => `<article class="${step.done ? 'is-done' : ''}"><span>${String(index + 1).padStart(2, '0')}</span><div><strong>${step.label}</strong><small>${step.done ? 'Etapa concluida e registrada' : 'Aguardando execucao'}</small></div><button type="button" data-action="toggle-installation-step" data-installation-id="${installation.id}" data-step-id="${step.id}">${step.done ? 'Reabrir' : 'Concluir'}</button></article>`).join('')}</div></section>`;
}

export function operationsPage(state, scopedEstablishmentId = null) {
  const chargers = scopedEstablishmentId ? state.chargers.filter((item) => item.establishmentId === scopedEstablishmentId) : state.chargers;
  const sessions = scopedEstablishmentId ? state.sessions.filter((item) => item.establishmentId === scopedEstablishmentId) : state.sessions;
  const incidents = chargers.filter((item) => item.status === 'offline' || item.anomaly);
  const active = sessions.filter((item) => item.status === 'active');
  return `<section class="surface panel enterprise-page">${sectionHeader({ title: 'Centro de operacao', subtitle: 'Sessoes, disponibilidade e excecoes que exigem intervencao.' })}<div class="kpi-grid four-cols">${kpiCard({ label: 'Sessoes ativas', value: active.length, help: 'em tempo real', accent: 'danger' })}${kpiCard({ label: 'Disponibilidade', value: `${Math.round((chargers.filter((item) => item.status !== 'offline').length / Math.max(1, chargers.length)) * 100)}%`, help: 'da infraestrutura', accent: 'good' })}${kpiCard({ label: 'Excecoes', value: incidents.length, help: 'offline ou anomalia', accent: incidents.length ? 'warn' : 'good' })}${kpiCard({ label: 'Energia hoje', value: `${formatNumber(chargers.reduce((sum, item) => sum + item.todayEnergyKwh, 0))} kWh`, help: 'entregue pela rede' })}</div><div class="operations-layout"><section><h3>Operacao ao vivo</h3>${simpleTable({ columns: ['Sessao', 'Motorista', 'Carregador', 'Energia', 'Valor', 'Status'], rows: active.map((item) => [item.id, item.driverName, item.chargerId, `${formatNumber(item.energyKwh)} kWh`, formatMoney(item.consumedAmount), badge(item.status)]) })}</section><aside><h3>Fila de intervencao</h3>${incidents.map((item) => { const location = state.locations.find((loc) => loc.id === item.locationId); return `<a href="#/mvp/charger?charger=${item.id}&est=${item.establishmentId}&loc=${item.locationId}"><div><strong>${item.id}</strong><span>${location?.name || item.locationId}</span></div>${statusPill(item.status === 'offline' ? 'Offline' : 'Anomalia')}</a>`; }).join('') || '<p>Nenhuma intervencao critica.</p>'}</aside></div></section>`;
}

export function financePage(state, scopedEstablishmentId = null) {
  const ledger = scopedEstablishmentId ? state.financeLedger.filter((item) => item.establishmentId === scopedEstablishmentId) : state.financeLedger;
  const sessions = scopedEstablishmentId ? state.sessions.filter((item) => item.establishmentId === scopedEstablishmentId) : state.sessions;
  const gross = ledger.reduce((sum, item) => sum + Number(item.grossAmount || 0), 0);
  const goodwe = ledger.reduce((sum, item) => sum + Number(item.goodweShare || 0), 0);
  return `<section class="surface panel enterprise-page">${sectionHeader({ title: scopedEstablishmentId ? 'Financeiro da operacao' : 'Financeiro da rede', subtitle: 'Receita, pagamentos, repasses e conciliacao vinculados as sessoes.' })}<div class="kpi-grid four-cols">${kpiCard({ label: 'Receita bruta', value: formatMoney(gross), help: 'movimentacao registrada', accent: 'good' })}${kpiCard({ label: 'Receita GoodWe', value: formatMoney(goodwe), help: 'regra contratual' })}${kpiCard({ label: 'Ticket medio', value: formatMoney(gross / Math.max(1, ledger.length)), help: 'por sessao liquidada' })}${kpiCard({ label: 'Pagamentos', value: state.payments.filter((item) => !scopedEstablishmentId || sessions.some((session) => session.id === item.sessionId)).length, help: 'transacoes no escopo' })}</div>${simpleTable({ columns: ['Lancamento', 'Sessao', 'Estabelecimento', 'Bruto', 'GoodWe', 'Status'], rows: ledger.map((item) => [item.id, item.sessionId, state.establishments.find((est) => est.id === item.establishmentId)?.name || item.establishmentId, formatMoney(item.grossAmount), formatMoney(item.goodweShare), statusPill(item.status)]) })}</section>`;
}

export function supportPage(state) {
  const account = getCurrentAccount(state);
  const tickets = getSupportTicketsByAccount(state, account);
  const establishmentId = account?.profile === AUTH_PROFILES.ESTABELECIMENTO ? account.establishmentId : state.establishments[0]?.id;
  const visibleLocations = account?.profile === AUTH_PROFILES.ESTABELECIMENTO ? state.locations.filter((item) => item.establishmentId === account.establishmentId) : state.locations;
  return `<section class="surface panel enterprise-page">${sectionHeader({ title: account?.profile === AUTH_PROFILES.GOODWE ? 'Central de suporte' : 'Suporte GoodWe', subtitle: 'Chamados contextualizados por cliente, ponto e equipamento.', action: '<button class="sems-primary-action" data-action="toggle-enterprise-form" data-target="support-create">Abrir chamado</button>' })}<details id="support-create" class="admin-details"><summary>Novo chamado</summary><form class="entity-form" data-form="create-support-ticket"><div class="form-section-grid"><label>Estabelecimento<select name="establishmentId">${state.establishments.filter((item) => account?.profile === AUTH_PROFILES.GOODWE || item.id === establishmentId).map((item) => `<option value="${item.id}">${item.name}</option>`).join('')}</select></label><label>Ponto<select name="locationId"><option value="">Nao especificado</option>${visibleLocations.map((item) => `<option value="${item.id}">${item.name}</option>`).join('')}</select></label><label>Carregador<select name="chargerId"><option value="">Nao especificado</option>${state.chargers.filter((item) => account?.profile === AUTH_PROFILES.GOODWE || item.establishmentId === establishmentId).map((item) => `<option value="${item.id}">${item.id}</option>`).join('')}</select></label><label>Categoria<select name="category"><option>Operacao</option><option>Conectividade</option><option>Financeiro</option><option>Energia</option><option>Conta e acesso</option></select></label><label>Severidade<select name="severity"><option>Media</option><option>Baixa</option><option>Alta</option><option>Critica</option></select></label><label>Titulo<input name="title" required /></label><label class="form-span">Descricao<textarea name="description" required rows="4"></textarea></label></div><div class="form-actions"><button type="submit">Enviar para triagem</button></div></form></details><div class="support-layout"><aside class="support-summary"><div><span>Abertos</span><strong>${tickets.filter((item) => item.status === 'Aberto').length}</strong></div><div><span>Em atendimento</span><strong>${tickets.filter((item) => item.status === 'Em atendimento').length}</strong></div><div><span>Criticos</span><strong>${tickets.filter((item) => item.severity === 'Critica').length}</strong></div></aside><div class="support-ticket-list">${tickets.map((ticket) => `<a href="#/mvp/ticket?ticket=${ticket.id}"><div class="ticket-severity ${ticket.severity.toLowerCase()}"></div><div><span>${ticket.code} · ${ticket.category}</span><strong>${ticket.title}</strong><p>${state.establishments.find((item) => item.id === ticket.establishmentId)?.name || 'Estabelecimento'} · ${ticket.owner}</p></div><div>${statusPill(ticket.status)}<small>SLA ${formatDateTime(ticket.slaDueAt)}</small></div></a>`).join('') || emptyState('Nenhum chamado', 'A operacao nao possui solicitacoes abertas.')}</div></div></section>`;
}

export function ticketDetailPage(state, route) {
  const account = getCurrentAccount(state);
  const ticket = getSupportTicketsByAccount(state, account).find((item) => item.id === route.query.ticket);
  if (!ticket) return emptyState('Chamado indisponivel', 'Este registro nao existe ou esta fora do escopo da conta.');
  const establishment = state.establishments.find((item) => item.id === ticket.establishmentId);
  const isGoodwe = account?.profile === AUTH_PROFILES.GOODWE;
  return `${breadcrumbs([{ label: 'Suporte', href: '#/mvp/support' }, { label: ticket.code }])}<section class="surface panel enterprise-page">${sectionHeader({ title: ticket.title, subtitle: `${ticket.code} · ${establishment?.name || 'Estabelecimento'}` })}<div class="ticket-detail-head"><div>${statusPill(ticket.severity)}${statusPill(ticket.status)}</div><dl><div><dt>Responsavel</dt><dd>${ticket.owner}</dd></div><div><dt>Solicitante</dt><dd>${ticket.requester}</dd></div><div><dt>Prazo SLA</dt><dd>${formatDateTime(ticket.slaDueAt)}</dd></div><div><dt>Equipamento</dt><dd>${ticket.chargerId || 'Nao especificado'}</dd></div></dl><p>${ticket.description}</p></div><section class="ticket-timeline"><h3>Historico do atendimento</h3><article><i></i><div><strong>Chamado aberto</strong><span>${formatDateTime(ticket.createdAt)} · ${ticket.requester}</span><p>${ticket.description}</p></div></article>${ticket.updates.map((item) => `<article><i></i><div><strong>Atualizacao</strong><span>${formatDateTime(item.at)} · ${item.author}</span><p>${item.message}</p></div></article>`).join('')}</section>${isGoodwe ? `<form class="ticket-update-form" data-form="update-support-ticket"><input type="hidden" name="ticketId" value="${ticket.id}" /><label>Status<select name="status"><option>Aberto</option><option>Em atendimento</option><option>Aguardando cliente</option><option>Resolvido</option><option>Fechado</option></select></label><label>Responsavel<input name="owner" value="${ticket.owner}" /></label><label class="form-span">Atualizacao<textarea name="message" required></textarea></label><label class="form-span">Motivo<input name="reason" value="Tratativa operacional" required /></label><button type="submit">Registrar atualizacao</button></form>` : ''}</section>`;
}

export function auditPage(state) {
  return `<section class="surface panel enterprise-page">${sectionHeader({ title: 'Auditoria e governanca', subtitle: 'Trilha imutavel das alteracoes administrativas, acessos e decisoes.' })}<div class="audit-feed">${state.auditLogs.map((log) => `<article><span class="audit-action">${log.action}</span><div><strong>${log.summary}</strong><p>${log.entityType} · ${log.entityId} · ${log.origin}</p>${log.reason ? `<small>Motivo: ${log.reason}</small>` : ''}</div><div><strong>${log.userName}</strong><span>${log.profile}</span><time>${formatDateTime(log.at)}</time></div></article>`).join('') || emptyState('Sem eventos de auditoria', 'As proximas alteracoes administrativas aparecerao aqui.')}</div></section>`;
}

export function expansionPage(state) {
  return `<section class="surface panel enterprise-page">${sectionHeader({ title: 'Expansao e Customer Success', subtitle: 'Oportunidades priorizadas por evidencia operacional e valor potencial.' })}<div class="expansion-grid">${state.expansionOpportunities.sort((a, b) => b.score - a.score).map((item) => { const client = state.clients.find((entry) => entry.id === item.clientId); const location = state.locations.find((entry) => entry.id === item.locationId); return `<article><header><div><span>${client?.name || 'Cliente'}</span><h3>${item.title}</h3><p>${location?.name || 'Escopo corporativo'}</p></div><strong>${item.score}</strong></header><div class="opportunity-evidence"><span>Evidencia</span><p>${item.evidence}</p></div><div class="opportunity-recommendation"><span>Recomendacao</span><p>${item.recommendation}</p></div><footer>${statusPill(item.status)}<span>Potencial ${formatMoney(item.estimatedMonthlyRevenue)}/mes</span><a href="#/mvp/client?client=${item.clientId}" class="ghost-button">Abrir cliente</a></footer></article>`; }).join('')}</div></section>`;
}

export function documentsPage(state) {
  const docs = getDocumentsByAccount(state);
  return `<section class="surface panel enterprise-page">${sectionHeader({ title: 'Documentos', subtitle: 'Contratos, aceites e registros tecnicos compartilhados com a GoodWe.' })}${simpleTable({ columns: ['Documento', 'Tipo', 'Versao', 'Status', 'Atualizacao'], rows: docs.map((item) => [`<strong>${item.name}</strong>`, item.type, item.version, statusPill(item.status), formatDateTime(item.updatedAt)]) })}</section>`;
}

export function enterpriseSettingsPage(state, scopedEstablishmentId = null) {
  const user = getCurrentUser(state);
  const account = getCurrentAccount(state);
  const accounts = scopedEstablishmentId ? getAccountsByEstablishment(state, scopedEstablishmentId) : state.accounts;
  const notifications = state.notifications.filter((item) => item.profile === account?.profile && (!item.establishmentId || item.establishmentId === scopedEstablishmentId));
  return `<section class="surface panel enterprise-page">${sectionHeader({ title: 'Configuracoes e seguranca', subtitle: 'Conta, permissoes, notificacoes e parametros do ambiente.' })}<div class="settings-enterprise-grid"><section><h3>Conta autenticada</h3><dl class="enterprise-definition"><div><dt>Usuario</dt><dd>${user?.name || '--'}</dd></div><div><dt>Email</dt><dd>${account?.email || '--'}</dd></div><div><dt>Perfil</dt><dd>${account?.profile || '--'}</dd></div><div><dt>Escopo</dt><dd>${scopedEstablishmentId || 'Rede GoodWe'}</dd></div></dl></section><section><h3>Contas no escopo</h3><p><strong>${accounts.length}</strong> contas configuradas</p><p>As permissoes sao verificadas no estado antes de qualquer alteracao.</p></section><section><h3>Notificacoes</h3>${notifications.map((item) => `<button type="button" class="notification-row ${item.read ? 'is-read' : ''}" data-action="mark-notification-read" data-notification-id="${item.id}"><strong>${item.title}</strong><span>${item.message}</span></button>`).join('') || '<p>Nenhuma notificacao pendente.</p>'}</section><section><h3>Persistencia e integracoes</h3><p>Dados empresariais compartilhados entre os perfis no armazenamento local.</p><p>Google Maps configurado por variavel de ambiente local.</p></section></div></section>`;
}

export function decisionCenter(state) {
  const network = goodweMetrics(state);
  const waiting = state.queues.filter((item) => item.status === 'waiting').length;
  const offline = state.chargers.filter((item) => item.status === 'offline');
  const support = state.supportTickets.filter((item) => !['Resolvido', 'Fechado'].includes(item.status));
  const opportunities = state.expansionOpportunities.filter((item) => item.score >= 70);
  const decisions = [
    ...offline.map((charger) => ({ severity: 'Alta', category: 'Operacao', title: `${charger.id} sem comunicacao`, reason: 'Disponibilidade abaixo do esperado.', evidence: `Ultima comunicacao ${formatDateTime(charger.lastCommunication)}.`, recommendation: 'Associar chamado e executar diagnostico remoto.', href: `#/mvp/charger?charger=${charger.id}&est=${charger.establishmentId}&loc=${charger.locationId}` })),
    ...support.slice(0, 2).map((ticket) => ({ severity: ticket.severity, category: 'Suporte', title: ticket.title, reason: `Chamado ${ticket.code} em ${ticket.status.toLowerCase()}.`, evidence: `SLA previsto para ${formatDateTime(ticket.slaDueAt)}.`, recommendation: 'Revisar responsavel e registrar a proxima tratativa.', href: `#/mvp/ticket?ticket=${ticket.id}` })),
    ...opportunities.slice(0, 2).map((item) => ({ severity: 'Oportunidade', category: 'Expansao', title: item.title, reason: 'Padrao de utilizacao com potencial comercial.', evidence: item.evidence, recommendation: item.recommendation, href: `#/mvp/client?client=${item.clientId}` }))
  ].slice(0, 5);
  return `<section class="surface panel decision-center" data-testid="mvp-overview-recommendation">${sectionHeader({ title: 'Centro de decisao', subtitle: 'Prioridades explicadas com evidencia, impacto e proxima acao.' })}<div class="decision-list">${decisions.map((item, index) => `<article><div class="decision-rank">${String(index + 1).padStart(2, '0')}</div><div><span>${item.category} · ${item.severity}</span><h3>${item.title}</h3><p><strong>Por que:</strong> ${item.reason}</p><p><strong>Evidencia:</strong> ${item.evidence}</p><p><strong>Recomendacao:</strong> ${item.recommendation}</p></div><a class="ghost-button" href="${item.href}">Agir agora</a></article>`).join('') || '<p>Nenhuma prioridade critica.</p>'}</div><footer><span>${network.totalChargers} equipamentos monitorados · Fila atual: ${waiting}</span><a href="#/mvp/ai">Abrir inteligencia completa</a></footer></section>`;
}

