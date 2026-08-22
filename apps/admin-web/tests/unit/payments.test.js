import { describe, expect, it } from 'vitest';
import { simulatePayment } from '../../src/core/payments.js';

describe('simulatePayment', () => {
  it('retorna pagamento aprovado', () => {
    const result = simulatePayment({ scenario: 'approved', amount: 20 });
    expect(result.status).toBe('Aprovado');
    expect(result.authorized).toBe(true);
  });

  it('retorna pagamento pendente', () => {
    const result = simulatePayment({ scenario: 'pending', amount: 20 });
    expect(result.status).toBe('Pendente');
    expect(result.authorized).toBe(false);
  });

  it('retorna pagamento recusado', () => {
    const result = simulatePayment({ scenario: 'declined', amount: 20 });
    expect(result.status).toBe('Recusado');
    expect(result.authorized).toBe(false);
  });
});
