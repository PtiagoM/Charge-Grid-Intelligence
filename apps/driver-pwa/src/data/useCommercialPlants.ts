import { useEffect, useMemo, useState } from "react";
import type { CommercialCatalog } from "@chargegrid/shared";
import { getCommercialCatalog } from "../services/paymentApi";
import { commercialPlants, mergeCommercialCatalog } from "./commercialPlants";

export function useCommercialPlants() {
  const [catalog, setCatalog] = useState<CommercialCatalog | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const current = await getCommercialCatalog();
        if (active) { setCatalog(current); setError(""); }
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "A operação comercial está indisponível.");
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  const plants = useMemo(() => catalog ? mergeCommercialCatalog(catalog) : commercialPlants.map((plant) => plant.isOperational ? { ...plant, isOperational: false } : plant), [catalog]);
  return { plants, loading: !catalog && !error, error };
}
