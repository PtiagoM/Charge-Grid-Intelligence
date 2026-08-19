import { EstablishmentCard } from "../components/EstablishmentCard";
import { StatusChip } from "../components/StatusChip";
import { getInitialDriverDemo } from "../services/demo";

export function ExplorePage() {
  const demo = getInitialDriverDemo();

  return (
    <>
      <section className="mobile-intro">
        <p className="eyebrow">Explorar</p>
        <h1>Onde faz sentido carregar agora?</h1>
        <p>A mesma fotografia D0 usada pelo Admin, projetada para a experiência do motorista.</p>
      </section>

      <div className="search-shell" role="search">
        <span aria-hidden="true">⌕</span>
        <span>Buscar estabelecimento</span>
      </div>

      <section className="availability-summary" aria-label="Disponibilidade atual">
        <div><StatusChip label="Energia favorável" tone="success" /><strong>Solar ativo até 17:59</strong></div>
        <p>Preço informado antes da sessão; fila não altera tarifa.</p>
      </section>

      <EstablishmentCard establishment={demo.establishment} nominalPowerKw={demo.chargers[0]?.nominalPowerKw ?? 7} />
    </>
  );
}
