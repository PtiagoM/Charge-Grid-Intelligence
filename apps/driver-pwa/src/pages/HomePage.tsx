import { Navigate, Link } from "react-router-dom";
import { useDriverApp } from "../app/DriverAppContext";
import { AppIcon } from "../components/AppIcon";
import { assets } from "../constants/assets";

export function HomePage() {
  const { isAuthenticated } = useDriverApp();
  if (isAuthenticated) return <Navigate to="/explore" replace />;

  return <>
    <section className="guest-hero">
      <div className="guest-brand"><img src={assets.logoCompact} alt="GoodWe" /><span>ChargeGrid</span></div>
      <p className="eyebrow">Recarga inteligente para motoristas</p>
      <h1>Comece sua recarga do seu jeito.</h1>
      <p>Escaneie o código no carregador para uma sessão rápida ou entre na sua conta para encontrar pontos, acompanhar filas e guardar comprovantes.</p>
    </section>

    <section className="entry-options" aria-label="Opções para começar">
      <Link to="/scan" className="entry-option entry-option-primary">
        <span><AppIcon name="camera" size={28} /></span>
        <div><strong>Escanear QR Code</strong><small>Abra a câmera e identifique o carregador</small></div>
        <AppIcon name="chevron-right" size={20} />
      </Link>
      <Link to="/signup" className="entry-option">
        <span><AppIcon name="user" size={27} /></span>
        <div><strong>Criar conta</strong><small>Cadastre seu veículo e use todos os recursos</small></div>
        <AppIcon name="chevron-right" size={20} />
      </Link>
      <Link to="/login" className="entry-option">
        <span><AppIcon name="logout" size={26} /></span>
        <div><strong>Entrar na conta</strong><small>Acesse mapa, fila, histórico e notificações</small></div>
        <AppIcon name="chevron-right" size={20} />
      </Link>
    </section>

    <section className="guest-benefits">
      <div><AppIcon name="map" /><span>Mapa com disponibilidade</span></div>
      <div><AppIcon name="card" /><span>Pagamento protegido</span></div>
      <div><AppIcon name="bell" /><span>Avisos da recarga</span></div>
    </section>
  </>;
}
