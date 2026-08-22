export interface MapLocation {
  location: { id: string; name?: string };
  status: { offline: number };
  position: { lat: number; lng: number };
}

export interface MapCluster {
  id: string;
  locations: MapLocation[];
  position: { lat: number; lng: number };
  isCluster: boolean;
  hasOffline: boolean;
}

const MIN_WORLD_ZOOM = 3.25;
const CLUSTER_PIXEL_RADIUS = 64;

function projectPositionToPixel(position: MapLocation["position"], zoom: number) {
  const scale = 256 * 2 ** zoom;
  const siny = Math.max(-0.9999, Math.min(0.9999, Math.sin((position.lat * Math.PI) / 180)));
  return {
    x: scale * (0.5 + position.lng / 360),
    y: scale * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI))
  };
}

function centerOfLocations(locations: MapLocation[]) {
  const total = locations.reduce(
    (acc, item) => ({ lat: acc.lat + item.position.lat, lng: acc.lng + item.position.lng }),
    { lat: 0, lng: 0 }
  );
  return { lat: total.lat / locations.length, lng: total.lng / locations.length };
}

export function buildVisibleMapClusters(mapLocations: MapLocation[], zoom = MIN_WORLD_ZOOM): MapCluster[] {
  const clusters: Array<{ locations: MapLocation[]; position: MapLocation["position"]; pixel: { x: number; y: number } }> = [];

  mapLocations.forEach((item) => {
    const pixel = projectPositionToPixel(item.position, zoom);
    const nearby = clusters.find((cluster) => Math.hypot(cluster.pixel.x - pixel.x, cluster.pixel.y - pixel.y) <= CLUSTER_PIXEL_RADIUS);
    if (nearby) {
      nearby.locations.push(item);
      nearby.position = centerOfLocations(nearby.locations);
      nearby.pixel = projectPositionToPixel(nearby.position, zoom);
    } else {
      clusters.push({ locations: [item], position: item.position, pixel });
    }
  });

  return clusters.map((cluster) => ({
    id: cluster.locations.map((item) => item.location.id).sort().join("__"),
    locations: cluster.locations,
    position: cluster.position,
    isCluster: cluster.locations.length > 1,
    hasOffline: cluster.locations.some((item) => item.status.offline > 0)
  }));
}
