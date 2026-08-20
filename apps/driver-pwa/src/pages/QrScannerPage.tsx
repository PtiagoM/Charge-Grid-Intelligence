import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AppIcon } from "../components/AppIcon";
import { PageIntro, PrimaryButton, SecondaryButton } from "../components/Ui";
import { commercialPlants } from "../data/commercialPlants";

function chargerSlugFromValue(value: string) {
  const normalized = value.trim();
  const routeMatch = normalized.match(/\/qr\/([^/?#]+)/i);
  const candidate = routeMatch?.[1] ?? normalized.split(/[/:]/).filter(Boolean).at(-1);
  if (!candidate) return null;
  const decoded = decodeURIComponent(candidate);
  return commercialPlants.some((plant) => plant.qrSlug === decoded) ? decoded : null;
}

export function QrScannerPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop(): void } | null>(null);
  const [status, setStatus] = useState<"idle" | "starting" | "scanning" | "error">("idle");
  const [message, setMessage] = useState("");
  const [manualCode, setManualCode] = useState("");

  useEffect(() => () => controlsRef.current?.stop(), []);

  function openResult(value: string) {
    const slug = chargerSlugFromValue(value);
    if (!slug) {
      setStatus("error");
      setMessage("Este QR Code não pertence a um carregador ChargeGrid ativo.");
      return;
    }
    controlsRef.current?.stop();
    navigate(`/qr/${slug}`);
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia || !videoRef.current) {
      setStatus("error");
      setMessage("A câmera não está disponível neste navegador. Envie uma imagem ou digite o código.");
      return;
    }
    setStatus("starting");
    setMessage("");
    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const reader = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 250 });
      controlsRef.current = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } }, audio: false },
        videoRef.current,
        (result) => { if (result) openResult(result.getText()); }
      );
      setStatus("scanning");
    } catch {
      setStatus("error");
      setMessage("Não foi possível abrir a câmera. Verifique a permissão do navegador.");
    }
  }

  async function scanImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setMessage("");
    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const result = await new BrowserQRCodeReader().decodeFromImageUrl(objectUrl);
      openResult(result.getText());
    } catch {
      setStatus("error");
      setMessage("Não encontramos um QR Code ChargeGrid nessa imagem.");
    } finally {
      URL.revokeObjectURL(objectUrl);
      event.target.value = "";
    }
  }

  function submitManual(event: FormEvent) {
    event.preventDefault();
    openResult(manualCode);
  }

  return <>
    <PageIntro eyebrow="Acesso rápido" title="Escaneie o carregador">
      <p>Aponte a câmera para o QR Code instalado na vaga. A identificação abre as condições exatas antes do pagamento.</p>
    </PageIntro>
    <section className={`qr-scanner ${status === "scanning" ? "is-scanning" : ""}`}>
      <video ref={videoRef} muted playsInline aria-label="Visualização da câmera para leitura do QR Code" />
      <div className="scanner-frame"><span /><span /><span /><span /></div>
      {status !== "scanning" ? <div className="scanner-placeholder"><AppIcon name="qr" size={54} /><strong>{status === "starting" ? "Abrindo câmera…" : "Câmera pronta para começar"}</strong></div> : null}
    </section>
    {message ? <p className="form-error" role="alert">{message}</p> : null}
    {status !== "scanning" ? <PrimaryButton onClick={startCamera} disabled={status === "starting"}><AppIcon name="camera" size={21} /> {status === "starting" ? "Abrindo…" : "Abrir câmera"}</PrimaryButton> : <SecondaryButton onClick={() => { controlsRef.current?.stop(); setStatus("idle"); }}>Fechar câmera</SecondaryButton>}
    <label className="secondary-link upload-qr">Ler QR de uma imagem<input className="sr-only" type="file" accept="image/*" capture="environment" onChange={scanImage} /></label>
    <div className="divider"><span>ou</span></div>
    <form className="manual-code-form" onSubmit={submitManual}>
      <label htmlFor="manual-code">Código do carregador</label>
      <div><input id="manual-code" placeholder="Ex.: aurora-04" value={manualCode} onChange={(event) => setManualCode(event.target.value)} /><button type="submit" aria-label="Confirmar código"><AppIcon name="chevron-right" /></button></div>
    </form>
  </>;
}
