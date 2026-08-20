import { CommercialSessionStatus } from "@chargegrid/shared";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDriverApp } from "../app/DriverAppContext";
import { AppIcon } from "../components/AppIcon";
import { StatusChip } from "../components/StatusChip";
import { PageIntro, PrimaryButton, SecondaryButton } from "../components/Ui";
import { settlePayment } from "../services/paymentApi";

const statusCopy: Partial<Record<CommercialSessionStatus, { label: string; title: string; detail: string; tone: "success" | "info" | "warning" | "danger" | "neutral" }>> = {
  AUTHORIZED: { label: "AUTHORIZED", title: "Pagamento garantido", detail: "A energia ainda não começou. Validando admissão comercial.", tone: "success" },
  WAITING_START: { label: "WAITING_START", title: "Pronto para iniciar", detail: "O carregador e a garantia estão válidos.", tone: "info" },
  STARTING: { label: "STARTING", title: "Iniciando recarga", detail: "Aguardando confirmação técnica do carregador.", tone: "info" },
  CHARGING: { label: "CHARGING", title: "Recarga em andamento", detail: "Energia confirmada na última leitura.", tone: "info" },
  ENERGY_FINISHED: { label: "ENERGY_FINISHED", title: "Energia finalizada", detail: "A sessão comercial continua enquanto o veículo estiver conectado.", tone: "success" },
  IDLE_GRACE_PERIOD: { label: "IDLE_GRACE_PERIOD", title: "Retire seu veículo", detail: "Você está dentro da tolerância gratuita de 15 minutos.", tone: "warning" },
  IDLE_FEE: { label: "IDLE_FEE", title: "Ociosidade em cobrança", detail: "R$ 0,50/min enquanto o veículo permanecer conectado.", tone: "danger" },
  SETTLING: { label: "SETTLING", title: "Finalizando pagamento", detail: "Consolidando o valor e eventual devolução. Ainda não está concluído.", tone: "info" },
  COMPLETED: { label: "COMPLETED", title: "Sessão concluída", detail: "Pagamento confirmado e comprovante disponível.", tone: "success" }
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function SessionPage() {
  const navigate = useNavigate();
  const { session, receipts, setSessionStatus, tickSession, finishEnergy, applyIdleFee, settleSession } = useDriverApp();
  const [settling, setSettling] = useState(false);
  const [settlementError, setSettlementError] = useState("");

  useEffect(() => {
    if (!session) return;
    if (session.status === CommercialSessionStatus.AUTHORIZED) {
      const timer = window.setTimeout(() => setSessionStatus(CommercialSessionStatus.WAITING_START), 700);
      return () => window.clearTimeout(timer);
    }
    if (session.status === CommercialSessionStatus.WAITING_START) {
      const timer = window.setTimeout(() => setSessionStatus(CommercialSessionStatus.STARTING), 800);
      return () => window.clearTimeout(timer);
    }
    if (session.status === CommercialSessionStatus.STARTING) {
      const timer = window.setTimeout(() => setSessionStatus(CommercialSessionStatus.CHARGING), 1400);
      return () => window.clearTimeout(timer);
    }
    if (session.status === CommercialSessionStatus.ENERGY_FINISHED) {
      const timer = window.setTimeout(() => setSessionStatus(CommercialSessionStatus.IDLE_GRACE_PERIOD), 1200);
      return () => window.clearTimeout(timer);
    }
    if (session.status === CommercialSessionStatus.SETTLING) {
      const timer = window.setTimeout(settleSession, 1400);
      return () => window.clearTimeout(timer);
    }
  }, [session, setSessionStatus, settleSession]);

  useEffect(() => {
    if (session?.status !== CommercialSessionStatus.CHARGING) return;
    const timer = window.setInterval(tickSession, 3000);
    return () => window.clearInterval(timer);
  }, [session?.status, tickSession]);

  if (!session) return <section className="empty-state"><AppIcon name="plug" size={36} /><h1>Nenhuma sessão ativa</h1><p>Use o mapa com uma conta ou escaneie o QR Code no carregador.</p><PrimaryButton onClick={() => navigate("/")}>Voltar ao início</PrimaryButton></section>;

  const presentation = statusCopy[session.status] ?? { label: session.status, title: "Estado da sessão", detail: "Consulte o próximo passo exibido.", tone: "neutral" as const };
  const total = session.energyAmount + session.idleAmount;
  const completedReceipt = receipts[0];
  const isPendingStart = [CommercialSessionStatus.AUTHORIZED, CommercialSessionStatus.WAITING_START, CommercialSessionStatus.STARTING].includes(session.status);

  async function beginSettlement() {
    if (!session) return;
    if (!session.paymentIntentId) {
      setSettlementError("A referência do pagamento não está disponível para a liquidação.");
      return;
    }
    setSettling(true);
    setSettlementError("");
    try {
      await settlePayment({
        paymentIntentId: session.paymentIntentId,
        sessionId: session.paymentSessionId,
        method: session.paymentMethod,
        totalAmount: Number(Math.max(0.5, total).toFixed(2)),
        financialLimit: session.financialLimit
      });
      setSessionStatus(CommercialSessionStatus.SETTLING);
    } catch (caught) {
      setSettlementError(caught instanceof Error ? caught.message : "Não foi possível liquidar o pagamento.");
    } finally {
      setSettling(false);
    }
  }

  return <>
    <PageIntro eyebrow={`${session.chargerName} · vaga ${session.parkingSpot}`} title={presentation.title}><p>{presentation.detail}</p></PageIntro>
    <section className={`session-hero state-${presentation.tone}`} aria-live="polite">
      <div className="session-state-row"><StatusChip label={presentation.label} tone={presentation.tone} /><span>Atualizado agora</span></div>
      {isPendingStart ? <div className="starting-visual"><span className="spinner" /><strong>{session.status === CommercialSessionStatus.STARTING ? "Confirmando energia" : "Preparando carregador"}</strong></div> : <div className="session-main-metric"><span>Energia confirmada</span><strong>{session.energyKwh.toFixed(2).replace(".", ",")} <small>kWh</small></strong></div>}
      <div className="session-metrics"><div><span>Potência agora</span><strong>{session.currentPowerKw.toFixed(1).replace(".", ",")} kW</strong></div><div><span>Custo estimado</span><strong>{currency.format(total)}</strong></div><div><span>Limite</span><strong>{currency.format(session.financialLimit)}</strong></div><div><span>Tarifa</span><strong>R$ 1,90/kWh</strong></div></div>
      {session.status === CommercialSessionStatus.IDLE_FEE ? <div className="idle-alert"><AppIcon name="warning" /><div><strong>{session.idleMinutes} min cobrados · {currency.format(session.idleAmount)}</strong><span>Retire e desconecte o veículo para encerrar.</span></div></div> : null}
    </section>

    <section className="mobile-card timeline-card"><h2>Linha do tempo da sessão</h2><ol className="session-timeline"><li className="is-complete"><span><AppIcon name="check" size={15} /></span><div><strong>Pagamento garantido</strong><small>{session.paymentMethod === "PIX" ? "Pix confirmado pela Stripe" : "Limite reservado no cartão"}</small></div></li><li className={session.status === CommercialSessionStatus.AUTHORIZED || session.status === CommercialSessionStatus.WAITING_START ? "is-current" : "is-complete"}><span /><div><strong>Início assíncrono</strong><small>Energia só aparece após confirmação</small></div></li><li className={session.status === CommercialSessionStatus.CHARGING ? "is-current" : session.energyKwh > 0 ? "is-complete" : ""}><span /><div><strong>Energia</strong><small>Somente medições confirmadas</small></div></li><li className={[CommercialSessionStatus.ENERGY_FINISHED, CommercialSessionStatus.IDLE_GRACE_PERIOD, CommercialSessionStatus.IDLE_FEE].includes(session.status) ? "is-current" : session.status === CommercialSessionStatus.COMPLETED ? "is-complete" : ""}><span /><div><strong>Retirada do veículo</strong><small>Tolerância e ociosidade</small></div></li><li className={session.status === CommercialSessionStatus.SETTLING ? "is-current" : session.status === CommercialSessionStatus.COMPLETED ? "is-complete" : ""}><span /><div><strong>Liquidação</strong><small>Captura ou devolução pela Stripe</small></div></li></ol></section>

    {session.status === CommercialSessionStatus.CHARGING ? <PrimaryButton onClick={finishEnergy}>Encerrar recarga</PrimaryButton> : null}
    {session.status === CommercialSessionStatus.IDLE_GRACE_PERIOD ? <><PrimaryButton onClick={beginSettlement} disabled={settling}>{settling ? "Liquidando com a Stripe…" : "Veículo desconectado"}</PrimaryButton><SecondaryButton onClick={applyIdleFee}>Registrar permanência após tolerância</SecondaryButton></> : null}
    {session.status === CommercialSessionStatus.IDLE_FEE ? <PrimaryButton onClick={beginSettlement} disabled={settling}>{settling ? "Liquidando com a Stripe…" : "Veículo desconectado"}</PrimaryButton> : null}
    {settlementError ? <p className="form-error" role="alert">{settlementError}</p> : null}
    {session.status === CommercialSessionStatus.COMPLETED && completedReceipt ? <><Link className="primary-link" to={`/receipt/${completedReceipt.id}`}><AppIcon name="receipt" size={20} /> Ver comprovante</Link><Link className="text-link" to={session.owner === "driver" ? "/history" : "/"}>{session.owner === "driver" ? "Ir para o histórico" : "Voltar ao início"}</Link></> : null}
  </>;
}
