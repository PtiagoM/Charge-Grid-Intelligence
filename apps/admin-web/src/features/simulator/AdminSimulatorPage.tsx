import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import type { CommercialSnapshot } from "@chargegrid/shared";
import { useAdminState } from "../../app/AdminState";
import { DataTable, SectionHeader, number } from "../../components/AdminUi";
import { canUseHardwareLab } from "../../services/hardwareLabAccess";
import { fetchCommercialSnapshot, resetCommercialTestData, sendHardwareEvent, type HardwareAction } from "../../services/commercialSnapshotRepository";

const statusLabels: Record<string, string> = { AVAILABLE: "Disponível", CONNECTED: "Veículo conectado", CHARGING: "Entregando energia", OFFLINE: "Offline", FAULT: "Falha" };

function HardwareLab() {
  const [snapshot, setSnapshot] = useState<CommercialSnapshot | null>(null);
  const [power, setPower] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const refresh = useCallback(async () => {
    try { setSnapshot(await fetchCommercialSnapshot()); setMessage(""); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível consultar a API."); }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function emit(chargerCode: string, action: HardwareAction) {
    setBusy(chargerCode);
    setMessage("");
    try {
      setSnapshot(await sendHardwareEvent(chargerCode, action, action === "CONNECT" ? power[chargerCode] : undefined));
      setMessage(`${chargerCode}: evento ${action} confirmado pela API.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "O evento físico falhou.");
    } finally { setBusy(""); }
  }

  async function resetTestData() {
    if (!window.confirm("Limpar sessões, pagamentos, fila e telemetria do Hub Solar Aurora?")) return;
    setBusy("reset");
    setMessage("");
    try {
      setSnapshot(await resetCommercialTestData());
      setMessage("Hub Solar Aurora reiniciado. Os seis carregadores estão disponíveis.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível reiniciar os dados de teste.");
    } finally { setBusy(""); }
  }

  const chargers = snapshot?.establishments.flatMap((establishment) => establishment.chargers.map((charger) => ({ establishment, charger }))) ?? [];
  return <section className="admin-simulator operations-detail" data-testid="hardware-lab">
    <SectionHeader eyebrow="Ferramenta técnica · GoodWe simulado" title="Laboratório de hardware" subtitle="Emite somente eventos físicos no backend compartilhado. Pagamentos e sessões continuam no fluxo normal da PWA e da Stripe em teste." />
    <section className="surface panel">
      <p>Os mesmos carregadores aparecem na PWA e em ChargeGrid &gt; Operação. O polling apenas observa; energia e custo avançam no backend.</p>
      <button type="button" className="cg-danger-action" disabled={Boolean(busy)} onClick={() => void resetTestData()}>Reiniciar dados de teste</button>
      {message ? <p role="status" className="command-feedback">{message}</p> : null}
      <DataTable columns={["Local / carregador", "Estado físico", "Potência", "Eventos GoodWe simulados"]}>{chargers.map(({ establishment, charger }) => {
        const disabled = busy === charger.code;
        return <tr key={charger.id}>
          <td><strong>{charger.code}</strong><span>{establishment.name} · vaga {charger.parkingSpot}</span></td>
          <td><strong>{statusLabels[charger.physicalStatus] ?? charger.physicalStatus}</strong><span>{charger.commercialStatus}</span></td>
          <td><label><span className="sr-only">Potência de {charger.code}</span><input aria-label={`Potência de ${charger.code}`} type="number" min="0.1" max={charger.nominalPowerKw} step="0.1" value={power[charger.code] ?? charger.nominalPowerKw} onChange={(event) => setPower((current) => ({ ...current, [charger.code]: event.target.valueAsNumber }))} /> kW</label><span>Atual: {number(charger.currentPowerKw)} kW</span></td>
          <td><div className="simulator-grid">
            {charger.physicalStatus === "AVAILABLE" ? <button type="button" disabled={disabled} onClick={() => void emit(charger.code, "CONNECT")}>Conectar veículo</button> : null}
            {charger.physicalStatus === "CONNECTED" ? <button type="button" disabled={disabled} onClick={() => void emit(charger.code, "DISCONNECT")}>Desconectar</button> : null}
            {charger.physicalStatus === "CHARGING" ? <button type="button" disabled={disabled} onClick={() => void emit(charger.code, "STOP")}>Interromper energia</button> : null}
            {["OFFLINE", "FAULT"].includes(charger.physicalStatus) ? <button type="button" disabled={disabled} onClick={() => void emit(charger.code, "RECOVER")}>Recuperar equipamento</button> : <><button type="button" disabled={disabled} onClick={() => void emit(charger.code, "OFFLINE")}>Offline</button><button type="button" disabled={disabled} onClick={() => void emit(charger.code, "FAULT")}>Falha</button></>}
          </div></td>
        </tr>;
      })}</DataTable>
      {!snapshot ? <p>Carregando carregadores compartilhados…</p> : null}
    </section>
  </section>;
}

export function AdminSimulatorPage() {
  const { account } = useAdminState();
  if (!account) return <Navigate to="/login" replace />;
  if (!canUseHardwareLab(account)) return <section className="surface panel"><h2>Acesso restrito ao laboratório</h2><p>Use uma conta GoodWe ou administradora do estabelecimento.</p></section>;
  return <HardwareLab />;
}
