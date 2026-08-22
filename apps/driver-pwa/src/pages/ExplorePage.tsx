import { useCallback, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useDriverApp } from "../app/DriverAppContext";
import { AppIcon } from "../components/AppIcon";
import { DriverDiscoveryMap } from "../components/DriverDiscoveryMap";
import { EstablishmentCard } from "../components/EstablishmentCard";
import { PageIntro } from "../components/Ui";
import { commercialPlants } from "../data/commercialPlants";
import { recommendedPlants } from "../data/plantRecommendations";

const recommendations = recommendedPlants(commercialPlants);
const mapPlaces = commercialPlants.map((plant) => ({
  id: plant.id,
  name: plant.name,
  position: plant.position,
  availableChargers: plant.availableChargerCount,
  chargerCount: plant.chargerCount,
  nominalPowerKw: plant.nominalPowerKw,
  tariff: plant.tariffFrom?.amount ?? 0
}));

export function ExplorePage() {
  const navigate = useNavigate();
  const { isAuthenticated, profile, selectChargingPoint, theme } = useDriverApp();
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [locationState, setLocationState] = useState<"idle" | "loading" | "denied">("idle");

  const selectPlace = useCallback((placeId: string) => {
    const plant = commercialPlants.find((item) => item.id === placeId);
    const charger = plant?.chargers[0];
    if (!plant || !charger) return;
    setSelectedPlaceId(placeId);
    selectChargingPoint(plant.id, charger.id);
  }, [selectChargingPoint]);

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
        setLocationState("idle");
      },
      () => setLocationState("denied"),
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 60_000 }
    );
  }

  return <>
    <PageIntro eyebrow={`Olá, ${profile?.fullName.split(" ")[0] ?? "motorista"}`} title="Onde vale a pena carregar agora?">
      <p>Veja a rede no mapa e encontre uma opção que combine disponibilidade, tarifa e distância.</p>
    </PageIntro>

    <section className="map-stage explore-map-preview" aria-label="Prévia do mapa de Charge Grids">
      <div className="search-shell">
        <button type="button" className="search-shell-trigger" onClick={() => navigate("/map")} aria-label="Abrir pesquisa no mapa">
          <AppIcon name="search" size={22} />
          <span>Buscar local ou endereço</span>
          <AppIcon name="chevron-right" size={20} />
        </button>
        <button type="button" className="locate-button" onClick={locateUser} aria-label="Usar minha localização"><AppIcon name="location" size={21} /></button>
      </div>
      <DriverDiscoveryMap places={mapPlaces} selectedPlaceId={selectedPlaceId} userPosition={userPosition} theme={theme} onSelectPlace={selectPlace} />
    </section>

    {locationState === "denied" ? <p className="field-message warning-message" role="status">Não foi possível usar sua localização. Você ainda pode pesquisar no mapa.</p> : null}
    {locationState === "loading" ? <p className="field-message" role="status">Buscando sua localização…</p> : null}

    <section className="results-heading recommendation-heading">
      <div><p className="eyebrow">Recomendações ChargeGrid</p><h2>Melhores locais</h2></div>
      <span>Melhor opção, tarifa e proximidade</span>
    </section>
    <section className="recommendation-rail" aria-label="Melhores locais para carregar">
      {recommendations.map(({ plant, reason }) => <EstablishmentCard key={plant.id} plant={plant} recommendationLabel={reason} />)}
    </section>

    <nav className="discovery-actions" aria-label="Outras formas de encontrar uma Charge Grid">
      <Link className="text-link" to="/session">Ver todas as plantas</Link>
    </nav>
  </>;
}
