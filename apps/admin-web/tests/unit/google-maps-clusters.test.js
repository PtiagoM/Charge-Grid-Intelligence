import { describe, expect, it } from 'vitest';

import { buildVisibleMapClusters } from '../../src/services/google-maps.js';

function mapLocation(id, lat, lng) {
  return {
    location: { id, name: id },
    chargers: [{ id: `${id}-charger` }],
    status: { offline: 0 },
    position: { lat, lng }
  };
}

describe('agrupamento de pontos no mapa GoodWe', () => {
  it('conta pontos proximos no zoom distante e separa cada local ao aproximar', () => {
    const saoPauloPoints = [
      mapLocation('pinheiros', -23.5668, -46.6889),
      mapLocation('aclimacao', -23.5746, -46.6232),
      mapLocation('paulista', -23.5617, -46.6559)
    ];

    const farClusters = buildVisibleMapClusters(saoPauloPoints, 3.25);
    const closeClusters = buildVisibleMapClusters(saoPauloPoints, 12);

    expect(farClusters).toHaveLength(1);
    expect(farClusters[0].locations).toHaveLength(3);
    expect(closeClusters).toHaveLength(3);
    expect(closeClusters.every((cluster) => cluster.locations.length === 1)).toBe(true);
  });
});
