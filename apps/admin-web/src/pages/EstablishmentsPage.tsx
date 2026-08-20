import { Navigate } from "react-router-dom";
import { UserRole } from "@chargegrid/shared";
import { useAuth } from "../auth/AuthContext";
import { SectionHeader, StatusTabs } from "../components/SemsUi";
import { StatusBadge } from "../components/StatusBadge";
import { assets } from "../constants/assets";
import { demoScenarioD0, money } from "../services/adminDemo";

export function EstablishmentsPage() {
  const { account } = useAuth();
  if (account?.role !== UserRole.GOODWE_ADMIN) return <Navigate to="/" replace />;
  const revenue = demoScenarioD0.financials.reduce((sum, item) => sum + (item.grossSettledRevenue ?? 0), 0);

  return <>
    <section className="surface panel sems-list-page" data-testid="goodwe-establishments-overview">
      <SectionHeader title="Lista de estabelecimentos" subtitle="Clientes comerciais, implantação, receita e operação." />
      <form onSubmit={(event) => event.preventDefault()}><div className="sems-filter-toolbar"><button type="button" className="sems-filter-button"><span>Filter</span></button><label className="sems-filter-field"><span>Busca</span><input name="search" placeholder="Nome, CNPJ, local ou carregador" /></label><label className="sems-filter-field"><span>Endereço</span><input name="address" placeholder="Cidade, estado ou unidade" /></label><label className="sems-filter-field"><span>Email</span><input name="email" placeholder="Contato comercial" /></label><button type="submit" className="sems-icon-action" aria-label="Pesquisar">⌕</button><button type="button" className="sems-icon-action" aria-label="Atualizar">↻</button><button type="button" className="sems-primary-action">+ Novo estabelecimento</button></div></form>
      <StatusTabs items={[{ label: "Todos", count: 1, tone: "info" }, { label: "Em operação", count: 1, tone: "good" }, { label: "Aguardando", count: 0, tone: "warn" }, { label: "Offline", count: 0, tone: "muted" }, { label: "Falha", count: 0, tone: "danger" }, { label: "Em implantação", count: 0, tone: "info" }]} />
      <div className="sems-table-wrap table-wrap"><table className="data-table"><thead><tr><th>Informações do cliente</th><th>Status</th><th>Locais</th><th>Carregadores</th><th>Sessões</th><th>Fila</th><th>Receita</th><th>Operação</th></tr></thead><tbody><tr><td><div className="sems-entity-cell"><img src={assets.plant} alt="" /><strong>{demoScenarioD0.establishment.name}</strong><span>São Paulo/SP · cenário sintético D0</span></div></td><td><StatusBadge label="Em operação" tone="success" /></td><td>1</td><td>{demoScenarioD0.chargers.length}</td><td>{demoScenarioD0.dashboardKpis.activeSessions}</td><td>{demoScenarioD0.queue.activeCount}</td><td>{money(revenue)}</td><td><button className="ghost-button" type="button">Abrir</button> <button className="ghost-button" type="button">Local</button></td></tr></tbody></table></div>
    </section>
    <section className="surface panel sems-panel">
      <SectionHeader title="Cadastrar estabelecimento e acesso" subtitle="Vincule uma ou várias plantas SEMS+ à mesma conta comercial." />
      <form className="simulator-grid" onSubmit={(event) => event.preventDefault()}>
        <label>Nome do estabelecimento<input name="name" required /></label><label>Razão social<input name="corporateName" required /></label><label>CNPJ<input name="cnpj" required /></label><label>Responsável<input name="responsible" required /></label><label>Telefone<input name="phone" required /></label><label>Email<input name="email" type="email" required /></label><label>Planta SEMS+<select name="plant"><option>Selecionar planta autorizada</option></select></label><label>Nome comercial da planta<input name="locationName" /></label><label>Tarifa base (R$/kWh)<input name="pricePerKwh" type="number" min="0" step="0.01" defaultValue="1.90" /></label><label>Status<select defaultValue="Ativo"><option>Ativo</option><option>Inativo</option></select></label><label>Nome de acesso do gestor<input name="accountName" required /></label><label>Email de acesso<input name="accountEmail" type="email" required /></label><button type="submit">Criar estabelecimento com login</button>
      </form>
    </section>
  </>;
}
