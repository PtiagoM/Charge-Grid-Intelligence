import { useCallback, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useDriverApp } from "../app/DriverAppContext";
import { AppIcon } from "../components/AppIcon";
import { DriverDiscoveryMap } from "../components/DriverDiscoveryMap";
import { EstablishmentCard } from "../components/EstablishmentCard";
import { PageIntro } from "../components/Ui";
import { commercialPlants, distanceBetweenKm } from "../data/commercialPlants";

export function ExplorePage() {
  const { isAuthenticated, profile } = useDriverApp();
  const [query, setQuery] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [locationState, setLocationState] = useState<"idle" | "loading" | "ready" | "denied">("idle");

  const filteredPlants = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    const matches = normalized
      ? commercialPlants.filter((plant) => `${plant.name} ${plant.address} ${plant.category}`.toLocaleLowerCase("pt-BR").includes(normalized))
      : [...commercialPlants];
    return matches.sort((a, b) => {
      const distanceA = userPosition ? distanceBetweenKm(userPosition, a.position) : a.distanceKm ?? 0;
      const distanceB = userPosition ? distanceBetweenKm(userPosition, b.position) : b.distanceKm ?? 0;
      return distanceA - distanceB;
    });
  }, [query, userPosition]);

  const mapPlaces = useMemo(() => filteredPlants.map((plant) => ({
    id: plant.id,
    name: plant.name,
    position: plant.position,
    availableChargers: plant.availableChargerCount,
    chargerCount: plant.chargerCount,
    tariff: plant.tariffFrom?.amount ?? 0
  })), [filteredPlants]);

  const selectPlace = useCallback((placeId: string) => {
    setSelectedPlaceId(placeId);
    window.setTimeout(() => document.getElementById(`plant-${placeId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  }, []);

  if (!isAuthenticated) return <Navigate to="/" replace />;

  function locateUser() {
    if (!navigator.geolocation) {
      setLocationState("denied");
      return;
    }
    setLocationState("loading");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserPosition({ lat: coords.latitude, lng: coords.longitude });
        setSelectedPlaceId(null);
        setLocationState("ready");
      },
      () => setLocationState("denied"),
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 60_000 }
    );
  }

  return <>
    <PageIntro eyebrow={`Olá, ${profile?.fullName.split(" ")[0] ?? "motorista"}`} title="Onde faz sentido carregar agora?">
      <p>Compare disponibilidade, tarifa, potência e fila em cada ponto.</p>
    </PageIntro>

    <div className="map-stage">
      <div className="search-shell" role="search">
        <AppIcon name="search" size={22} />
        <label className="sr-only" htmlFor="place-search">Buscar estabelecimento ou endereço</label>
        <input id="place-search" type="search" placeholder="Buscar local ou endereço" value={query} onChange={(event) => { setQuery(event.target.value); setSelectedPlaceId(null); }} />
        <button type="button" className="locate-button" onClick={locateUser} aria-label="Usar minha localização"><AppIcon name="location" size={21} /></button>
      </div>
      {mapPlaces.length ? <DriverDiscoveryMap places={mapPlaces} selectedPlaceId={selectedPlaceId} userPosition={userPosition} onSelectPlace={selectPlace} /> : <div className="map-no-results"><AppIcon name="search" size={32} /><strong>Nenhum ponto encontrado</strong></div>}
    </div>

    {locationState === "denied" ? <p className="field-message warning-message" role="status">Não foi possível usar sua localização. A busca manual continua disponível.</p> : null}
    {locationState === "loading" ? <p className="field-message" role="status">Solicitando sua localização…</p> : null}
    {locationState === "ready" ? <p className="field-message success-message" role="status">Localização ativa. Os pontos foram ordenados por proximidade.</p> : null}

    <section className="results-heading"><div><p className="eyebrow">Rede ChargeGrid</p><h2>{filteredPlants.length} {filteredPlants.length === 1 ? "ponto encontrado" : "pontos encontrados"}</h2></div><span>Atualizado agora</span></section>
    <section className="plant-results">
      {filteredPlants.map((plant) => <div id={`plant-${plant.id}`} key={plant.id}><EstablishmentCard plant={plant} selected={plant.id === selectedPlaceId} distanceKm={userPosition ? distanceBetweenKm(userPosition, plant.position) : plant.distanceKm} /></div>)}
    </section>
  </>;
}
