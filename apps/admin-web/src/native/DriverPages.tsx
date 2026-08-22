import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAppState } from "./AppState";
import type { Payment } from "./model";
import { Badge, DataTable, SectionHeader, money, number } from "./Ui";

function DriverShell({ tab, children }: { tab: string; children: ReactNode }) {
  useEffect(() => { document.body.className = "layout-driver"; }, []);
  const tabs = [["home", "Inicio"], ["payment", "Pagamento"], ["current", "Recarga Atual"], ["history", "Historico"]];
  return <div className="driver-shell" data-testid="driver-shell"><header className="driver-topbar"><div><small>ChargeGrid Drive</small><h1>Interface do Motorista</h1><p>Selecionar carregador, validar pagamento e acompanhar recarga.</p></div><a href="#/logout" className="ghost-button">Sair</a></header><main className="driver-main">{children}</main><nav className="driver-nav" data-testid="driver-nav">{tabs.map(([id, label]) => <a key={id} href={`#/drive/${id}`} className={tab === id ? "is-active" : ""} data-testid={`driver-tab-${id}`}>{label}</a>)}</nav></div>;
}

function Home() {
  const { state } = useAppState();
  const locations = state.locations.filter((location) => state.chargers.some((charger) => charger.locationId === location.id && charger.status !== "offline"));
  return <section className="driver-section" data-testid="drive-home"><SectionHeader eyebrow="Proximos de voce" title="Onde deseja recarregar?" subtitle="Escolha um ponto com disponibilidade comercial." /><div className="driver-spot-list">{locations.map((location) => {
    const establishment = state.establishments.find((item) => item.id === location.establishmentId)!;
    const chargers = state.chargers.filter((item) => item.locationId === location.id);
    return <article key={location.id} className="driver-spot"><div><h3>{location.name}</h3><p>{establishment.name} · {location.city}</p></div><ul><li><strong>{chargers.filter((item) => item.status === "available").length}</strong><span>disponiveis</span></li><li><strong>{money(establishment.pricePerKwh)}</strong><span>por kWh</span></li><li><strong>{state.queue.filter((item) => item.locationId === location.id && item.status === "waiting").length}</strong><span>fila</span></li></ul><div className="driver-spot-footer"><span>Boa opcao para recarga</span><a className="ghost-button" href={`#/drive/payment?charger=${chargers.find((item) => item.status === "available")?.id ?? chargers[0]?.id}`}>Selecionar</a></div></article>;
  })}</div></section>;
}

function PaymentPage() {
  const { state, startSession } = useAppState();
  const [query] = useSearchParams();
  const navigate = useNavigate();
  const chargerId = query.get("charger") ?? "CG-FIAP-05";
  const charger = state.chargers.find((item) => item.id === chargerId);
  const establishment = state.establishments.find((item) => item.id === charger?.establishmentId);
  const [payment, setPayment] = useState<Payment | null>(null);
  if (!charger || !establishment) return <p>Carregador nao encontrado.</p>;
  function validate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPayment({ status: "Aprovado", method: String(data.get("paymentMethod")) as Payment["method"], limitAmount: Number(data.get("limitAmount")) });
  }
  function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!payment) return;
    const session = startSession(chargerId, payment, "driver");
    if (session) navigate("/drive/current");
  }
  return <section className="driver-section" data-testid="drive-payment"><SectionHeader eyebrow="Garantia financeira" title="Validar pagamento" subtitle="A sessao so inicia apos autorizacao simulada." /><article className="surface panel driver-payment-card"><h3>{charger.id}</h3><ul><li><strong>Status:</strong> <Badge value={charger.status} /></li><li><strong>Potencia:</strong> {charger.powerKw} kW</li><li><strong>Tarifa:</strong> {money(establishment.pricePerKwh)}/kWh</li></ul><form className="start-session-form" data-form="driver-validate-payment" data-testid="driver-payment-form" onSubmit={validate}><label>Limite de gasto<select name="limitAmount" defaultValue="80"><option value="30">R$ 30</option><option value="50">R$ 50</option><option value="80">R$ 80</option><option value="100">R$ 100</option></select></label><label>Pagamento<select name="paymentMethod"><option value="Cartao">Cartao</option><option value="Pix">Pix</option></select></label><button type="submit">Validar pagamento</button></form>{payment ? <form className="start-session-form" data-testid="drive-start-session-form" onSubmit={start}><p><Badge value={payment.status} /> Limite de {money(payment.limitAmount)}</p><button type="submit" data-testid="drive-start-session-submit">Iniciar recarga</button></form> : null}</article></section>;
}

function CurrentPage() {
  const { state, finishSession } = useAppState();
  const current = state.sessions.find((item) => item.driverId === "user-driver-01" && item.status === "active");
  if (!current) return <section className="driver-section" data-testid="drive-current"><SectionHeader title="Nenhuma recarga ativa" /><a className="ghost-button" href="#/drive/home">Encontrar carregador</a></section>;
  return <section className="driver-section" data-testid="drive-current"><SectionHeader eyebrow="Sessao em andamento" title={current.chargerId} subtitle={current.id} /><article className="surface panel quick-card"><ul><li><strong>Tempo:</strong> {current.durationMinutes} min</li><li><strong>Energia:</strong> {number(current.energyKwh)} kWh</li><li><strong>Tarifa:</strong> {money(current.tariffPerKwh)}/kWh</li><li><strong>Valor:</strong> {money(current.consumedAmount)}</li><li><strong>Pagamento:</strong> {current.payment.status}</li></ul><button type="button" onClick={() => finishSession(current.id)}>Finalizar recarga</button></article></section>;
}

function HistoryPage() {
  const { state } = useAppState();
  const items = state.sessions.filter((item) => item.driverId === "user-driver-01" || item.driverId === "driver-paulo");
  return <section className="driver-section" data-testid="drive-history"><SectionHeader title="Historico de recargas" /><DataTable columns={["Sessao", "Carregador", "Energia", "Valor", "Status"]}>{items.map((item) => <tr key={item.id}><td>{item.id}</td><td>{item.chargerId}</td><td>{number(item.energyKwh)} kWh</td><td>{money(item.finalAmount ?? item.consumedAmount)}</td><td><Badge value={item.status} /></td></tr>)}</DataTable></section>;
}

export function DriverPage() {
  const { tab = "home" } = useParams();
  const { account } = useAppState();
  if (!account) return <Navigate to="/login" replace />;
  if (account.profile !== "USUARIO") return <Navigate to="/mvp/overview" replace />;
  const content = tab === "payment" ? <PaymentPage /> : tab === "current" ? <CurrentPage /> : tab === "history" ? <HistoryPage /> : <Home />;
  return <DriverShell tab={tab}>{content}</DriverShell>;
}

function QuickShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  useEffect(() => { document.body.className = "layout-quick"; }, []);
  return <div className="quick-shell" data-testid="quick-shell"><header><span>ChargeGrid Quick</span><h1>{title}</h1><p>{subtitle}</p></header><main>{children}</main></div>;
}

export function QuickChargerPage() {
  const { chargerId = "" } = useParams();
  const { state } = useAppState();
  const charger = state.chargers.find((item) => item.id === chargerId);
  const establishment = state.establishments.find((item) => item.id === charger?.establishmentId);
  const location = state.locations.find((item) => item.id === charger?.locationId);
  if (!charger || !establishment || !location) return <QuickShell title="Carregador nao encontrado" subtitle="Confira o QR Code."><p>Equipamento indisponivel.</p></QuickShell>;
  return <QuickShell title="ChargeGrid Quick" subtitle="Fluxo publico sem app para iniciar recarga por QR Code."><section className="quick-section" data-testid="quick-charger-page"><SectionHeader title={location.name} subtitle={`${establishment.name} · ${location.address}, ${location.number}`} /><article className="surface panel quick-card"><ul><li><strong>Carregador:</strong> {charger.id}</li><li><strong>Status:</strong> <Badge value={charger.status} /></li><li><strong>Potencia:</strong> {charger.powerKw} kW</li><li><strong>Tarifa:</strong> {money(establishment.pricePerKwh)}/kWh</li></ul><a className="ghost-button" href={`#/quick/payment/${charger.id}`} data-testid="quick-go-payment">Continuar para pagamento</a></article></section></QuickShell>;
}

export function QuickPaymentPage() {
  const { chargerId = "" } = useParams();
  const { state, startSession } = useAppState();
  const navigate = useNavigate();
  const charger = state.chargers.find((item) => item.id === chargerId);
  const establishment = state.establishments.find((item) => item.id === charger?.establishmentId);
  const [payment, setPayment] = useState<Payment | null>(null);
  if (!charger || !establishment) return <QuickShell title="Pagamento indisponivel" subtitle="Equipamento nao encontrado."><p>Leia o QR Code novamente.</p></QuickShell>;
  function validate(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); setPayment({ status: "Aprovado", method: String(data.get("paymentMethod")) as Payment["method"], limitAmount: Number(data.get("limitAmount")) }); }
  function start(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!payment) return; const session = startSession(chargerId, payment, "quick"); if (session) navigate(`/quick/session/${session.id}`); }
  return <QuickShell title="ChargeGrid Quick" subtitle="Pagamento validado antes da liberacao da sessao."><section className="quick-section" data-testid="quick-payment-page"><article className="surface panel quick-card"><h3>Pagamento da recarga</h3><p>{charger.id} · {money(establishment.pricePerKwh)}/kWh</p><form className="start-session-form" data-form="quick-validate-payment" data-testid="quick-payment-form" onSubmit={validate}><label>Limite<select name="limitAmount" defaultValue="80"><option value="30">R$ 30</option><option value="50">R$ 50</option><option value="80">R$ 80</option><option value="100">R$ 100</option></select></label><label>Pagamento<select name="paymentMethod"><option value="Cartao">Cartao</option><option value="Pix">Pix</option></select></label><button type="submit">Validar pagamento</button></form>{payment ? <form className="start-session-form" data-testid="quick-start-session-form" onSubmit={start}><p><Badge value={payment.status} /></p><button type="submit">Iniciar recarga</button></form> : null}</article></section></QuickShell>;
}

export function QuickTrackingPage() {
  const { sessionId = "" } = useParams();
  const { state, finishSession } = useAppState();
  const session = state.sessions.find((item) => item.id === sessionId);
  if (!session) return <QuickShell title="Sessao nao encontrada" subtitle="Nenhuma recarga para esse identificador."><p>Escaneie novamente o QR Code.</p></QuickShell>;
  return <QuickShell title="Acompanhamento da recarga" subtitle="Fluxo publico com garantia financeira simulada."><section className="quick-section" data-testid="quick-tracking-page"><article className="surface panel quick-card"><h3>{session.status === "finished" ? "Recarga finalizada" : "Recarga em andamento"}</h3><ul><li><strong>Carregador:</strong> {session.chargerId}</li><li><strong>Tempo:</strong> {session.durationMinutes} min</li><li><strong>Energia:</strong> {number(session.energyKwh)} kWh</li><li><strong>Valor:</strong> {money(session.finalAmount ?? session.consumedAmount)}</li></ul>{session.status === "active" ? <button type="button" onClick={() => finishSession(session.id)}>Finalizar recarga</button> : <button className="ghost-button">Comprovante simples</button>}</article></section></QuickShell>;
}
