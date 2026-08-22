import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../src/fixtures/adminDemo.js';
import { normalizeAdminState } from '../../src/services/adminStateRepository.js';

describe('normalizeAdminState', () => {
  it('migra fixtures antigas para a fronteira administrativa atual', () => {
    const fallback = createInitialState();
    const stale = structuredClone(fallback);
    stale.accounts.push({ id: 'old-driver', email: 'driver@example.test', password: 'x', profile: 'USUARIO', displayName: 'Driver' });
    delete stale.energy[0].demandKw;
    delete stale.energy[0].contractedLimitKw;
    delete stale.commercialPlants;
    delete stale.plantOnboardingDraft;
    delete stale.chargerTelemetry;
    delete stale.chargerCommands;
    delete stale.sessionEvents;
    delete stale.queueEvents;
    delete stale.energyPolicies;
    delete stale.tariffPolicies;
    delete stale.paymentTransactions;
    delete stale.financialEvents;
    stale.sessions[0].chargerId = 'charger-that-does-not-exist';

    const result = normalizeAdminState(stale, fallback);

    expect(result.accounts.map((item) => item.profile)).toEqual(['GOODWE', 'ESTABELECIMENTO']);
    expect(result.energy[0].demandKw).toBe(76);
    expect(result.energy[0].contractedLimitKw).toBe(100);
    expect(result.chargers.some((item) => item.id === result.sessions[0].chargerId)).toBe(true);
    expect(result.commercialPlants).toHaveLength(fallback.commercialPlants.length);
    expect(result.plantOnboardingDraft).toEqual(fallback.plantOnboardingDraft);
    expect(result.chargerTelemetry).toEqual(fallback.chargerTelemetry);
    expect(result.chargerCommands).toEqual(fallback.chargerCommands);
    expect(result.sessionEvents).toEqual(fallback.sessionEvents);
    expect(result.queueEvents).toEqual(fallback.queueEvents);
    expect(result.energyPolicies).toEqual(fallback.energyPolicies);
    expect(result.tariffPolicies).toEqual(fallback.tariffPolicies);
    expect(result.paymentTransactions).toEqual(fallback.paymentTransactions);
    expect(result.financialEvents).toEqual(fallback.financialEvents);
  });
});
