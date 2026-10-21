import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../src/fixtures/adminDemo.js';
import { GOODWE_PLANT_CATALOG } from '../../src/fixtures/goodwePlantCatalog.js';
import { createEmptyPlantOnboardingDraft, publishPlantOnboarding, validatePlantOnboarding } from '../../src/domain/plantOnboarding.js';

function validDraft(overrides = {}) {
  return {
    ...createEmptyPlantOnboardingDraft(),
    plantId: 'gw-plant-fiap-vila-mariana',
    establishmentId: 'est-fiap',
    commercialName: 'Hub FIAP Vila Mariana',
    updatedAt: '2026-08-22T12:00:00-03:00',
    ...overrides
  };
}

describe('plant onboarding', () => {
  it('publica o vínculo e projeta dados técnicos sem recadastro', () => {
    const initial = createInitialState();
    const publication = publishPlantOnboarding(initial, GOODWE_PLANT_CATALOG, validDraft(), '2026-08-22T12:30:00-03:00');

    expect(publication.result).toEqual({ ok: true, issues: [], commercialPlantId: 'cplant-gw-plant-fiap-vila-mariana' });
    expect(publication.state.commercialPlants).toHaveLength(initial.commercialPlants.length + 1);
    expect(publication.state.locations.at(-1)).toMatchObject({
      establishmentId: 'est-fiap',
      name: 'Hub FIAP Vila Mariana',
      address: 'Rua Tito',
      latitude: -23.5891
    });
    expect(publication.state.chargers.slice(-2).map((charger) => charger.serial)).toEqual(['GWVM0001', 'GWVM0002']);
    expect(publication.state.chargers.slice(-2).map((charger) => charger.publicationStatus)).toEqual(['ELIGIBLE', 'ELIGIBLE']);
    expect(publication.state.plantOnboardingDraft.plantId).toBe('');
  });

  it('bloqueia duplicidade, ausência de EV e falta de autorização', () => {
    const state = createInitialState();
    expect(validatePlantOnboarding(state, GOODWE_PLANT_CATALOG, validDraft({ plantId: 'gw-plant-fiap-aclimacao' })).map((issue) => issue.code)).toContain('PLANT_ALREADY_LINKED');
    expect(validatePlantOnboarding(state, GOODWE_PLANT_CATALOG, validDraft({ plantId: 'gw-plant-without-ev' })).map((issue) => issue.code)).toContain('PLANT_WITHOUT_EV');
    expect(validatePlantOnboarding(state, GOODWE_PLANT_CATALOG, validDraft({ plantId: 'gw-plant-denied' })).map((issue) => issue.code)).toContain('PLANT_NOT_AUTHORIZED');
  });

  it('exige configuração comercial consistente', () => {
    const issues = validatePlantOnboarding(createInitialState(), GOODWE_PLANT_CATALOG, validDraft({
      commercialName: ' ',
      alwaysOpen: false,
      opensAt: '22:00',
      closesAt: '08:00'
    }));
    expect(issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(['COMMERCIAL_NAME_REQUIRED', 'OPERATING_HOURS_INVALID']));
  });
});
