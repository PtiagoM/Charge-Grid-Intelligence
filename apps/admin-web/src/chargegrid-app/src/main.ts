// @ts-nocheck
import { renderAdminSimulatorPage } from './pages/admin.js';
import { renderAuthPage } from './pages/auth.js';
import { renderDriverPage } from './pages/driver.js';
import { renderGoodweAiAgent, renderMvpManagerPage } from './pages/mvp-manager.js';
import { renderQuickChargerPage, renderQuickPaymentPage, renderQuickTracking } from './pages/quick.js';
import { geocodeAddressForPayload, geocodeMapSearch, initGoogleWorldMap } from './services/google-maps.js';
import './styles/main.css';
import {
  AUTH_PROFILES,
  canAccessMvpTab,
  createStore,
  getCurrentAccount,
  getCurrentUser,
  getLocationById,
  resolveHomeHash,
  getEstablishmentById
} from './state/store.js';
import { establishmentMetrics } from './state/metrics.js';
import {
  Activity,
  BadgeDollarSign,
  BatteryCharging,
  BrainCircuit,
  Building2,
  ChartNoAxesCombined,
  ClipboardCheck,
  Clock3,
  createIcons,
  FileChartColumn,
  FileSignature,
  FolderOpen,
  Gauge,
  History,
  Landmark,
  LayoutDashboard,
  LogOut,
  MapPin,
  MapPinned,
  NotebookTabs,
  PlugZap,
  RadioTower,
  ReceiptText,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UsersRound,
  WalletCards,
  Zap
} from 'lucide';

const app = document.querySelector('#app');
const store = createStore();

const sidebarIcons = {
  Activity,
  BadgeDollarSign,
  BatteryCharging,
  BrainCircuit,
  Building2,
  ChartNoAxesCombined,
  ClipboardCheck,
  Clock3,
  FileChartColumn,
  FileSignature,
  FolderOpen,
  Gauge,
  History,
  Landmark,
  LayoutDashboard,
  LogOut,
  MapPin,
  MapPinned,
  NotebookTabs,
  PlugZap,
  RadioTower,
  ReceiptText,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UsersRound,
  WalletCards,
  Zap
};

function parseQuery(queryString) {
  const query = {};
  const parser = new URLSearchParams(queryString);
  parser.forEach((value, key) => {
    query[key] = value;
  });
  return query;
}

function parseRoute() {
  const raw = window.location.hash || '#/login';
  const [pathPart, queryPart = ''] = raw.replace(/^#/, '').split('?');
  const segments = pathPart.split('/').filter(Boolean);
  const [scope = 'login', tab = 'overview', third = null, fourth = null] = segments;

  const route = {
    raw,
    scope,
    tab,
    third,
    fourth,
    query: parseQuery(queryPart)
  };

  if (scope === 'quick' && tab === 'charger') {
    route.chargerId = third;
  }
  if (scope === 'quick' && tab === 'payment') {
    route.chargerId = third;
  }
  if (scope === 'quick' && tab === 'session') {
    route.sessionId = third;
  }

  return route;
}

function hasAccess(state, scope) {
  const account = getCurrentAccount(state);
  if (!account) return scope === 'login' || scope === 'quick';

  if (scope === 'quick' || scope === 'login' || scope === 'logout') return true;

  if (account.profile === AUTH_PROFILES.GOODWE) {
    return scope === 'mvp' || scope === 'admin';
  }
  if (account.profile === AUTH_PROFILES.ESTABELECIMENTO) {
    return scope === 'mvp';
  }
  return scope === 'drive';
}

function isMvpRouteAllowedByBinding(state, account, route) {
  if (account.profile !== AUTH_PROFILES.ESTABELECIMENTO) return true;

  if (route.query.est && route.query.est !== account.establishmentId) {
    return false;
  }

  if (route.query.loc) {
    const location = getLocationById(state, route.query.loc);
    if (!location || location.establishmentId !== account.establishmentId) {
      return false;
    }
  }

  return true;
}

function ensureRouteAccess(state, route) {
  const account = getCurrentAccount(state);

  if (route.scope === 'login' && account) {
    window.location.hash = resolveHomeHash(account.profile);
    return false;
  }

  if (!account && ['mvp', 'goodwe', 'business', 'drive', 'admin'].includes(route.scope)) {
    window.location.hash = '#/login';
    return false;
  }

  if (!hasAccess(state, route.scope)) {
    window.location.hash = account ? resolveHomeHash(account.profile) : '#/login';
    return false;
  }

  if (route.scope === 'mvp') {
    if (!account) {
      window.location.hash = '#/login';
      return false;
    }

    if (!canAccessMvpTab(account.profile, route.tab)) {
      window.location.hash = resolveHomeHash(account.profile);
      return false;
    }

    if (!isMvpRouteAllowedByBinding(state, account, route)) {
      window.location.hash = resolveHomeHash(account.profile);
      return false;
    }
  }

  return true;
}

function wrapWithFlash(html, state) {
  if (!state.ui.flashMessage) return html;
  return `
    <div class="flash tone-${state.ui.flashTone ?? 'info'}" data-testid="flash-message">
      ${state.ui.flashMessage}
      <button data-action="clear-flash" aria-label="Fechar">x</button>
    </div>
    ${html}`;
}

function renderAssistantDrawer(state) {
  if (!state.ui.assistantOpen) return '';

  const account = getCurrentAccount(state);
  if (!account || ![AUTH_PROFILES.GOODWE, AUTH_PROFILES.ESTABELECIMENTO].includes(account.profile)) return '';

  const establishmentId =
    account.profile === AUTH_PROFILES.ESTABELECIMENTO
      ? account.establishmentId
      : state.ui.selectedEstablishmentId ?? state.establishments[0]?.id;
  const establishment = getEstablishmentById(state, establishmentId);
  if (!establishment) return '';

  return `
    <div class="goodwe-ai-drawer-layer" data-testid="goodwe-ai-drawer-layer">
      ${renderGoodweAiAgent(
        state,
        {
          establishment,
          estMetrics: establishmentMetrics(state, establishment.id)
        },
        { drawer: true }
      )}
    </div>`;
}

function render() {
  const state = store.getState();
  const route = parseRoute();

  if (!ensureRouteAccess(state, route)) return;

  let output;

  if (route.scope === 'login') {
    output = renderAuthPage(state);
    document.body.className = 'layout-auth';
  } else if (route.scope === 'mvp') {
    output = renderMvpManagerPage(state, route);
    document.body.className = 'layout-desktop';
  } else if (route.scope === 'goodwe' || route.scope === 'business') {
    window.location.hash = '#/mvp/overview';
    return;
  } else if (route.scope === 'drive') {
    output = renderDriverPage(state, route.tab, route);
    document.body.className = 'layout-driver';
  } else if (route.scope === 'quick' && route.tab === 'charger') {
    output = renderQuickChargerPage(state, route.chargerId);
    document.body.className = 'layout-quick';
  } else if (route.scope === 'quick' && route.tab === 'payment') {
    output = renderQuickPaymentPage(state, route.chargerId);
    document.body.className = 'layout-quick';
  } else if (route.scope === 'quick' && route.tab === 'session') {
    output = renderQuickTracking(state, route.sessionId);
    document.body.className = 'layout-quick';
  } else if (route.scope === 'admin') {
    output = renderAdminSimulatorPage(state);
    document.body.className = 'layout-desktop';
  } else if (route.scope === 'logout') {
    store.dispatch({ type: 'LOGOUT' });
    window.location.hash = '#/login';
    return;
  } else {
    window.location.hash = '#/login';
    return;
  }

  app.innerHTML = wrapWithFlash(`${output.html}${renderAssistantDrawer(state)}`, state);
  createIcons({ icons: sidebarIcons, attrs: { 'aria-hidden': 'true' } });
  initGoogleWorldMap(state, (locationId) => {
    store.dispatch({ type: 'SET_UI', payload: { selectedMapLocationId: locationId } });
  });
}

function setFlash(message, tone = 'info') {
  store.dispatch({ type: 'SET_UI', payload: { flashMessage: message, flashTone: tone } });
}

function parseFormToObject(form) {
  const data = new FormData(form);
  return Object.fromEntries(data.entries());
}

app.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;

  if (action === 'fill-login') {
    const form = app.querySelector('[data-form="login"]');
    form.querySelector('input[name="email"]').value = target.dataset.email;
    form.querySelector('input[name="password"]').value = target.dataset.password;
    return;
  }

  if (action === 'open-assistant') {
    const account = getCurrentAccount(store.getState());
    if (account && (account.profile === AUTH_PROFILES.GOODWE || account.profile === AUTH_PROFILES.ESTABELECIMENTO)) {
      store.dispatch({ type: 'SET_UI', payload: { assistantOpen: true } });
    }
    return;
  }

  if (action === 'close-assistant') {
    store.dispatch({ type: 'SET_UI', payload: { assistantOpen: false } });
    return;
  }

  if (action === 'clear-flash') {
    store.dispatch({ type: 'SET_UI', payload: { flashMessage: '', flashTone: 'info' } });
    return;
  }

  if (action === 'toggle-enterprise-form') {
    const details = document.getElementById(target.dataset.target);
    if (details) details.open = !details.open;
    return;
  }

  if (action === 'toggle-installation-step') {
    const result = store.dispatch({
      type: 'TOGGLE_INSTALLATION_STEP',
      payload: {
        installationId: target.dataset.installationId,
        stepId: target.dataset.stepId,
        reason: 'Atualizacao do checklist de implantacao'
      }
    });
    setFlash(result.message, result.ok ? 'good' : 'danger');
    return;
  }

  if (action === 'mark-notification-read') {
    store.dispatch({ type: 'MARK_NOTIFICATION_READ', payload: { notificationId: target.dataset.notificationId } });
    return;
  }

  if (action === 'tick') {
    store.dispatch({ type: 'TICK' });
    setFlash('Dados simulados atualizados.', 'good');
    return;
  }

  if (action === 'select-establishment') {
    store.dispatch({ type: 'SET_UI', payload: { selectedEstablishmentId: target.dataset.establishmentId } });
    return;
  }

  if (action === 'select-charger') {
    store.dispatch({ type: 'SET_UI', payload: { selectedChargerId: target.dataset.chargerId } });
    return;
  }

  if (action === 'select-session') {
    store.dispatch({ type: 'SET_UI', payload: { selectedSessionId: target.dataset.sessionId } });
    return;
  }

  if (action === 'toggle-account-status') {
    const result = store.dispatch({ type: 'UPDATE_ACCOUNT_STATUS', payload: { accountId: target.dataset.accountId, status: target.dataset.status } });
    setFlash(result.message, result.ok ? 'good' : 'danger');
    return;
  }

  if (action === 'reset-account-password') {
    const result = store.dispatch({ type: 'RESET_ACCOUNT_PASSWORD', payload: { accountId: target.dataset.accountId } });
    setFlash(result.ok ? `Nova senha temporaria: ${result.temporaryPassword}` : result.message, result.ok ? 'warn' : 'danger');
    return;
  }

  if (action === 'select-map-location') {
    store.dispatch({ type: 'SET_UI', payload: { selectedMapLocationId: target.dataset.locationId } });
    return;
  }

  if (action === 'select-ai-topic') {
    store.dispatch({ type: 'SET_UI', payload: { selectedAiTopic: target.dataset.topic } });
    return;
  }

  if (action === 'join-queue') {
    store.dispatch({
      type: 'JOIN_QUEUE',
      payload: {
        establishmentId: target.dataset.establishmentId,
        locationId: target.dataset.locationId,
        driverId: target.dataset.driverId,
        driverName: target.dataset.driverName,
        vehicle: target.dataset.vehicle,
        chargerPreference: target.dataset.preference,
        note: 'Aguardando liberacao de carregador'
      }
    });
    setFlash('Usuario adicionado na fila virtual.', 'warn');
    return;
  }

  if (action === 'finish-session') {
    const result = store.dispatch({
      type: 'END_SESSION',
      payload: { sessionId: target.dataset.sessionId, reason: 'encerramento_solicitado' }
    });
    setFlash(
      result.ok ? 'Sessao encerrada e valores consolidados no financeiro.' : result.message,
      result.ok ? 'good' : 'danger'
    );
    return;
  }

  if (action === 'set-payment-status') {
    store.dispatch({ type: 'SET_SIMULATION_PAYMENT', payload: { status: target.dataset.status } });
    setFlash(`Novas validacoes de pagamento: ${target.dataset.status}.`, 'info');
    return;
  }

  if (action === 'simulate-peak') {
    store.dispatch({ type: 'SIMULATE_PEAK', payload: { establishmentId: target.dataset.establishmentId ?? 'est-fiap', locationId: target.dataset.locationId } });
    setFlash('Cenario de pico aplicado ao ponto selecionado.', 'warn');
    return;
  }

  if (action === 'simulate-critical') {
    store.dispatch({ type: 'SIMULATE_CRITICAL', payload: { establishmentId: target.dataset.establishmentId ?? 'est-fiap', locationId: target.dataset.locationId } });
    setFlash('Cenario critico aplicado ao ponto selecionado.', 'danger');
    return;
  }

  if (action === 'simulate-favorable') {
    store.dispatch({ type: 'SIMULATE_FAVORABLE', payload: { establishmentId: target.dataset.establishmentId ?? 'est-fiap', locationId: target.dataset.locationId } });
    setFlash('Cenario favoravel aplicado para liberar sessoes em espera.', 'good');
    return;
  }

  if (action === 'simulate-alert') {
    store.dispatch({ type: 'SIMULATE_ALERT', payload: { establishmentId: target.dataset.establishmentId ?? 'est-fiap', locationId: target.dataset.locationId } });
    setFlash('Cenario de alerta aplicado com limitacao preventiva.', 'warn');
  }
});

app.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  const formType = form.dataset.form;
  const payload = parseFormToObject(form);

  if (formType === 'login') {
    store.dispatch({ type: 'CLEAR_AUTH_ERROR' });
    const result = store.dispatch({
      type: 'LOGIN',
      payload: {
        email: payload.email,
        password: payload.password
      }
    });
    if (!result.ok) return;
    window.location.hash = resolveHomeHash(result.account.profile);
    return;
  }

  if (formType === 'search-establishments') {
    store.dispatch({ type: 'SET_UI', payload: { searchTerm: payload.searchTerm } });
    return;
  }

  if (formType === 'enterprise-search') {
    store.dispatch({ type: 'SET_UI', payload: { enterpriseSearch: payload.enterpriseSearch } });
    return;
  }

  if (formType === 'create-client') {
    const result = store.dispatch({ type: 'CREATE_CLIENT', payload });
    if (!result.ok) {
      setFlash(result.message, 'danger');
      return;
    }
    setFlash(result.message, 'good');
    window.location.hash = `#/mvp/client?client=${result.clientId}`;
    return;
  }

  if (formType === 'update-client') {
    const result = store.dispatch({ type: 'UPDATE_CLIENT', payload });
    setFlash(result.message, result.ok ? 'good' : 'danger');
    return;
  }

  if (formType === 'create-contract') {
    const result = store.dispatch({ type: 'CREATE_CONTRACT', payload });
    if (!result.ok) {
      setFlash(result.message, 'danger');
      return;
    }
    setFlash(result.message, 'good');
    window.location.hash = `#/mvp/contract?contract=${result.contractId}`;
    return;
  }

  if (formType === 'create-installation') {
    const result = store.dispatch({ type: 'CREATE_INSTALLATION', payload });
    if (!result.ok) {
      setFlash(result.message, 'danger');
      return;
    }
    setFlash(result.message, 'good');
    window.location.hash = `#/mvp/installation?installation=${result.installationId}`;
    return;
  }

  if (formType === 'create-support-ticket') {
    const result = store.dispatch({ type: 'CREATE_SUPPORT_TICKET', payload });
    if (!result.ok) {
      setFlash(result.message, 'danger');
      return;
    }
    setFlash(result.message, 'good');
    window.location.hash = `#/mvp/ticket?ticket=${result.ticketId}`;
    return;
  }

  if (formType === 'update-support-ticket') {
    const result = store.dispatch({ type: 'UPDATE_SUPPORT_TICKET', payload });
    setFlash(result.message, result.ok ? 'good' : 'danger');
    return;
  }

  if (formType === 'business-session-filter') {
    store.dispatch({ type: 'SET_UI', payload: { selectedSessionFilter: payload.sessionFilter } });
    return;
  }

  if (formType === 'monitor-filters') {
    store.dispatch({
      type: 'SET_UI',
      payload: {
        monitorLocationFilter: payload.monitorLocationFilter,
        monitorStatusFilter: payload.monitorStatusFilter
      }
    });
    return;
  }

  if (formType === 'network-location-filters') {
    store.dispatch({
      type: 'SET_UI',
      payload: {
        networkEstablishmentFilter: payload.establishmentId,
        networkLocationStatusFilter: payload.status
      }
    });
    return;
  }

  if (formType === 'simulator-scope') {
    const state = store.getState();
    const locationId = state.locations.some(
      (location) => location.id === payload.locationId && location.establishmentId === payload.establishmentId
    )
      ? payload.locationId
      : state.locations.find((location) => location.establishmentId === payload.establishmentId)?.id;
    store.dispatch({ type: 'SET_UI', payload: { simulatorEstablishmentId: payload.establishmentId, simulatorLocationId: locationId } });
    return;
  }

  if (formType === 'mvp-report-filter') {
    store.dispatch({ type: 'SET_UI', payload: { reportPeriod: payload.reportPeriod } });
    return;
  }

  if (formType === 'assistant-question') {
    store.dispatch({
      type: 'SET_UI',
      payload: {
        aiChatQuestion: payload.question,
        selectedAiTopic: 'custom'
      }
    });
    setFlash('Resposta gerada a partir dos dados internos da plataforma.', 'info');
    return;
  }

  if (formType === 'google-map-address-search') {
    try {
      const result = await geocodeMapSearch(payload.address);
      store.dispatch({
        type: 'SET_UI',
        payload: {
          mapSearchAddress: payload.address,
          mapSearchResult: result
        }
      });
      setFlash('Endereco localizado no Google Maps.', 'good');
    } catch {
      setFlash('Nao consegui localizar esse endereco no Google Maps.', 'danger');
    }
    return;
  }

  if (formType === 'create-establishment') {
    const coordinates = await geocodeAddressForPayload(payload);
    const result = store.dispatch({
      type: 'CREATE_ESTABLISHMENT',
      payload: {
        clientId: payload.clientId,
        name: payload.name,
        corporateName: payload.corporateName,
        cnpj: payload.cnpj,
        responsible: payload.responsible,
        phone: payload.phone,
        email: payload.email,
        city: payload.city,
        state: payload.state,
        address: payload.address,
        number: payload.number,
        complement: payload.complement,
        zipCode: payload.zipCode,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        geocodingPrecision: coordinates.geocodingPrecision,
        formattedAddress: coordinates.formattedAddress,
        locationName: payload.locationName,
        locationDescription: payload.locationDescription,
        pricePerKwh: Number(payload.pricePerKwh),
        status: payload.status,
        notes: payload.notes,
        folderImage: payload.folderImage,
        clientType: payload.clientType,
        networkEntryDate: payload.networkEntryDate,
        internalInformation: payload.internalInformation,
        reason: payload.reason,
        accountName: payload.accountName,
        accountEmail: payload.accountEmail,
        accountPassword: payload.accountPassword,
        accountStatus: payload.accountStatus
      }
    });

    if (!result.ok) {
      setFlash(result.message, 'danger');
      return;
    }

    setFlash('Estabelecimento e acesso criados pela GoodWe.', 'good');
    window.location.hash = `#/mvp/establishment?est=${result.establishmentId}`;
    return;
  }

  if (formType === 'select-charger-establishment') {
    const state = store.getState();
    const selectedLocationId =
      state.locations.find((location) => location.establishmentId === payload.establishmentId)?.id ?? null;

    store.dispatch({
      type: 'SET_UI',
      payload: {
        selectedEstablishmentId: payload.establishmentId,
        selectedLocationId
      }
    });
    return;
  }

  if (formType === 'create-location') {
    const coordinates = await geocodeAddressForPayload(payload);
    const result = store.dispatch({
      type: 'CREATE_LOCATION',
      payload: {
        establishmentId: payload.establishmentId,
        name: payload.name,
        address: payload.address,
        number: payload.number,
        complement: payload.complement,
        city: payload.city,
        state: payload.state,
        zipCode: payload.zipCode,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        geocodingPrecision: coordinates.geocodingPrecision,
        formattedAddress: coordinates.formattedAddress,
        description: payload.description,
        coverImage: payload.coverImage,
        galleryImage1: payload.galleryImage1,
        galleryImage2: payload.galleryImage2,
        operatingHours: payload.operatingHours,
        operationalNotes: payload.operationalNotes,
        initialChargers: Number(payload.initialChargers),
        status: payload.status
      }
    });

    if (!result.ok) {
      setFlash(result.message, 'danger');
      return;
    }

    setFlash('Local cadastrado e vinculado ao estabelecimento.', 'good');
    window.location.hash = `#/mvp/location?est=${payload.establishmentId}&loc=${result.locationId}`;
    return;
  }

  if (formType === 'create-charger') {
    const result = store.dispatch({
      type: 'CREATE_CHARGER',
      payload: {
        establishmentId: payload.establishmentId,
        locationId: payload.locationId,
        identifier: payload.identifier,
        internalId: payload.internalId,
        serial: payload.serial,
        model: payload.model,
        powerKw: Number(payload.powerKw),
        installationDate: payload.installationDate,
        status: payload.status,
        technicalNotes: payload.technicalNotes,
        ports: payload.ports,
        connectionType: payload.connectionType,
        firmware: payload.firmware,
        image: payload.image,
        assetTag: payload.assetTag,
        warrantyEndDate: payload.warrantyEndDate,
        maintenancePlan: payload.maintenancePlan,
        nextMaintenanceDate: payload.nextMaintenanceDate,
        commissioningStatus: payload.commissioningStatus,
        reason: payload.reason
      }
    });

    if (!result.ok) {
      setFlash(result.message, 'danger');
      return;
    }

    setFlash('Carregador cadastrado no local selecionado.', 'good');
    window.location.hash = `#/mvp/location?est=${payload.establishmentId}&loc=${payload.locationId}`;
    return;
  }

  if (formType === 'create-charger-by-establishment') {
    const result = store.dispatch({
      type: 'CREATE_CHARGER',
      payload: {
        establishmentId: payload.establishmentId,
        locationId: payload.locationId,
        identifier: payload.identifier,
        internalId: payload.internalId,
        serial: payload.serial,
        model: payload.model,
        powerKw: Number(payload.powerKw),
        installationDate: payload.installationDate,
        status: payload.status,
        technicalNotes: payload.technicalNotes,
        ports: payload.ports,
        connectionType: payload.connectionType,
        firmware: payload.firmware,
        image: payload.image,
        assetTag: payload.assetTag,
        warrantyEndDate: payload.warrantyEndDate,
        maintenancePlan: payload.maintenancePlan,
        nextMaintenanceDate: payload.nextMaintenanceDate,
        commissioningStatus: payload.commissioningStatus,
        reason: payload.reason
      }
    });

    if (!result.ok) {
      setFlash(result.message, 'danger');
      return;
    }

    setFlash('Novo carregador vinculado ao estabelecimento selecionado.', 'good');
    window.location.hash = `#/mvp/location?est=${payload.establishmentId}&loc=${payload.locationId}`;
    return;
  }

  if (formType === 'transfer-charger') {
    const result = store.dispatch({
      type: 'TRANSFER_CHARGER',
      payload: {
        chargerId: payload.chargerId,
        toLocationId: payload.toLocationId,
        reason: payload.reason,
        responsible: payload.responsible
      }
    });

    setFlash(result.message, result.ok ? 'good' : 'danger');
    if (result.ok) {
      window.location.hash = `#/mvp/location?est=${result.establishmentId}&loc=${result.locationId}`;
    }
    return;
  }

  if (formType === 'create-establishment-account') {
    const result = store.dispatch({
      type: 'CREATE_ESTABLISHMENT_ACCOUNT',
      payload: {
        establishmentId: payload.establishmentId,
        name: payload.name,
        email: payload.email,
        password: payload.password,
        phone: payload.phone,
        role: payload.role,
        status: payload.status
      }
    });

    setFlash(result.message, result.ok ? 'good' : 'danger');
    return;
  }

  if (formType === 'goodwe-simulator') {
    store.dispatch({
      type: 'SET_UI',
      payload: {
        simClientName: payload.clientName,
        simChargers: Number(payload.chargers),
        simInvestment: Number(payload.investment),
        simSellKwh: Number(payload.sellKwh),
        simCostKwh: Number(payload.costKwh),
        simSessionsDay: Number(payload.sessionsDay),
        simEnergyPerSession: Number(payload.energyPerSession),
        simMonthlyFee: Number(payload.monthlyFee),
        simPerCharger: Number(payload.perCharger),
        simGoodweShare: Number(payload.goodweShare),
        simOtherCosts: Number(payload.otherCosts)
      }
    });
    setFlash('Simulador comercial recalculado.', 'good');
    return;
  }

  if (formType === 'start-session' || formType === 'quick-start-session' || formType === 'admin-start-session') {
    const result = store.dispatch({
      type: 'START_SESSION',
      payload: {
        chargerId: payload.chargerId,
        driverId: payload.driverId ?? 'guest-qr',
        driverName: payload.driverName,
        vehicle: payload.vehicle,
        limitAmount: Number(payload.limitAmount),
        paymentMethod: payload.paymentMethod,
        paymentStatus: payload.paymentStatus,
        source: payload.source ?? 'drive'
      }
    });

    if (!result.ok) {
      setFlash(result.message, 'danger');
      return;
    }

    if (formType === 'quick-start-session') {
      window.location.hash = `#/quick/session/${result.session.id}`;
    } else {
      window.location.hash = '#/drive/current';
    }
    setFlash('Pagamento aprovado e sessao iniciada.', 'good');
    return;
  }

  if (formType === 'driver-validate-payment' || formType === 'quick-validate-payment') {
    const state = store.getState();
    const paymentStatus = state.simulation.nextPaymentStatus;
    const paymentPayload = {
      status: paymentStatus,
      paymentMethod: payload.paymentMethod,
      limitAmount: Number(payload.limitAmount),
      chargerId: payload.chargerId
    };

    if (formType === 'driver-validate-payment') {
      store.dispatch({ type: 'SET_UI', payload: { driverPaymentState: paymentPayload } });
    } else {
      store.dispatch({ type: 'SET_UI', payload: { quickPaymentState: paymentPayload } });
    }

    setFlash(
      paymentStatus === 'Aprovado'
        ? 'Pagamento validado. Sessao pronta para liberacao.'
        : `Pagamento ${paymentStatus.toLowerCase()}. Sessao nao sera iniciada.`,
      paymentStatus === 'Aprovado' ? 'good' : 'danger'
    );
    return;
  }

  if (formType === 'driver-profile') {
    const user = getCurrentUser(store.getState());
    if (user) {
      store.dispatch({
        type: 'UPDATE_DRIVER_PROFILE',
        payload: {
          userId: user.id,
          patch: {
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            vehicle: {
              ...user.vehicle,
              model: payload.vehicleModel,
              plate: payload.vehiclePlate
            }
          }
        }
      });
      setFlash('Perfil atualizado.', 'good');
    }
    return;
  }

  if (formType === 'admin-set-status') {
    store.dispatch({
      type: 'SET_CHARGER_STATUS',
      payload: {
        chargerId: payload.chargerId,
        status: payload.status,
        currentPowerKw: Number(payload.currentPowerKw)
      }
    });
    setFlash('Status do carregador atualizado.', 'warn');
    return;
  }

  if (formType === 'admin-energy') {
    store.dispatch({
      type: 'UPDATE_ENERGY',
      payload: {
        establishmentId: payload.establishmentId,
        locationId: payload.locationId,
        patch: {
          baseLoadKw: Number(payload.baseLoadKw),
          solarKw: Number(payload.solarKw),
          batterySocPercent: Number(payload.batterySocPercent)
        }
      }
    });
    setFlash('Parametros energeticos atualizados.', 'warn');
    return;
  }

  if (formType === 'admin-queue') {
    store.dispatch({
      type: 'JOIN_QUEUE',
      payload: {
        establishmentId: payload.establishmentId,
        locationId: payload.locationId,
        driverId: `guest-${Date.now()}`,
        driverName: payload.driverName,
        vehicle: payload.vehicle,
        chargerPreference: payload.chargerPreference,
        note: 'Inserido pelo simulador administrativo'
      }
    });
    setFlash('Item inserido na fila da demonstracao.', 'warn');
  }
});

app.addEventListener('change', (event) => {
  const radio = event.target.closest('.segmented-tab input[type="radio"]');
  if (!radio) return;
  radio.closest('form')?.requestSubmit();
});

store.subscribe(render);
window.addEventListener('hashchange', render);

setInterval(() => {
  store.dispatch({ type: 'TICK' });
}, 60000);

render();

