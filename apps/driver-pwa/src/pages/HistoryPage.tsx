import { CommercialSessionStatus, type CommercialSessionRecord } from "@chargegrid/shared";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDriverApp } from "../app/DriverAppContext";
import { AppIcon } from "../components/AppIcon";
import { AuthGate, PageIntro } from "../components/Ui";
import { getCommercialSessions } from "../services/paymentApi";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function needsAttention(session: CommercialSessionRecord) {
  return [CommercialSessionStatus.PAYMENT_FAILED, CommercialSessionStatus.START_FAILED, CommercialSessionStatus.FAULTED, CommercialSessionStatus.SETTLEMENT_PENDING, CommercialSessionStatus.OUTSTANDING_BALANCE].includes(session.status);
}

export function HistoryPage() {
  const { isCommercialDriver, profile } = useDriverApp();
  const [filter, setFilter] = useState<"all" | "completed" | "attention">("all");
  const [sessions, setSessions] = useState<CommercialSessionRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isCommercialDriver) return;
    let active = true;
    const refresh = async () => {
      try {
        const result = await getCommercialSessions();
        if (active) { setSessions(result.sessions); setError(""); }
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Não foi possível consultar seu histórico.");
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2000);
    return () => { active = false; window.clearInterval(timer); };
  }, [isCommercialDriver]);

  if (!isCommercialDriver) return <AuthGate title="Seu histórico fica na conta" copy="Entre com sua conta de motorista para manter sessões, veículos e pagamentos organizados." />;
  const visibleSessions = sessions.filter((session) => filter === "completed" ? session.status === CommercialSessionStatus.COMPLETED : filter === "attention" ? needsAttention(session) : true);

  return <>
    <PageIntro eyebrow={profile?.fullName ?? "Motorista"} title="Suas recargas"><p>Consulte energia, valores e comprovantes das sessões vinculadas à sua conta.</p></PageIntro>
    <div className="filter-pills" aria-label="Filtro do histórico"><button type="button" className={filter === "all" ? "is-active" : ""} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>Todas</button><button type="button" className={filter === "completed" ? "is-active" : ""} aria-pressed={filter === "completed"} onClick={() => setFilter("completed")}>Concluídas</button><button type="button" className={filter === "attention" ? "is-active" : ""} aria-pressed={filter === "attention"} onClick={() => setFilter("attention")}>Com atenção</button></div>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    {visibleSessions.length ? <section className="history-list">{visibleSessions.map((session) => <Link to={`/receipt/${session.id}`} className="history-card" key={session.id}><span className="history-icon"><AppIcon name="plug" /></span><div><strong>{session.establishmentName}</strong><small>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(session.endedAt ?? session.createdAt))}</small><span>{(session.energyWh / 1000).toFixed(2).replace(".", ",")} kWh · {session.chargerName}</span></div><div><strong>{currency.format(session.totalCostCents / 100)}</strong><AppIcon name="chevron-right" /></div></Link>)}</section> : <section className="empty-inline tall"><span><AppIcon name={filter === "attention" ? "check" : "receipt"} size={30} /></span><strong>{filter === "attention" ? "Nenhuma sessão precisa de atenção" : "Nenhuma recarga encontrada"}</strong><p>{filter === "attention" ? "Pendências de pagamento ou saldo aparecerão aqui." : "Sua próxima recarga aparecerá neste histórico."}</p>{filter !== "attention" ? <Link className="primary-link" to="/explore">Encontrar carregador</Link> : null}</section>}
  </>;
}
