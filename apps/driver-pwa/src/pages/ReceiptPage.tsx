import { Navigate, useParams } from "react-router-dom";
import { useDriverApp } from "../app/DriverAppContext";
import { AppIcon } from "../components/AppIcon";
import { StatusChip } from "../components/StatusChip";
import { PageIntro } from "../components/Ui";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function ReceiptPage() {
  const { receiptId } = useParams();
  const { receipts } = useDriverApp();
  const receipt = receipts.find((item) => item.id === receiptId);
  if (!receipt) return <Navigate to="/session" replace />;

  return <>
    <PageIntro eyebrow="Sessão comercial concluída" title="Comprovante"><p>{receipt.establishmentName} · {receipt.chargerName}</p></PageIntro>
    <section className="receipt-card">
      <div className="receipt-success"><span><AppIcon name="check" size={30} /></span><div><StatusChip label="COMPLETED" tone="success" /><h2>{currency.format(receipt.totalAmount)}</h2><p>Pagamento processado pela Stripe</p></div></div>
      <dl className="receipt-details"><div><dt>Identificador</dt><dd>{receipt.id}</dd></div>{receipt.paymentIntentId ? <div><dt>Pagamento Stripe</dt><dd>{receipt.paymentIntentId}</dd></div> : null}<div><dt>Concluída em</dt><dd>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(receipt.completedAt))}</dd></div><div><dt>Energia</dt><dd>{receipt.energyKwh.toFixed(2).replace(".", ",")} kWh</dd></div><div><dt>Valor da energia</dt><dd>{currency.format(receipt.energyAmount)}</dd></div><div><dt>Ociosidade</dt><dd>{currency.format(receipt.idleAmount)}</dd></div><div><dt>Meio</dt><dd>{receipt.paymentMethod === "PIX" ? "Pix" : "Cartão"}</dd></div><div><dt>Limite garantido</dt><dd>{currency.format(receipt.financialLimit)}</dd></div>{receipt.refundAmount > 0 ? <div className="refund-row"><dt>Saldo em devolução</dt><dd>{currency.format(receipt.refundAmount)}</dd></div> : null}<div className="total-row"><dt>Total utilizado</dt><dd>{currency.format(receipt.totalAmount)}</dd></div></dl>
      <p className="receipt-footnote">O valor considera energia confirmada e eventual ociosidade. Este comprovante não substitui documento fiscal.</p>
    </section>
    <button type="button" className="secondary-cta" onClick={() => window.print()}><AppIcon name="receipt" size={20} /> Salvar comprovante</button>
  </>;
}
