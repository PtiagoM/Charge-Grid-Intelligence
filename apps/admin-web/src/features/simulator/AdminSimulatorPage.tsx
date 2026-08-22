import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAdminState } from "../../app/AdminState";
import { Badge, SectionHeader } from "../../components/AdminUi";

export function AdminSimulatorPage() {
  const { account, state } = useAdminState();
  const [scenario, setScenario] = useState("normal");
  if (!account) return <Navigate to="/login" replace />;
  if (account.profile !== "GOODWE") return <Navigate to="/mvp/overview" replace />;
  return <section className="admin-simulator"><SectionHeader eyebrow="Ambiente demonstrativo" title="Simulador administrativo" subtitle="Aplique cenarios para demonstrar as decisoes do produto." /><div className="simulator-grid"><button type="button" onClick={() => setScenario("peak")}>Simular pico</button><button type="button" onClick={() => setScenario("critical")}>Simular critico</button><button type="button" onClick={() => setScenario("favorable")}>Simular favoravel</button></div><article className="surface panel"><h3>Cenario atual</h3><Badge value={scenario === "critical" ? "Crítico" : scenario === "favorable" ? "Favorável" : "Alerta"} /><p>{state.chargers.length} carregadores e {state.sessions.length} sessoes no estado compartilhado.</p></article></section>;
}
