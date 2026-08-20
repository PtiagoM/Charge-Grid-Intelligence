import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth, demoAdminAccounts } from "../auth/AuthContext";
import { assets } from "../constants/assets";

export function LoginPage() {
  const { account, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (account) return <Navigate to="/" replace />;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (login(email, password)) {
      navigate("/", { replace: true });
      return;
    }
    setError("Credenciais demonstrativas inválidas.");
  }

  function fillAccount(selectedEmail: string, selectedPassword: string) {
    setEmail(selectedEmail);
    setPassword(selectedPassword);
    setError("");
  }

  return (
    <div className="auth-shell" data-testid="auth-shell">
      <aside className="auth-brand">
        <img src={assets.logo} alt="GoodWe" />
        <h1>ChargeGrid Intelligence</h1>
        <p>SEMS+ monitora a operação energética. ChargeGrid organiza a operação comercial da recarga.</p>
        <ul>
          <li>Central GoodWe: visão da rede comercial autorizada.</li>
          <li>Estabelecimento: uma conta para uma ou várias plantas.</li>
          <li>Driver PWA: experiência separada para motorista e visitante.</li>
        </ul>
      </aside>
      <section className="auth-card" data-testid="login-card">
        <h2>Entrar no ChargeGrid</h2>
        <p>Use as credenciais demonstrativas para acessar cada ambiente.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>E-mail<input value={email} onChange={(event) => setEmail(event.target.value)} name="email" type="email" placeholder="seuemail@teste.com" required data-testid="login-email" /></label>
          <label>Senha<input value={password} onChange={(event) => setPassword(event.target.value)} name="password" type="password" placeholder="******" required data-testid="login-password" /></label>
          <button type="submit" data-testid="login-submit">Acessar</button>
        </form>
        {error ? <p className="auth-error" data-testid="login-error">{error}</p> : null}
        <div className="quick-login-list">
          <h3>Conta inicial</h3>
          {demoAdminAccounts.map((demoAccount) => <button key={demoAccount.email} type="button" className="quick-login" onClick={() => fillAccount(demoAccount.email, demoAccount.password)}>{demoAccount.profileLabel} · {demoAccount.email}</button>)}
        </div>
        <footer><span>Autenticação demonstrativa no Admin Web.</span><strong>Supabase Auth será integrado por spec.</strong></footer>
      </section>
    </div>
  );
}
