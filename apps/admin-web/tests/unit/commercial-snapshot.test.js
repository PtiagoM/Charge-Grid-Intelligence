import { ChargerCommercialStatus, CommercialSessionStatus, PaymentStatus } from '@chargegrid/shared';
import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../src/fixtures/adminDemo.js';
import { mergeCommercialSnapshot } from '../../src/services/commercialSnapshotRepository.js';

describe('mergeCommercialSnapshot', () => {
  it('projeta a mesma sessao e codigo de carregador no Admin', () => {
    const snapshot = {
      generatedAt: '2026-09-22T12:00:00.000Z',
      establishments: [{
        id: 'est_aurora_001', name: 'Hub Solar Aurora', address: 'Av. Mercurio, 420', latitude: -23.55, longitude: -46.63, tariffCents: 190, qrSlug: 'aurora',
        chargers: [{ id: '00000000-0000-4000-8000-000000000001', code: 'AURORA-01', establishmentId: 'est_aurora_001', name: 'Aurora 01', parkingSpot: 'A01', nominalPowerKw: 7, currentPowerKw: 0, physicalStatus: 'AVAILABLE', commercialStatus: ChargerCommercialStatus.OCCUPIED, published: true, qrIdentifier: 'aurora-01', updatedAt: '2026-09-22T12:00:00.000Z' }]
      }],
      sessions: [{
        id: '10000000-0000-4000-8000-000000000001', publicCode: 'CG-10000000', driverName: 'Visitante', establishmentId: 'est_aurora_001', establishmentName: 'Hub Solar Aurora', chargerId: 'AURORA-01', chargerCode: 'AURORA-01', chargerName: 'Aurora 01', parkingSpot: 'A01', status: CommercialSessionStatus.WAITING_START, tariffCents: 190, authorizedCents: 2500, energyWh: 0, costCents: 0, currentPowerKw: 0, createdAt: '2026-09-22T12:00:00.000Z', updatedAt: '2026-09-22T12:00:00.000Z', payment: { paymentIntentId: 'pi_test', method: 'CARD', status: PaymentStatus.AUTHORIZED, providerStatus: 'requires_capture', authorizedCents: 2500, capturedCents: 0 }
      }]
    };

    const state = mergeCommercialSnapshot(createInitialState(), snapshot);
    expect(state.chargers.find((charger) => charger.id === 'AURORA-01')?.internalId).toBe('00000000-0000-4000-8000-000000000001');
    expect(state.sessions.find((session) => session.id === 'CG-10000000')).toEqual(expect.objectContaining({ chargerId: 'AURORA-01', status: 'authorized' }));
    expect(state.paymentTransactions.find((payment) => payment.providerReference === 'pi_test')).toEqual(expect.objectContaining({ sessionId: 'CG-10000000', status: 'AUTHORIZED', authorizedCents: 2500 }));
    expect(state.accessGrants.find((grant) => grant.role === 'GOODWE_CENTRAL')?.establishmentIds).toContain('est_aurora_001');
  });
});
