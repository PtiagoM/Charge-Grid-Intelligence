import { CommercialAvailability } from "@chargegrid/shared";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppIcon } from "./AppIcon";
import { EstablishmentCard } from "./EstablishmentCard";
import { PageIntro, SecondaryButton } from "./Ui";
import { commercialPlants } from "../data/commercialPlants";

type AvailabilityFilter = "all" | "available" | "queue";
const availableStates: CommercialAvailability[] = [CommercialAvailability.OPEN_AVAILABLE, CommercialAvailability.OPEN_PARTIAL];

export function SessionPlantCatalog() {
  const [query, setQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minPower, setMinPower] = useState("");
  const [maxDistance, setMaxDistance] = useState("");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [visibleCount, setVisibleCount] = useState(4);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    return commercialPlants.filter((plant) => {
      const matchesQuery = !normalizedQuery || `${plant.name} ${plant.address} ${plant.category}`.toLocaleLowerCase("pt-BR").includes(normalizedQuery);
      const matchesPrice = !maxPrice || (plant.tariffFrom?.amount ?? Infinity) <= Number(maxPrice);
      const matchesPower = !minPower || plant.nominalPowerKw >= Number(minPower);
      const matchesDistance = !maxDistance || (plant.distanceKm ?? Infinity) <= Number(maxDistance);
      const matchesAvailability = availability === "all"
        || availability === "available" && availableStates.includes(plant.commercialAvailability)
        || availability === "queue" && plant.commercialAvailability === CommercialAvailability.FULL_QUEUE;
      return matchesQuery && matchesPrice && matchesPower && matchesDistance && matchesAvailability;
    }).sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }, [availability, maxDistance, maxPrice, minPower, query]);

  const activeFilterCount = [maxPrice, minPower, maxDistance, availability === "all" ? "" : availability].filter(Boolean).length;
  const visiblePlants = results.slice(0, visibleCount);

  function clearFilters() {
    setMaxPrice("");
    setMinPower("");
    setMaxDistance("");
    setAvailability("all");
    setVisibleCount(4);
  }

  return <>
    <PageIntro eyebrow="Todas as plantas" title="Encontre sua próxima recarga">
      <p>Pesquise a rede completa e ajuste somente os filtros que importam para você.</p>
    </PageIntro>

    <div className="catalog-search" role="search">
      <AppIcon name="search" size={21} />
      <label className="sr-only" htmlFor="session-plant-search">Buscar planta ou endereço</label>
      <input id="session-plant-search" type="search" placeholder="Buscar planta ou endereço" value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(4); }} />
      <Link to="/map" aria-label="Abrir mapa"><AppIcon name="map" size={21} /></Link>
    </div>

    <details className="catalog-filters">
      <summary><span><AppIcon name="filter" size={18} /> Filtros</span>{activeFilterCount ? <strong>{activeFilterCount}</strong> : <small>Preço, potência, distância e disponibilidade</small>}</summary>
      <div className="catalog-filter-grid">
        <label>Preço máximo<select value={maxPrice} onChange={(event) => { setMaxPrice(event.target.value); setVisibleCount(4); }}><option value="">Qualquer preço</option><option value="1.75">Até R$ 1,75/kWh</option><option value="2">Até R$ 2,00/kWh</option></select></label>
        <label>Potência mínima<select value={minPower} onChange={(event) => { setMinPower(event.target.value); setVisibleCount(4); }}><option value="">Qualquer potência</option><option value="11">11 kW ou mais</option><option value="22">22 kW ou mais</option><option value="60">60 kW ou mais</option></select></label>
        <label>Distância máxima<select value={maxDistance} onChange={(event) => { setMaxDistance(event.target.value); setVisibleCount(4); }}><option value="">Qualquer distância</option><option value="5">Até 5 km</option><option value="10">Até 10 km</option><option value="20">Até 20 km</option></select></label>
        <label>Disponibilidade<select value={availability} onChange={(event) => { setAvailability(event.target.value as AvailabilityFilter); setVisibleCount(4); }}><option value="all">Todos os estados</option><option value="available">Disponível agora</option><option value="queue">Com fila</option></select></label>
      </div>
      {activeFilterCount ? <button type="button" className="clear-filters" onClick={clearFilters}>Limpar filtros</button> : null}
    </details>

    <section className="results-heading"><div><p className="eyebrow">Rede ChargeGrid</p><h2>{results.length} {results.length === 1 ? "planta encontrada" : "plantas encontradas"}</h2></div><span>Por proximidade</span></section>
    {visiblePlants.length ? <section className="plant-results">{visiblePlants.map((plant) => <EstablishmentCard key={plant.id} plant={plant} />)}</section> : <section className="empty-inline tall"><span><AppIcon name="search" size={30} /></span><strong>Nenhuma planta combina com a busca</strong><p>Tente ampliar a distância ou remover um dos filtros.</p><SecondaryButton onClick={clearFilters}>Limpar filtros</SecondaryButton></section>}
    {visibleCount < results.length ? <SecondaryButton onClick={() => setVisibleCount((current) => current + 4)}>Ver mais {Math.min(4, results.length - visibleCount)} plantas</SecondaryButton> : null}
  </>;
}
