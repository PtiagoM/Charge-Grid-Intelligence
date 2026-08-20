import { useState, type FormEvent } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useDriverApp } from "../app/DriverAppContext";
import { PageIntro, PrimaryButton } from "../components/Ui";

export function SignupPage() {
  const navigate = useNavigate();
  const { isAuthenticated, register } = useDriverApp();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [batteryCapacity, setBatteryCapacity] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");

  if (isAuthenticated) return <Navigate to="/explore" replace />;
  if (confirmationEmail) return <section className="empty-state"><span className="empty-icon">@</span><h1>Confirme seu e-mail</h1><p>Enviamos um link de confirmação para {confirmationEmail}. Depois de confirmar, volte para entrar na conta.</p><Link className="primary-link" to="/login">Ir para o login</Link></section>;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (fullName.trim().split(/\s+/).length < 2) return setError("Informe seu nome e sobrenome.");
    if (!email.includes("@")) return setError("Informe um e-mail válido.");
    if (password.length < 8) return setError("Crie uma senha com pelo menos 8 caracteres.");
    if (password !== confirmPassword) return setError("As senhas não coincidem.");
    if (!accepted) return setError("Aceite os termos e a política de privacidade para continuar.");

    setSubmitting(true);
    const result = await register({
      fullName,
      email,
      password,
      vehicleName,
      batteryCapacityKwh: batteryCapacity ? Number(batteryCapacity) : undefined
    });
    setSubmitting(false);
    if (!result.ok) return setError(result.message ?? "Não foi possível criar sua conta.");
    if (result.requiresEmailConfirmation) {
      setConfirmationEmail(email);
      return;
    }
    navigate("/explore", { replace: true });
  }

  return <>
    <PageIntro eyebrow="Cadastro do motorista" title="Sua conta ChargeGrid">
      <p>Encontre carregadores, participe de filas e mantenha o histórico das suas recargas.</p>
    </PageIntro>
    <form className="auth-form" onSubmit={submit} noValidate>
      <label htmlFor="signup-name">Nome completo</label>
      <input id="signup-name" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
      <label htmlFor="signup-email">E-mail</label>
      <input id="signup-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      <label htmlFor="signup-password">Senha</label>
      <input id="signup-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
      <label htmlFor="signup-confirm">Confirmar senha</label>
      <input id="signup-confirm" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
      <div className="auth-form-grid">
        <div><label htmlFor="signup-vehicle">Veículo</label><input id="signup-vehicle" placeholder="Ex.: BYD Dolphin" value={vehicleName} onChange={(event) => setVehicleName(event.target.value)} /></div>
        <div><label htmlFor="signup-battery">Bateria (kWh)</label><input id="signup-battery" type="number" inputMode="decimal" min="5" max="250" placeholder="Ex.: 45" value={batteryCapacity} onChange={(event) => setBatteryCapacity(event.target.value)} /></div>
      </div>
      <label className="terms-check account-terms"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /><span>Li e aceito os Termos de Uso e a Política de Privacidade.</span></label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <PrimaryButton type="submit" disabled={submitting}>{submitting ? "Criando conta…" : "Criar minha conta"}</PrimaryButton>
    </form>
    <Link className="text-link" to="/login">Já tenho uma conta</Link>
  </>;
}
