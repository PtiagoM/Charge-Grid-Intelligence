// @ts-nocheck
import { getCurrentUser } from '../state/store.js';
import { formatDateTime, formatMoney, formatNumber } from '../ui/format.js';
import { badge, sectionHeader, simpleTable } from '../ui/components.js';
import { renderDriverShell } from '../ui/layouts.js';

function getDriverLocations(state) {
  return state.locations
    .filter((location) => location.status === 'Ativo')
    .map((location) => {
      const establishment = state.establishments.find((item) => item.id === location.establishmentId);
      const chargers = state.chargers.filter((item) => item.locationId === location.id);
      const waiting = state.queues.filter((item) => item.locationId === location.id && item.status === 'waiting').length;
      const discovery = state.driverDiscovery.find((item) => item.establishmentId === establishment?.id);
      return { location, establishment, chargers, waiting, distanceKm: discovery?.distanceKm ?? 6.2 };
    });
}

function estimateWaitMinutes(charger, waiting) {
  if (charger.status === 'available') return 0;
  return 12 + waiting * 4;
}

function homeSection(state, user) {
  const points = getDriverLocations(state);
  const cards = points.map(({ location, establishment, chargers, waiting, distanceKm }) => {
    const available = chargers.filter((charger) => charger.status === 'available').length;
    return `
      <article class="driver-spot driver-point-card" data-testid="driver-point-${location.id}">
        <img class="driver-point-cover" src="${location.coverImage || establishment.folderImage}" alt="${location.name}" />
        <div><h3>${location.name}</h3><p>${establishment.name} · ${location.address}, ${location.number}</p></div>
        <ul>
          <li><strong>${available}</strong><span>disponiveis</span></li>
          <li><strong>${chargers.length - available}</strong><span>ocupados/offline</span></li>
          <li><strong>${formatMoney(establishment.pricePerKwh)}</strong><span>tarifa</span></li>
          <li><strong>${distanceKm} km</strong><span>distancia</span></li>
        </ul>
        <div class="driver-charger-options">${chargers.map((charger) => `<a class="driver-charger-option" href="#/drive/payment?charger=${charger.id}"><span><strong>${charger.internalId || charger.id}</strong><small>${charger.model} · ${charger.powerKw} kW</small></span><b>${charger.status === 'available' ? 'Disponivel' : `${estimateWaitMinutes(charger, waiting)} min`}</b></a>`).join('') || '<p>Sem carregadores publicos.</p>'}</div>
      </article>`;
  });

  return `
    <section class="driver-section" data-testid="drive-home">
      ${sectionHeader({ title: `Ola, ${user.name.split(' ')[0]}`, subtitle: 'Encontre um ponto, confira disponibilidade e escolha o equipamento.' })}
      <div class="driver-spot-grid" data-testid="drive-charger-list">${cards.join('') || '<p>Nenhum ponto disponivel.</p>'}</div>
    </section>`;
}

function paymentSection(state, route, user) {
  const chargers = state.chargers;
  const selectedChargerId = route.query?.charger ?? state.ui.selectedChargerId ?? chargers[0]?.id;
  const charger = chargers.find((item) => item.id === selectedChargerId) ?? chargers[0];
  const establishment = state.establishments.find((item) => item.id === charger.establishmentId);
  const location = state.locations.find((item) => item.id === charger.locationId);
  const paymentState = state.ui.driverPaymentState ?? { status: 'Aguardando' };

  return `
    <section class="driver-section" data-testid="drive-payment">
      ${sectionHeader({ title: 'Pagamento da recarga', subtitle: 'Validacao obrigatoria antes da liberacao da sessao.' })}
      <article class="surface panel quick-card">
        <img class="driver-payment-cover" src="${location.coverImage || establishment.folderImage}" alt="${location.name}" />
        <ul>
          <li><strong>Ponto:</strong> ${location.name}</li>
          <li><strong>Carregador:</strong> ${charger.id}</li>
          <li><strong>Status:</strong> ${badge(charger.status)}</li>
          <li><strong>Potencia:</strong> ${charger.powerKw} kW</li>
          <li><strong>Tarifa:</strong> ${formatMoney(establishment.pricePerKwh)}/kWh</li>
          <li><strong>Status validacao:</strong> ${paymentState.status}</li>
        </ul>
        <form data-form="driver-validate-payment" class="start-session-form" data-testid="driver-payment-form">
          <input type="hidden" name="chargerId" value="${charger.id}" />
          <label>Limite financeiro
            <select name="limitAmount">
              <option value="30">R$ 30</option>
              <option value="50">R$ 50</option>
              <option value="80" selected>R$ 80</option>
              <option value="100">R$ 100</option>
            </select>
          </label>
          <label>Forma de pagamento
            <select name="paymentMethod">
              <option value="Cartao">Cartao</option>
              <option value="Pix">Pix</option>
            </select>
          </label>
          <button type="submit">Validar pagamento</button>
        </form>
        ${paymentState.status === 'Aprovado' ? `
          <form data-form="start-session" class="start-session-form" data-testid="drive-start-session-form">
            <input type="hidden" name="chargerId" value="${charger.id}" />
            <input type="hidden" name="driverId" value="${user.id}" />
            <input type="hidden" name="driverName" value="${user.name}" />
            <input type="hidden" name="vehicle" value="${user.vehicle.model}" />
            <input type="hidden" name="source" value="drive" />
            <input type="hidden" name="paymentMethod" value="${paymentState.paymentMethod}" />
            <input type="hidden" name="limitAmount" value="${paymentState.limitAmount}" />
            <input type="hidden" name="paymentStatus" value="${paymentState.status}" />
            <button type="submit" data-testid="drive-start-session-submit">Iniciar recarga</button>
          </form>` : ''}
        <p class="sim-note">Cartao usa pre-autorizacao simulada. Pix representa validacao antecipada simulada.</p>
      </article>
    </section>`;
}

function currentSection(state, user) {
  const activeSession = state.sessions.find(
    (session) => session.driverId === user.id && session.status === 'active'
  );

  if (!activeSession) {
    return `
      <section class="driver-section" data-testid="drive-current-empty">
        <article class="surface panel quick-card">
          <h3>Sem recarga ativa</h3>
          <p>Valide um pagamento para iniciar nova sessao.</p>
          <a class="ghost-button" href="#/drive/payment">Ir para pagamento</a>
        </article>
      </section>`;
  }

  const establishment = state.establishments.find((item) => item.id === activeSession.establishmentId);
  const remaining = Math.max(0, activeSession.limitAmount - activeSession.consumedAmount);

  return `
    <section class="driver-section" data-testid="drive-current">
      <article class="surface panel quick-card">
        <h3>Recarga atual</h3>
        <ul>
          <li><strong>Tempo decorrido:</strong> ${activeSession.durationMinutes} min</li>
          <li><strong>Energia entregue:</strong> ${formatNumber(activeSession.energyKwh)} kWh</li>
          <li><strong>Potencia atual:</strong> ${formatNumber(activeSession.powerKw)} kW</li>
          <li><strong>Tarifa aplicada:</strong> ${formatMoney(activeSession.tariffPerKwh)}/kWh</li>
          <li><strong>Valor acumulado:</strong> ${formatMoney(activeSession.consumedAmount)}</li>
          <li><strong>Status:</strong> ${badge(activeSession.status)}</li>
          <li><strong>Carregador:</strong> ${activeSession.chargerId} em ${establishment.name}</li>
          <li><strong>Saldo restante:</strong> ${formatMoney(remaining)}</li>
        </ul>
        <button data-action="finish-session" data-session-id="${activeSession.id}" data-testid="drive-finish-session">Encerrar recarga</button>
      </article>
    </section>`;
}

function historySection(state, user) {
  const sessions = state.sessions
    .filter((session) => session.driverId === user.id && session.status !== 'active')
    .slice()
    .reverse();

  return `
    <section class="driver-section" data-testid="drive-history">
      <article class="surface panel quick-card">
        <h3>Finalizacoes e comprovantes</h3>
        ${simpleTable({
          columns: ['Data', 'Carregador', 'Energia', 'Duracao', 'Valor final', 'Pagamento', 'Comprovante'],
          rows: sessions.map((session) => [
            formatDateTime(session.startedAt),
            session.chargerId,
            `${formatNumber(session.energyKwh)} kWh`,
            `${session.durationMinutes} min`,
            formatMoney(session.finalAmount ?? session.consumedAmount),
            session.payment.status,
            '<button class="ghost-button">Comprovante</button>'
          ])
        })}
      </article>
    </section>`;
}

export function renderDriverPage(state, tab = 'home', route) {
  const user = getCurrentUser(state);

  if (!user) {
    return {
      html: '<p>Usuario nao encontrado.</p>',
      page: 'driver'
    };
  }

  const views = {
    home: () => homeSection(state, user),
    payment: () => paymentSection(state, route, user),
    current: () => currentSection(state, user),
    history: () => historySection(state, user)
  };

  const renderer = views[tab] ?? views.home;

  return {
    html: renderDriverShell({
      activePath: tab,
      content: renderer(),
      title: 'Interface do Motorista',
      subtitle: 'Fluxo direto: selecionar carregador, validar pagamento e acompanhar recarga.'
    }),
    page: 'driver'
  };
}


