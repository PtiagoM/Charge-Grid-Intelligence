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

  if (!isAuthenticated) return <section className="empty-state"><AppIcon name="user" size={34} /><h1>Entre para usar a fila</h1><p>A fila exige uma conta de motorista para manter sua posição.</p><PrimaryButton onClick={() => navigate("/login")}>Entrar na conta</PrimaryButton></section>;
  if (!queue) return <section className="empty-state"><AppIcon name="clock" size={34} /><h1>Você não está em uma fila</h1><p>Escolha no mapa um estabelecimento lotado para entrar na fila.</p><PrimaryButton onClick={() => navigate("/explore")}>Ver estabelecimentos</PrimaryButton></section>;

  const called = queue.status === QueueStatus.CALLED;
  return <>
    <PageIntro eyebrow={queue.establishmentName} title={called ? "É a sua vez" : "Você está na fila"}>
      <p>{called ? "Dirija-se ao carregador atribuído antes do fim da janela." : "Avisaremos quando um carregador compatível estiver disponível."}</p>
    </PageIntro>

    <section className={`queue-hero ${called ? "is-called" : ""}`} aria-live="polite">
      <StatusChip label={called ? "CALLED" : "WAITING"} tone={called ? "info" : "warning"} />
      {called ? <><span>Tempo restante</span><strong className="queue-number">{countdown}</strong><p>{queue.chargerName} · vaga {queue.parkingSpot}</p></> : <><span>Sua posição</span><strong className="queue-number">#{queue.position}</strong><p>Espera estimada: cerca de {queue.estimatedWaitMinutes} min</p></>}
    </section>

    <section className="mobile-card queue-rules"><h2>Como a fila funciona</h2><ul className="rule-list"><li>Cadastrados têm prioridade sobre visitantes; dentro da classe, vale a ordem de chegada.</li><li>O chamado dura 10 minutos e não é reserva antecipada.</li><li>A fila não altera a tarifa.</li><li>Você só pode estar em uma fila ChargeGrid por vez.</li></ul></section>

    {called ? <PrimaryButton onClick={() => navigate("/checkout?mode=driver")}>Continuar para pagamento</PrimaryButton> : <PrimaryButton onClick={callQueue}>Atualizar disponibilidade</PrimaryButton>}
    <SecondaryButton onClick={() => { leaveQueue(); navigate("/explore"); }}>Sair da fila</SecondaryButton>
  </>;
}
