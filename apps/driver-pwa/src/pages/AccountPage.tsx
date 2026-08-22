import { Link, useNavigate } from "react-router-dom";
import { useDriverApp } from "../app/DriverAppContext";
import { AppIcon, type AppIconName } from "../components/AppIcon";
import { AuthGate, PageIntro, SecondaryButton } from "../components/Ui";

function AccountRow({ icon, title, detail }: { icon: AppIconName; title: string; detail: string }) {
  return <div className="account-row"><span><AppIcon name={icon} /></span><div><strong>{title}</strong><small>{detail}</small></div></div>;
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("pt-BR");
}

export function AccountPage() {
  const navigate = useNavigate();
  const { clearLocalData, isAuthenticated, logout, profile, receipts, setTheme, theme } = useDriverApp();
  if (!isAuthenticated || !profile) return <AuthGate title="Entre na sua conta" copy="Salve veículo e preferências, use a fila e mantenha seus comprovantes organizados." />;

  return <>
    <PageIntro eyebrow="Motorista cadastrado" title={`Olá, ${profile.fullName.split(" ")[0]}`}><p>Gerencie sua mobilidade e as preferências do aplicativo.</p></PageIntro>
    <section className="profile-card"><span className="profile-avatar">{initials(profile.fullName)}</span><div><strong>{profile.fullName}</strong><small>{profile.email}</small></div></section>
    <section className="account-section"><h2>Mobilidade</h2><AccountRow icon="vehicle" title={profile.vehicleName} detail={profile.batteryCapacityKwh ? `${profile.batteryCapacityKwh} kWh de capacidade informada` : "Capacidade não informada"} /><AccountRow icon="card" title="Stripe sandbox" detail="Cartão e Pix processados no ambiente de teste" /><AccountRow icon="receipt" title={`${receipts.filter((item) => item.owner === "driver").length} comprovantes`} detail="Somente recargas vinculadas à sua conta" /></section>
    <section className="account-section"><h2>Preferências</h2><button type="button" className="account-row account-row-button" onClick={() => setTheme(theme === "light" ? "dark" : "light")}><span><AppIcon name={theme === "light" ? "moon" : "sun"} /></span><div><strong>Aparência</strong><small>{theme === "light" ? "Tema claro ativo" : "Tema escuro ativo"} · toque para alternar</small></div><AppIcon name="chevron-right" size={19} /></button><Link to="/notifications" className="account-row account-row-button"><span><AppIcon name="bell" /></span><div><strong>Notificações</strong><small>Fila, sessão, pagamento e ociosidade</small></div><AppIcon name="chevron-right" size={19} /></Link></section>
    <SecondaryButton onClick={() => { logout(); navigate("/"); }}><AppIcon name="logout" size={20} /> Sair da conta</SecondaryButton>
    <button type="button" className="danger-text-button" onClick={() => { if (window.confirm("Excluir a conta e os dados guardados neste dispositivo?")) { clearLocalData(); navigate("/"); } }}>Excluir dados deste dispositivo</button>
  </>;
}
