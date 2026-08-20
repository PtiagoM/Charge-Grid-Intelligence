import { UserRole } from "@chargegrid/shared";
import { useCallback, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { GoogleNetworkMap } from "../components/GoogleNetworkMap";
import { KpiCard, SectionHeader, StatusTabs, UtilizationChart } from "../components/SemsUi";
import { adminMapPlantsD0, demoScenarioD0, money } from "../services/adminDemo";

export function HomePage() {
  const { account } = useAuth();
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(adminMapPlantsD0[0]?.id ?? null);
  const selectPlant = useCallback((plantId: string) => setSelectedPlantId(plantId), []);
  const totalEnergy = demoScenarioD0.sessions.reduce((sum, session) => sum + session.energyDeliveredKwh, 0);
  const movedRevenue = demoScenarioD0.financials.reduce((sum, item) => sum + item.energyRevenue + item.idleRevenue, 0);
  const commission = demoScenarioD0.financials.reduce((sum, item) => sum + (item.chargegridCommission ?? 0), 0);
  const active = demoScenarioD0.dashboardKpis.activeSessions ?? 0;
  const available = demoScenarioD0.dashboardKpis.availableChargers ?? 0;
  const faulted = demoScenarioD0.dashboardKpis.incidentCount ?? 0;
  const waiting = demoScenarioD0.queue.activeCount;

  return <>
    <section className="sems-dashboard-map" data-testid="mvp-overview-panel">
      <GoogleNetworkMap plants={adminMapPlantsD0} selectedPlantId={selectedPlantId} onSelectPlant={selectPlant} />
      <div className="sems-dashboard-title"><h2>Dashboard comercial</h2><p>Rede de vendas, implantação e operação ChargeGrid sobre o ecossistema GoodWe.</p></div>
    </section>

    <section className="surface panel sems-panel">
      <SectionHeader title="Rede comercial" subtitle="Indicadores principais da operação GoodWe no cenário oficial D0." />
      <StatusTabs items={[
        { label: "Todos", count: demoScenarioD0.chargers.length, tone: "info" },
        { label: "Em operação", count: active + available, tone: "good" },
        { label: "Aguardando", count: waiting, tone: "warn" },
        { label: "Offline", count: 0, tone: "muted" },
        { label: "Falha", count: faulted, tone: "danger" },
        { label: "Em implantação", count: 0, tone: "info" }
      ]} />
      <div className="kpi-grid four-cols">
        <KpiCard label="Disponíveis" value={available} help="prontos para vender kWh" accent="good" />
        <KpiCard label="Em uso" value={active} help="receita em tempo real" accent="danger" />
        <KpiCard label="Sessões acontecendo" value={active} help="agora" />
        <KpiCard label="Locais cadastrados" value={adminMapPlantsD0.length} help="plantas comerciais ativas" />
        <KpiCard label="Comissão ChargeGrid" value={money(commission)} help="5% nas liquidações D0" />
        <KpiCard label="Energia entregue" value={`${totalEnergy.toFixed(2)} kWh`} help="sessões do cenário" />
        <KpiCard label="Fila comercial" value={waiting} help="clientes aguardando carga" accent={waiting ? "warn" : "good"} />
        <KpiCard label="Status da carteira" value="Estável" help="sem fila ativa" accent="good" />
      </div>
    </section>

    <section className="sems-dashboard-grid">
      <article className="surface panel sems-chart-card"><SectionHeader title="Potência" subtitle="Leitura comercial de ocupação por horário." /><UtilizationChart /></article>
      <article className="surface panel sems-chart-card"><SectionHeader title="Revenue" subtitle="Receita e cobrança das recargas." /><div className="detail-grid"><article><h3>Receita movimentada</h3><p>{money(movedRevenue)}</p></article><article><h3>Comissão liquidada</h3><p>{money(commission)}</p></article><article><h3>Tarifa atual</h3><p>{money(demoScenarioD0.tariff.currentPricePerKwh)}/kWh</p></article></div></article>
      <article className="surface panel sems-chart-card"><SectionHeader title="Alarmes comerciais" subtitle="Sinais de operação e disponibilidade." /><div className="detail-grid"><article><h3>Fila</h3><p>{waiting} aguardando</p></article><article><h3>Falhas</h3><p>{faulted} equipamento</p></article><article><h3>Energia</h3><p>{demoScenarioD0.plant.energyStatus}</p></article></div></article>
      <article className="surface panel sems-chart-card"><SectionHeader title="Orientação operacional" subtitle="Resumo determinístico; a IA será integrada posteriormente." /><article className="assistant-card"><p>A planta opera com {demoScenarioD0.plant.evLoadKw} kW de carga EV para um limite de {demoScenarioD0.plant.operationalEvLimitKw} kW. A falha técnica permanece separada da disponibilidade comercial.</p></article></article>
    </section>

    {account?.role === UserRole.GOODWE_ADMIN ? <section className="surface panel">
      <SectionHeader title="Cadastrar estabelecimento e acesso" subtitle="A GoodWe habilita comercialmente plantas energéticas já cadastradas no SEMS+." />
      <form className="simulator-grid" onSubmit={(event) => event.preventDefault()}>
        <label>Nome do estabelecimento<input name="name" required /></label><label>Razão social<input name="corporateName" required /></label><label>CNPJ<input name="cnpj" required /></label><label>Responsável<input name="responsible" required /></label><label>Telefone<input name="phone" required /></label><label>Email<input name="email" type="email" required /></label><label>Planta SEMS+<select name="plant"><option>Selecionar planta autorizada</option></select></label><label>Nome comercial da planta<input name="locationName" placeholder="Unidade Principal" /></label><label>Tarifa base (R$/kWh)<input name="pricePerKwh" type="number" min="0" step="0.01" defaultValue="1.90" required /></label><label>Status<select name="status" defaultValue="Ativo"><option>Ativo</option><option>Inativo</option></select></label><label>Nome de acesso do gestor<input name="accountName" required /></label><label>Email de acesso<input name="accountEmail" type="email" required /></label><button type="submit">Criar estabelecimento com login</button>
      </form>
    </section> : null}
  </>;
}
