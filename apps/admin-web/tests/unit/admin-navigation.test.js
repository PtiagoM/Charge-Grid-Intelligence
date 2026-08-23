import { describe, expect, it } from 'vitest';
import { ADMIN_DOMAINS, getAdminContextLinks, getAdminDomainForRoute, getAdminEntryRoute } from '../../src/app/adminNavigation.js';
import { getAdminCapabilities, hasAdminCapability } from '../../src/domain/adminCapabilities.js';

describe('admin navigation', () => {
  it('mantém somente os seis domínios primários', () => {
    expect(ADMIN_DOMAINS.map((domain) => domain.id)).toEqual([
      'overview',
      'network',
      'operations',
      'energy',
      'commercial',
      'intelligence'
    ]);
  });

  it('resolve rotas profundas para o domínio pai', () => {
    expect(getAdminDomainForRoute('client')?.id).toBe('network');
    expect(getAdminDomainForRoute('ticket')?.id).toBe('operations');
    expect(getAdminDomainForRoute('invoices')?.id).toBe('commercial');
  });

  it('aplica capacidades distintas para GoodWe e estabelecimento', () => {
    const network = ADMIN_DOMAINS.find((domain) => domain.id === 'network');
    expect(network).toBeDefined();
    expect(getAdminEntryRoute(network, 'GOODWE')).toBe('clients');
    expect(getAdminEntryRoute(network, 'ESTABELECIMENTO')).toBe('locations');
    expect(getAdminContextLinks(network, 'GOODWE').map((item) => item.route)).toEqual(['clients', 'establishments', 'locations', 'chargers', 'plants']);
    expect(getAdminContextLinks(network, 'ESTABELECIMENTO').map((item) => item.route)).toEqual(['locations', 'chargers']);
    const commercial = ADMIN_DOMAINS.find((domain) => domain.id === 'commercial');
    expect(getAdminContextLinks(commercial, 'GOODWE').map((item) => item.route)).toEqual(['pricing', 'finance', 'contracts']);
    expect(getAdminContextLinks(commercial, 'ESTABELECIMENTO').map((item) => item.route)).toEqual(['pricing', 'finance', 'contract', 'documents']);
    expect(hasAdminCapability('ESTABELECIMENTO', 'network:portfolio')).toBe(false);
    expect(getAdminCapabilities('GOODWE')).toContain('governance:audit');

    const operator = { id: 'operator', profile: 'ESTABELECIMENTO', role: 'ESTABLISHMENT_OPERATOR' };
    const reporter = { id: 'reporter', profile: 'ESTABELECIMENTO', role: 'REPORT_VIEWER' };
    const intelligence = ADMIN_DOMAINS.find((domain) => domain.id === 'intelligence');
    expect(getAdminContextLinks(commercial, operator)).toEqual([]);
    expect(getAdminContextLinks(intelligence, reporter).map((item) => item.route)).toEqual(['reports']);
    expect(getAdminEntryRoute(intelligence, reporter)).toBe('reports');
  });
});
