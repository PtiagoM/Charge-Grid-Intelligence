// @ts-nocheck
import { establishmentMetrics } from '../state/metrics.js';
import { getCurrentUser } from '../state/store.js';
import { sectionHeader, simpleTable } from '../ui/components.js';
import { renderDesktopShell } from '../ui/layouts.js';

const menu = [
  { path: 'simulator', href: '#/admin/simulator', label: 'Simulador Interno', icon: '/assets/sems/icons/icon_setting.6ecae33c.png' }
];

export function renderAdminSimulatorPage(state) {
  const user = getCurrentUser(state);
  const establishmentId = state.ui.simulatorEstablishmentId ?? state.establishments[0]?.id;
  const availableLocations = state.locations.filter((item) => item.establishmentId === establishmentId);
  const locationId = availableLocations.some((item) => item.id === state.ui.simulatorLocationId)
    ? state.ui.simulatorLocationId
    : availableLocations[0]?.id;
  const metrics = establishmentMetrics(state, establishmentId);
  const location = state.locations.find((item) => item.id === locationId);
  const energy = state.energyByLocation?.[locationId] ?? metrics.energy;
  const scopedChargers = metrics.chargers.filter((charger) => charger.locationId === locationId);

  const activeSessions = metrics.activeSessions.filter((session) => session.locationId === locationId).map((session) => [
    session.id,
    session.driverName,
    session.chargerId,
    `${session.consumedAmount.toFixed(2)}`,
    session.payment.status
  ]);

  const waitingQueue = metrics.queue
    .filter((entry) => entry.status === 'waiting' && entry.locationId === locationId)
    .map((entry) => [entry.id, entry.driverName, entry.chargerPreference, entry.status]);

  return {
    html: renderDesktopShell({
      activePath: 'simulator',
      menu,
      profile: 'SIMULADOR',
      title: 'Simulador administrativo da apresentacao',
      subtitle:
        'Ferramenta interna de demonstracao. Nao aparece para usuarios comuns e nao envia comandos fisicos reais.',
      userName: user?.name ?? 'Equipe Demo',
      content: `
        <section class="surface panel" data-testid="admin-simulator-panel">
          ${sectionHeader({ title: 'Controles rapidos da demo', subtitle: 'Todas as simulacoes alteram a mesma fonte usada pelos tres perfis.' })}
          <form class="inline-form simulator-scope" data-form="simulator-scope">
            <label>Estabelecimento<select name="establishmentId">${state.establishments.map((item) => `<option value="${item.id}" ${item.id === establishmentId ? 'selected' : ''}>${item.name}</option>`).join('')}</select></label>
            <label>Ponto<select name="locationId">${availableLocations.map((item) => `<option value="${item.id}" ${item.id === locationId ? 'selected' : ''}>${item.name}</option>`).join('')}</select></label>
            <button type="submit">Aplicar escopo</button>
          </form>
          <p class="sim-note">Escopo atual: ${metrics.establishment.name} · ${location?.name ?? 'Sem ponto cadastrado'}</p>
          <div class="sim-controls-grid">
            <form data-form="admin-start-session" class="sim-form">
              <h3>Iniciar sessao</h3>
              <label>Carregador
                <select name="chargerId">${scopedChargers
                  .map((charger) => `<option value="${charger.id}">${charger.id} (${charger.status})</option>`)
                  .join('')}</select>
              </label>
              <label>Driver
                <input name="driverName" value="Motorista Demo" />
              </label>
              <label>Veiculo
                <input name="vehicle" value="Veiculo Simulado" />
              </label>
              <label>Limite
                <input name="limitAmount" type="number" value="80" />
              </label>
              <label>Pagamento
                <select name="paymentMethod"><option>Cartao</option><option>Pix</option></select>
              </label>
              <button type="submit">Iniciar</button>
            </form>
            <form data-form="admin-set-status" class="sim-form">
              <h3>Status do carregador</h3>
              <label>Carregador
                <select name="chargerId">${scopedChargers
                  .map((charger) => `<option value="${charger.id}">${charger.id}</option>`)
                  .join('')}</select>
              </label>
              <label>Status
                <select name="status">
                  <option value="available">Disponivel</option>
                  <option value="charging">Carregando</option>
                  <option value="reserved">Reservado</option>
                  <option value="limited">Limitado</option>
                  <option value="offline">Offline</option>
                </select>
              </label>
              <label>Potencia atual (kW)
                <input name="currentPowerKw" type="number" value="0" />
              </label>
              <button type="submit">Aplicar</button>
            </form>
            <form data-form="admin-energy" class="sim-form">
              <h3>Ajuste energetico</h3>
              <input type="hidden" name="establishmentId" value="${establishmentId}" /><input type="hidden" name="locationId" value="${locationId}" />
              <label>Demanda base (kW)<input name="baseLoadKw" type="number" value="${energy.baseLoadKw}" /></label>
              <label>Geracao solar (kW)<input name="solarKw" type="number" value="${energy.solarKw}" /></label>
              <label>SOC bateria (%)<input name="batterySocPercent" type="number" value="${energy.batterySocPercent}" /></label>
              <button type="submit">Atualizar energia</button>
            </form>
            <form data-form="admin-queue" class="sim-form">
              <h3>Fila e pagamento</h3>
              <input type="hidden" name="establishmentId" value="${establishmentId}" /><input type="hidden" name="locationId" value="${locationId}" />
              <label>Nome motorista<input name="driverName" value="Segundo Motorista" /></label>
              <label>Veiculo<input name="vehicle" value="Sedan EV" /></label>
              <label>Preferencia de carregador
                <select name="chargerPreference">${scopedChargers
                  .map((charger) => `<option value="${charger.id}">${charger.id}</option>`)
                  .join('')}</select>
              </label>
              <button type="submit">Adicionar fila</button>
              <div class="sim-inline-buttons">
                <button type="button" data-action="set-payment-status" data-status="Aprovado">Pagamentos: Aprovado</button>
                <button type="button" data-action="set-payment-status" data-status="Recusado">Pagamentos: Recusado</button>
              </div>
              <div class="sim-inline-buttons">
                <button type="button" data-action="simulate-peak" data-establishment-id="${establishmentId}" data-location-id="${locationId}">Gerar pico</button>
                <button type="button" data-action="simulate-critical" data-establishment-id="${establishmentId}" data-location-id="${locationId}">Gerar critico</button>
                <button type="button" data-action="simulate-favorable" data-establishment-id="${establishmentId}" data-location-id="${locationId}">Favoravel</button>
              </div>
            </form>
          </div>
        </section>
        <section class="surface panel">
          ${sectionHeader({ title: 'Sessoes ativas', subtitle: 'Controle de encerramento manual da demonstracao.' })}
          ${simpleTable({
            columns: ['Sessao', 'Motorista', 'Carregador', 'Valor atual', 'Pagamento', 'Acao'],
            rows: activeSessions.map((row) => [
              row[0],
              row[1],
              row[2],
              `R$ ${row[3]}`,
              row[4],
              `<button data-action="finish-session" data-session-id="${row[0]}">Encerrar</button>`
            ])
          })}
        </section>
        <section class="surface panel">
          ${sectionHeader({ title: 'Fila atual', subtitle: 'Itens aguardando liberacao de carregador.' })}
          ${simpleTable({
            columns: ['ID', 'Usuario', 'Carregador provavel', 'Status'],
            rows: waitingQueue
          })}
        </section>`
    }),
    page: 'admin'
  };
}

