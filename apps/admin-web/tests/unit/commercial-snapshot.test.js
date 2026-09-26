import { ChargerCommercialStatus, CommercialSessionStatus, PaymentStatus } from '@chargegrid/shared';
import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../src/fixtures/adminDemo.js';
import { mergeCommercialSnapshot } from '../../src/services/commercialSnapshotRepository.js';

describe('mergeCommercialSnapshot', () => {
  it('projeta a mesma sessao e codigo de carregador no Admin', () => {
    const snapshot = {
      contractVersion: 'S4-C1',
      generatedAt: '2026-09-22T12:00:00.000Z',
      establishments: [{
        id: 'est_aurora_001', name: 'Hub Solar Aurora', address: 'Av. Mercurio, 420', latitude: -23.55, longitude: -46.63, tariffCents: 190, qrSlug: 'aurora', plantId: 'plant_aurora_001', timezone: 'America/Sao_Paulo', openingHours: [{ day: 0, opens: '00:00', closes: '24:00' }], published: true, availableChargerCount: 1, queueSummary: { establishmentId: 'est_aurora_001', activeCount: 0, commercialAvailability: 'OPEN_AVAILABLE' },
        chargers: [{ id: '00000000-0000-4000-8000-000000000001', code: 'AURORA-01', establishmentId: 'est_aurora_001', plantId: 'plant_aurora_001', name: 'Aurora 01', parkingSpot: 'A01', nominalPowerKw: 7, currentPowerKw: 0, physicalStatus: 'AVAILABLE', commercialStatus: ChargerCommercialStatus.OCCUPIED, published: true, qrIdentifier: 'aurora-01', currentSessionId: '10000000-0000-4000-0000-000000000001', assignmentId: null, updatedAt: '2026-09-22T12:00:00.000Z' }]
      }],
      sessions: [{
        id: '10000000-0000-4000-8000-000000000001', publicCode: 'CG-10000000', driverName: 'Visitante', establishmentId: 'est_aurora_001', establishmentName: 'Hub Solar Aurora', chargerId: '00000000-0000-4000-8000-000000000001', chargerCode: 'AURORA-01', chargerName: 'Aurora 01', parkingSpot: 'A01', status: CommercialSessionStatus.WAITING_START, tariffCents: 190, actorType: 'GUEST', quote: null, authorizedCents: 2500, energyWh: 0, costCents: 0, energyCostCents: 0, idleCostCents: 0, totalCostCents: 0, currentPowerKw: 0, energyEndedAt: null, disconnectedAt: null, settledAt: null, idleGraceEndsAt: null, endReason: null, transitionReason: null, pendingCommandId: null, createdAt: '2026-09-22T12:00:00.000Z', updatedAt: '2026-09-22T12:00:00.000Z', payment: { id: 'pay-001', paymentIntentId: 'pi_test', method: 'CARD', status: PaymentStatus.AUTHORIZED, providerStatus: 'requires_capture', authorizedCents: 2500, capturedCents: 0, refundedCents: 0, pendingOperation: null, lastErrorCode: null }
      }],
      queue: []
    };

    const state = mergeCommercialSnapshot(createInitialState(), snapshot);
    expect(state.chargers.find((charger) => charger.id === 'AURORA-01')?.internalId).toBe('00000000-0000-4000-8000-000000000001');
    expect(state.sessions.find((session) => session.id === 'CG-10000000')).toEqual(expect.objectContaining({ chargerId: 'AURORA-01', status: 'authorized' }));
    expect(state.paymentTransactions.find((payment) => payment.providerReference === 'pi_test')).toEqual(expect.objectContaining({ sessionId: 'CG-10000000', status: 'AUTHORIZED', authorizedCents: 2500 }));
    expect(state.accessGrants.find((grant) => grant.role === 'GOODWE_CENTRAL')?.establishmentIds).toContain('est_aurora_001');

    const completedEnergy = mergeCommercialSnapshot(createInitialState(), {
      ...snapshot,
      establishments: [{ ...snapshot.establishments[0], chargers: [{ ...snapshot.establishments[0].chargers[0], physicalStatus: 'CONNECTED' }] }],
      sessions: [{ ...snapshot.sessions[0], status: CommercialSessionStatus.ENERGY_FINISHED, energyWh: 3500, costCents: 665 }]
    });
    expect(completedEnergy.sessions.find((session) => session.id === 'CG-10000000')).toEqual(expect.objectContaining({ status: 'finished', energyKwh: 3.5, consumedAmount: 6.65 }));
  });
});
