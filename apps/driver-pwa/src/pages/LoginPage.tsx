import { useState, type FormEvent } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useDriverApp } from "../app/DriverAppContext";
import { PageIntro, PrimaryButton } from "../components/Ui";
import { assets } from "../constants/assets";

export function LoginPage() {
  const navigate = useNavigate();
  const { account, isAuthenticated, login } = useDriverApp();
  const [email, setEmail] = useState(account?.profile.email ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/explore" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!email.includes("@") || password.length < 8) {
      setError("Informe seu e-mail e uma senha com pelo menos 8 caracteres.");
      return;
    }
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(account ? result.message ?? "Não foi possível entrar." : "Nenhuma conta foi cadastrada neste dispositivo. Crie sua conta primeiro.");
      return;
    }
    navigate("/explore", { replace: true });
  }

  return <>
    <section className="login-brand"><img src={assets.logoCompact} alt="GoodWe" /><div><span>SEMS+ ecosystem</span><strong>ChargeGrid</strong></div></section>
    <PageIntro eyebrow="Conta do motorista" title="Bem-vindo de volta">
      <p>Entre para localizar pontos, participar de filas e acompanhar suas recargas.</p>
    </PageIntro>
    <form className="auth-form" onSubmit={submit} noValidate>
      <label htmlFor="email">E-mail</label>
      <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} aria-invalid={Boolean(error)} />
      <label htmlFor="password">Senha</label>
      <input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} aria-invalid={Boolean(error)} />
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <PrimaryButton type="submit" disabled={submitting}>{submitting ? "Entrando…" : "Entrar"}</PrimaryButton>
    </form>
    <Link className="secondary-link" to="/signup">Criar conta de motorista</Link>
    <Link className="text-link" to="/scan">Continuar como visitante pelo QR Code</Link>
  </>;
}
