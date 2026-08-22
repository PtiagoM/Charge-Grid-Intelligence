import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useDriverApp } from "../app/DriverAppContext";
import { AppIcon } from "../components/AppIcon";
import { DriverDiscoveryMap, geocodeMapAddress } from "../components/DriverDiscoveryMap";
import { commercialPlants } from "../data/commercialPlants";

const mapPlaces = commercialPlants.map((plant) => ({
  id: plant.id,
  name: plant.name,
  position: plant.position,
  availableChargers: plant.availableChargerCount,
  chargerCount: plant.chargerCount,
  nominalPowerKw: plant.nominalPowerKw,
  tariff: plant.tariffFrom?.amount ?? 0
}));

export function MapPage() {
  const navigate = useNavigate();
  const { isAuthenticated, selectChargingPoint, theme } = useDriverApp();
  const [query, setQuery] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [focusPosition, setFocusPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");

  if (!isAuthenticated) return <Navigate to="/" replace />;

  function selectPlace(placeId: string) {
    const plant = commercialPlants.find((item) => item.id === placeId);
    const charger = plant?.chargers[0];
    if (!plant || !charger) return;
    setSelectedPlaceId(placeId);
    selectChargingPoint(plant.id, charger.id);
  }

  async function searchLocation(event: FormEvent) {
    event.preventDefault();
    const address = query.trim();
    if (!address) return;
    setSearching(true);
    setMessage("");
    try {
      setFocusPosition(await geocodeMapAddress(address));
      setSelectedPlaceId(null);
    } catch (error) {
      setMessage(error instanceof Error && error.message === "LOCAL_NAO_ENCONTRADO" ? "Não encontramos esse local. Revise a busca e tente novamente." : "Não foi possível pesquisar o local agora.");
    } finally {
      setSearching(false);
    }
  }

  return <section className="immersive-map-page" aria-label="Mapa de Charge Grids">
    <form className="map-search-bar" role="search" onSubmit={searchLocation}>
      <button type="button" className="map-back-button" aria-label="Voltar" onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/explore", { replace: true })}><AppIcon name="arrow-left" /></button>
      <AppIcon name="search" size={21} />
      <label className="sr-only" htmlFor="map-location-search">Pesquisar local no mapa</label>
      <input id="map-location-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar local ou endereço" />
      {searching ? <span className="map-search-spinner" aria-label="Pesquisando" /> : null}
    </form>
    {message ? <p className="map-search-message" role="status">{message}</p> : null}
    <DriverDiscoveryMap places={mapPlaces} selectedPlaceId={selectedPlaceId} focusPosition={focusPosition} theme={theme} onSelectPlace={selectPlace} />
  </section>;
}
