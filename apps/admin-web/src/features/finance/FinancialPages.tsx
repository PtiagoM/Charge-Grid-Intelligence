import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAdminState } from "../../app/AdminState";
import { Badge, DataTable, SectionHeader, money } from "../../components/AdminUi";
import { accessibleEstablishmentIds } from "../../domain/accessOperations";
import { hasAdminCapability } from "../../domain/adminCapabilities";
import { activeTariffFor, calculateFinancialBreakdown, calculateSessionCharge } from "../../domain/financialOperations";

function cents(value: number) {
  return money(value / 100);
}

function localDate(value?: string) {
  return value ? new Date(value).toLocaleString("pt-BR") : "—";
}

export function TariffPoliciesPage({ establishmentId }: { establishmentId?: string }) {
  const { state, account, activateTariffPolicy } = useAdminState();
  const [editorOpen, setEditorOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const scopeId = establishmentId ?? (account?.profile === "ESTABELECIMENTO" ? account.establishmentId : undefined);
  const accessibleIds = new Set(accessibleEstablishmentIds(state, account));
  const visibleEstablishments = state.establishments.filter((item) => accessibleIds.has(item.id));
  const canManageFinance = Boolean(account && hasAdminCapability(account, "finance:manage"));
  if (!scopeId) return <section className="surface panel operations-page" data-testid="tariff-portfolio"><SectionHeader eyebrow="Politicas comerciais" title="Tarifas por estabelecimento" subtitle="Cada unidade possui versao, vigencia e participacao proprias." /><div className="energy-portfolio-grid">{visibleEstablishments.map((item) => { const tariff = activeTariffFor(state, item.id); return <article key={item.id}><Badge value={tariff ? "ACTIVE" : "Pendente"} /><h3>{item.name}</h3><strong>{tariff ? `${cents(tariff.energyPriceCentsPerKwh)}/kWh` : "Sem politica ativa"}</strong><span>{tariff ? `v${tariff.version} · ${tariff.platformShareBps / 100}% participacao` : "Requer configuracao"}</span><a className="ghost-button" href={`#/mvp/pricing?est=${item.id}`}>Abrir politica</a></article>; })}</div></section>;

  const establishment = state.establishments.find((item) => item.id === scopeId);
  const active = activeTariffFor(state, scopeId);
  const history = state.tariffPolicies.filter((item) => item.establishmentId === scopeId).sort((a, b) => b.version - a.version);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = activateTariffPolicy({ establishmentId: scopeId!, energyPriceCentsPerKwh: Math.round(Number(data.get("energyPrice")) * 100), idlePriceCentsPerMinute: Math.round(Number(data.get("idlePrice")) * 100), idleGraceMinutes: Number(data.get("idleGrace")), platformShareBps: Math.round(Number(data.get("platformShare")) * 100), effectiveFrom: new Date(String(data.get("effectiveFrom"))).toISOString(), changeReason: String(data.get("reason")) });
    setFeedback(result.ok ? `Tarifa v${result.tariffPolicy?.version} publicada.` : result.issues.join(" "));
    if (result.ok) setEditorOpen(false);
  }

  return <div className="operations-detail" data-testid="mvp-pricing-panel"><nav className="enterprise-breadcrumb"><span><a href="#/mvp/pricing">Tarifas</a><i>/</i></span><span><strong>{establishment?.name}</strong></span></nav><section className="operations-hero surface"><div><span className="eyebrow">Politica comercial vigente</span><h2>{establishment?.name}</h2><p>Preco aceito, ociosidade e participacao versionados.</p></div><div className="operations-hero-status"><Badge value={active?.status ?? "Pendente"} /><strong>{active ? `${cents(active.energyPriceCentsPerKwh)}/kWh` : "—"}</strong><span>{active ? `Versao ${active.version} · desde ${localDate(active.effectiveFrom)}` : "Sem politica"}</span></div></section><nav className="entity-tabs operations-anchor-nav"><a className="is-active" href="#tariff-current">Vigente</a><a href="#tariff-history">Historico</a>{canManageFinance ? <a href="#tariff-editor">Nova versao</a> : null}</nav><section id="tariff-current" className="surface panel"><SectionHeader title="Condicoes aplicadas" subtitle="Sessoes preservam a versao aceita no momento da autorizacao." /><div className="detail-grid"><article><h3>Energia</h3><p>{active ? `${cents(active.energyPriceCentsPerKwh)}/kWh` : "—"}</p></article><article><h3>Ociosidade</h3><p>{active ? `${cents(active.idlePriceCentsPerMinute)}/min` : "—"}</p><small>{active?.idleGraceMinutes ?? 0} min de carencia</small></article><article><h3>Participacao</h3><p>{active ? `${active.platformShareBps / 100}%` : "—"}</p><small>parametro desta versao</small></article><article><h3>Motivo</h3><p>{active?.changeReason ?? "—"}</p><small>por {active?.createdBy}</small></article></div></section><section id="tariff-history" className="surface panel"><SectionHeader title="Historico de versoes" subtitle="Politicas anteriores permanecem imutaveis para auditoria." /><DataTable columns={["Versao", "Status", "Energia", "Ociosidade", "Participacao", "Vigencia"]}>{history.map((item) => <tr key={item.id}><td><strong>v{item.version}</strong><span>{item.id}</span></td><td><Badge value={item.status} /></td><td>{cents(item.energyPriceCentsPerKwh)}/kWh</td><td>{cents(item.idlePriceCentsPerMinute)}/min<span>{item.idleGraceMinutes} min carencia</span></td><td>{item.platformShareBps / 100}%</td><td>{localDate(item.effectiveFrom)}<span>{item.effectiveTo ? `ate ${localDate(item.effectiveTo)}` : "vigente"}</span></td></tr>)}</DataTable></section>{canManageFinance ? <section id="tariff-editor" className="surface panel"><SectionHeader title="Publicar nova versao" subtitle="A politica vigente sera aposentada na nova data de inicio." action={<button type="button" className="sems-primary-action" onClick={() => setEditorOpen((value) => !value)}>Nova versao</button>} />{editorOpen ? <form className="financial-editor" onSubmit={submit} data-testid="tariff-editor-form"><label>Preco da energia (R$/kWh)<input name="energyPrice" type="number" min="0.01" step="0.01" defaultValue={(active?.energyPriceCentsPerKwh ?? 0) / 100} required /></label><label>Ociosidade (R$/min)<input name="idlePrice" type="number" min="0" step="0.01" defaultValue={(active?.idlePriceCentsPerMinute ?? 0) / 100} required /></label><label>Carencia (min)<input name="idleGrace" type="number" min="0" step="1" defaultValue={active?.idleGraceMinutes ?? 0} required /></label><label>Participacao (%)<input name="platformShare" type="number" min="0" max="100" step="0.01" defaultValue={(active?.platformShareBps ?? 0) / 100} required /></label><label>Inicio da vigencia<input name="effectiveFrom" type="datetime-local" required /></label><label className="financial-reason">Motivo da alteracao<textarea name="reason" minLength={8} required /></label><button type="submit">Publicar politica</button></form> : null}{feedback ? <p role="status" className="command-feedback">{feedback}</p> : null}</section> : <p className="operations-empty">Seu perfil possui somente leitura das condicoes comerciais.</p>}</div>;
}

export function FinanceDashboardPage({ establishmentId }: { establishmentId?: string }) {
  const { state, account, settlePayment } = useAdminState();
  const [status, setStatus] = useState("all");
  const [feedback, setFeedback] = useState("");
  const scopeId = establishmentId ?? (account?.profile === "ESTABELECIMENTO" ? account.establishmentId : undefined);
  const accessibleIds = new Set(accessibleEstablishmentIds(state, account));
  const canManageFinance = Boolean(account && hasAdminCapability(account, "finance:manage"));
  const transactions = state.paymentTransactions.filter((item) => accessibleIds.has(item.establishmentId) && (!scopeId || item.establishmentId === scopeId) && (status === "all" || item.status === status));
  const breakdowns = transactions.map(calculateFinancialBreakdown);
  const captured = breakdowns.reduce((sum, item) => sum + item.totalCents, 0);
  const refunds = breakdowns.reduce((sum, item) => sum + item.refundedCents, 0);
  const platform = breakdowns.reduce((sum, item) => sum + item.platformShareCents, 0);
  const net = breakdowns.reduce((sum, item) => sum + item.establishmentNetCents, 0);
  function settle(id: string) { const result = settlePayment(id); setFeedback(result.ok ? "Liquidacao conciliada." : result.issues.join(" ")); }
  return <section className="surface panel operations-page sems-reference-list sems-chargegrid-table-page sems-finance-page" data-testid="finance-dashboard">
    <header className="sems-chargegrid-table-heading"><div><h2>Receita e conciliação</h2><p>Valores confirmados pela transação, com taxas, participação e liquidação preservadas por linha.</p></div></header>
    <dl className="sems-finance-summary" aria-label="Resumo financeiro"><div><dt>Capturado</dt><dd>{cents(captured)}</dd><small>antes de reembolsos</small></div><div><dt>Reembolsado</dt><dd>{cents(refunds)}</dd><small>total processado</small></div><div><dt>Participação</dt><dd>{cents(platform)}</dd><small>por versão de tarifa</small></div><div><dt>Líquido estabelecimentos</dt><dd>{cents(net)}</dd><small>após taxa e participação</small></div></dl>
    <form className="sems-device-toolbar sems-chargegrid-table-toolbar sems-finance-toolbar" onSubmit={(event) => event.preventDefault()}><label><span className="sr-only">Status financeiro</span><select aria-label="Status financeiro" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">▣  Todos os estados financeiros</option><option value="AUTHORIZED">Autorizado</option><option value="CAPTURED">Capturado</option><option value="PARTIALLY_REFUNDED">Reembolso parcial</option><option value="REFUNDED">Reembolsado</option><option value="DISPUTED">Em disputa</option><option value="FAILED">Falhou</option></select></label><button className="sems-icon-action" type="submit" aria-label="Pesquisar">⌕</button><button className="sems-icon-action" type="button" aria-label="Limpar filtro financeiro" onClick={() => setStatus("all")}>↻</button></form>
    <div data-testid="mvp-payments-table"><DataTable columns={["Sessão", "Pagamento", "Capturado", "Reembolso", "Liquidação", "Operação"]}>{transactions.map((item) => <tr key={item.id}><td><strong>{item.sessionId}</strong><span>{item.providerReference}</span></td><td><Badge value={item.status} /></td><td>{cents(item.capturedCents)}<span>autorizado {cents(item.authorizedCents)}</span></td><td>{cents(item.refundedCents)}</td><td><Badge value={item.settlementStatus} /></td><td><div className="financial-row-actions"><a className="sems-row-action" href={`#/mvp/financial-session?est=${item.establishmentId}&transaction=${item.id}`}>Abrir detalhe ›</a>{canManageFinance && item.settlementStatus === "AVAILABLE" && item.status !== "DISPUTED" ? <button className="sems-finance-action" type="button" onClick={() => settle(item.id)}>Conciliar</button> : null}</div></td></tr>)}</DataTable></div>
    {!transactions.length ? <p className="operations-empty">Nenhuma transação corresponde ao filtro.</p> : null}
    {feedback ? <p role="status" className="command-feedback">{feedback}</p> : null}
  </section>;
}

export function FinancialSessionPage({ transactionId, establishmentId }: { transactionId: string; establishmentId?: string }) {
  const { state, account, refundPayment } = useAdminState();
  const [feedback, setFeedback] = useState("");
  const canManageFinance = Boolean(account && hasAdminCapability(account, "finance:manage"));
  const transaction = state.paymentTransactions.find((item) => item.id === transactionId);
  if (!transaction || (establishmentId && transaction.establishmentId !== establishmentId)) return <Navigate to="/mvp/finance" replace />;
  const selectedTransactionId = transaction.id;
  const session = state.sessions.find((item) => item.id === transaction.sessionId);
  const tariff = state.tariffPolicies.find((item) => item.id === transaction.tariffPolicyId);
  const calculation = session && tariff ? calculateSessionCharge(session, tariff) : undefined;
  const breakdown = calculateFinancialBreakdown(transaction);
  const events = state.financialEvents.filter((item) => item.transactionId === transaction.id).sort((a, b) => a.at.localeCompare(b.at));
  function refund(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); const result = refundPayment(selectedTransactionId, Math.round(Number(data.get("amount")) * 100), String(data.get("reason")), `refund-${selectedTransactionId}-${Date.now()}`); setFeedback(result.ok ? "Reembolso registrado no sandbox." : result.issues.join(" ")); }
  return <div className="operations-detail" data-testid="financial-session-detail"><nav className="enterprise-breadcrumb"><span><a href={`#/mvp/finance?est=${transaction.establishmentId}`}>Financeiro</a><i>/</i></span><span><strong>{transaction.id}</strong></span></nav><section className="operations-hero surface"><div><span className="eyebrow">Sessao financeira</span><h2>{session?.id}</h2><p>{transaction.provider} · {transaction.providerReference}</p></div><div className="operations-hero-status"><Badge value={transaction.status} /><strong>{cents(transaction.capturedCents)}</strong><span>Liquidacao {transaction.settlementStatus}</span></div></section><nav className="entity-tabs operations-anchor-nav"><a className="is-active" href="#financial-breakdown">Composicao</a><a href="#financial-timeline">Timeline</a>{canManageFinance ? <a href="#financial-refund">Reembolso</a> : null}</nav><section id="financial-breakdown" className="surface panel"><SectionHeader title="Composicao do valor" subtitle={`Politica ${tariff?.id ?? "nao encontrada"}; calculo em centavos inteiros.`} /><div className="financial-breakdown"><article><span>Energia calculada</span><strong>{cents(calculation?.energyCents ?? 0)}</strong><small>{session?.energyKwh ?? 0} kWh</small></article><article><span>Ociosidade</span><strong>{cents(calculation?.idleCents ?? 0)}</strong><small>{calculation?.billableIdleMinutes ?? 0} min faturaveis</small></article><article><span>Taxa provider</span><strong>- {cents(breakdown.providerFeeCents)}</strong></article><article><span>Participacao</span><strong>- {cents(breakdown.platformShareCents)}</strong><small>{transaction.platformShareBps / 100}% registrado</small></article><article className="financial-net"><span>Liquido estabelecimento</span><strong>{cents(breakdown.establishmentNetCents)}</strong><small>apos {cents(breakdown.refundedCents)} reembolsados</small></article></div></section><section id="financial-timeline" className="surface panel"><SectionHeader title="Timeline financeira" subtitle="Autorizacao, captura, reembolso e liquidacao nao sao colapsados em um unico status." /><ol className="session-timeline">{events.map((item) => <li key={item.id}><i /><div><span>{item.actor} · {localDate(item.at)}</span><h3>{item.type}</h3>{item.amountCents !== undefined ? <p>{cents(item.amountCents)}</p> : null}{item.reason ? <small>{item.reason}</small> : null}</div></li>)}</ol></section>{canManageFinance ? <section id="financial-refund" className="surface panel"><SectionHeader title="Reembolso" subtitle="Acao auditada e idempotente no adapter sandbox." />{["CAPTURED", "PARTIALLY_REFUNDED"].includes(transaction.status) ? <form className="financial-editor" onSubmit={refund} data-testid="refund-form"><label>Valor (R$)<input name="amount" type="number" min="0.01" step="0.01" max={(transaction.capturedCents - transaction.refundedCents) / 100} required /></label><label className="financial-reason">Motivo<textarea name="reason" minLength={8} required /></label><button type="submit">Registrar reembolso</button></form> : <p className="operations-empty">Transacao sem saldo elegivel para reembolso.</p>}{feedback ? <p role="status" className="command-feedback">{feedback}</p> : null}</section> : null}</div>;
}
