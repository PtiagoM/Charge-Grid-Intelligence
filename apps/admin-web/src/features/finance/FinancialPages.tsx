import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAdminState } from "../../app/AdminState";
import { Badge, DataTable, SectionHeader, money, statusLabel } from "../../components/AdminUi";
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
  const { state, account, refundPayment, settlePayment } = useAdminState();
  const [feedback, setFeedback] = useState("");
  const canManageFinance = Boolean(account && hasAdminCapability(account, "finance:manage"));
  const transaction = state.paymentTransactions.find((item) => item.id === transactionId);
  if (!transaction || (establishmentId && transaction.establishmentId !== establishmentId)) return <Navigate to="/mvp/finance" replace />;
  const selectedTransactionId = transaction.id;
  const session = state.sessions.find((item) => item.id === transaction.sessionId);
  const tariff = state.tariffPolicies.find((item) => item.id === transaction.tariffPolicyId);
  const establishment = state.establishments.find((item) => item.id === transaction.establishmentId);
  const charger = session ? state.chargers.find((item) => item.id === session.chargerId) : undefined;
  const location = charger ? state.locations.find((item) => item.id === charger.locationId) : undefined;
  const calculation = session && tariff ? calculateSessionCharge(session, tariff) : undefined;
  const breakdown = calculateFinancialBreakdown(transaction);
  const events = state.financialEvents.filter((item) => item.transactionId === transaction.id).sort((a, b) => a.at.localeCompare(b.at));
  const refundableCents = Math.max(0, transaction.capturedCents - transaction.refundedCents);
  const authorizationEvent = events.find((item) => item.type === "AUTHORIZED");
  const captureEvent = events.find((item) => item.type === "CAPTURED");
  const settlementEvent = events.find((item) => item.type === "SETTLED");
  const paymentSteps = [
    { label: "Autorização", detail: authorizationEvent ? localDate(authorizationEvent.at) : "Aguardando confirmação", done: Boolean(authorizationEvent || transaction.authorizedCents) },
    { label: "Captura", detail: captureEvent ? localDate(captureEvent.at) : "Aguardando encerramento", done: Boolean(captureEvent || transaction.capturedCents) },
    { label: "Liquidação", detail: settlementEvent ? localDate(settlementEvent.at) : statusLabel(transaction.settlementStatus), done: transaction.settlementStatus === "PAID" }
  ];
  const currentStep = paymentSteps.findIndex((item) => !item.done);

  function refund(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = refundPayment(selectedTransactionId, Math.round(Number(data.get("amount")) * 100), String(data.get("reason")), `refund-${selectedTransactionId}-${Date.now()}`);
    setFeedback(result.ok ? "Reembolso registrado no sandbox." : result.issues.join(" "));
    if (result.ok) form.reset();
  }

  function settle() {
    const result = settlePayment(selectedTransactionId);
    setFeedback(result.ok ? "Liquidação conciliada." : result.issues.join(" "));
  }

  return <div className="cg-payment-detail" data-testid="financial-session-detail">
    <nav className="enterprise-breadcrumb" aria-label="Navegação estrutural">
      <span><a href={`#/mvp/finance?est=${transaction.establishmentId}`}>Resumo financeiro</a><i>/</i></span>
      <span><strong>Detalhe do pagamento</strong></span>
    </nav>

    <section className="cg-payment-hero">
      <a className="cg-payment-back" href={`#/mvp/finance?est=${transaction.establishmentId}`} aria-label="Voltar ao resumo financeiro">‹</a>
      <div className="cg-payment-identity">
        <span>Detalhe do pagamento</span>
        <h1>{session?.id ?? transaction.id}</h1>
        <p>{establishment?.name ?? transaction.establishmentId} · {location?.name ?? "Operação ChargeGrid"}</p>
      </div>
      <div className="cg-payment-live-state">
        <Badge value={transaction.status} />
        <strong>{cents(transaction.capturedCents || transaction.authorizedCents)}</strong>
        <span>{transaction.capturedCents ? "valor capturado" : "valor autorizado"}</span>
      </div>
      <div className="cg-payment-hero-actions">
        {session ? <a href={`#/mvp/session?est=${transaction.establishmentId}&session=${session.id}`}>Abrir sessão</a> : null}
        <a href={`#/mvp/finance?est=${transaction.establishmentId}`}>Voltar ao financeiro</a>
      </div>
    </section>

    <ol className="cg-payment-progress" aria-label="Progresso do pagamento">
      {paymentSteps.map((step, index) => <li className={step.done ? "is-complete" : index === currentStep ? "is-current" : ""} key={step.label}>
        <i>{step.done ? "✓" : index + 1}</i>
        <div><strong>{step.label}</strong><span>{step.detail}</span></div>
      </li>)}
    </ol>

    <section className="cg-payment-kpis" aria-label="Resumo do pagamento">
      <article><span>Autorizado</span><strong>{cents(transaction.authorizedCents)}</strong><small>limite confirmado</small></article>
      <article><span>Capturado</span><strong>{cents(transaction.capturedCents)}</strong><small>{statusLabel(transaction.status)}</small></article>
      <article><span>Reembolsado</span><strong>{cents(transaction.refundedCents)}</strong><small>{cents(refundableCents)} disponível</small></article>
      <article className="is-net"><span>Líquido da operação</span><strong>{cents(breakdown.establishmentNetCents)}</strong><small>após taxas e participação</small></article>
    </section>

    <div className="cg-payment-layout">
      <section className="cg-payment-card cg-payment-composition" id="financial-breakdown">
        <header><div><span>Composição financeira</span><h2>Do consumo ao valor líquido</h2></div><small>Política {tariff?.id ?? "não encontrada"}</small></header>
        <div className="cg-payment-breakdown">
          <div><span>Energia da sessão<small>{session?.energyKwh.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) ?? "0,00"} kWh</small></span><strong>{cents(calculation?.energyCents ?? transaction.capturedCents)}</strong></div>
          <div><span>Ociosidade faturável<small>{calculation?.billableIdleMinutes ?? 0} min após carência</small></span><strong>{cents(calculation?.idleCents ?? 0)}</strong></div>
          <div className="is-deduction"><span>Taxa do provedor<small>{transaction.provider}</small></span><strong>− {cents(breakdown.providerFeeCents)}</strong></div>
          <div className="is-deduction"><span>Participação ChargeGrid<small>{transaction.platformShareBps / 100}% nesta versão</small></span><strong>− {cents(breakdown.platformShareCents)}</strong></div>
          {transaction.refundedCents ? <div className="is-deduction"><span>Reembolsos<small>abatidos do valor capturado</small></span><strong>− {cents(transaction.refundedCents)}</strong></div> : null}
          <div className="is-total"><span>Líquido do estabelecimento<small>valor disponível após deduções</small></span><strong>{cents(breakdown.establishmentNetCents)}</strong></div>
        </div>
      </section>

      <aside className="cg-payment-card cg-payment-context">
        <header><div><span>Transação</span><h2>Referências e liquidação</h2></div><Badge value={transaction.settlementStatus} /></header>
        <dl>
          <div><dt>Provedor</dt><dd>{transaction.provider}</dd></div>
          <div><dt>Referência</dt><dd>{transaction.providerReference}</dd></div>
          <div><dt>Transação ChargeGrid</dt><dd>{transaction.id}</dd></div>
          <div><dt>Política aplicada</dt><dd>{tariff?.id ?? "Não encontrada"}</dd></div>
          <div><dt>Criada em</dt><dd>{localDate(transaction.createdAt)}</dd></div>
          <div><dt>Capturada em</dt><dd>{localDate(transaction.capturedAt)}</dd></div>
        </dl>
        <footer>
          <div><span>Liquidação</span><strong>{statusLabel(transaction.settlementStatus)}</strong></div>
          {canManageFinance && transaction.settlementStatus === "AVAILABLE" && transaction.status !== "DISPUTED" ? <button type="button" onClick={settle}>Conciliar pagamento</button> : <small>{transaction.settlementStatus === "PAID" ? `Concluída em ${localDate(transaction.settledAt)}` : "Aguardando disponibilidade do provedor"}</small>}
        </footer>
      </aside>

      <section className="cg-payment-card cg-payment-timeline" id="financial-timeline">
        <header><div><span>Auditoria financeira</span><h2>Histórico do pagamento</h2></div><small>{events.length} registros</small></header>
        <ol>{events.map((item) => <li key={item.id}>
          <time>{new Date(item.at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time>
          <i />
          <div><span>{item.actor}</span><strong>{statusLabel(item.type)}</strong>{item.amountCents !== undefined ? <p>{cents(item.amountCents)}</p> : null}{item.reason ? <small>{item.reason}</small> : null}</div>
        </li>)}</ol>
        {!events.length ? <p className="operations-empty">Nenhum evento financeiro registrado.</p> : null}
      </section>

      {canManageFinance ? <section className="cg-payment-card cg-payment-refund" id="financial-refund">
        <header><div><span>Ação administrativa</span><h2>Registrar reembolso</h2></div><small>Saldo {cents(refundableCents)}</small></header>
        {["CAPTURED", "PARTIALLY_REFUNDED"].includes(transaction.status) && refundableCents > 0 ? <>
          <p>Use somente após a confirmação comercial. A ação é registrada no histórico e não pode ser desfeita por esta tela.</p>
          <form onSubmit={refund} data-testid="refund-form">
            <label>Valor (R$)<input name="amount" type="number" min="0.01" step="0.01" max={refundableCents / 100} placeholder="0,00" required /></label>
            <label>Motivo<textarea name="reason" minLength={8} placeholder="Informe a justificativa aprovada" required /></label>
            <button type="submit">Registrar reembolso</button>
          </form>
        </> : <p className="operations-empty">Transação sem saldo elegível para reembolso.</p>}
        {feedback ? <p role="status" className="command-feedback">{feedback}</p> : null}
      </section> : null}
    </div>
  </div>;
}
