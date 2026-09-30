import { useEffect, useMemo, useState } from "react";
import type { CommercialCatalog } from "@chargegrid/shared";
import { getCommercialCatalog } from "../services/paymentApi";
import { commercialPlants, mergeCommercialCatalog } from "./commercialPlants";

export function useCommercialPlants() {
  const [catalog, setCatalog] = useState<CommercialCatalog | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let timer = 0;
    let request: AbortController | undefined;
    const refresh = async () => {
      request = new AbortController();
      try {
        const current = await getCommercialCatalog(request.signal);
        if (active) { setCatalog(current); setError(""); }
      } catch (caught) {
        if (active && !request.signal.aborted) setError(caught instanceof Error ? caught.message : "A operação comercial está indisponível.");
      } finally {
        if (active) timer = window.setTimeout(() => void refresh(), 2000);
      }
    };
    void refresh();
    return () => { active = false; window.clearTimeout(timer); request?.abort(); };
  }, []);
  const plants = useMemo(() => catalog ? mergeCommercialCatalog(catalog) : commercialPlants.map((plant) => plant.isOperational ? { ...plant, isOperational: false } : plant), [catalog]);
  return { plants, loading: !catalog && !error, error };
}
