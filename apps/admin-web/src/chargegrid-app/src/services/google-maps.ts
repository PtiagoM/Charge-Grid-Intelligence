// @ts-nocheck
const GOOGLE_MAP_ID = 'chargegrid-goodwe-world-map';
const DEFAULT_CENTER = { lat: 10, lng: -20 };
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const MIN_WORLD_ZOOM = 3.25;
const SELECTED_LOCATION_ZOOM = MIN_WORLD_ZOOM;
const SEARCH_RESULT_ZOOM = 9;
const REGIONAL_DETAIL_ZOOM = 5.2;
const CLUSTER_PIXEL_RADIUS = 64;
const WORLD_BOUNDS = {
  north: 84,
  south: -58,
  west: -179.5,
  east: 179.5
};

let googleMapsPromise = null;
let activeMap = null;
let activeMarkers = [];
let activeCountryLabels = [];
let searchMarker = null;

const COUNTRY_LABELS = [
  { name: 'Brasil', position: { lat: -10.8, lng: -52.9 } },
  { name: 'Argentina', position: { lat: -38.4, lng: -63.6 } },
  { name: 'Chile', position: { lat: -30.8, lng: -71.1 } },
  { name: 'Bolivia', position: { lat: -16.3, lng: -63.6 } },
  { name: 'Peru', position: { lat: -9.2, lng: -75.0 } },
  { name: 'Colombia', position: { lat: 4.6, lng: -74.3 } },
  { name: 'Mexico', position: { lat: 23.6, lng: -102.5 } },
  { name: 'Estados Unidos', position: { lat: 39.4, lng: -98.8 } },
  { name: 'Canada', position: { lat: 57.6, lng: -106.3 } },
  { name: 'Portugal', position: { lat: 39.7, lng: -8.0 } },
  { name: 'Espanha', position: { lat: 40.2, lng: -3.7 } },
  { name: 'Franca', position: { lat: 46.2, lng: 2.2 } },
  { name: 'Alemanha', position: { lat: 51.2, lng: 10.4 } },
  { name: 'Italia', position: { lat: 42.8, lng: 12.5 } },
  { name: 'Marrocos', position: { lat: 31.8, lng: -7.1 } },
  { name: 'Argelia', position: { lat: 28.0, lng: 1.6 } },
  { name: 'Nigeria', position: { lat: 9.1, lng: 8.7 } },
  { name: 'Africa do Sul', position: { lat: -30.6, lng: 24.0 } },
  { name: 'China', position: { lat: 35.8, lng: 104.1 } },
  { name: 'Japao', position: { lat: 37.4, lng: 138.2 } },
  { name: 'Australia', position: { lat: -25.3, lng: 134.8 } }
];

const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#101518' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#aeb8bf' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#101518' }] },
  { featureType: 'administrative.country', elementType: 'geometry', stylers: [{ color: '#53616a' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#d5dde1' }] },
  { featureType: 'administrative.province', elementType: 'geometry', stylers: [{ color: '#4c5a62' }] },
  { featureType: 'administrative.province', elementType: 'labels.text.fill', stylers: [{ color: '#9ea9af' }] },
  { featureType: 'locality', elementType: 'labels.text.fill', stylers: [{ color: '#b5bec4' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#0c1012' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#26343c' }] }
];

const countryOnlyMapStyles = [
  ...darkMapStyles,
  { featureType: 'administrative.province', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.province', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.neighborhood', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'locality', elementType: 'labels', stylers: [{ visibility: 'off' }] }
];

function applyDetailLevelForZoom(map) {
  const zoom = map.getZoom() ?? MIN_WORLD_ZOOM;
  map.setOptions({
    styles: zoom >= REGIONAL_DETAIL_ZOOM ? darkMapStyles : countryOnlyMapStyles
  });
  updateCountryLabelVisibility(map);
}

function updateCountryLabelVisibility(map) {
  const showCountriesOnly = (map.getZoom() ?? MIN_WORLD_ZOOM) < REGIONAL_DETAIL_ZOOM;
  activeCountryLabels.forEach((overlay) => overlay.setVisible(showCountriesOnly));
}

function createCountryLabelOverlays(maps, map) {
  return COUNTRY_LABELS.map((item) => {
    class CountryLabelOverlay extends maps.OverlayView {
      constructor() {
        super();
        this.div = null;
        this.visible = true;
      }

      onAdd() {
        this.div = document.createElement('span');
        this.div.className = 'google-country-label';
        this.div.textContent = item.name;
        this.getPanes().overlayLayer.appendChild(this.div);
      }

      draw() {
        const projection = this.getProjection();
        const point = projection.fromLatLngToDivPixel(new maps.LatLng(item.position.lat, item.position.lng));
        if (!this.div || !point) return;
        this.div.style.left = `${point.x}px`;
        this.div.style.top = `${point.y}px`;
        this.div.style.display = this.visible ? 'block' : 'none';
      }

      onRemove() {
        this.div?.remove();
        this.div = null;
      }

      setVisible(visible) {
        this.visible = visible;
        if (this.div) this.div.style.display = visible ? 'block' : 'none';
      }
    }

    const overlay = new CountryLabelOverlay();
    overlay.setMap(map);
    return overlay;
  });
}

function loadGoogleMaps() {
  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(new Error('Google Maps API key ausente.'));
  }

  if (window.google?.maps?.importLibrary) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = `__chargegridGoogleMapsReady_${Date.now()}`;
    const script = document.createElement('script');
    const params = new URLSearchParams({
      key: GOOGLE_MAPS_API_KEY,
      v: 'weekly',
      loading: 'async',
      callback: callbackName
    });

    window[callbackName] = () => {
      delete window[callbackName];
      resolve(window.google.maps);
    };

    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      delete window[callbackName];
      reject(new Error('Nao foi possivel carregar o Google Maps.'));
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function chargerStatusSummary(chargers) {
  return {
    available: chargers.filter((charger) => charger.status === 'available').length,
    charging: chargers.filter((charger) => charger.status === 'charging').length,
    offline: chargers.filter((charger) => charger.status === 'offline').length
  };
}

function getMapLocations(state) {
  return state.locations
    .map((location) => {
      const latitude = Number(location.latitude);
      const longitude = Number(location.longitude);
      const establishment = state.establishments.find((item) => item.id === location.establishmentId);
      const chargers = state.chargers.filter((charger) => charger.locationId === location.id);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !establishment || chargers.length === 0) {
        return null;
      }

      return {
        location,
        establishment,
        chargers,
        status: chargerStatusSummary(chargers),
        position: { lat: latitude, lng: longitude }
      };
    })
    .filter(Boolean);
}

function projectPositionToPixel(position, zoom) {
  const scale = 256 * 2 ** zoom;
  const siny = Math.max(-0.9999, Math.min(0.9999, Math.sin((position.lat * Math.PI) / 180)));

  return {
    x: scale * (0.5 + position.lng / 360),
    y: scale * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI))
  };
}

function distanceBetweenPixels(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function centerOfLocations(locations) {
  const total = locations.reduce(
    (acc, item) => ({
      lat: acc.lat + item.position.lat,
      lng: acc.lng + item.position.lng
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: total.lat / locations.length,
    lng: total.lng / locations.length
  };
}

export function buildVisibleMapClusters(mapLocations, zoom = MIN_WORLD_ZOOM) {
  const clusters = [];

  mapLocations.forEach((item) => {
    const pixel = projectPositionToPixel(item.position, zoom);
    const nearby = clusters.find((cluster) => distanceBetweenPixels(cluster.pixel, pixel) <= CLUSTER_PIXEL_RADIUS);

    if (nearby) {
      nearby.locations.push(item);
      nearby.position = centerOfLocations(nearby.locations);
      nearby.pixel = projectPositionToPixel(nearby.position, zoom);
      return;
    }

    clusters.push({
      id: item.location.id,
      locations: [item],
      position: item.position,
      pixel
    });
  });

  return clusters.map((cluster) => ({
    id: cluster.locations.map((item) => item.location.id).sort().join('__'),
    locations: cluster.locations,
    position: cluster.position,
    isCluster: cluster.locations.length > 1,
    hasOffline: cluster.locations.some((item) => item.status.offline > 0)
  }));
}

async function geocodeWithGoogle(address) {
  const maps = await loadGoogleMaps();
  const { Geocoder } = await maps.importLibrary('geocoding');
  const geocoder = new Geocoder();
  const response = await geocoder.geocode({ address });
  const result = response.results?.[0];

  if (!result) {
    throw new Error('Endereco nao encontrado no Google Maps.');
  }

  const location = result.geometry.location;
  return {
    address: result.formatted_address,
    latitude: location.lat(),
    longitude: location.lng()
  };
}

export async function geocodeAddressForPayload(payload) {
  const address = [payload.address, payload.number, payload.city, payload.state, payload.zipCode, payload.country]
    .filter(Boolean)
    .join(', ');

  if (!address.trim()) return {};

  try {
    const result = await geocodeWithGoogle(address);
    return {
      latitude: result.latitude,
      longitude: result.longitude,
      geocodingPrecision: 'google',
      formattedAddress: result.address
    };
  } catch {
    return {};
  }
}

export async function geocodeMapSearch(address) {
  const result = await geocodeWithGoogle(address);
  return {
    label: result.address,
    latitude: result.latitude,
    longitude: result.longitude
  };
}

function clearLocationMarkers() {
  activeMarkers.forEach((marker) => {
    marker.setMap(null);
  });
  activeMarkers = [];
}

function createMapMarkerIcon(maps, { isCluster, isSelected, hasOffline }) {
  return {
    path: maps.SymbolPath.CIRCLE,
    scale: isCluster ? (isSelected ? 20 : 17) : isSelected ? 14 : 11,
    fillColor: hasOffline ? '#ff3049' : '#ff3049',
    fillOpacity: 1,
    strokeColor: isSelected ? '#ff8a91' : isCluster ? '#ff5964' : '#ff8a91',
    strokeWeight: isCluster ? (isSelected ? 8 : 6) : isSelected ? 6 : 4
  };
}

function renderLocationMarkers(maps, map, mapLocations, selectedLocationId, onSelectLocation) {
  clearLocationMarkers();

  const clusters = buildVisibleMapClusters(mapLocations, map.getZoom() ?? MIN_WORLD_ZOOM);

  clusters.forEach((cluster) => {
    const isSelected = cluster.locations.some((item) => item.location.id === selectedLocationId);
    const marker = new maps.Marker({
      map,
      position: cluster.position,
      title: cluster.isCluster
        ? `${cluster.locations.length} pontos GoodWe`
        : `${cluster.locations[0].location.name} - ${cluster.locations[0].chargers.length} carregadores`,
      label: cluster.isCluster
        ? {
            text: String(cluster.locations.length),
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: '800'
          }
        : undefined,
      icon: createMapMarkerIcon(maps, {
        isCluster: cluster.isCluster,
        isSelected,
        hasOffline: cluster.hasOffline
      })
    });

    marker.addListener('click', () => {
      if (cluster.isCluster) {
        map.setCenter(cluster.position);
        map.setZoom(Math.min(15, Math.max((map.getZoom() ?? MIN_WORLD_ZOOM) + 2.25, REGIONAL_DETAIL_ZOOM + 1)));
        return;
      }

      onSelectLocation(cluster.locations[0].location.id);
    });

    activeMarkers.push(marker);
  });

  window.__chargegridMapDebug = {
    zoom: map.getZoom() ?? MIN_WORLD_ZOOM,
    clusters: clusters.map((cluster) => ({
      id: cluster.id,
      count: cluster.locations.length,
      locationIds: cluster.locations.map((item) => item.location.id)
    }))
  };
}

export async function initGoogleWorldMap(state, onSelectLocation) {
  const mapElement = document.getElementById(GOOGLE_MAP_ID);
  if (!mapElement) return;

  const fallback = document.querySelector('[data-testid="world-map-fallback"]');

  try {
    const maps = await loadGoogleMaps();
    const { Map } = await maps.importLibrary('maps');
    const mapLocations = getMapLocations(state);
    const selectedLocationId =
      mapLocations.find((item) => item.location.id === state.ui.selectedMapLocationId)?.location.id ??
      mapLocations[0]?.location.id ??
      null;

    clearLocationMarkers();
    activeCountryLabels.forEach((overlay) => overlay.setMap(null));
    activeCountryLabels = [];
    searchMarker?.setMap(null);
    searchMarker = null;

    activeMap = new Map(mapElement, {
      center: DEFAULT_CENTER,
      zoom: MIN_WORLD_ZOOM,
      minZoom: MIN_WORLD_ZOOM,
      maxZoom: 15,
      backgroundColor: '#101518',
      styles: countryOnlyMapStyles,
      disableDefaultUI: true,
      zoomControl: true,
      fullscreenControl: true,
      gestureHandling: 'greedy',
      restriction: {
        latLngBounds: WORLD_BOUNDS,
        strictBounds: true
      }
    });

    activeMap.addListener('zoom_changed', () => applyDetailLevelForZoom(activeMap));
    activeMap.addListener('idle', () =>
      renderLocationMarkers(maps, activeMap, mapLocations, selectedLocationId, onSelectLocation)
    );
    activeCountryLabels = createCountryLabelOverlays(maps, activeMap);

    if (state.ui.mapSearchResult?.latitude && state.ui.mapSearchResult?.longitude) {
      const resultPosition = {
        lat: Number(state.ui.mapSearchResult.latitude),
        lng: Number(state.ui.mapSearchResult.longitude)
      };
      searchMarker = new maps.Marker({
        map: activeMap,
        position: resultPosition,
        title: state.ui.mapSearchResult.label,
        label: { text: '+', color: '#ffffff', fontSize: '18px', fontWeight: '900' },
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 15,
          fillColor: '#2f86ff',
          fillOpacity: 1,
          strokeColor: '#91c2ff',
          strokeWeight: 5
        }
      });
      activeMap.setCenter(resultPosition);
      activeMap.setZoom(SEARCH_RESULT_ZOOM);
    }

    const selected = mapLocations.find((item) => item.location.id === selectedLocationId);

    if (selected && !state.ui.mapSearchResult) {
      activeMap.setCenter(selected.position);
      activeMap.setZoom(SELECTED_LOCATION_ZOOM);
    }

    applyDetailLevelForZoom(activeMap);
    renderLocationMarkers(maps, activeMap, mapLocations, selectedLocationId, onSelectLocation);
    mapElement.classList.add('is-loaded');
    fallback?.setAttribute('hidden', '');
  } catch (error) {
    mapElement.classList.add('has-error');
    fallback?.removeAttribute('hidden');
  }
}

