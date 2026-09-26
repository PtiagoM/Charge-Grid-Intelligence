import { CommercialSessionStatus, PaymentStatus, type CommercialSessionRecord } from "@chargegrid/shared";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppIcon } from "../components/AppIcon";
import { StatusChip } from "../components/StatusChip";
import { PageIntro } from "../components/Ui";
import { getCommercialSession } from "../services/paymentApi";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function ReceiptPage() {
  const { receiptId } = useParams();
  const [session, setSession] = useState<CommercialSessionRecord | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!receiptId) return;
    let active = true;
    void getCommercialSession(receiptId).then((result) => {
      if (active) setSession(result);
    }).catch((caught: unknown) => {
      if (active) setError(caught instanceof Error ? caught.message : "Não foi possível consultar este comprovante.");
    });
    return () => { active = false; };
  }, [receiptId]);

  if (error) return <section className="empty-state"><AppIcon name="receipt" size={38} /><h1>Comprovante indisponível</h1><p>{error}</p><Link className="primary-link" to="/history">Ver histórico</Link></section>;
  if (!session) return <section className="empty-state"><span className="spinner" /><h1>Consultando comprovante</h1><p>Buscando valores confirmados pela operação ChargeGrid.</p></section>;

  const settled = session.status === CommercialSessionStatus.COMPLETED && session.payment.status === PaymentStatus.PAID;
  const refundAmount = session.payment.refundedCents / 100;
  return <>
    <PageIntro eyebrow="Sessão comercial" title="Comprovante"><p>{session.establishmentName} · {session.chargerName}</p></PageIntro>
    <section className="receipt-card">
      <div className="receipt-success"><span><AppIcon name={settled ? "check" : "clock"} size={30} /></span><div><StatusChip label={settled ? "Pagamento concluído" : "Liquidação pendente"} tone={settled ? "success" : "warning"} /><h2>{currency.format(session.totalCostCents / 100)}</h2><p>{settled ? "Pagamento processado pela Stripe" : "Acompanhe a confirmação do pagamento na sessão."}</p></div></div>
      <dl className="receipt-details"><div><dt>Identificador</dt><dd>{session.publicCode}</dd></div>{session.payment.paymentIntentId ? <div><dt>Pagamento Stripe</dt><dd>{session.payment.paymentIntentId}</dd></div> : null}<div><dt>Concluída em</dt><dd>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(session.endedAt ?? session.updatedAt))}</dd></div><div><dt>Energia</dt><dd>{(session.energyWh / 1000).toFixed(2).replace(".", ",")} kWh</dd></div><div><dt>Valor da energia</dt><dd>{currency.format(session.energyCostCents / 100)}</dd></div><div><dt>Ociosidade</dt><dd>{currency.format(session.idleCostCents / 100)}</dd></div><div><dt>Meio</dt><dd>{session.payment.method === "PIX" ? "Pix" : "Cartão"}</dd></div><div><dt>Limite garantido</dt><dd>{currency.format(session.authorizedCents / 100)}</dd></div>{refundAmount > 0 ? <div className="refund-row"><dt>Saldo em devolução</dt><dd>{currency.format(refundAmount)}</dd></div> : null}<div className="total-row"><dt>Total utilizado</dt><dd>{currency.format(session.totalCostCents / 100)}</dd></div></dl>
      <p className="receipt-footnote">O valor considera energia confirmada e eventual ociosidade. Este comprovante não substitui documento fiscal.</p>
    </section>
    <button type="button" className="secondary-cta" onClick={() => window.print()}><AppIcon name="receipt" size={20} /> Salvar comprovante</button>
  </>;
}
