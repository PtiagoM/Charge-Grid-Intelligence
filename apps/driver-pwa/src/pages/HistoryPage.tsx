import { useState } from "react";
import { Link } from "react-router-dom";
import { useDriverApp } from "../app/DriverAppContext";
import { AppIcon } from "../components/AppIcon";
import { AuthGate, PageIntro } from "../components/Ui";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function HistoryPage() {
  const { isAuthenticated, profile, receipts } = useDriverApp();
  const [filter, setFilter] = useState<"all" | "completed" | "attention">("all");
  if (!isAuthenticated) return <AuthGate title="Seu histórico fica na conta" copy="Visitantes recebem um comprovante pontual. Entre para manter sessões, veículos e pagamentos organizados." />;
  const ownReceipts = receipts.filter((receipt) => receipt.owner === "driver");

  return <>
    <PageIntro eyebrow={profile?.fullName ?? "Motorista"} title="Suas recargas"><p>Consulte energia, valores e comprovantes das sessões vinculadas à sua conta.</p></PageIntro>
    <div className="filter-pills" aria-label="Filtro do histórico"><button type="button" className={filter === "all" ? "is-active" : ""} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>Todas</button><button type="button" className={filter === "completed" ? "is-active" : ""} aria-pressed={filter === "completed"} onClick={() => setFilter("completed")}>Concluídas</button><button type="button" className={filter === "attention" ? "is-active" : ""} aria-pressed={filter === "attention"} onClick={() => setFilter("attention")}>Com atenção</button></div>
    {ownReceipts.length && filter !== "attention" ? <section className="history-list">{ownReceipts.map((receipt) => <Link to={`/receipt/${receipt.id}`} className="history-card" key={receipt.id}><span className="history-icon"><AppIcon name="plug" /></span><div><strong>{receipt.establishmentName}</strong><small>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(receipt.completedAt))}</small><span>{receipt.energyKwh.toFixed(2).replace(".", ",")} kWh · {receipt.chargerName}</span></div><div><strong>{currency.format(receipt.totalAmount)}</strong><AppIcon name="chevron-right" /></div></Link>)}</section> : <section className="empty-inline tall"><span><AppIcon name={filter === "attention" ? "check" : "receipt"} size={30} /></span><strong>{filter === "attention" ? "Nenhuma sessão precisa de atenção" : "Nenhuma recarga concluída"}</strong><p>{filter === "attention" ? "Pendências de pagamento ou saldo aparecerão aqui." : "Sua próxima recarga concluída aparecerá neste histórico."}</p>{filter !== "attention" ? <Link className="primary-link" to="/explore">Encontrar carregador</Link> : null}</section>}
  </>;
}
