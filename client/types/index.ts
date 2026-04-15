export type BidStatus = "cadastrado" | "codificado" | "nao_codificado_flamingo" | "questionamento" | "suspenso" | "won" | "lost" | "nao_temos";
export type BidType = "chamamento_publico" | "dispensa_eletronica" | "pregao_eletronico" | "pregao_presencial";

export interface BidItem {
  id: string;
  number: string;
  code: string;
  description: string;
}

export interface Bid {
  id: string;
  title: string; // TIPO + NÚMERO - PRODUTOS (PORTAL)
  bidType: BidType;
  bidNumber: string;
  products: string; // Produtos/descrição do edital
  observation: string; // Nome do órgão + complementos + número do processo
  disputeDate: Date;
  disputeTime: string; // HH:mm format
  portal: string;
  codigoEffecti: string;
  uasg: string;
  codigoBancoDoBrasil?: string;
  status: BidStatus;
  year: number;
  state: string;
  city: string;
  notes: string; // Detailed journal/notes
  items: {
    itemsRegistered: BidItem[];
    itemsWon: BidItem[];
    itemsLost: BidItem[];
  };
  attachments: BidAttachment[];
  processHistory: ProcessHistoryEntry[];
  effectiveDate?: string; // Additional date field
  createdAt: Date;
  updatedAt: Date;
}

export interface BidAttachment {
  id: string;
  name: string;
  type: "proposta-inicial" | "proposta-final" | "empenhos" | "atas" | "edital" | "termo" | "resultado" | "outro";
  url: string;
  uploadedAt: Date;
}

export interface ProcessHistoryEntry {
  date: Date;
  title: string;
  description: string;
}

export interface AppSettings {
  rootPath: string; // Server path (where the app is running)
  clientBasePath: string; // Client path (where user accesses from)
  autoSaveEnabled: boolean;
}
