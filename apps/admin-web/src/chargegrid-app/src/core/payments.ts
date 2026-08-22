// @ts-nocheck
const statuses = {
  approved: { status: 'Aprovado', authorized: true },
  pending: { status: 'Pendente', authorized: false },
  declined: { status: 'Recusado', authorized: false }
};

export function simulatePayment({ scenario, amount }) {
  const result = statuses[scenario] ?? statuses.pending;
  return { ...result, scenario, amount };
}

