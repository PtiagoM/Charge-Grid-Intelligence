import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { buildVisibleMapClusters, type MapLocation as ClusterLocation } from "../../services/google-maps";
import type { AdminState } from "../../domain/admin";

type Position = { lat: number; lng: number };
interface MapObject { setCenter(position: Position): void; setZoom(zoom: number): void; }
interface OverlayObject {
  onAdd?: () => void;
  draw?: () => void;
  onRemove?: () => void;
  setMap(map: MapObject | null): void;
  getPanes(): { overlayMouseTarget: HTMLElement } | null;
  getProjection(): { fromLatLngToDivPixel(position: Position): { x: number; y: number } | null };
}
interface MapsApi {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => MapObject;
  OverlayView: new () => OverlayObject;
}

let mapsPromise: Promise<MapsApi> | null = null;

function loadGoogleMaps() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) return Promise.reject(new Error("Google Maps API key ausente"));
  const browserWindow = window as unknown as Record<string, unknown>;
  const existing = browserWindow.google as { maps?: MapsApi } | undefined;
  if (existing?.maps) return Promise.resolve(existing.maps);
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise<MapsApi>((resolve, reject) => {
    const callback = `__chargegridMaps_${Date.now()}`;
    browserWindow[callback] = () => {
      const loaded = (browserWindow.google as { maps?: MapsApi } | undefined)?.maps;
      delete browserWindow[callback];
      if (loaded) resolve(loaded); else reject(new Error("Google Maps indisponivel"));
    };
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&callback=${callback}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => { delete browserWindow[callback]; reject(new Error("Falha ao carregar Google Maps")); };
    document.head.appendChild(script);
  });
  return mapsPromise;
}

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#101518" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#aeb8bf" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#101518" }] },
  { featureType: "administrative.country", elementType: "geometry", stylers: [{ color: "#53616a" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#0c1012" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#26343c" }] }
];

function point(position: Position) {
  return { x: Math.max(2, Math.min(98, ((position.lng + 180) / 360) * 100)), y: Math.max(2, Math.min(98, ((90 - position.lat) / 180) * 100)) };
}

export function WorldMap({ state }: { state: AdminState }) {
  const mapElement = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState(state.locations[0]?.id ?? "");
  const mapLocations = useMemo<ClusterLocation[]>(() => state.locations.map((location) => {
    const chargers = state.chargers.filter((charger) => charger.locationId === location.id);
    return {
      location,
      status: { offline: chargers.filter((charger) => charger.status === "offline").length },
      position: { lat: location.latitude, lng: location.longitude }
    };
  }), [state.chargers, state.locations]);
  const clusters = useMemo(() => buildVisibleMapClusters(mapLocations, 3.25), [mapLocations]);

  useEffect(() => {
    let disposed = false;
    const overlays: OverlayObject[] = [];
    loadGoogleMaps().then((maps) => {
      if (disposed || !mapElement.current) return;
      const map = new maps.Map(mapElement.current, {
        center: { lat: 10, lng: -20 }, zoom: 3.25, minZoom: 3.25, maxZoom: 15,
        backgroundColor: "#101518", styles: darkMapStyles, disableDefaultUI: true,
        zoomControl: true, fullscreenControl: true, gestureHandling: "greedy",
        restriction: { latLngBounds: { north: 84, south: -58, west: -179.5, east: 179.5 }, strictBounds: true }
      });
      clusters.forEach((cluster) => {
        const content = document.createElement("button");
        content.type = "button";
        content.className = `google-map-overlay-marker${cluster.hasOffline ? " has-alert" : ""}${cluster.isCluster ? " is-cluster" : ""}`;
        content.textContent = cluster.isCluster ? String(cluster.locations.length) : "";
        content.setAttribute("aria-label", cluster.locations.map((item) => String(item.location.name ?? item.location.id)).join(", "));
        content.addEventListener("click", () => { const id = cluster.locations[0]?.location.id; if (id) setSelectedId(id); map.setCenter(cluster.position); map.setZoom(5.5); });
        const overlay = new maps.OverlayView();
        overlay.onAdd = () => overlay.getPanes()?.overlayMouseTarget.appendChild(content);
        overlay.draw = () => {
          const pixel = overlay.getProjection().fromLatLngToDivPixel(cluster.position);
          if (pixel) content.style.transform = `translate(${pixel.x}px, ${pixel.y}px) translate(-50%, -50%)`;
        };
        overlay.onRemove = () => content.remove();
        overlay.setMap(map);
        overlays.push(overlay);
      });
      setLoaded(true);
    }).catch(() => setLoaded(false));
    return () => { disposed = true; overlays.forEach((overlay) => overlay.setMap(null)); };
  }, [clusters, mapLocations]);

  return <div className="sems-map-canvas world-map-canvas" data-testid="world-charger-map">
    <div ref={mapElement} id="chargegrid-goodwe-world-map" className={`google-world-map ${loaded ? "is-loaded" : "has-error"}`} data-testid="google-world-map" />
    <div className="world-map-fallback" data-testid="world-map-fallback" hidden={loaded}>
      <svg className="world-map-svg" viewBox="0 0 1000 500" role="img" aria-label="Mapa mundi de carregadores GoodWe">
        <path d="M120 118 172 86 238 94 262 126 242 178 188 206 154 250 120 230 96 176Z" /><path d="M252 210 302 242 322 306 292 392 250 468 222 396 192 336 210 268Z" /><path d="M442 116 512 82 586 96 638 132 708 118 794 156 860 206 832 258 738 236 676 278 612 252 532 278 470 238 410 202Z" /><path d="M520 280 584 274 630 326 618 410 566 456 528 384Z" /><path d="M790 318 874 324 928 374 898 430 820 422 770 366Z" /><path d="M410 92 462 70 516 80 498 118 438 130Z" />
      </svg>
      <div className="world-map-grid-lines" aria-hidden="true" /><span className="world-map-label label-americas">AMERICAS</span><span className="world-map-label label-europe">EUROPE</span><span className="world-map-label label-asia">ASIA</span><span className="world-map-label label-oceania">OCEANIA</span>
      {clusters.map((cluster) => {
        const projected = point(cluster.position);
        const primary = cluster.locations[0];
        const style = { "--x": `${projected.x.toFixed(2)}%`, "--y": `${projected.y.toFixed(2)}%` } as CSSProperties;
        return <button key={cluster.id} type="button" className={`world-map-marker ${cluster.locations.some((item) => item.location.id === selectedId) ? "is-selected" : ""} ${cluster.hasOffline ? "has-alert" : ""}`} style={style} data-testid={`world-map-marker-${primary?.location.id}`} onClick={() => primary && setSelectedId(primary.location.id)} aria-label={`${primary?.location.name ?? "Ponto"}: ponto com carregador`}><span>{cluster.isCluster ? cluster.locations.length : ""}</span></button>;
      })}
    </div>
  </div>;
}
