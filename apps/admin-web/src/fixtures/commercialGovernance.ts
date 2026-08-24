export type CommercialContractStatus = "AUTHORIZED" | "TECHNICAL_PENDING" | "PUBLISHED" | "CLOSED";

export interface CommercialPlantContract {
  id: string;
  contractCode: string;
  activationCode: string;
  establishmentId: string;
  goodwePlantId: string;
  contractingParty: string;
  goodweConsultant: string;
  portfolio: string;
  status: CommercialContractStatus;
  signedAt: string;
  validUntil: string;
}

export const COMMERCIAL_PLANT_CONTRACTS: readonly CommercialPlantContract[] = [
  {
    id: "contract-fiap-aclimacao",
    contractCode: "CG-CTR-2026-001",
    activationCode: "CG-ACT-FIAP-ACL",
    establishmentId: "est-fiap",
    goodwePlantId: "gw-plant-fiap-aclimacao",
    contractingParty: "FIAP Eco Smart Group S.A.",
    goodweConsultant: "Consultora GoodWe SP",
    portfolio: "São Paulo · Educação",
    status: "PUBLISHED",
    signedAt: "2026-01-12",
    validUntil: "2027-01-11"
  },
  {
    id: "contract-fiap-vila-mariana",
    contractCode: "CG-CTR-2026-006",
    activationCode: "CG-ACT-FIAP-VM",
    establishmentId: "est-fiap",
    goodwePlantId: "gw-plant-fiap-vila-mariana",
    contractingParty: "FIAP Eco Smart Group S.A.",
    goodweConsultant: "Consultora GoodWe SP",
    portfolio: "São Paulo · Educação",
    status: "AUTHORIZED",
    signedAt: "2026-08-20",
    validUntil: "2027-08-19"
  },
  {
    id: "contract-mercadox-pinheiros",
    contractCode: "CG-CTR-2026-002",
    activationCode: "CG-ACT-MX-PIN",
    establishmentId: "est-mercadox",
    goodwePlantId: "gw-plant-mercadox-pinheiros",
    contractingParty: "MercadoX Mobilidade Ltda.",
    goodweConsultant: "Consultora GoodWe SP",
    portfolio: "São Paulo · Varejo",
    status: "PUBLISHED",
    signedAt: "2026-02-03",
    validUntil: "2027-02-02"
  },
  {
    id: "contract-goodwe-california",
    contractCode: "CG-GLOBAL-CA",
    activationCode: "CG-ACT-GW-CA",
    establishmentId: "est-goodwe-california",
    goodwePlantId: "gw-plant-california",
    contractingParty: "GoodWe Americas",
    goodweConsultant: "GoodWe Global Mobility",
    portfolio: "Americas · Estratégico",
    status: "PUBLISHED",
    signedAt: "2026-02-15",
    validUntil: "2027-02-14"
  },
  {
    id: "contract-goodwe-europe",
    contractCode: "CG-GLOBAL-EU",
    activationCode: "CG-ACT-GW-EU",
    establishmentId: "est-goodwe-europe",
    goodwePlantId: "gw-plant-berlin",
    contractingParty: "GoodWe Europe",
    goodweConsultant: "GoodWe Global Mobility",
    portfolio: "Europa · Estratégico",
    status: "PUBLISHED",
    signedAt: "2026-04-01",
    validUntil: "2027-03-31"
  },
  {
    id: "contract-goodwe-shanghai",
    contractCode: "CG-GLOBAL-SH",
    activationCode: "CG-ACT-GW-SH",
    establishmentId: "est-goodwe-shanghai",
    goodwePlantId: "gw-plant-shanghai",
    contractingParty: "GoodWe Technologies Co., Ltd.",
    goodweConsultant: "GoodWe Global Mobility",
    portfolio: "China · Estratégico",
    status: "PUBLISHED",
    signedAt: "2026-05-02",
    validUntil: "2027-05-01"
  }
];

export function contractByActivationCode(value: string) {
  const normalized = value.trim().toUpperCase();
  return COMMERCIAL_PLANT_CONTRACTS.find((item) => item.activationCode === normalized);
}
