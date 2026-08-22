import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js/pure";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDriverApp, type DriverMode, type PaymentMethod } from "../app/DriverAppContext";
import { AppIcon } from "../components/AppIcon";
import { InfoNotice, PageIntro, PrimaryButton } from "../components/Ui";
import { commercialPlants, getPlantById } from "../data/commercialPlants";
import { createPaymentIntent, getPaymentStatus, type PaymentIntentResult } from "../services/paymentApi";

const limits = [25, 40, 60] as const;
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey?.startsWith("pk_test_") && publishableKey.length > 16 ? loadStripe(publishableKey) : null;
const PENDING_PAYMENT_KEY = "chargegrid.pending-payment.v1";

interface PendingPayment {
  sessionId: string;
  paymentIntentId: string;
  clientSecret: string;
  method: PaymentMethod;
  mode: DriverMode;
  limit: number;
}

function readPendingPayment(): PendingPayment | null {
  try {
    return JSON.parse(sessionStorage.getItem(PENDING_PAYMENT_KEY) ?? "null") as PendingPayment | null;
  } catch {
    return null;
  }
}

function StripeConfirmationForm({
  pending,
  initialWaiting,
  onAuthorized
}: {
  pending: PendingPayment;
  initialWaiting: boolean;
  onAuthorized(): void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [waiting, setWaiting] = useState(initialWaiting);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!waiting) return;
    const timer = window.setInterval(() => {
      void getPaymentStatus(pending.paymentIntentId).then((payment) => {
        if (payment.status === "PAID" || payment.status === "AUTHORIZED") {
          window.clearInterval(timer);
          onAuthorized();
        }
      }).catch(() => undefined);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [onAuthorized, pending.paymentIntentId, waiting]);

  async function confirm(event: FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError("");
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/checkout?payment_return=1` },
      redirect: "if_required"
    });
    setSubmitting(false);
    if (stripeError) {
      setError(stripeError.message ?? "A Stripe não conseguiu confirmar este pagamento.");
      return;
    }
    if (paymentIntent?.status === "requires_capture" || paymentIntent?.status === "succeeded") {
      onAuthorized();
      return;
    }
    setWaiting(true);
  }

  return <form className="stripe-payment-form" onSubmit={confirm}>
    <div className="stripe-test-badge"><span>Stripe</span><strong>Modo de teste</strong></div>
    <PaymentElement options={{ layout: { type: "accordion", defaultCollapsed: false, radios: "always", spacedAccordionItems: true } }} />
    {pending.method === "CARD" ? <p className="test-payment-help">Cartão de teste: 4242 4242 4242 4242 · validade futura · CVC com 3 dígitos.</p> : <p className="test-payment-help">A Stripe exibirá o QR e o código Pix disponíveis para esta transação de teste.</p>}
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    {waiting ? <p className="payment-waiting" role="status"><span className="spinner" /> Aguardando confirmação do pagamento…</p> : null}
    <PrimaryButton type="submit" disabled={!stripe || submitting || waiting}>{submitting ? "Confirmando…" : waiting ? "Aguardando pagamento" : pending.method === "CARD" ? "Autorizar limite" : "Gerar e pagar Pix"}</PrimaryButton>
  </form>;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    authorizeSession,
    isAuthenticated,
    isOnline,
    profile,
    queue,
    selectedChargerId,
    selectedEstablishmentId,
    theme
  } = useDriverApp();
  const requestedMode = searchParams.get("mode") === "driver" ? "driver" : "guest";
  const mode: DriverMode = requestedMode === "driver" && isAuthenticated ? "driver" : "guest";
  const plant = getPlantById(selectedEstablishmentId) ?? commercialPlants[0];
  const charger = plant?.chargers.find((item) => item.id === selectedChargerId) ?? plant?.chargers[0];
  const [limit, setLimit] = useState<number>(mode === "guest" ? 25 : 40);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(mode === "guest" ? "PIX" : "CARD");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [pending, setPending] = useState<PendingPayment | null>(null);

  const completeAuthorization = useCallback((payment: PendingPayment) => {
    authorizeSession({
      owner: payment.mode,
      paymentSessionId: payment.sessionId,
      financialLimit: payment.limit,
      paymentMethod: payment.method,
      paymentIntentId: payment.paymentIntentId
    });
    sessionStorage.removeItem(PENDING_PAYMENT_KEY);
    navigate("/session", { replace: true });
  }, [authorizeSession, navigate]);

  useEffect(() => {
    const returnedIntentId = searchParams.get("payment_intent");
    const stored = readPendingPayment();
    if (!returnedIntentId || !stored || stored.paymentIntentId !== returnedIntentId) return;
    setPending(stored);
    void getPaymentStatus(returnedIntentId).then((payment) => {
      if (payment.status === "PAID" || payment.status === "AUTHORIZED") completeAuthorization(stored);
    }).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Não foi possível consultar o pagamento."));
  }, [completeAuthorization, searchParams]);

  async function preparePayment(event: FormEvent) {
    event.preventDefault();
    if (!isOnline) return setError("Conecte-se à internet para autorizar o pagamento.");
    if (!accepted) return setError("Confirme a tarifa, o limite e a regra de ociosidade para continuar.");
    if (!stripePromise || !plant || !charger) return setError("O Stripe sandbox ainda não está configurado. Adicione as chaves de teste no ambiente da aplicação.");

    setPreparing(true);
    setError("");
    const sessionId = crypto.randomUUID();
    try {
      const result: PaymentIntentResult = await createPaymentIntent({
        sessionId,
        method: paymentMethod,
        amount: limit,
        email: profile?.email,
        establishmentId: plant.id,
        chargerId: charger.id
      });
      const nextPending: PendingPayment = { sessionId, paymentIntentId: result.paymentIntentId, clientSecret: result.clientSecret, method: paymentMethod, mode, limit };
      sessionStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(nextPending));
      setPending(nextPending);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível iniciar o pagamento.");
    } finally {
      setPreparing(false);
    }
  }

  const elementsOptions = useMemo(() => pending ? {
    clientSecret: pending.clientSecret,
    appearance: {
      theme: theme === "light" ? "stripe" as const : "night" as const,
      variables: { colorPrimary: "#ef3238", borderRadius: "12px", fontFamily: "Inter, system-ui, sans-serif" }
    },
    locale: "pt-BR" as const
  } : null, [pending, theme]);

  if (!plant || !charger) return <section className="empty-state"><AppIcon name="plug" size={36} /><h1>Selecione um carregador</h1><p>Volte ao mapa e escolha um ponto disponível.</p><PrimaryButton onClick={() => navigate(isAuthenticated ? "/explore" : "/scan")}>Escolher carregador</PrimaryButton></section>;

  if (pending && elementsOptions) return <>
    <PageIntro eyebrow={`${plant.name} · ${charger.commercialName}`} title="Confirme o pagamento"><p>Os dados financeiros são processados diretamente pela Stripe.</p></PageIntro>
    <Elements stripe={stripePromise} options={elementsOptions} key={pending.clientSecret}>
      <StripeConfirmationForm
        pending={pending}
        initialWaiting={searchParams.has("payment_return")}
        onAuthorized={() => completeAuthorization(pending)}
      />
    </Elements>
    <button type="button" className="text-link button-link" onClick={() => { sessionStorage.removeItem(PENDING_PAYMENT_KEY); setPending(null); }}>Alterar limite ou meio de pagamento</button>
  </>;

  const tariff = plant.tariffFrom?.amount ?? 0;
  return <>
    <PageIntro eyebrow={mode === "guest" ? "Visitante" : profile?.fullName ?? "Motorista"} title="Defina seu limite"><p>O limite cobre energia e eventual ociosidade. O valor final considera somente o consumo confirmado.</p></PageIntro>
    <form className="checkout-form" onSubmit={preparePayment}>
      <fieldset><legend>Limite financeiro</legend><div className="choice-grid limit-grid">{limits.map((item) => <label key={item} className={limit === item ? "is-selected" : ""}><input type="radio" name="limit" value={item} checked={limit === item} onChange={() => setLimit(item)} /><span>R$</span><strong>{item},00</strong></label>)}</div><p className="field-help">Limite mínimo de R$ 25,00. Você pode encerrar a recarga antes de atingi-lo.</p></fieldset>
      <fieldset><legend>Meio de pagamento</legend><div className="payment-choices">
        <label className={paymentMethod === "CARD" ? "is-selected" : ""}><input type="radio" name="payment" checked={paymentMethod === "CARD"} onChange={() => setPaymentMethod("CARD")} /><span className="choice-icon"><AppIcon name="card" /></span><span><strong>Cartão</strong><small>A Stripe reserva o limite e captura o valor final.</small></span></label>
        <label className={paymentMethod === "PIX" ? "is-selected" : ""}><input type="radio" name="payment" checked={paymentMethod === "PIX"} onChange={() => setPaymentMethod("PIX")} /><span className="choice-icon pix-mark">PIX</span><span><strong>Pix</strong><small>Pagamento antecipado com reembolso do saldo não utilizado.</small></span></label>
      </div></fieldset>
      <section className="checkout-summary"><div><span>Local</span><strong>{plant.name}</strong></div><div><span>Carregador</span><strong>{queue?.chargerName ?? charger.commercialName} · vaga {queue?.parkingSpot ?? charger.parkingSpot}</strong></div><div><span>Tarifa atual</span><strong>{tariff.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/kWh</strong></div><div><span>Ociosidade</span><strong>15 min grátis; depois R$ 0,50/min</strong></div><div className="summary-total"><span>Limite</span><strong>R$ {limit.toFixed(2).replace(".", ",")}</strong></div></section>
      <label className="terms-check"><input type="checkbox" checked={accepted} onChange={(event) => { setAccepted(event.target.checked); setError(""); }} /><span>Li e aceito a tarifa, o limite e a política de ociosidade exibidos.</span></label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <PrimaryButton type="submit" disabled={!isOnline || preparing}>{preparing ? "Conectando à Stripe…" : "Continuar para pagamento"}</PrimaryButton>
    </form>
    <p className="security-note"><AppIcon name="check" size={18} /> Stripe sandbox · nenhuma chave secreta ou dado de cartão passa pelo PWA.</p>
    <InfoNotice>Use somente credenciais e meios de pagamento de teste enquanto o sandbox estiver ativo.</InfoNotice>
  </>;
}
