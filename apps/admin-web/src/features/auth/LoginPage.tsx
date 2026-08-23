import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { assets } from "../../constants/assets";
import { useAdminState } from "../../app/AdminState";
import type { Profile } from "../../domain/admin";
import { activeGrantFor } from "../../domain/accessOperations";

export function homeFor(_profile: Profile) {
  return "/mvp/overview";
}

export function LoginPage() {
  const { account, login, state } = useAdminState();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (account) return <Navigate to={homeFor(account.profile)} replace />;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const matched = login(email, password);
    if (!matched) {
      setError("Credenciais demonstrativas invalidas.");
      return;
    }
    navigate(homeFor(matched.profile), { replace: true });
  }

  return <div className="auth-shell" data-testid="auth-shell">
    <aside className="auth-brand">
      <img src={assets.logo} alt="GoodWe" />
      <h1>CHARGEGRID INTELLIGENCE</h1>
      <p>SEMS+ monitora a operacao energetica. ChargeGrid organiza a operacao comercial da recarga.</p>
      <ul><li>Central GoodWe: visao nacional de rede comercial.</li><li>Business: operacao do estabelecimento em tempo real.</li><li>Motoristas e visitantes utilizam exclusivamente o Driver PWA.</li></ul>
    </aside>
    <section className="auth-card" data-testid="login-card">
      <h2>Entrar no ChargeGrid</h2>
      <p>Use as credenciais demonstrativas para acessar cada ambiente.</p>
      <form className="auth-form" onSubmit={submit}>
        <label>E-mail<input name="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="seuemail@teste.com" required data-testid="login-email" /></label>
        <label>Senha<input name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="******" required data-testid="login-password" /></label>
        <button type="submit" data-testid="login-submit">Acessar</button>
      </form>
      {error ? <p className="auth-error" data-testid="login-error">{error}</p> : null}
      <div className="demo-account-list" data-testid="demo-account-list">
        <h3>Conta inicial</h3>
        {state.accounts.filter((item) => activeGrantFor(state, item.id)).map((item) => <button key={item.id} type="button" className="demo-account" onClick={() => { setEmail(item.email); setPassword(item.password); setError(""); }}>{item.role} · {item.email}</button>)}
      </div>
      <footer><span>Ambiente administrativo separado das jornadas do motorista e visitante.</span></footer>
    </section>
  </div>;
}
