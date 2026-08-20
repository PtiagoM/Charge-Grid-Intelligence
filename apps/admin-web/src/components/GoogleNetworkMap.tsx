import { useEffect, useRef, useState } from "react";
import type { AdminMapPlant } from "../services/adminDemo";

interface GoogleNetworkMapProps {
  plants: readonly AdminMapPlant[];
  selectedPlantId: string | null;
  onSelectPlant: (plantId: string) => void;
}

interface GoogleMapInstance {
  setCenter(position: { lat: number; lng: number }): void;
  setZoom(zoom: number): void;
}

interface GoogleMarker {
  addListener(event: "click", handler: () => void): void;
}

interface GoogleMapsApi {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMapInstance;
  Marker: new (options: Record<string, unknown>) => GoogleMarker;
  SymbolPath: { CIRCLE: unknown };
}

declare global {
  interface Window {
    google?: { maps?: GoogleMapsApi };
  }
}

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
    script.onload = () => {
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error("SDK do Google Maps indisponível."));
    };
    script.onerror = () => reject(new Error("Não foi possível carregar o Google Maps."));
    document.head.append(script);
  });

  return googleMapsPromise;
}

function createMarkerIcon(maps: GoogleMapsApi, selected: boolean) {
  return {
    path: maps.SymbolPath.CIRCLE,
    scale: selected ? 13 : 10,
    fillColor: "#ff323a",
    fillOpacity: 1,
    strokeColor: selected ? "#ffc4c7" : "#ff7279",
    strokeWeight: selected ? 7 : 4
  };
}

interface PlantCluster {
  position: { lat: number; lng: number };
  plants: readonly AdminMapPlant[];
}

function clusterPlants(plants: readonly AdminMapPlant[]): readonly PlantCluster[] {
  const clusters: PlantCluster[] = [];
  const clusterRadiusDegrees = 0.12;

  plants.forEach((plant) => {
    const nearby = clusters.find(({ position }) => Math.hypot(position.lat - plant.position.lat, position.lng - plant.position.lng) <= clusterRadiusDegrees);
    if (!nearby) {
      clusters.push({ position: plant.position, plants: [plant] });
      return;
    }

    const groupedPlants = [...nearby.plants, plant];
    nearby.plants = groupedPlants;
    nearby.position = {
      lat: groupedPlants.reduce((sum, item) => sum + item.position.lat, 0) / groupedPlants.length,
      lng: groupedPlants.reduce((sum, item) => sum + item.position.lng, 0) / groupedPlants.length
    };
  });

  return clusters;
}

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#101518" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#c8d1d5" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#101518" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#26343c" }] }
];

export function GoogleNetworkMap({ plants, selectedPlantId, onSelectPlant }: GoogleNetworkMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");

  useEffect(() => {
    const target = mapElement.current;
    if (!target) return;

    let cancelled = false;
    void loadGoogleMaps()
      .then((maps) => {
        if (cancelled) return;
        const selected = plants.find((plant) => plant.id === selectedPlantId) ?? plants[0];
        if (!selected) return;

        const map = new maps.Map(target, {
          center: selected.position,
          zoom: plants.length > 1 ? 5 : 12,
          styles: darkMapStyles,
          backgroundColor: "#101518",
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: true,
          gestureHandling: "greedy"
        });

        clusterPlants(plants).forEach((cluster) => {
          const isCluster = cluster.plants.length > 1;
          const firstPlant = cluster.plants[0];
          if (!firstPlant) return;
          const marker = new maps.Marker({
            map,
            position: cluster.position,
            title: isCluster ? `${cluster.plants.length} plantas comerciais` : `${firstPlant.name} · ${firstPlant.availableChargers}/${firstPlant.chargerCount} disponíveis`,
            label: isCluster ? { text: String(cluster.plants.length), color: "#ffffff", fontSize: "14px", fontWeight: "800" } : undefined,
            icon: createMarkerIcon(maps, firstPlant.id === selectedPlantId)
          });
          marker.addListener("click", () => {
            map.setCenter(cluster.position);
            if (isCluster) {
              map.setZoom(11);
              return;
            }
            map.setZoom(13);
            onSelectPlant(firstPlant.id);
          });
        });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("fallback");
      });

    return () => {
      cancelled = true;
    };
  }, [onSelectPlant, plants, selectedPlantId]);

  return (
    <div className="network-map" aria-label="Mapa de plantas comerciais vinculadas à conta">
      <div className="network-map-canvas" ref={mapElement} />
      {status !== "ready" ? (
        <div className="map-fallback" role="status">
          <strong>{status === "loading" ? "Carregando Google Maps…" : "Mapa indisponível"}</strong>
          <span>{status === "loading" ? "Preparando as plantas vinculadas à conta." : "Verifique VITE_GOOGLE_MAPS_API_KEY para ativar o mapa ao vivo."}</span>
        </div>
      ) : null}
    </div>
  );
}
