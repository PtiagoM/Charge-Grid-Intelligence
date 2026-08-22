// @ts-nocheck
import { formatMoney, formatNumber } from '../ui/format.js';
import { badge, sectionHeader } from '../ui/components.js';
import { renderPublicShell } from '../ui/layouts.js';

function resolveCharger(state, chargerId) {
  const charger = state.chargers.find((item) => item.id === chargerId);
  if (!charger) return null;
  const establishment = state.establishments.find((item) => item.id === charger.establishmentId);
  const location = state.locations.find((item) => item.id === charger.locationId);
  return { charger, establishment, location };
}

export function renderQuickChargerPage(state, chargerId) {
  const resolved = resolveCharger(state, chargerId);

  if (!resolved) {
    return {
      html: renderPublicShell({
        title: 'Carregador nao encontrado',
        subtitle: 'Confira o QR Code e tente novamente.',
        content: '<p>Equipamento indisponivel na simulacao atual.</p>'
      }),
      page: 'quick'
    };
  }

  const { charger, establishment, location } = resolved;

  const content = `
    <section class="quick-section" data-testid="quick-charger-page">
      ${sectionHeader({ title: location.name, subtitle: `${establishment.name} · ${location.address}, ${location.number}` })}
      <article class="surface panel quick-card">
        <img class="driver-payment-cover" src="${location.coverImage || establishment.folderImage}" alt="${location.name}" />
        <ul>
          <li><strong>Carregador:</strong> ${charger.id}</li>
          <li><strong>Status:</strong> ${badge(charger.status)}</li>
          <li><strong>Potencia:</strong> ${charger.powerKw} kW</li>
          <li><strong>Tarifa:</strong> ${formatMoney(establishment.pricePerKwh)}/kWh</li>
          <li><strong>Fila:</strong> ${state.queues.filter((item) => item.locationId === location.id && item.status === 'waiting').length}</li>
        </ul>
        <a class="ghost-button" href="#/quick/payment/${charger.id}" data-testid="quick-go-payment">Continuar para pagamento</a>
      </article>
    </section>`;

  return {
    html: renderPublicShell({
      title: 'ChargeGrid Quick',
      subtitle: 'Fluxo publico sem app para iniciar recarga por QR Code.',
      content
    }),
    page: 'quick'
  };
}

export function renderQuickPaymentPage(state, chargerId) {
  const resolved = resolveCharger(state, chargerId);

  if (!resolved) {
    return {
      html: renderPublicShell({
        title: 'Pagamento indisponivel',
        subtitle: 'Nao foi possivel encontrar o equipamento.',
        content: '<p>Retorne para a etapa de leitura do QR Code.</p>'
      }),
      page: 'quick'
    };
  }

  const { charger, establishment, location } = resolved;
  const paymentState = state.ui.quickPaymentState ?? { status: 'Aguardando' };

  const content = `
    <section class="quick-section" data-testid="quick-payment-page">
      ${sectionHeader({ title: 'Pagamento da recarga', subtitle: 'Validacao obrigatoria antes do inicio da sessao.' })}
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
        <form data-form="quick-validate-payment" class="start-session-form" data-testid="quick-payment-form">
          <input type="hidden" name="chargerId" value="${charger.id}" />
          <label>Limite de gasto
            <select name="limitAmount">
              <option value="30">R$ 30</option>
              <option value="50">R$ 50</option>
              <option value="80" selected>R$ 80</option>
              <option value="100">R$ 100</option>
            </select>
          </label>
          <label>Pagamento
            <select name="paymentMethod">
              <option value="Cartao">Cartao</option>
              <option value="Pix">Pix</option>
            </select>
          </label>
          <button type="submit">Validar pagamento</button>
        </form>
        ${paymentState.status === 'Aprovado' ? `
          <form data-form="quick-start-session" class="start-session-form" data-testid="quick-start-session-form">
            <input type="hidden" name="chargerId" value="${charger.id}" />
            <input type="hidden" name="source" value="quick" />
            <input type="hidden" name="driverId" value="guest-qr" />
            <input type="hidden" name="driverName" value="Visitante QR" />
            <input type="hidden" name="vehicle" value="Visitante" />
            <input type="hidden" name="limitAmount" value="${paymentState.limitAmount}" />
            <input type="hidden" name="paymentMethod" value="${paymentState.paymentMethod}" />
            <input type="hidden" name="paymentStatus" value="${paymentState.status}" />
            <button type="submit">Iniciar recarga</button>
          </form>` : ''}
        <p class="sim-note">Cartao: pre-autorizacao simulada. Pix: validacao antecipada simulada.</p>
      </article>
    </section>`;

  return {
    html: renderPublicShell({
      title: 'ChargeGrid Quick',
      subtitle: 'Pagamento validado antes da liberacao da sessao.',
      content
    }),
    page: 'quick'
  };
}

export function renderQuickTracking(state, sessionId) {
  const session = state.sessions.find((item) => item.id === sessionId);

  if (!session) {
    return {
      html: renderPublicShell({
        title: 'Sessao nao encontrada',
        subtitle: 'Nenhuma recarga ativa para esse identificador.',
        content: '<p>Escaneie novamente o QR Code para iniciar outra recarga.</p>'
      }),
      page: 'quick'
    };
  }

  const establishment = state.establishments.find((item) => item.id === session.establishmentId);
  const finished = session.status === 'finished';

  const content = `
    <section class="quick-section" data-testid="quick-tracking-page">
      <article class="surface panel quick-card">
        <h3>${finished ? 'Recarga finalizada' : 'Recarga em andamento'}</h3>
        <ul>
          <li><strong>Carregador:</strong> ${session.chargerId}</li>
          <li><strong>Estabelecimento:</strong> ${establishment?.name ?? '--'}</li>
          <li><strong>Tempo:</strong> ${session.durationMinutes} min</li>
          <li><strong>Energia:</strong> ${formatNumber(session.energyKwh)} kWh</li>
          <li><strong>Tarifa:</strong> ${formatMoney(session.tariffPerKwh)}/kWh</li>
          <li><strong>Valor:</strong> ${formatMoney(finished ? session.finalAmount ?? session.consumedAmount : session.consumedAmount)}</li>
          <li><strong>Pagamento:</strong> ${session.payment.status}</li>
        </ul>
        ${finished ? '<button class="ghost-button">Comprovante simples</button>' : `<button data-action="finish-session" data-session-id="${session.id}">Finalizar recarga</button>`}
      </article>
      ${finished ? '<a class="ghost-button" href="#/login">Criar conta apos a recarga</a>' : ''}
    </section>`;

  return {
    html: renderPublicShell({
      title: 'Acompanhamento da recarga',
      subtitle: 'Fluxo publico com garantia financeira simulada.',
      content
    }),
    page: 'quick'
  };
}


