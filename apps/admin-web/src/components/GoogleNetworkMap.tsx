import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { AdminMapPlant } from "../services/adminDemo";

interface GoogleNetworkMapProps {
  plants: readonly AdminMapPlant[];
  selectedPlantId: string | null;
  onSelectPlant: (plantId: string) => void;
}

interface GoogleMapInstance { setCenter(position: { lat: number; lng: number }): void; setZoom(zoom: number): void; }
interface GoogleMarker { addListener(event: "click", handler: () => void): void; }
interface GoogleMapsApi {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMapInstance;
  Marker: new (options: Record<string, unknown>) => GoogleMarker;
  SymbolPath: { CIRCLE: unknown };
}

declare global { interface Window { google?: { maps?: GoogleMapsApi }; } }

let googleMapsPromise: Promise<GoogleMapsApi> | undefined;

function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (googleMapsPromise) return googleMapsPromise;
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) return Promise.reject(new Error("Chave do Google Maps não configurada."));
  googleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`;
    script.async = true;
    script.onload = () => window.google?.maps ? resolve(window.google.maps) : reject(new Error("SDK indisponível."));
    script.onerror = () => reject(new Error("Falha ao carregar o Google Maps."));
    document.head.append(script);
  });
  return googleMapsPromise;
}

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#111619" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#aab5ba" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#111619" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#26343c" }] }
];

function WorldFallback({ plants, selectedPlantId, onSelectPlant }: GoogleNetworkMapProps) {
  return <div className="world-map-fallback">
    <svg className="world-map-svg" viewBox="0 0 1000 500" role="img" aria-label="Mapa mundial de plantas ChargeGrid">
      <path d="M120 118 172 86 238 94 262 126 242 178 188 206 154 250 120 230 96 176Z" /><path d="M252 210 302 242 322 306 292 392 250 468 222 396 192 336 210 268Z" /><path d="M442 116 512 82 586 96 638 132 708 118 794 156 860 206 832 258 738 236 676 278 612 252 532 278 470 238 410 202Z" /><path d="M520 280 584 274 630 326 618 410 566 456 528 384Z" /><path d="M790 318 874 324 928 374 898 430 820 422 770 366Z" /><path d="M410 92 462 70 516 80 498 118 438 130Z" />
    </svg>
    <div className="world-map-grid-lines" aria-hidden="true" />
    <span className="world-map-label label-americas">AMERICAS</span><span className="world-map-label label-europe">EUROPE</span><span className="world-map-label label-asia">ASIA</span><span className="world-map-label label-oceania">OCEANIA</span>
    {plants.map((plant) => <button key={plant.id} type="button" className={`world-map-marker ${plant.id === selectedPlantId ? "is-selected" : ""}`} style={{ "--x": "27%", "--y": "72%" } as CSSProperties} onClick={() => onSelectPlant(plant.id)} aria-label={plant.name}><span /></button>)}
  </div>;
}

export function GoogleNetworkMap({ plants, selectedPlantId, onSelectPlant }: GoogleNetworkMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const totalPower = plants.reduce((sum, plant) => sum + plant.chargerCount * 7, 0);

  useEffect(() => {
    if (!mapElement.current || plants.length === 0) return;
    let cancelled = false;
    void loadGoogleMaps().then((maps) => {
      if (cancelled || !mapElement.current) return;
      const map = new maps.Map(mapElement.current, { center: { lat: 10, lng: -20 }, zoom: 3.25, minZoom: 2, styles: darkMapStyles, backgroundColor: "#111619", disableDefaultUI: true, zoomControl: true, fullscreenControl: true, gestureHandling: "greedy" });
      plants.forEach((plant) => {
        const marker = new maps.Marker({ map, position: plant.position, title: `${plant.name} · ${plant.availableChargers}/${plant.chargerCount} disponíveis`, icon: { path: maps.SymbolPath.CIRCLE, scale: plant.id === selectedPlantId ? 12 : 9, fillColor: "#ff3049", fillOpacity: 1, strokeColor: plant.id === selectedPlantId ? "#ffd0d6" : "#ff7b8b", strokeWeight: plant.id === selectedPlantId ? 7 : 4 } });
        marker.addListener("click", () => { map.setCenter(plant.position); map.setZoom(12); onSelectPlant(plant.id); });
      });
      setStatus("ready");
    }).catch(() => { if (!cancelled) setStatus("fallback"); });
    return () => { cancelled = true; };
  }, [onSelectPlant, plants, selectedPlantId]);

  return <div className="sems-map-canvas world-map-canvas" data-testid="world-charger-map">
    <div ref={mapElement} className={`google-world-map ${status === "ready" ? "is-loaded" : ""}`} data-testid="google-world-map" />
    {status !== "ready" ? <WorldFallback plants={plants} selectedPlantId={selectedPlantId} onSelectPlant={onSelectPlant} /> : null}
    <article className="sems-station-summary world-station-summary">
      <div className="station-row station-row-main"><div className="station-map-illustration" aria-hidden="true"><span /><i /><b /><em /></div><div className="station-value"><p><strong>{plants.length}</strong><button type="button" aria-label="Expandir estações">⌄</button></p><span>Station Number <small>?</small></span></div></div>
      <div className="station-row"><div className="station-solar-illustration" aria-hidden="true"><span /><span /><span /></div><div className="station-value"><p><strong>{totalPower}</strong><small>kWp</small></p><span>Capacity</span></div></div>
      <div className="station-row"><div className="station-storage-illustration" aria-hidden="true"><span /><span /><span /></div><div className="station-value"><p><strong>48,05</strong><small>kWh</small></p><span>Capacity</span></div></div>
    </article>
  </div>;
}
