import { useEffect, useRef, useState } from "react";
import { AppIcon } from "./AppIcon";

export interface MapPlace {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  availableChargers: number;
  chargerCount: number;
  tariff: number;
}

interface DriverDiscoveryMapProps {
  places: readonly MapPlace[];
  selectedPlaceId: string | null;
  userPosition?: { lat: number; lng: number } | null;
  onSelectPlace(placeId: string): void;
}

interface GoogleMapInstance {
  data: GoogleDataLayer;
  setCenter(position: { lat: number; lng: number }): void;
  setZoom(zoom: number): void;
  fitBounds(bounds: GoogleBounds): void;
}

interface GoogleBounds {
  extend(position: { lat: number; lng: number }): void;
}

interface GoogleDataFeature {
  getProperty(name: string): unknown;
}

interface GoogleDataLayer {
  add(options: { id: string; geometry: unknown; properties: Record<string, unknown> }): void;
  addListener(event: "click", handler: (event: { feature: GoogleDataFeature }) => void): { remove(): void };
  setStyle(style: (feature: GoogleDataFeature) => Record<string, unknown>): void;
  forEach(handler: (feature: GoogleDataFeature) => void): void;
  remove(feature: GoogleDataFeature): void;
}

interface InfoWindowInstance {
  setContent(content: Node): void;
  open(options: { map: GoogleMapInstance; position: { lat: number; lng: number } }): void;
  close(): void;
}

interface GoogleMapsApi {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMapInstance;
  LatLngBounds: new () => GoogleBounds;
  InfoWindow: new () => InfoWindowInstance;
  Data: { Point: new (position: { lat: number; lng: number }) => unknown };
  Size: new (width: number, height: number) => unknown;
  Point: new (x: number, y: number) => unknown;
  importLibrary(name: string): Promise<unknown>;
}

declare global {
  interface Window {
    google?: { maps?: GoogleMapsApi };
    __chargeGridMapsReady?: () => void;
    gm_authFailure?: () => void;
  }
}

let mapsPromise: Promise<GoogleMapsApi> | undefined;

function loadGoogleMaps() {
  if (window.google?.maps && typeof window.google.maps.importLibrary === "function") return Promise.resolve(window.google.maps);
  if (mapsPromise) return mapsPromise;
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) return Promise.reject(new Error("MAPS_KEY_MISSING"));
  mapsPromise = new Promise<GoogleMapsApi>((resolve, reject) => {
    const script = document.createElement("script");
    window.__chargeGridMapsReady = () => {
      const maps = window.google?.maps;
      if (maps && typeof maps.importLibrary === "function") resolve(maps);
      else reject(new Error("MAPS_SDK_UNAVAILABLE"));
      delete window.__chargeGridMapsReady;
      delete window.gm_authFailure;
    };
    window.gm_authFailure = () => {
      reject(new Error("MAPS_AUTH_FAILED"));
      delete window.__chargeGridMapsReady;
      delete window.gm_authFailure;
    };
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&language=pt-BR&region=BR&callback=__chargeGridMapsReady`;
    script.async = true;
    script.onerror = () => {
      delete window.__chargeGridMapsReady;
      delete window.gm_authFailure;
      reject(new Error("MAPS_LOAD_FAILED"));
    };
    document.head.append(script);
  }).catch((error) => {
    mapsPromise = undefined;
    throw error;
  });
  return mapsPromise;
}

function infoContent(place: MapPlace) {
  const content = document.createElement("article");
  content.className = "map-info-window";
  const title = document.createElement("strong");
  title.textContent = place.name;
  const availability = document.createElement("span");
  availability.textContent = `${place.availableChargers} de ${place.chargerCount} disponíveis`;
  const tariff = document.createElement("small");
  tariff.textContent = `A partir de ${place.tariff.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/kWh`;
  content.append(title, availability, tariff);
  return content;
}

function dataMarkerIcon(maps: GoogleMapsApi, label: string, color: string, active = false) {
  const size = active ? 48 : 42;
  const safeLabel = label.replace(/[^0-9•]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M24 2C12.4 2 3 11.4 3 23c0 15.8 21 23 21 23s21-7.2 21-23C45 11.4 35.6 2 24 2Z" fill="${color}" stroke="${active ? "#ffffff" : "#f4a1a5"}" stroke-width="${active ? 3 : 2}"/><text x="24" y="28" text-anchor="middle" fill="#ffffff" font-family="Arial,sans-serif" font-size="14" font-weight="700">${safeLabel}</text></svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new maps.Size(size, size),
    anchor: new maps.Point(size / 2, size)
  };
}

export function DriverDiscoveryMap({ places, selectedPlaceId, userPosition, onSelectPlace }: DriverDiscoveryMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorCode, setErrorCode] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!mapElement.current || places.length === 0) return;
    let cancelled = false;
    let infoWindow: InfoWindowInstance | undefined;
    let dataLayer: GoogleDataLayer | undefined;
    let dataClickListener: { remove(): void } | undefined;
    const failureObserver = new MutationObserver(() => {
      if (mapElement.current?.querySelector(".gm-err-container")) {
        setErrorCode("MAPS_PROVIDER_ERROR");
        setStatus("error");
      }
    });
    failureObserver.observe(mapElement.current, { childList: true, subtree: true });
    setStatus("loading");
    setErrorCode("");

    void loadGoogleMaps().then((maps) => {
      if (cancelled || !mapElement.current) return;
      const map = new maps.Map(mapElement.current, {
        center: places[0]?.position ?? { lat: -23.55052, lng: -46.63331 },
        zoom: 11,
        minZoom: 4,
        backgroundColor: "#edf0f2",
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
        gestureHandling: "greedy"
      });
      const bounds = new maps.LatLngBounds();
      infoWindow = new maps.InfoWindow();
      dataLayer = map.data;

      for (const place of places) {
        dataLayer.add({
          id: place.id,
          geometry: new maps.Data.Point(place.position),
          properties: {
            kind: "plant",
            placeId: place.id,
            title: `${place.name}: ${place.availableChargers} de ${place.chargerCount} disponíveis`
          }
        });
        bounds.extend(place.position);
      }

      if (userPosition) {
        dataLayer.add({ id: "driver-position", geometry: new maps.Data.Point(userPosition), properties: { kind: "driver", title: "Sua localização" } });
        bounds.extend(userPosition);
      }

      dataLayer.setStyle((feature) => {
        const kind = feature.getProperty("kind");
        if (kind === "driver") return { clickable: false, icon: dataMarkerIcon(maps, "•", "#2f86ff"), title: "Sua localização", zIndex: 20 };
        const placeId = String(feature.getProperty("placeId") ?? "");
        const place = places.find((item) => item.id === placeId);
        if (!place) return { visible: false };
        const active = place.id === selectedPlaceId;
        return {
          clickable: true,
          icon: dataMarkerIcon(maps, String(place.availableChargers), place.availableChargers > 0 ? "#ef3238" : "#697279", active),
          title: String(feature.getProperty("title") ?? place.name),
          zIndex: active ? 10 : 1
        };
      });

      dataClickListener = dataLayer.addListener("click", (event) => {
        const placeId = String(event.feature.getProperty("placeId") ?? "");
        const place = places.find((item) => item.id === placeId);
        if (!place) return;
        map.setCenter(place.position);
        map.setZoom(14);
        infoWindow?.setContent(infoContent(place));
        infoWindow?.open({ map, position: place.position });
        onSelectPlace(place.id);
      });

      const selected = places.find((place) => place.id === selectedPlaceId);
      if (selected) {
        map.setCenter(selected.position);
        map.setZoom(14);
      } else {
        map.fitBounds(bounds);
      }
      setStatus("ready");
    }).catch((error: unknown) => {
      if (!cancelled) {
        setErrorCode(error instanceof Error ? error.message : "MAPS_UNKNOWN_ERROR");
        setStatus("error");
      }
    });

    return () => {
      cancelled = true;
      infoWindow?.close();
      failureObserver.disconnect();
      dataClickListener?.remove();
      dataLayer?.forEach((feature) => dataLayer?.remove(feature));
    };
  }, [attempt, onSelectPlace, places, selectedPlaceId, userPosition]);

  return <div className="discovery-map" data-testid="driver-discovery-map" data-map-error={errorCode || undefined}>
    <div ref={mapElement} className={`google-discovery-map ${status === "ready" ? "is-loaded" : ""}`} />
    {status === "loading" ? <div className="map-loading-state"><span className="spinner" /><strong>Carregando Google Maps…</strong></div> : null}
    {status === "error" ? <div className="map-error-state" role="alert"><AppIcon name="map" size={34} /><strong>Não foi possível carregar o mapa</strong><p>Verifique sua conexão e tente novamente.</p><button type="button" onClick={() => setAttempt((current) => current + 1)}>Tentar novamente</button></div> : null}
  </div>;
}
