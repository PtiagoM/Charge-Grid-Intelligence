import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { assets } from "../../constants/assets";
import { useAdminState } from "../../app/AdminState";
import type { Profile } from "../../domain/admin";

export function homeFor(_profile: Profile) {
  return "/mvp/overview";
}

export function LoginPage() {
  const { account, login, state } = useAdminState();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  return <div className="auth-shell sems-auth-shell" data-testid="auth-shell">
    <aside className="auth-brand sems-auth-hero">
      <img src={assets.logo} alt="GoodWe" />
      <div className="auth-hero-copy"><span>SEMS+ · ChargeGrid Intelligence</span><h1>Energia e recarga em uma unica operacao.</h1><p>Monitore usinas, dispositivos e a jornada comercial da recarga conectada.</p></div>
    </aside>
    <section className="auth-card sems-auth-card" data-testid="login-card">
      <nav className="auth-utilities" aria-label="Preferencias de acesso"><button type="button">Servidor global</button><button type="button">Português</button><button type="button" aria-label="Alternar tema">☼</button></nav>
      <div className="auth-form-wrap"><span className="auth-welcome">Bem-vindo ao SEMS+</span><h2>Entrar</h2><p>Acesse a operacao integrada GoodWe e ChargeGrid.</p>
      <form className="auth-form" onSubmit={submit}>
        <label><span>Conta</span><input name="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Insira sua conta" required data-testid="login-email" /></label>
        <label><span>Senha</span><span className="auth-password-field"><input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Insira sua senha" required data-testid="login-password" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? "Ocultar" : "Exibir"}</button></span></label>
        <div className="auth-form-options"><label><input type="checkbox" /> Lembrar senha</label><button type="button">Esqueceu sua senha?</button></div>
        <button className="auth-submit" type="submit" data-testid="login-submit">Entrar</button>
      </form>
      {error ? <p className="auth-error" data-testid="login-error">{error}</p> : null}
      <details className="demo-account-list" data-testid="demo-account-list">
        <summary>Usar uma conta de demonstracao</summary>
        {state.accounts.map((item) => <button key={item.id} type="button" className="demo-account" onClick={() => { setEmail(item.email); setPassword(item.password); setError(""); }}><strong>{item.role ?? "Somente SEMS+"}</strong><span>{item.email}</span></button>)}
      </details>
      <p className="auth-create-account">Ainda nao possui uma conta? <button type="button">Criar conta</button></p></div>
      <footer><span>Declaração de privacidade</span><span>Termos de uso</span><span>© 2026 GoodWe Technologies Co., Ltd.</span></footer>
    </section>
  </div>;
}
