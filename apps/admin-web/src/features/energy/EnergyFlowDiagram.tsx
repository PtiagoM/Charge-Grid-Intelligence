import type { EnergySnapshot } from "../../domain/admin";
import { number } from "../../components/AdminUi";

export type EnergyGlyphName = "solar" | "grid" | "charger" | "battery" | "pulse" | "limit" | "margin" | "blocked" | "forecast" | "people" | "policy" | "clock" | "shield" | "cloud";

/** Original vector artwork for the energy surface; values remain accessible HTML. */
export function EnergyGlyph({ name }: { name: EnergyGlyphName }) {
  return <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {name === "solar" ? <><path d="M14 31h38l-8 23H6l8-23Z M20 31l-8 23m21-23-8 23m21-23-8 23M10 43h38M23 54v6m-9 0h21" /><path d="M22 23a10 10 0 0 1 20 0M32 4v5M14 11l4 4m28-4-4 4M7 23h6m38 0h6" /></> : null}
    {name === "grid" ? <><path d="m32 4-7 13-9 42 16-9 16 9-9-42-7-13Zm-7 13h14M21 33h22M16 59l27-26M48 59 21 33M23 24l18 18M41 24 23 42M12 21h40M6 35h52M32 4v46" /></> : null}
    {name === "charger" ? <><rect x="9" y="7" width="28" height="51" rx="4" /><rect x="16" y="14" width="14" height="17" rx="2" /><path d="M23 31v8m-7 12h14m7-28h5a5 5 0 0 1 5 5v18a5 5 0 0 0 10 0V22m-4-8v8h8v-8m-4 0V9" /></> : null}
    {name === "battery" ? <><path d="M24 8V3h16v5" /><rect x="15" y="8" width="34" height="52" rx="3" /><path d="M15 19h34m-25 15 16 15m0-15L24 49" /></> : null}
    {name === "pulse" ? <path d="M5 32h12l6-16 9 33 8-28 6 11h13" /> : null}
    {name === "limit" ? <><rect x="17" y="9" width="32" height="48" rx="3" /><path d="M26 9v9h13V9M25 29h16m-16 9h16m-16 9h11" /></> : null}
    {name === "margin" ? <><path d="M31 8a24 24 0 1 0 25 25H31V8Z" /><path d="M38 7v19h19A23 23 0 0 0 38 7Z" /></> : null}
    {name === "blocked" ? <><circle cx="32" cy="32" r="24" /><path d="m15 15 34 34" /></> : null}
    {name === "forecast" ? <><path d="M13 53V38m12 15V28m12 25V18m12 35V8" /><path d="m7 8 50 50" /></> : null}
    {name === "people" ? <><circle cx="32" cy="19" r="9" /><path d="M16 54v-6a16 16 0 0 1 32 0v6H16Z" /><path d="M13 12a8 8 0 0 0 0 16m38-16a8 8 0 0 1 0 16M11 35a12 12 0 0 0-8 12v7h8m42-19a12 12 0 0 1 8 12v7h-8" /></> : null}
    {name === "policy" ? <><path d="m26 5-2 8-7 4-8-2-5 10 6 6v8l-6 6 5 10 8-2 7 4 2 7h12l2-7 7-4 8 2 5-10-6-6v-8l6-6-5-10-8 2-7-4-2-8H26Z" /><circle cx="32" cy="34" r="11" /></> : null}
    {name === "clock" ? <><circle cx="32" cy="35" r="23" /><path d="M32 20v16l10 6M25 5h14m-7 0v7" /></> : null}
    {name === "shield" ? <><path d="m32 6 21 9v18c0 12-10 21-21 27C21 54 11 45 11 33V15l21-9Z" /><path d="m23 32 7 7 13-16" /></> : null}
    {name === "cloud" ? <path d="M18 49a14 14 0 0 1-1-28A18 18 0 0 1 51 25a12 12 0 0 1-1 24H18Z" /> : null}
  </svg>;
}

function power(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? `${number(value)} kW` : "—";
}

export function EnergyFlowDiagram({ snapshot }: { snapshot?: EnergySnapshot }) {
  const active = (value?: number) => typeof value === "number" && Number.isFinite(value) && value > 0;
  return <div className="energy-network" role="group" aria-label="Fluxo energético: solar e rede conectados à planta; carregadores e bateria conectados ao barramento. Potências instantâneas em kW.">
    <svg className="energy-network-wires" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        {[["solar", "#ffd363"], ["grid", "#70c7ff"], ["ev", "#ff626d"]].map(([id, color]) => <marker key={id} id={`energy-arrow-${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="m1 1 7 4-7 4" fill="none" stroke={color} strokeWidth="1.5" /></marker>)}
      </defs>
      <path className={`network-wire wire-solar ${active(snapshot?.solarPowerKw) ? "wire-active" : "wire-idle"}`} d="M265 77H328C371 77 357 145 430 145" markerEnd={active(snapshot?.solarPowerKw) ? "url(#energy-arrow-solar)" : undefined} />
      <path className={`network-wire wire-grid ${active(snapshot?.gridImportKw) || active(snapshot?.gridExportKw) ? "wire-active" : "wire-idle"}`} d="M265 227H328C371 227 357 155 430 155" markerEnd={active(snapshot?.gridImportKw) ? "url(#energy-arrow-grid)" : undefined} markerStart={active(snapshot?.gridExportKw) ? "url(#energy-arrow-grid)" : undefined} />
      <path className={`network-wire wire-ev ${active(snapshot?.evLoadKw) ? "wire-active" : "wire-idle"}`} d="M570 145C647 145 619 77 676 77H735" markerEnd={active(snapshot?.evLoadKw) ? "url(#energy-arrow-ev)" : undefined} />
      <path className="network-wire wire-battery wire-idle" d="M570 155C647 155 619 227 676 227H735" />
    </svg>
    <svg className="energy-network-wires-mobile" viewBox="0 0 400 540" preserveAspectRatio="none" aria-hidden="true">
      <path className={`network-wire wire-solar ${active(snapshot?.solarPowerKw) ? "wire-active" : "wire-idle"}`} d="M100 135V173Q100 193 150 193H180V212" />
      <path className={`network-wire wire-grid ${active(snapshot?.gridImportKw) || active(snapshot?.gridExportKw) ? "wire-active" : "wire-idle"}`} d="M300 135V173Q300 193 250 193H220V212" />
      <path className={`network-wire wire-ev ${active(snapshot?.evLoadKw) ? "wire-active" : "wire-idle"}`} d="M180 329V357Q180 377 150 377H100V410" />
      <path className="network-wire wire-battery wire-idle" d="M220 329V357Q220 377 250 377H300V410" />
      {active(snapshot?.solarPowerKw) ? <path className="mobile-flow-arrow wire-solar" d="m174 203 6 9 6-9" /> : null}
      {active(snapshot?.gridImportKw) ? <path className="mobile-flow-arrow wire-grid" d="m214 203 6 9 6-9" /> : null}
      {active(snapshot?.gridExportKw) ? <path className="mobile-flow-arrow wire-grid" d="m294 144 6-9 6 9" /> : null}
      {active(snapshot?.evLoadKw) ? <path className="mobile-flow-arrow wire-ev" d="m94 401 6 9 6-9" /> : null}
    </svg>
    <article className="energy-network-node network-solar"><EnergyGlyph name="solar" /><div><span>Geração solar</span><strong>{power(snapshot?.solarPowerKw)}</strong><small>potência fotovoltaica</small></div></article>
    <article className="energy-network-node network-grid"><EnergyGlyph name="grid" /><div><span>Rede elétrica</span><strong>{power(snapshot?.gridImportKw)}</strong><small>importação · exportação {power(snapshot?.gridExportKw)}</small></div></article>
    <article className="energy-network-plant"><img src="/assets/sems/energy/plant-aurora.svg" alt="" /><div><span>Carga da planta</span><strong>{power(snapshot?.buildingLoadKw)}</strong><small>consumo base · sem EV</small></div></article>
    <article className="energy-network-node network-ev"><EnergyGlyph name="charger" /><div><span>Carregadores EV</span><strong>{power(snapshot?.evLoadKw)}</strong><small>potência de recarga</small></div></article>
    <article className="energy-network-node network-battery"><EnergyGlyph name="battery" /><div><span>Bateria</span><strong>{snapshot?.batterySocPercent == null ? "Não integrada" : `${number(snapshot.batterySocPercent)}% SOC`}</strong><small>{snapshot?.batterySocPercent == null ? "sem medição de potência ou SOC" : "potência da bateria indisponível"}</small></div></article>
  </div>;
}
