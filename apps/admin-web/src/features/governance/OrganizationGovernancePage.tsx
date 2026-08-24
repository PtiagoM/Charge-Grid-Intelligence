import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useAdminState } from "../../app/AdminState";
import { Badge, DataTable, SectionHeader } from "../../components/AdminUi";
import { accessibleEstablishmentIds } from "../../domain/accessOperations";
import type { AdminRole, SemsOrganizationFunction } from "../../domain/admin";
import { hasAdminCapability } from "../../domain/adminCapabilities";
import {
  COMMERCIAL_PLANT_CONTRACTS,
  contractByActivationCode,
  type CommercialContractStatus
} from "../../fixtures/commercialGovernance";
import { AccessDeniedPage } from "./GovernancePages";

const ROLE_LABELS: Record<AdminRole, string> = {
  GOODWE_CENTRAL: "Central GoodWe",
  GOODWE_PORTFOLIO_MANAGER: "Gestor de carteira GoodWe",
  GOODWE_TECH_SUPPORT: "Técnico / suporte GoodWe",
  GOODWE_ADMIN: "Central GoodWe (legado)",
  ESTABLISHMENT_ADMIN: "Administrador comercial do estabelecimento",
  ESTABLISHMENT_OPERATOR: "Operador comercial do estabelecimento",
  REPORT_VIEWER: "Financeiro e relatórios"
};

const CONTRACT_STATUS_LABELS: Record<CommercialContractStatus, string> = {
  AUTHORIZED: "Código autorizado",
  TECHNICAL_PENDING: "Pendência técnica",
  PUBLISHED: "Planta comercial ativa",
  CLOSED: "Encerrado"
};

type GovernanceSection = "organization" | "users" | "contracts" | "audit";

function localDate(value?: string) {
  return value ? new Date(value).toLocaleString("pt-BR") : "—";
}

function semsAccountType(profile?: string) {
  return profile === "GOODWE" ? "Distribuidor / Instalador" : "Usuário / Proprietário";
}

function roleLabel(role?: AdminRole) {
  return role ? ROLE_LABELS[role] : "Sem vínculo ChargeGrid";
}

function semsFunction(value?: SemsOrganizationFunction) {
  if (value === "ADMINISTRATOR") return "Administrador";
  if (value === "NAVIGATOR") return "Navegador";
  if (value === "TECHNICIAN") return "Técnico";
  return "—";
}

export function OrganizationGovernancePage() {
  const { state, account, grantAccess, revokeAccess } = useAdminState();
  const [query, setQuery] = useSearchParams();
  const [feedback, setFeedback] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [activationCode, setActivationCode] = useState("");
  const [validatedContractId, setValidatedContractId] = useState("");

  if (!account || !hasAdminCapability(account, "organization:view")) return <AccessDeniedPage />;

  const canManageAccess = hasAdminCapability(account, "access:manage");
  const canViewContracts = hasAdminCapability(account, "commercial:manage") || hasAdminCapability(account, "commercial:self-service");
  const canViewAudit = hasAdminCapability(account, "governance:audit") || canManageAccess;
  const requestedSection = query.get("section") as GovernanceSection | null;
  const allowedSections: GovernanceSection[] = ["organization", ...(canManageAccess ? ["users" as const] : []), ...(canViewContracts ? ["contracts" as const] : []), ...(canViewAudit ? ["audit" as const] : [])];
  const section = requestedSection && allowedSections.includes(requestedSection) ? requestedSection : "organization";
  function selectSection(next: GovernanceSection) {
    const updated = new URLSearchParams(query);
    updated.set("section", next);
    setQuery(updated, { replace: true });
  }

  const actorScopes = accessibleEstablishmentIds(state, account);
  const actorScopeSet = new Set(actorScopes);
  const accountById = new Map(state.accounts.map((item) => [item.id, item]));
  const establishmentById = new Map(state.establishments.map((item) => [item.id, item]));
  const publishedPlantIds = new Set(state.commercialPlants.map((item) => item.goodwePlantId));
  const isGoodWeCentral = account.role === "GOODWE_CENTRAL" || account.role === "GOODWE_ADMIN";
  const visibleEstablishments = state.establishments.filter((item) => actorScopeSet.has(item.id));
  const visibleGrants = state.accessGrants.filter((item) => {
    const target = accountById.get(item.accountId);
    if (account.profile === "ESTABELECIMENTO" && target?.profile !== "ESTABELECIMENTO") return false;
    return item.accountId === account.id || item.establishmentIds.some((scope) => actorScopeSet.has(scope));
  });
  const targetAccounts = state.accounts.filter((item) =>
    item.id !== account.id && (isGoodWeCentral || item.profile === "ESTABELECIMENTO")
  );
  const roles: AdminRole[] = isGoodWeCentral
    ? ["GOODWE_CENTRAL", "GOODWE_PORTFOLIO_MANAGER", "GOODWE_TECH_SUPPORT", "ESTABLISHMENT_ADMIN", "ESTABLISHMENT_OPERATOR", "REPORT_VIEWER"]
    : account.profile === "GOODWE"
      ? ["ESTABLISHMENT_ADMIN", "ESTABLISHMENT_OPERATOR", "REPORT_VIEWER"]
      : ["ESTABLISHMENT_OPERATOR", "REPORT_VIEWER"];
  const visibleContracts = COMMERCIAL_PLANT_CONTRACTS
    .filter((item) => actorScopeSet.has(item.establishmentId))
    .map((item) => publishedPlantIds.has(item.goodwePlantId)
      ? { ...item, status: "PUBLISHED" as const }
      : item);
  const visibleContractById = new Map(visibleContracts.map((item) => [item.id, item]));
  const validatedContract = visibleContractById.get(validatedContractId);
  const organizationName = account.profile === "GOODWE"
    ? "GoodWe Brasil · ChargeGrid"
    : visibleEstablishments[0]?.name ?? "Organização do estabelecimento";

  function submitGrant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = grantAccess({
      accountId: String(data.get("accountId")),
      role: String(data.get("role")) as AdminRole,
      establishmentIds: data.getAll("establishmentIds").map(String)
    });
    setFeedback(result.ok ? "Concessão registrada na trilha de auditoria." : result.issues.join(" "));
  }

  function revoke(grantId: string) {
    const result = revokeAccess(grantId, reasons[grantId] ?? "");
    setFeedback(result.ok ? "Acesso revogado imediatamente." : result.issues.join(" "));
  }

  function validateActivation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const contractRecord = contractByActivationCode(activationCode);
    const contract = contractRecord ? visibleContractById.get(contractRecord.id) : undefined;
    if (!contract) {
      setValidatedContractId("");
      setFeedback("Código não encontrado ou fora do seu escopo autorizado.");
      return;
    }
    setValidatedContractId(contract.id);
    setFeedback(contract.status === "AUTHORIZED"
      ? "Contrato confirmado. O onboarding comercial pode começar."
      : `Contrato localizado: ${CONTRACT_STATUS_LABELS[contract.status]}.`);
  }

  return <div className="sems-governance-page" data-testid="access-management-page">
    <aside className="surface sems-governance-menu" aria-label="Gestão da organização">
      <header>
        <span>Organização</span>
        <strong>{organizationName}</strong>
        <small>{roleLabel(account.role)}</small>
      </header>
      <nav>
        <button className={section === "organization" ? "is-active" : ""} type="button" onClick={() => selectSection("organization")}>Informações da organização</button>
        {canManageAccess ? <button className={section === "users" ? "is-active" : ""} type="button" onClick={() => selectSection("users")}>Usuários e funções</button> : null}
        {canViewContracts ? <button className={section === "contracts" ? "is-active" : ""} type="button" onClick={() => selectSection("contracts")}>Contratos e ativações</button> : null}
        {canViewAudit ? <button className={section === "audit" ? "is-active" : ""} type="button" onClick={() => selectSection("audit")}>Gerenciamento de logs</button> : null}
      </nav>
    </aside>

    <div className="sems-governance-content">
      {section === "organization" ? <>
        <section className="surface panel sems-organization-information">
          <SectionHeader eyebrow="SEMS+ preservado · ChargeGrid adicional" title="Informações da organização" subtitle="A conta técnica, a função organizacional e o acesso comercial são dimensões independentes." />
          <div className="organization-details-grid">
            <article><span>Nome da organização</span><strong>{organizationName}</strong></article>
            <article><span>Código da organização</span><strong>{account.profile === "GOODWE" ? "GW-BR-CHARGEGRID" : visibleEstablishments[0]?.contractCode ?? "—"}</strong></article>
            <article><span>Tipo de conta SEMS+</span><strong>{account.semsAccountType === "DISTRIBUTOR_INSTALLER" ? "Distribuidor / Instalador aprovado" : "Usuário / Proprietário"}</strong></article>
            <article><span>Responsabilidade ChargeGrid</span><strong>{roleLabel(account.role)}</strong></article>
            <article><span>Escopo explícito</span><strong>{actorScopes.length} estabelecimento(s)</strong></article>
            <article><span>Administrador atual</span><strong>{account.displayName}</strong></article>
          </div>
        </section>
        <section className="surface panel">
          <SectionHeader title="Como as permissões se combinam" subtitle="Ativar a camada comercial não remove nem amplia automaticamente as permissões técnicas do SEMS+." />
          <div className="governance-layer-grid">
            <article><span>1 · Conta SEMS+</span><h3>Proprietário ou profissional aprovado</h3><p>Define a relação técnica original com plantas e equipamentos.</p></article>
            <article><span>2 · Função organizacional</span><h3>Administrador, Navegador ou Técnico</h3><p>Controla a gestão técnica dentro da organização SEMS+.</p></article>
            <article><span>3 · Camada ChargeGrid</span><h3>Papel comercial com escopo por planta</h3><p>Libera contratos, publicação, operação e dados comerciais somente quando necessário.</p></article>
          </div>
        </section>
      </> : null}

      {section === "users" ? <>
        <section className="surface panel">
          <SectionHeader eyebrow="Governança por responsabilidade" title="Usuários e funções" subtitle="Uma conta pode manter seu papel SEMS+ e receber uma responsabilidade ChargeGrid sem se transformar em outro tipo de usuário." />
          <dl className="sems-compact-summary">
            <div><dt>Contas visíveis</dt><dd>{new Set(visibleGrants.map((item) => item.accountId)).size}</dd><small>No seu escopo</small></div>
            <div><dt>Acessos ativos</dt><dd>{visibleGrants.filter((item) => item.status === "ACTIVE").length}</dd><small>Com escopo explícito</small></div>
            <div><dt>Revogados</dt><dd>{visibleGrants.filter((item) => item.status === "REVOKED").length}</dd><small>Histórico preservado</small></div>
            <div><dt>Plantas administradas</dt><dd>{actorScopes.length}</dd><small>Sem alcance implícito</small></div>
          </dl>
        </section>
        <section className="surface panel governance-grid">
          <div>
            <SectionHeader title="Conceder ou alterar responsabilidade" subtitle="A nova concessão substitui a anterior sem apagar o histórico." />
            <form className="access-editor" onSubmit={submitGrant}>
              <label>Conta<select name="accountId" required defaultValue=""><option value="" disabled>Selecione uma conta</option>{targetAccounts.map((item) => <option key={item.id} value={item.id}>{item.displayName} · {item.email}</option>)}</select></label>
              <label>Papel ChargeGrid<select name="role" required defaultValue={roles[0]}>{roles.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}</select></label>
              <fieldset><legend>Estabelecimentos e plantas permitidos</legend>{visibleEstablishments.map((item) => <label className="access-scope-option" key={item.id}><input type="checkbox" name="establishmentIds" value={item.id} defaultChecked={!isGoodWeCentral} />{item.name}</label>)}</fieldset>
              <button type="submit">Registrar concessão</button>
            </form>
          </div>
          <aside className="access-policy-note">
            <span>Política efetiva</span><h3>Função e escopo são obrigatórios</h3>
            <p>Nenhum usuário GoodWe recebe visão nacional apenas por pertencer à empresa.</p>
            <ul><li>Gestor acompanha sua carteira.</li><li>Central recebe escopo estratégico adicional.</li><li>Suporte atua apenas nas plantas autorizadas.</li><li>Estabelecimento delega somente sua operação local.</li></ul>
          </aside>
        </section>
        <section className="surface panel">
          <SectionHeader title="Matriz de usuários" subtitle="A função técnica SEMS+ permanece separada do papel comercial ChargeGrid." />
          <DataTable columns={["Usuário", "Conta SEMS+", "Função SEMS+", "Papel ChargeGrid", "Escopo", "Estado", "Gestão"]}>
            {visibleGrants.map((grant) => {
              const user = accountById.get(grant.accountId);
              return <tr key={grant.id}>
                <td><strong>{user?.displayName ?? grant.accountId}</strong><span>{user?.email}</span></td>
                <td>{semsAccountType(user?.profile)}</td>
                <td>{semsFunction(user?.semsOrganizationFunction)}</td>
                <td>{ROLE_LABELS[grant.role]}</td>
                <td>{grant.establishmentIds.map((id) => establishmentById.get(id)?.name ?? id).join(", ") || "Sem escopo"}</td>
                <td><Badge value={grant.status} /></td>
                <td>{grant.status === "ACTIVE" && grant.accountId !== account.id ? <div className="access-revoke"><label><span className="sr-only">Motivo para revogar {user?.displayName}</span><input aria-label={`Motivo para revogar ${user?.displayName}`} value={reasons[grant.id] ?? ""} onChange={(event) => setReasons((current) => ({ ...current, [grant.id]: event.target.value }))} placeholder="Motivo da revogação" /></label><button type="button" className="ghost-button" onClick={() => revoke(grant.id)}>Revogar</button></div> : <span>{grant.revocationReason ?? "Conta atual"}</span>}</td>
              </tr>;
            })}
          </DataTable>
        </section>
      </> : null}

      {section === "contracts" ? <>
        <section className="surface panel">
          <SectionHeader eyebrow="Camada ChargeGrid" title="Contratos e ativações por planta" subtitle="O contrato do mundo real autoriza uma única planta; o código apenas vincula essa autorização ao SEMS+." />
          <dl className="sems-compact-summary">
            <div><dt>Contratos no escopo</dt><dd>{visibleContracts.length}</dd><small>Um por planta</small></div>
            <div><dt>Plantas publicadas</dt><dd>{visibleContracts.filter((item) => item.status === "PUBLISHED").length}</dd><small>Camada comercial ativa</small></div>
            <div><dt>Códigos autorizados</dt><dd>{visibleContracts.filter((item) => item.status === "AUTHORIZED").length}</dd><small>Aguardando ativação</small></div>
            <div><dt>Pendências técnicas</dt><dd>{visibleContracts.filter((item) => item.status === "TECHNICAL_PENDING").length}</dd><small>Publicação bloqueada</small></div>
          </dl>
        </section>
        {hasAdminCapability(account, "commercial:self-service") ? <section className="surface panel contract-activation-panel">
          <div>
            <SectionHeader title="Validar código de contrato" subtitle="O usuário não solicita uma planta comercial livremente: ele informa o código previamente autorizado pelo consultor GoodWe." />
            <form onSubmit={validateActivation}><label><span>Código de ativação</span><input value={activationCode} onChange={(event) => setActivationCode(event.target.value.toUpperCase())} placeholder="CG-ACT-..." required /></label><button type="submit">Validar contrato</button></form>
            <small>Ambiente demonstrativo: use CG-ACT-FIAP-VM.</small>
          </div>
          {validatedContract ? <aside>
            <Badge value={validatedContract.status}>{CONTRACT_STATUS_LABELS[validatedContract.status]}</Badge>
            <h3>{validatedContract.contractCode}</h3><p>{validatedContract.contractingParty}</p>
            <dl><div><dt>Planta</dt><dd>{validatedContract.goodwePlantId}</dd></div><div><dt>Consultor</dt><dd>{validatedContract.goodweConsultant}</dd></div></dl>
            {validatedContract.status === "AUTHORIZED" ? <a className="sems-primary-action" href={`#/mvp/plant-onboarding?contract=${validatedContract.id}`}>Continuar onboarding</a> : null}
          </aside> : <aside className="is-empty"><strong>Nenhum código validado</strong><span>Somente contratos do seu escopo serão exibidos.</span></aside>}
        </section> : <section className="surface panel governance-responsibility-note"><SectionHeader title="Ativações conduzidas pela carteira" subtitle="O consultor acompanha contrato, pendência e prontidão. O código é emitido pelo backoffice e resgatado pelo estabelecimento contratante." /></section>}
        <section className="surface panel">
          <SectionHeader title="Carteira contratual" subtitle="Dados jurídicos continuam no backoffice; aqui aparecem somente os vínculos necessários para decidir e operar." />
          <DataTable columns={["Contrato", "Parte contratante", "Planta SEMS+", "Responsável GoodWe", "Escopo", "Estado", "Vigência"]}>
            {visibleContracts.map((contract) => <tr key={contract.id}>
              <td><strong>{contract.contractCode}</strong><span>Código {contract.status === "AUTHORIZED" ? contract.activationCode : "já utilizado"}</span></td>
              <td>{contract.contractingParty}</td><td>{contract.goodwePlantId}</td><td>{contract.goodweConsultant}</td><td>{contract.portfolio}</td>
              <td><Badge value={contract.status}>{CONTRACT_STATUS_LABELS[contract.status]}</Badge></td>
              <td>{new Date(`${contract.signedAt}T12:00:00`).toLocaleDateString("pt-BR")}<span>até {new Date(`${contract.validUntil}T12:00:00`).toLocaleDateString("pt-BR")}</span></td>
            </tr>)}
          </DataTable>
        </section>
      </> : null}

      {section === "audit" ? <section className="surface panel sems-audit-panel">
        <SectionHeader eyebrow="Gerenciamento de logs" title="Auditoria organizacional e comercial" subtitle="Eventos técnicos e ChargeGrid permanecem identificados pela origem, autor, escopo e horário." />
        <form className="sems-audit-filter" onSubmit={(event) => event.preventDefault()}>
          <label>Operador<input placeholder="Nome ou e-mail" /></label>
          <label>Módulo<select><option>Todos</option><option>Organização SEMS+</option><option>Contratos ChargeGrid</option><option>Usuários e acessos</option><option>Publicação comercial</option></select></label>
          <label>Tipo<select><option>Todos</option><option>Criação</option><option>Alteração</option><option>Revogação</option><option>Publicação</option></select></label>
          <button type="submit">Pesquisar</button>
        </form>
        <DataTable columns={["Módulo", "Tipo", "Operador", "Data e hora", "Detalhe"]}>
          {state.audit.slice().reverse().map((item) => <tr key={item.id}><td>ChargeGrid</td><td>Operação</td><td>{account.displayName}</td><td>{localDate(item.at)}</td><td>{item.summary}</td></tr>)}
          {visibleGrants.slice().reverse().map((grant) => <tr key={`log-${grant.id}`}><td>Usuários e acessos</td><td>{grant.status === "ACTIVE" ? "Concessão" : "Revogação"}</td><td>{grant.status === "ACTIVE" ? grant.grantedBy : grant.revokedBy ?? "Sistema"}</td><td>{localDate(grant.revokedAt ?? grant.grantedAt)}</td><td>{ROLE_LABELS[grant.role]} · {grant.establishmentIds.length} escopo(s)</td></tr>)}
        </DataTable>
      </section> : null}

      {feedback ? <p className="command-feedback sems-governance-feedback" role="status">{feedback}</p> : null}
    </div>
  </div>;
}
