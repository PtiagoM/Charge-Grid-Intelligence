import { CommercialSessionStatus } from "@chargegrid/shared";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDriverApp } from "../app/DriverAppContext";
import { AppIcon, type AppIconName } from "../components/AppIcon";
import { SessionPlantCatalog } from "../components/SessionPlantCatalog";
import { PageIntro, PrimaryButton, SecondaryButton } from "../components/Ui";
import { settlePayment } from "../services/paymentApi";

interface SessionPresentation {
  label: string;
  title: string;
  detail: string;
  tone: "success" | "info" | "warning" | "danger" | "neutral";
  icon: AppIconName;
}

const statusCopy: Partial<Record<CommercialSessionStatus, SessionPresentation>> = {
  SESSION_CREATED: { label: "Sessão criada", title: "Preparando sua recarga", detail: "Organizando as condições para começar com segurança.", tone: "neutral", icon: "clock" },
  AWAITING_PAYMENT: { label: "Aguardando pagamento", title: "Confirme o pagamento", detail: "A recarga será preparada assim que a garantia for confirmada.", tone: "warning", icon: "card" },
  AUTHORIZED: { label: "Garantia confirmada", title: "Pagamento garantido", detail: "A energia ainda não começou. Estamos validando as condições da planta.", tone: "success", icon: "check" },
  WAITING_START: { label: "Tudo pronto", title: "Pronto para iniciar", detail: "O carregador e a garantia estão válidos.", tone: "info", icon: "plug" },
  STARTING: { label: "Conectando", title: "Iniciando recarga", detail: "Aguardando a confirmação do carregador.", tone: "info", icon: "plug" },
  CHARGING: { label: "Carregando", title: "Recarga em andamento", detail: "Acompanhe o consumo e o limite da sua sessão.", tone: "info", icon: "plug" },
  SUSPENDED_BY_DEMAND: { label: "Recarga interrompida", title: "Pausa para proteger a planta", detail: "A energia foi interrompida por segurança. Você não será cobrado por energia não confirmada.", tone: "warning", icon: "warning" },
  ENERGY_FINISHED: { label: "Energia concluída", title: "Recarga finalizada", detail: "Agora retire e desconecte o veículo.", tone: "success", icon: "check" },
  IDLE_GRACE_PERIOD: { label: "Tempo para retirada", title: "Retire seu veículo", detail: "A tolerância é gratuita enquanto o contador estiver ativo.", tone: "warning", icon: "clock" },
  IDLE_FEE: { label: "Retirada necessária", title: "Ociosidade em cobrança", detail: "A tarifa é de R$ 0,50 por minuto enquanto o veículo permanecer conectado.", tone: "danger", icon: "warning" },
  SETTLING: { label: "Conferindo valores", title: "Finalizando pagamento", detail: "Consolidando o valor final. A sessão ainda não está concluída.", tone: "info", icon: "clock" },
  COMPLETED: { label: "Tudo certo", title: "Sessão concluída", detail: "Pagamento confirmado e comprovante disponível.", tone: "success", icon: "check" },
  PAYMENT_FAILED: { label: "Pagamento não confirmado", title: "Não foi possível autorizar", detail: "Revise o pagamento antes de tentar iniciar novamente.", tone: "danger", icon: "warning" },
  START_FAILED: { label: "Recarga não iniciada", title: "O carregador não respondeu", detail: "Nenhuma energia foi registrada. Tente novamente ou escolha outra planta.", tone: "danger", icon: "warning" },
  FAULTED: { label: "Carregador indisponível", title: "A recarga foi interrompida", detail: "Vamos considerar somente a energia confirmada até a falha.", tone: "danger", icon: "warning" },
  CANCELLED: { label: "Sessão cancelada", title: "Esta sessão foi encerrada", detail: "Nenhuma nova energia será registrada.", tone: "neutral", icon: "clock" },
  SETTLEMENT_PENDING: { label: "Pagamento em análise", title: "Finalização pendente", detail: "Os valores estão seguros enquanto aguardamos a confirmação.", tone: "warning", icon: "clock" },
  DISPUTED: { label: "Pagamento em análise", title: "Precisamos revisar esta sessão", detail: "O pagamento está em contestação e será acompanhado pelo suporte.", tone: "warning", icon: "warning" },
  OUTSTANDING_BALANCE: { label: "Saldo pendente", title: "Existe um valor em aberto", detail: "Regularize o saldo antes de iniciar uma nova sessão.", tone: "danger", icon: "card" }
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatRemainingTime(minutes: number) {
  if (minutes < 1) return "menos de 1 min";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.ceil(minutes % 60);
  return hours ? `${hours} h${remainingMinutes ? ` ${remainingMinutes} min` : ""}` : `${remainingMinutes} min`;
}

function formatCountdown(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(safeSeconds % 60).padStart(2, "0")}`;
}

export function SessionPage() {
  const { session, receipts, setSessionStatus, finishEnergy, applyIdleFee } = useDriverApp();
  const [settling, setSettling] = useState(false);
  const [settlementError, setSettlementError] = useState("");
  const [clockNow, setClockNow] = useState(Date.now);

  useEffect(() => {
    if (session?.status !== CommercialSessionStatus.IDLE_GRACE_PERIOD) return;
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [session?.status]);

  if (!session) return <SessionPlantCatalog />;

  const presentation = statusCopy[session.status] ?? { label: "Sessão em atualização", title: "Acompanhando sua sessão", detail: "Em instantes mostraremos o próximo passo.", tone: "neutral" as const, icon: "clock" as const };
  const total = session.energyAmount + session.idleAmount;
  const completedReceipt = receipts[0];
  const isPendingStart = [CommercialSessionStatus.AUTHORIZED, CommercialSessionStatus.WAITING_START, CommercialSessionStatus.STARTING].includes(session.status);
  const charging = session.status === CommercialSessionStatus.CHARGING;
  const creditProgress = Math.min(100, Math.round((session.energyAmount / session.financialLimit) * 100));
  const remainingCredit = Math.max(0, session.financialLimit - session.energyAmount);
  const remainingKwh = session.tariffPerKwh > 0 ? remainingCredit / session.tariffPerKwh : 0;
  const estimatedMinutesRemaining = session.currentPowerKw > 0 ? (remainingKwh / session.currentPowerKw) * 60 : 0;
  const graceRemainingSeconds = session.idleGraceEndsAt ? Math.max(0, Math.ceil((new Date(session.idleGraceEndsAt).getTime() - clockNow) / 1000)) : 15 * 60;
  const graceExpired = graceRemainingSeconds === 0;
  const graceProgress = Math.round((graceRemainingSeconds / (15 * 60)) * 360);
  const graceNeedsUrgency = graceExpired && session.status === CommercialSessionStatus.IDLE_GRACE_PERIOD;
  const heroTone = graceNeedsUrgency ? "danger" : presentation.tone;

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
    <PageIntro eyebrow={`${session.chargerName} · vaga ${session.parkingSpot}`} title={graceNeedsUrgency ? "Retire seu veículo agora" : presentation.title}><p>{graceNeedsUrgency ? "A tolerância terminou e a cobrança de ociosidade pode começar." : presentation.detail}</p></PageIntro>
    <section className={`session-hero state-${heroTone}`} aria-live="polite">
      <div className="session-state-visual"><span><AppIcon name={graceNeedsUrgency ? "warning" : presentation.icon} size={36} /></span><div><small>Estado da recarga</small><strong>{graceNeedsUrgency ? "Tolerância encerrada" : presentation.label}</strong></div></div>
      {isPendingStart ? <div className="starting-visual"><span className="spinner" /><strong>{session.status === CommercialSessionStatus.STARTING ? "Confirmando energia" : "Preparando carregador"}</strong></div> : charging ? <div className="charging-limit-progress" aria-label={`${creditProgress}% do limite de crédito utilizado`}><div className="charging-progress-heading"><span>Limite utilizado</span><strong>{creditProgress}%</strong></div><div className="charging-progress-track"><span style={{ width: `${creditProgress}%` }} /></div><div className="charging-progress-summary"><span>{currency.format(session.energyAmount)} de {currency.format(session.financialLimit)}</span><strong>Restam {currency.format(remainingCredit)}</strong></div><p>Estimativa até o limite: <strong>{formatRemainingTime(estimatedMinutesRemaining)}</strong></p></div> : session.status === CommercialSessionStatus.IDLE_GRACE_PERIOD ? <div className={`idle-countdown${graceExpired ? " is-expired" : ""}`}><div className="idle-countdown-ring" style={{ background: `conic-gradient(var(--cg-warning) ${graceProgress}deg, var(--cg-surface-4) 0deg)` }}><span>{formatCountdown(graceRemainingSeconds)}<small>{graceExpired ? "encerrada" : "restantes"}</small></span></div><p>{graceExpired ? "A cobrança de ociosidade pode começar. Retire o veículo agora." : "Desconecte o veículo antes do fim da tolerância."}</p></div> : <div className="session-main-metric"><span>Energia confirmada</span><strong>{session.energyKwh.toFixed(2).replace(".", ",")} <small>kWh</small></strong></div>}
      {!isPendingStart ? <div className="session-metrics"><div><span>Energia confirmada</span><strong>{session.energyKwh.toFixed(2).replace(".", ",")} kWh</strong></div><div><span>Potência agora</span><strong>{session.currentPowerKw.toFixed(1).replace(".", ",")} kW</strong></div><div><span>Custo estimado</span><strong>{currency.format(total)}</strong></div><div><span>Tarifa</span><strong>{currency.format(session.tariffPerKwh)}/kWh</strong></div></div> : null}
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
