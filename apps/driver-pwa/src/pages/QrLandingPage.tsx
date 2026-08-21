import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChargerCommercialStatus } from "@chargegrid/shared";
import { useDriverApp } from "../app/DriverAppContext";
import { AppIcon } from "../components/AppIcon";
import { QueueJoinConfirmation } from "../components/QueueJoinConfirmation";
import { StatusChip } from "../components/StatusChip";
import { InfoRow, PageIntro } from "../components/Ui";
import { getChargingPointBySlug } from "../data/commercialPlants";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function QrLandingPage() {
  const { chargerSlug } = useParams();
  const navigate = useNavigate();
  const point = getChargingPointBySlug(chargerSlug);
  const { getQueueJoinPreview, isAuthenticated, joinQueue, queue, selectChargingPoint } = useDriverApp();
  const [showQueueConfirmation, setShowQueueConfirmation] = useState(false);
  const plantId = point?.plant.id;
  const chargerId = point?.charger.id;
  const isAvailable = point?.charger.commercialStatus === ChargerCommercialStatus.AVAILABLE_TO_START;

  useEffect(() => {
    if (plantId && chargerId) selectChargingPoint(plantId, chargerId);
  }, [chargerId, plantId, selectChargingPoint]);

  if (!point) return <section className="empty-state"><AppIcon name="qr" size={38} /><h1>QR Code não reconhecido</h1><p>Confira se o código pertence a uma vaga ChargeGrid ou faça uma nova leitura.</p><Link className="primary-link" to="/scan">Escanear novamente</Link></section>;

  const { plant, charger } = point;
  return <>
    <PageIntro eyebrow={plant.name} title={charger.commercialName}><p>Vaga {charger.parkingSpot} identificada e pronta para validação.</p></PageIntro>
    <section className="qr-identity-card">
      <span className="qr-symbol"><AppIcon name="qr" size={38} /></span>
      <div><StatusChip label={isAvailable ? "Disponível para iniciar" : "Em uso no momento"} tone={isAvailable ? "success" : "warning"} /><h2>{isAvailable ? "Conecte o veículo" : "Carregador indisponível"}</h2><p>{isAvailable ? `Confirme que o cabo está conectado ao carregador ${charger.commercialName}.` : "Você será incluído na fila única desta planta e receberá uma vaga quando houver disponibilidade."}</p></div>
    </section>
    <section className="quick-info-grid single-column">
      <InfoRow icon="plug" label="Carregador" value={`${charger.commercialName} · vaga ${charger.parkingSpot}`} detail={`até ${charger.nominalPowerKw} kW nominais`} />
      <InfoRow icon="card" label="Tarifa" value={`${currency.format(plant.tariffFrom?.amount ?? 0)}/kWh`} detail="o valor será confirmado antes do pagamento" />
      <InfoRow icon="clock" label="Ociosidade" value="15 min gratuitos" detail="depois R$ 0,50/min, máximo 60 min" />
    </section>
    <section className="mobile-card consent-summary"><h2>O que acontece agora</h2><ol className="step-list"><li><span>1</span>Você define um limite financeiro.</li><li><span>2</span>O pagamento é autorizado com segurança.</li><li><span>3</span>O carregador confirma o início da energia.</li><li><span>4</span>Você acompanha consumo e custo durante a sessão.</li></ol></section>
    {isAvailable ? <Link className="primary-link" to={`/checkout?mode=${isAuthenticated ? "driver" : "guest"}`}><AppIcon name="chevron-right" size={20} /> {isAuthenticated ? "Continuar com minha conta" : "Continuar como visitante"}</Link> : isAuthenticated ? <button type="button" className="primary-link" onClick={() => queue ? navigate("/queue") : setShowQueueConfirmation(true)}><AppIcon name="clock" size={20} /> {queue ? "Acompanhar minha fila" : "Entrar na fila da planta"}</button> : <Link className="primary-link" to="/login"><AppIcon name="user" size={20} /> Entre para usar a fila</Link>}
    {!isAuthenticated ? <><Link className="secondary-link" to="/login">Entrar na minha conta</Link><Link className="text-link" to="/signup">Criar conta de motorista</Link></> : null}
    <p className="privacy-note centered">Visitantes têm acesso somente à sessão atual e ao comprovante correspondente.</p>
    {showQueueConfirmation ? <QueueJoinConfirmation {...getQueueJoinPreview(plant.id)} onCancel={() => setShowQueueConfirmation(false)} onConfirm={() => { joinQueue(plant.id); setShowQueueConfirmation(false); navigate("/queue"); }} /> : null}
  </>;
}
