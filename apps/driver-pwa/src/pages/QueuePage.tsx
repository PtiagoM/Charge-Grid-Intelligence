import { QueueStatus } from "@chargegrid/shared";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDriverApp } from "../app/DriverAppContext";
import { AppIcon } from "../components/AppIcon";
import { StatusChip } from "../components/StatusChip";
import { PageIntro, PrimaryButton, SecondaryButton } from "../components/Ui";

function remaining(expiresAt?: string) {
  if (!expiresAt) return "10:00";
  const seconds = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function QueuePage() {
  const navigate = useNavigate();
  const { isAuthenticated, queue, callQueue, leaveQueue } = useDriverApp();
  const [countdown, setCountdown] = useState(() => remaining(queue?.expiresAt));

  useEffect(() => {
    if (queue?.status !== QueueStatus.CALLED) return;
    const timer = window.setInterval(() => setCountdown(remaining(queue.expiresAt)), 1000);
    return () => window.clearInterval(timer);
  }, [queue]);

  if (!queue) return <section className="empty-state"><AppIcon name="clock" size={34} /><h1>Você não está em uma fila</h1><p>Motoristas logados podem entrar na fila de uma planta quando todos os carregadores estiverem ocupados.</p><PrimaryButton onClick={() => navigate(isAuthenticated ? "/explore" : "/login")}>{isAuthenticated ? "Ver estabelecimentos" : "Entrar na conta"}</PrimaryButton></section>;

  const called = queue.status === QueueStatus.CALLED;
  return <>
    <PageIntro eyebrow={queue.establishmentName} title={called ? "É a sua vez" : "Você está na fila"}>
      <p>{called ? "Dirija-se ao carregador atribuído antes do fim da janela." : "Avisaremos quando um carregador compatível estiver disponível."}</p>
    </PageIntro>

    <section className={`queue-hero ${called ? "is-called" : ""}`} aria-live="polite">
      <StatusChip label={called ? "Sua vez" : "Aguardando vaga"} tone={called ? "info" : "warning"} />
      {called ? <><span>Tempo restante</span><strong className="queue-number">{countdown}</strong><p>{queue.chargerName} · vaga {queue.parkingSpot}</p></> : <><span>Sua posição</span><strong className="queue-number">#{queue.position}</strong><p>Espera estimada: cerca de {queue.estimatedWaitMinutes} min</p></>}
    </section>

    <section className="mobile-card queue-rules"><h2>Como a fila funciona</h2><ul className="rule-list"><li>A fila é exclusiva para motoristas com conta; a ordem é definida pela entrada.</li><li>O chamado dura 10 minutos e não é reserva antecipada.</li><li>A fila não altera a tarifa.</li><li>Você só pode estar em uma fila ChargeGrid por vez.</li></ul></section>

    {called ? <PrimaryButton onClick={() => navigate(`/checkout?mode=${isAuthenticated ? "driver" : "guest"}`)}>Continuar para pagamento</PrimaryButton> : <PrimaryButton onClick={callQueue}>Atualizar disponibilidade</PrimaryButton>}
    <SecondaryButton onClick={() => { leaveQueue(); navigate(isAuthenticated ? "/explore" : "/"); }}>Sair da fila</SecondaryButton>
  </>;
}
