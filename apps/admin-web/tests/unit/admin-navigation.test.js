import { describe, expect, it } from 'vitest';
import { ADMIN_DOMAINS, getAdminContextLinks, getAdminDomainForRoute, getAdminEntryRoute } from '../../src/app/adminNavigation.js';
import { getAdminCapabilities, hasAdminCapability } from '../../src/domain/adminCapabilities.js';

const semsOwner = { id: 'owner', profile: 'ESTABELECIMENTO', semsAccountType: 'OWNER' };
const establishmentAdmin = { ...semsOwner, id: 'est-admin', role: 'ESTABLISHMENT_ADMIN' };
const central = { id: 'central', profile: 'GOODWE', semsAccountType: 'DISTRIBUTOR_INSTALLER', role: 'GOODWE_CENTRAL' };
const consultant = { ...central, id: 'consultant', role: 'GOODWE_PORTFOLIO_MANAGER' };
const technician = { ...central, id: 'technician', role: 'GOODWE_TECH_SUPPORT', semsOrganizationFunction: 'TECHNICIAN' };

describe('admin navigation', () => {
  it('mantém as superfícies principais do SEMS+', () => {
    expect(ADMIN_DOMAINS.map((domain) => domain.id)).toEqual([
      'overview',
      'plants',
      'devices',
      'alarms',
      'reports',
      'analysis',
      'service',
      'organization'
    ]);
  });

  it('resolve rotas profundas para a superfície SEMS+ correspondente', () => {
    expect(getAdminDomainForRoute('client')?.id).toBe('plants');
    expect(getAdminDomainForRoute('ticket')?.id).toBe('service');
    expect(getAdminDomainForRoute('invoices')?.id).toBe('reports');
    expect(getAdminDomainForRoute('financial-session')?.id).toBe('reports');
  });

  it('mantém a conta SEMS comum e adiciona ChargeGrid por responsabilidade', () => {
    const plants = ADMIN_DOMAINS.find((domain) => domain.id === 'plants');
    const devices = ADMIN_DOMAINS.find((domain) => domain.id === 'devices');
    const reports = ADMIN_DOMAINS.find((domain) => domain.id === 'reports');

    expect(getAdminEntryRoute(plants, semsOwner)).toBe('plants');
    expect(getAdminContextLinks(plants, semsOwner).map((item) => item.route)).toEqual(['plants']);
    expect(getAdminContextLinks(plants, central).map((item) => item.route)).toEqual(['plants', 'clients']);
    expect(getAdminContextLinks(plants, consultant).map((item) => item.route)).toEqual(['plants', 'plant-onboarding', 'clients', 'contracts']);
    expect(getAdminContextLinks(plants, establishmentAdmin).map((item) => item.route)).toEqual(['plants', 'plant-onboarding', 'contracts']);
    expect(getAdminContextLinks(devices, technician).map((item) => item.route)).toEqual(['chargers']);
    expect(getAdminContextLinks(reports, central).map((item) => item.route)).toEqual(['reports', 'finance', 'pricing']);

    expect(hasAdminCapability(semsOwner, 'commercial:read')).toBe(false);
    expect(hasAdminCapability(technician, 'commercial:read')).toBe(false);
    expect(hasAdminCapability(consultant, 'operations:monitor')).toBe(false);
    expect(getAdminCapabilities(central)).toContain('governance:audit');
  });
});
