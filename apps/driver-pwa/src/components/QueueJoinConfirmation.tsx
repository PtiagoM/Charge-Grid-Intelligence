import { AppIcon } from "./AppIcon";
import { PrimaryButton, SecondaryButton } from "./Ui";

interface QueueJoinConfirmationProps {
  establishmentName: string;
  position: number;
  estimatedWaitMinutes: number;
  onConfirm(): void;
  onCancel(): void;
}

export function QueueJoinConfirmation({ establishmentName, position, estimatedWaitMinutes, onConfirm, onCancel }: QueueJoinConfirmationProps) {
  return <div className="queue-confirmation-backdrop" role="presentation" onMouseDown={onCancel}>
    <section className="queue-confirmation" role="dialog" aria-modal="true" aria-labelledby="queue-confirmation-title" onMouseDown={(event) => event.stopPropagation()}>
      <span className="queue-confirmation-icon"><AppIcon name="clock" size={25} /></span>
      <p className="eyebrow">Fila da planta</p>
      <h2 id="queue-confirmation-title">Entrar nesta fila?</h2>
      <p>Você entrará na fila única de <strong>{establishmentName}</strong>, válida para todos os carregadores compatíveis da planta.</p>
      <dl className="queue-confirmation-details"><div><dt>Posição prevista</dt><dd>#{position}</dd></div><div><dt>Espera estimada</dt><dd>cerca de {estimatedWaitMinutes} min</dd></div></dl>
      <ul className="queue-confirmation-rules"><li>Quando houver uma vaga, indicaremos o primeiro carregador disponível.</li><li>Sua posição continua ativa enquanto você navega pelo app.</li><li>Você pode sair da fila a qualquer momento pela tela “Sua fila”.</li></ul>
      <PrimaryButton onClick={onConfirm}>Confirmar entrada na fila</PrimaryButton>
      <SecondaryButton onClick={onCancel}>Agora não</SecondaryButton>
    </section>
  </div>;
}
