import { useEffect, useMemo, useState } from "react";
import type { CommercialSnapshot } from "@chargegrid/shared";
import { getCommercialSnapshot } from "../services/paymentApi";
import { commercialPlants, mergeCommercialPlants } from "./commercialPlants";

const backendPlantIds = new Set(["est_aurora_001"]);

export function useCommercialPlants() {
  const [snapshot, setSnapshot] = useState<CommercialSnapshot | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const current = await getCommercialSnapshot();
        if (active) { setSnapshot(current); setError(""); }
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "A operação comercial está indisponível.");
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  const plants = useMemo(() => snapshot ? mergeCommercialPlants(snapshot) : commercialPlants.filter((plant) => !backendPlantIds.has(plant.id)), [snapshot]);
  return { plants, loading: !snapshot && !error, error };
}
