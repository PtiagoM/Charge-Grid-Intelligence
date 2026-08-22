import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { assets } from "../constants/assets";
import { useAppState } from "./AppState";

export function homeFor(profile: "GOODWE" | "ESTABELECIMENTO" | "USUARIO") {
  return profile === "USUARIO" ? "/drive/home" : "/mvp/overview";
}

export function LoginPage() {
  const { account, login, state } = useAppState();
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
      <ul><li>Central GoodWe: visao nacional de rede comercial.</li><li>Business: operacao do estabelecimento em tempo real.</li><li>Drive e Quick: experiencia de recarga para motorista e visitante.</li></ul>
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
      <div className="quick-login-list" data-testid="quick-login-list">
        <h3>Conta inicial</h3>
        {state.accounts.map((item) => <button key={item.id} type="button" className="quick-login" onClick={() => { setEmail(item.email); setPassword(item.password); setError(""); }}>{item.profile} · {item.email}</button>)}
      </div>
      <footer><span>Quick sem login por QR:</span><a href="#/quick/charger/CG-FIAP-01" data-testid="quick-public-link">Abrir ChargeGrid Quick</a></footer>
    </section>
  </div>;
}
