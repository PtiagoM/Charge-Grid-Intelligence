import { ChargerCommercialStatus, CommercialSessionStatus, PaymentStatus } from '@chargegrid/shared';
import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../src/fixtures/adminDemo.js';
import { mergeCommercialSnapshot } from '../../src/services/commercialSnapshotRepository.js';
import { catalogWithCommercialPlants } from '../../src/services/goodwePlantCatalogRepository.js';

describe('mergeCommercialSnapshot', () => {
  it('projeta a mesma sessao e codigo de carregador no Admin', () => {
    const snapshot = {
      contractVersion: 'S4-C1',
      generatedAt: '2026-09-22T12:00:00.000Z',
      establishments: [{
        id: 'est_aurora_001', name: 'Hub Solar Aurora', address: 'Av. Mercurio, 420', latitude: -23.55, longitude: -46.63, tariffCents: 190, qrSlug: 'aurora', plantId: 'plant_aurora_001', timezone: 'America/Sao_Paulo', openingHours: [{ day: 0, opens: '00:00', closes: '24:00' }], published: true, availableChargerCount: 1, queueSummary: { establishmentId: 'est_aurora_001', activeCount: 0, commercialAvailability: 'OPEN_AVAILABLE' },
        chargers: [{ id: '00000000-0000-4000-8000-000000000001', code: 'AURORA-01', establishmentId: 'est_aurora_001', plantId: 'plant_aurora_001', name: 'Aurora 01', parkingSpot: 'A01', nominalPowerKw: 7, currentPowerKw: 0, physicalStatus: 'AVAILABLE', commercialStatus: ChargerCommercialStatus.OCCUPIED, published: true, qrIdentifier: 'aurora-01', currentSessionId: '10000000-0000-4000-8000-000000000001', assignmentId: null, updatedAt: '2026-09-22T12:00:00.000Z' }]
      }],
      sessions: [{
        id: '10000000-0000-4000-8000-000000000001', publicCode: 'CG-10000000', driverName: 'Visitante', establishmentId: 'est_aurora_001', establishmentName: 'Hub Solar Aurora', chargerId: '00000000-0000-4000-8000-000000000001', chargerCode: 'AURORA-01', chargerName: 'Aurora 01', parkingSpot: 'A01', status: CommercialSessionStatus.WAITING_START, tariffCents: 190, actorType: 'GUEST', quote: null, authorizedCents: 2500, energyWh: 0, costCents: 0, energyCostCents: 0, idleCostCents: 0, totalCostCents: 0, currentPowerKw: 0, energyEndedAt: null, disconnectedAt: null, settledAt: null, idleGraceEndsAt: null, endReason: null, transitionReason: null, pendingCommandId: null, createdAt: '2026-09-22T12:00:00.000Z', updatedAt: '2026-09-22T12:00:00.000Z', payment: { id: 'pay-001', paymentIntentId: 'pi_test', method: 'CARD', status: PaymentStatus.AUTHORIZED, providerStatus: 'requires_capture', authorizedCents: 2500, capturedCents: 0, refundedCents: 0, pendingOperation: null, lastErrorCode: null }
      }],
      tariffs: [{ id: 'tariff-aurora-v1', establishmentId: 'est_aurora_001', energyCentsPerKwh: 190, solarEnergyCentsPerKwh: null, idleGraceMinutes: 15, idleCentsPerMinute: 50, idleMaxMinutes: 60, idleEnabled: true, validFrom: '2026-09-22T12:00:00.000Z', createdAt: '2026-09-22T12:00:00.000Z', reason: 'Tarifa Aurora' }],
      queue: []
    };

    const state = mergeCommercialSnapshot(createInitialState(), snapshot);
    expect(state.chargers.find((charger) => charger.id === '00000000-0000-4000-8000-000000000001')).toEqual(expect.objectContaining({ identifier: 'AURORA-01', parkingSpot: 'A01', currentSessionId: '10000000-0000-4000-8000-000000000001' }));
    expect(state.establishments.find((item) => item.id === 'est_aurora_001')?.clientId).not.toBe('cli-fiap');
    expect(state.sessions.find((session) => session.id === '10000000-0000-4000-8000-000000000001')).toEqual(expect.objectContaining({ publicCode: 'CG-10000000', chargerId: '00000000-0000-4000-8000-000000000001', status: 'authorized' }));
    expect(state.paymentTransactions.find((payment) => payment.providerReference === 'pi_test')).toEqual(expect.objectContaining({ id: 'pay-001', sessionId: '10000000-0000-4000-8000-000000000001', status: 'AUTHORIZED', settlementStatus: 'PENDING', authorizedCents: 2500, refundedCents: 0 }));
    expect(catalogWithCommercialPlants(state).find((plant) => plant.id === 'plant_aurora_001')).toEqual(expect.objectContaining({ name: 'Hub Solar Aurora', source: 'COMMERCIAL_API', evChargers: [expect.objectContaining({ id: '00000000-0000-4000-8000-000000000001', code: 'AURORA-01' })] }));
    expect(state.tariffPolicies.find((tariff) => tariff.id === 'tariff-aurora-v1')).toEqual(expect.objectContaining({ status: 'ACTIVE', energyPriceCentsPerKwh: 190, idleGraceMinutes: 15 }));
    expect(state.accessGrants.find((grant) => grant.role === 'GOODWE_CENTRAL')?.establishmentIds).toContain('est_aurora_001');

    const insights = mergeCommercialSnapshot(createInitialState(), snapshot, {
      alerts: [{ id: 'insight_telemetry', kind: 'ALERT', type: 'TELEMETRY_STALE', entityId: 'plant_aurora_001', sourceEventId: null, sampleId: null, policyVersion: 'demand-v1', conditionActive: true, severity: 'WARNING', reasonCode: 'TELEMETRY_UNAVAILABLE', message: 'Telemetria expirada.', evidence: ['Sem amostra recente.'], suggestedAction: 'OPEN_ENERGY', reviewState: 'OPEN', createdAt: '2026-09-22T11:59:00.000Z', updatedAt: '2026-09-22T12:00:00.000Z' }],
      recommendations: [{ id: 'insight_solar', kind: 'RECOMMENDATION', type: 'SOLAR_OPPORTUNITY', entityId: 'plant_aurora_001', sourceEventId: null, sampleId: 'sample-001', policyVersion: 's4-quote-v1', conditionActive: true, severity: 'INFO', reasonCode: 'SOLAR_SURPLUS', message: 'Há excedente solar.', evidence: ['Excedente: 10.0 kW.'], suggestedAction: 'OPEN_ENERGY', reviewState: 'ACCEPTED', createdAt: '2026-09-22T11:59:00.000Z', updatedAt: '2026-09-22T12:00:00.000Z' }]
    });
    expect(insights.incidents).toContainEqual(expect.objectContaining({ id: 'insight_telemetry', establishmentId: 'est_aurora_001', category: 'COMMUNICATION' }));
    expect(insights.incidentEvents).toContainEqual(expect.objectContaining({ incidentId: 'insight_telemetry', type: 'CREATED', at: '2026-09-22T11:59:00.000Z' }));
    expect(insights.recommendations).toContainEqual(expect.objectContaining({ id: 'insight_solar', status: 'ACCEPTED', proposedAction: 'OPEN_ENERGY' }));

    const resolved = mergeCommercialSnapshot(createInitialState(), snapshot, {
      alerts: [{ id: 'insight_telemetry', kind: 'ALERT', type: 'TELEMETRY_STALE', entityId: 'plant_aurora_001', sourceEventId: null, sampleId: null, policyVersion: 'demand-v1', conditionActive: false, severity: 'WARNING', reasonCode: 'TELEMETRY_RECOVERED', message: 'Telemetria restabelecida.', evidence: [], suggestedAction: 'OPEN_ENERGY', reviewState: 'RESOLVED', decidedAt: '2026-09-22T12:01:00.000Z', decidedBy: 'Operação ChargeGrid', decisionReason: 'Leitura validada.', createdAt: '2026-09-22T11:59:00.000Z', updatedAt: '2026-09-22T12:01:00.000Z' }],
      recommendations: []
    });
    expect(resolved.incidents).toContainEqual(expect.objectContaining({ id: 'insight_telemetry', status: 'RESOLVED', resolvedAt: '2026-09-22T12:01:00.000Z', resolution: 'Leitura validada.' }));

    const completedEnergy = mergeCommercialSnapshot(createInitialState(), {
      ...snapshot,
      establishments: [{ ...snapshot.establishments[0], chargers: [{ ...snapshot.establishments[0].chargers[0], physicalStatus: 'CONNECTED' }] }],
      sessions: [{ ...snapshot.sessions[0], status: CommercialSessionStatus.ENERGY_FINISHED, energyWh: 3500, costCents: 665 }],
      queue: [{ id: 'queue-001', driverId: 'driver-001', driverName: 'Motorista', driverVehicle: 'Veiculo', establishmentId: 'est_aurora_001', establishmentName: 'Hub Solar Aurora', status: 'WAITING', position: 2, joinedAt: '2026-09-22T12:00:00.000Z', sessionId: null, estimatedWaitMinutes: 12 }]
    });
    expect(completedEnergy.sessions.find((session) => session.id === '10000000-0000-4000-8000-000000000001')).toEqual(expect.objectContaining({ publicCode: 'CG-10000000', status: 'energy_finished', energyKwh: 3.5, consumedAmount: 6.65 }));
    expect(completedEnergy.queue.find((entry) => entry.id === 'queue-001')).toEqual(expect.objectContaining({ position: 2, estimatedWaitMinutes: 12 }));

    const allConnected = mergeCommercialSnapshot(createInitialState(), {
      ...snapshot,
      establishments: [{ ...snapshot.establishments[0], chargers: Array.from({ length: 6 }, (_, index) => ({ ...snapshot.establishments[0].chargers[0], id: `charger-${index + 1}`, code: `AURORA-0${index + 1}`, parkingSpot: `A0${index + 1}`, physicalStatus: 'CONNECTED', currentSessionId: null })) }]
    });
    expect(allConnected.chargers.filter((charger) => charger.establishmentId === 'est_aurora_001' && charger.status === 'available')).toHaveLength(0);

    const faulted = mergeCommercialSnapshot(createInitialState(), {
      ...snapshot,
      establishments: [{ ...snapshot.establishments[0], chargers: [{ ...snapshot.establishments[0].chargers[0], physicalStatus: 'FAULT' }] }]
    });
    expect(faulted.chargers.find((charger) => charger.identifier === 'AURORA-01')).toMatchObject({ id: '00000000-0000-4000-8000-000000000001', status: 'fault' });
  });

  it('nao promove sessao historica a sessao atual de um conector reconectado', () => {
    const snapshot = {
      contractVersion: 'S4-C1', generatedAt: '2026-09-22T12:10:00.000Z',
      establishments: [{ id: 'est_aurora_001', name: 'Hub Solar Aurora', address: 'Av. Mercurio, 420', latitude: -23.55, longitude: -46.63, tariffCents: 190, qrSlug: 'aurora', plantId: 'plant_aurora_001', timezone: 'America/Sao_Paulo', openingHours: [], published: true, availableChargerCount: 0, queueSummary: { establishmentId: 'est_aurora_001', activeCount: 0, commercialAvailability: 'OPEN_PARTIAL' }, chargers: [{ id: 'charger-001', code: 'AURORA-01', establishmentId: 'est_aurora_001', plantId: 'plant_aurora_001', name: 'Aurora 01', parkingSpot: 'B02', nominalPowerKw: 7, currentPowerKw: 0, physicalStatus: 'CONNECTED', commercialStatus: ChargerCommercialStatus.OCCUPIED, published: true, qrIdentifier: 'aurora-01', currentSessionId: null, assignmentId: null, updatedAt: '2026-09-22T12:10:00.000Z' }] }],
      sessions: [{ id: 'session-old', publicCode: 'CG-OLD', driverName: 'Visitante', establishmentId: 'est_aurora_001', establishmentName: 'Hub Solar Aurora', chargerId: 'charger-001', chargerCode: 'AURORA-01', chargerName: 'Aurora 01', parkingSpot: 'B02', status: CommercialSessionStatus.COMPLETED, tariffCents: 190, actorType: 'GUEST', quote: null, authorizedCents: 2500, energyWh: 3500, costCents: 665, energyCostCents: 665, idleCostCents: 0, totalCostCents: 665, currentPowerKw: 0, energyEndedAt: '2026-09-22T12:05:00.000Z', disconnectedAt: '2026-09-22T12:06:00.000Z', settledAt: '2026-09-22T12:07:00.000Z', idleGraceEndsAt: null, endReason: null, transitionReason: null, pendingCommandId: null, createdAt: '2026-09-22T12:00:00.000Z', updatedAt: '2026-09-22T12:07:00.000Z', payment: { id: 'pay-old', paymentIntentId: 'pi_old', method: 'CARD', status: PaymentStatus.PAID, providerStatus: 'succeeded', authorizedCents: 2500, capturedCents: 665, refundedCents: 0, pendingOperation: null, lastErrorCode: null } }],
      tariffs: [{ id: 'tariff-aurora-v1', establishmentId: 'est_aurora_001', energyCentsPerKwh: 190, solarEnergyCentsPerKwh: null, idleGraceMinutes: 15, idleCentsPerMinute: 50, idleMaxMinutes: 60, idleEnabled: true, validFrom: '2026-09-22T12:00:00.000Z', createdAt: '2026-09-22T12:00:00.000Z', reason: 'Tarifa Aurora' }],
      queue: []
    };

    const state = mergeCommercialSnapshot(createInitialState(), snapshot);
    expect(state.chargers.find((charger) => charger.id === 'charger-001')).toEqual(expect.objectContaining({ identifier: 'AURORA-01', status: 'connected', parkingSpot: 'B02', currentSessionId: null }));
    expect(state.sessions.find((session) => session.id === 'session-old')).toEqual(expect.objectContaining({ publicCode: 'CG-OLD', status: 'finished' }));
    expect(state.paymentTransactions.find((transaction) => transaction.sessionId === 'session-old')).toEqual(expect.objectContaining({ id: 'pay-old', status: 'CAPTURED', settlementStatus: 'PAID', capturedCents: 665 }));
    expect(state.sessionEvents.filter((event) => event.sessionId === 'session-old').map((event) => event.type)).toEqual(expect.arrayContaining(['ENERGY_FINISHED', 'PAYMENT_CAPTURED']));
    expect(state.financialEvents.filter((event) => event.transactionId === 'pay-old').map((event) => event.type)).toEqual(expect.arrayContaining(['AUTHORIZED', 'CAPTURED', 'SETTLED']));
  });
});
