import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../src/fixtures/adminDemo.js';
import { callNextDriver, confirmQueueArrival, enqueueDriver, markQueueNoShow, queuePosition, releaseQueueEntry } from '../../src/domain/queueOperations.js';

const NOW = '2026-08-22T12:00:00-03:00';

function account(state, id = 'acc-est-fiap') {
  return state.accounts.find((item) => item.id === id);
}

describe('queue operations', () => {
  it('chama em FIFO e sugere carregador compativel sem reserva tecnica', () => {
    const initial = createInitialState();
    const transition = callNextDriver(initial, account(initial), 'est-fiap', NOW);

    expect(transition.ok).toBe(true);
    expect(transition.entry).toMatchObject({ id: 'Q-001', status: 'called', suggestedChargerId: 'CG-FIAP-03' });
    expect(transition.state.chargers.find((item) => item.id === 'CG-FIAP-03')?.status).toBe('available');
    expect(transition.state.queueEvents.at(-1)).toMatchObject({ type: 'CALLED', queueEntryId: 'Q-001' });
    expect(queuePosition(transition.state, 'Q-002')).toEqual({ position: 1, estimatedWaitMinutes: 18 });
  });

  it('impede chamadas concorrentes no mesmo estabelecimento', () => {
    const initial = createInitialState();
    const first = callNextDriver(initial, account(initial), 'est-fiap', NOW);
    const second = callNextDriver(first.state, account(first.state), 'est-fiap', NOW);

    expect(second.ok).toBe(false);
    expect(second.issues).toContain('Ja existe um motorista em janela de chamada neste estabelecimento.');
  });

  it('confirma chegada, conclui admissao e preserva o historico', () => {
    const initial = createInitialState();
    const called = callNextDriver(initial, account(initial), 'est-fiap', NOW);
    const assigned = confirmQueueArrival(called.state, account(called.state), 'Q-001', '2026-08-22T12:03:00-03:00');
    const released = releaseQueueEntry(assigned.state, account(assigned.state), 'Q-001', '2026-08-22T12:04:00-03:00');

    expect(assigned.entry?.status).toBe('assigned');
    expect(released.entry?.status).toBe('released');
    expect(released.state.queueEvents.filter((item) => item.queueEntryId === 'Q-001').map((item) => item.type)).toEqual(['JOINED', 'CALLED', 'ASSIGNED', 'RELEASED']);
  });

  it('registra no-show somente depois da janela expirar', () => {
    const initial = createInitialState();
    const called = callNextDriver(initial, account(initial), 'est-fiap', NOW);
    const early = markQueueNoShow(called.state, account(called.state), 'Q-001', '2026-08-22T12:04:00-03:00');
    const expired = markQueueNoShow(called.state, account(called.state), 'Q-001', '2026-08-22T12:11:00-03:00');

    expect(early.issues).toContain('A janela de chamada ainda esta ativa.');
    expect(expired.entry?.status).toBe('no_show');
  });

  it('isola estabelecimentos e evita duas filas ativas para o mesmo motorista', () => {
    const initial = createInitialState();
    const outside = callNextDriver(initial, account(initial), 'est-goodwe-shanghai', NOW);
    expect(outside.issues).toContain('Perfil sem permissao para gerenciar esta fila.');

    const duplicate = enqueueDriver(initial, {
      id: 'Q-duplicate', driverId: 'driver-marcos-queue', establishmentId: 'est-fiap', locationId: 'loc-fiap-aclimacao', driverName: 'Marcos Silva', vehicle: 'GWM Ora 03', requiredConnector: 'TYPE_2'
    }, NOW);
    expect(duplicate.issues).toContain('Motorista ja possui uma entrada ativa em fila.');
  });

  it('bloqueia chamada quando nenhum conector compativel esta disponivel', () => {
    const initial = createInitialState();
    const state = { ...initial, queue: initial.queue.map((item) => item.establishmentId === 'est-fiap' ? { ...item, requiredConnector: 'CCS_2' } : item) };
    const result = callNextDriver(state, account(state), 'est-fiap', NOW);
    expect(result.issues).toContain('Nao ha carregador compativel e disponivel para a proxima chamada.');
  });
});
