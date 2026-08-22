import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Activity, BadgeDollarSign, BatteryCharging, BrainCircuit, Building2, ChartNoAxesCombined,
  ClipboardCheck, Clock3, createIcons, FileChartColumn, FileSignature, FolderOpen, Gauge,
  History, Landmark, LayoutDashboard, LogOut, MapPin, MapPinned, NotebookTabs, PlugZap,
  RadioTower, ReceiptText, ScrollText, Settings, ShieldCheck, Sparkles, TrendingUp,
  UsersRound, WalletCards, Zap
} from "lucide";
import { assets } from "../constants/assets";
import { useAppState } from "./AppState";

const goodweNav = [
  ["overview", "Visao Geral", "layout-dashboard"], ["clients", "Clientes", "users-round"], ["establishments", "Estabelecimentos", "building-2"], ["locations", "Pontos de Recarga", "map-pinned"], ["chargers", "Carregadores", "battery-charging"], ["installations", "Implantacoes", "clipboard-check"], ["contracts", "Contratos", "file-signature"], ["finance", "Financeiro", "wallet-cards"], ["operations", "Operacao", "activity"], ["sessions", "Sessoes", "history"], ["energy", "Demanda e Energia", "zap"], ["pricing", "Tarifacao e Pagamentos", "badge-dollar-sign"], ["ai", "Inteligencia Artificial", "brain-circuit"], ["reports", "Relatorios", "file-chart-column"], ["expansion", "Expansao", "trending-up"], ["audit", "Auditoria", "shield-check"]
];

const establishmentNav = [
  ["overview", "Visao Geral", "gauge"], ["locations", "Meus Pontos", "map-pin"], ["chargers", "Carregadores", "plug-zap"], ["operations", "Operacao", "radio-tower"], ["sessions", "Sessoes", "clock-3"], ["energy", "Demanda e Energia", "chart-no-axes-combined"], ["pricing", "Tarifacao e Pagamentos", "receipt-text"], ["finance", "Financeiro", "landmark"], ["contract", "Contrato", "scroll-text"], ["documents", "Documentos", "folder-open"], ["ai", "Inteligencia Artificial", "sparkles"], ["reports", "Relatorios", "notebook-tabs"]
];

const sidebarIcons = { Activity, BadgeDollarSign, BatteryCharging, BrainCircuit, Building2, ChartNoAxesCombined, ClipboardCheck, Clock3, FileChartColumn, FileSignature, FolderOpen, Gauge, History, Landmark, LayoutDashboard, LogOut, MapPin, MapPinned, NotebookTabs, PlugZap, RadioTower, ReceiptText, ScrollText, Settings, ShieldCheck, Sparkles, TrendingUp, UsersRound, WalletCards, Zap };

function AssistantDrawer({ onClose }: { onClose: () => void }) {
  const [topic, setTopic] = useState("Operacao da rede");
  const topics = ["Operacao da rede", "Demanda energetica", "Receita e tarifa", "Expansao comercial"];
  return <div className="goodwe-ai-drawer-layer" data-testid="goodwe-ai-drawer-layer">
    <aside className="goodwe-ai-agent goodwe-ai-drawer" data-testid="goodwe-ai-drawer">
      <header className="goodwe-ai-header"><h2>Agente de IA GoodWe</h2><div className="goodwe-ai-window-actions"><button type="button" onClick={onClose} aria-label="Fechar agente">×</button></div></header>
      <div className="goodwe-ai-intro"><img src={assets.assistant} alt="" /><h3>Como posso apoiar a operacao?</h3><p>Analiso os dados comerciais e energeticos disponiveis nesta demonstracao.</p></div>
      <div className="goodwe-ai-body"><div className="goodwe-ai-topic-list">{topics.map((item) => <button key={item} type="button" className={topic === item ? "is-active" : ""} onClick={() => setTopic(item)}><strong>{item}</strong><span>Leitura deterministica do cenario atual</span></button>)}</div><article className="goodwe-ai-answer"><small>Analise atual</small><h3>{topic}</h3><p>A rede possui margem controlada, fila ativa e oportunidade de priorizar carregadores disponiveis.</p><ul><li>Monitorar o pico entre 18h e 21h.</li><li>Preservar a reserva minima da bateria.</li></ul></article></div>
      <form className="goodwe-ai-compose"><button type="button">Nova conversa</button><input aria-label="Mensagem para o agente" placeholder="Pergunte sobre a operacao" /><button type="submit" aria-label="Enviar">↑</button></form>
    </aside>
  </div>;
}

export function ManagerShell({ children }: { children: ReactNode }) {
  const { account } = useAppState();
  const location = useLocation();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const nav = account?.profile === "GOODWE" ? goodweNav : establishmentNav;
  const active = location.pathname.split("/")[2] ?? "overview";

  useEffect(() => { document.body.className = "layout-desktop"; }, []);
  useEffect(() => { createIcons({ icons: sidebarIcons }); }, [active, assistantOpen]);

  return <div className="app-shell desktop-shell" data-testid="desktop-shell">
    <aside className="sidebar" data-testid="sidebar">
      <a className="sidebar-logo" href="#/mvp/overview" aria-label="GoodWe"><img className="logo-collapsed" src={assets.logoCollapsed} alt="GoodWe" /></a>
      <nav className="sidebar-nav">{nav.map(([id, label, icon]) => <NavLink key={id} to={`/mvp/${id}`} className={active === id ? "sidebar-item is-active" : "sidebar-item"} title={label} aria-label={label}><i className="sidebar-lucide" data-lucide={icon} aria-hidden="true" /><span className="sidebar-tooltip">{label}</span></NavLink>)}</nav>
    </aside>
    <main className="main-area">
      <header className="topbar" data-testid="topbar"><div className="topbar-promo"><img src={assets.icons.solarInfo} alt="" />Hub Comercial ChargeGrid</div><div className="topbar-actions"><button className="topbar-icon-button" type="button" aria-label="Pesquisar"><img src={assets.icons.search} alt="" /></button><button className="topbar-icon-button" type="button" aria-label="Alarmes"><img src={assets.icons.alarms} alt="" /></button><button className="topbar-icon-button" type="button" aria-label="Mensagens"><img src={assets.icons.message} alt="" /></button><button className="topbar-icon-button" type="button" aria-label="Idioma"><img src={assets.icons.language} alt="" /></button><span className="profile-chip">{account?.profile}</span><span className="profile-name">{account?.displayName}</span><img className="avatar" src={assets.avatar} alt="Perfil" /><a className="topbar-account-action" href="#/mvp/settings" aria-label="Configuracoes"><i data-lucide="settings" /></a><a className="topbar-account-action is-logout" href="#/logout" aria-label="Sair do sistema"><i data-lucide="log-out" /></a></div></header>
      <section className="page-content" data-testid="page-content"><header className="page-heading"><div><h1>{account?.profile === "GOODWE" ? "ChargeGrid Intelligence GoodWe" : "ChargeGrid Intelligence Estabelecimento"}</h1><p>{account?.profile === "GOODWE" ? "A GoodWe controla a rede e administra estrutura, vinculos e contas." : "O estabelecimento monitora apenas locais e carregadores atribuidos pela GoodWe."}</p><small>Tempo de atualizacao de dados: 22/08/2026, 06:39:38</small></div><div className="page-heading-actions"><button type="button">Atualizar dados</button></div></header>{children}</section>
    </main>
    <button type="button" className="assistant-orb-button" aria-label="Assistente ChargeGrid" onClick={() => setAssistantOpen(true)}><img src={assets.assistant} alt="" /><span className="assistant-orb-eye" /></button>
    {assistantOpen ? <AssistantDrawer onClose={() => setAssistantOpen(false)} /> : null}
  </div>;
}
