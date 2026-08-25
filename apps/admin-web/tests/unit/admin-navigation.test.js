import { describe, expect, it } from 'vitest';
import { ADMIN_DOMAINS, getAdminContextLinks, getAdminDomainForRoute, getAdminEntryRoute } from '../../src/app/adminNavigation.js';
import { getAdminCapabilities, hasAdminCapability } from '../../src/domain/adminCapabilities.js';

const semsOwner = { id: 'owner', profile: 'ESTABELECIMENTO', semsAccountType: 'OWNER' };
const commercialOwner = { ...semsOwner, id: 'commercial-owner', role: 'ESTABLISHMENT_ADMIN' };
const central = { id: 'central', profile: 'GOODWE', semsAccountType: 'DISTRIBUTOR_INSTALLER', role: 'GOODWE_CENTRAL', semsOrganizationFunction: 'ADMINISTRATOR' };
const consultant = { ...central, id: 'consultant', role: 'GOODWE_PORTFOLIO_MANAGER', semsOrganizationFunction: 'NAVIGATOR' };
const technician = { ...central, id: 'technician', role: 'GOODWE_TECH_SUPPORT', semsOrganizationFunction: 'TECHNICIAN' };
const installer = { id: 'installer', profile: 'GOODWE', semsAccountType: 'DISTRIBUTOR_INSTALLER', semsOrganizationFunction: 'ADMINISTRATOR' };

function domain(id) {
  return ADMIN_DOMAINS.find((item) => item.id === id);
}

describe('admin navigation', () => {
  it('mantém as sete superfícies SEMS+ e a camada ChargeGrid separada', () => {
    expect(ADMIN_DOMAINS.map((item) => item.id)).toEqual([
      'overview',
      'plants',
      'devices',
      'chargegrid',
      'alarms',
      'reports',
      'analysis',
      'service',
      'organization'
    ]);
  });

  it('resolve rotas profundas para a superfície correta', () => {
    expect(getAdminDomainForRoute('client')?.id).toBe('plants');
    expect(getAdminDomainForRoute('ticket')?.id).toBe('service');
    expect(getAdminDomainForRoute('financial-session')?.id).toBe('chargegrid');
    expect(getAdminDomainForRoute('pricing')?.id).toBe('organization');
    expect(getAdminDomainForRoute('plant-onboarding')?.id).toBe('organization');
  });

  it('mantém usinas, dispositivos e relatórios livres de fluxos comerciais deslocados', () => {
    expect(getAdminContextLinks(domain('plants'), consultant).map((item) => item.route)).toEqual(['plants', 'clients']);
    expect(getAdminContextLinks(domain('plants'), commercialOwner).map((item) => item.route)).toEqual(['plants']);
    expect(getAdminContextLinks(domain('devices'), commercialOwner).map((item) => item.route)).toEqual(['chargers']);
    expect(getAdminContextLinks(domain('reports'), commercialOwner).map((item) => item.route)).toEqual(['reports']);
  });

  it('libera a entrada operacional somente à conta proprietária comercial', () => {
    expect(getAdminContextLinks(domain('chargegrid'), commercialOwner).map((item) => item.route)).toEqual(['operations', 'sessions', 'queue', 'finance']);
    expect(getAdminContextLinks(domain('chargegrid'), central)).toEqual([]);
    expect(getAdminContextLinks(domain('chargegrid'), consultant)).toEqual([]);
    expect(getAdminContextLinks(domain('chargegrid'), installer)).toEqual([]);
    expect(getAdminContextLinks(domain('chargegrid'), semsOwner)).toEqual([]);
  });

  it('deriva Central do consultor e adiciona somente governança organizacional', () => {
    expect(getAdminCapabilities(consultant)).toContain('commercial:manage');
    expect(getAdminCapabilities(central)).toContain('commercial:manage');
    expect(getAdminCapabilities(central)).toContain('access:manage');
    expect(getAdminCapabilities(central)).toContain('governance:audit');
    expect(hasAdminCapability(central, 'operations:monitor')).toBe(false);
    expect(hasAdminCapability(consultant, 'operations:monitor')).toBe(false);
  });

  it('preserva instalador e proprietário comuns sem concessão ChargeGrid', () => {
    expect(getAdminEntryRoute(domain('plants'), semsOwner)).toBe('plants');
    expect(getAdminContextLinks(domain('organization'), installer).map((item) => item.route)).toEqual(['access']);
    expect(hasAdminCapability(installer, 'commercial:read')).toBe(false);
    expect(hasAdminCapability(semsOwner, 'commercial:read')).toBe(false);
    expect(hasAdminCapability(technician, 'organization:view')).toBe(false);
  });
});
