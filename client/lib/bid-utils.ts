import { BidStatus, BidType } from "@/types";

export function getBidColor(status: BidStatus) {
  const colors: Record<
    BidStatus,
    { bg: string; text: string; bgLight: string }
  > = {
    cadastrado: {
      bg: "bg-status-cadastrado",
      text: "text-white",
      bgLight: "bg-status-cadastrado-light text-status-cadastrado",
    },
    codificado: {
      bg: "bg-status-codificado",
      text: "text-white",
      bgLight: "bg-status-codificado-light text-status-codificado",
    },
    nao_codificado_flamingo: {
      bg: "bg-status-nao_codificado_flamingo",
      text: "text-white",
      bgLight: "bg-status-nao_codificado_flamingo-light text-status-nao_codificado_flamingo",
    },
    questionamento: {
      bg: "bg-status-questionamento",
      text: "text-white",
      bgLight: "bg-status-questionamento-light text-status-questionamento",
    },
    suspenso: {
      bg: "bg-status-suspenso",
      text: "text-white",
      bgLight: "bg-status-suspenso-light text-status-suspenso",
    },
    won: {
      bg: "bg-status-won",
      text: "text-white",
      bgLight: "bg-status-won-light text-status-won",
    },
    lost: {
      bg: "bg-status-lost",
      text: "text-white",
      bgLight: "bg-status-lost-light text-status-lost",
    },
    nao_temos: {
      bg: "bg-status-nao_temos",
      text: "text-white",
      bgLight: "bg-status-nao_temos-light text-status-nao_temos",
    },
  };

  return colors[status];
}

export function getStatusLabel(status: BidStatus): string {
  const labels: Record<BidStatus, string> = {
    cadastrado: "Cadastrado",
    codificado: "Codificado",
    nao_codificado_flamingo: "Não codificado flamingo",
    questionamento: "Questionamento",
    suspenso: "Suspenso",
    won: "Ganho",
    lost: "Perdido",
    nao_temos: "Não temos",
  };
  return labels[status];
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR");
}

export function formatDateTime(date: Date, time: string): string {
  return `${formatDate(date)} às ${time}`;
}

export function getBidTypeLabel(bidType: BidType): string {
  const labels: Record<BidType, string> = {
    chamamento_publico: "Chamamento Público",
    dispensa_eletronica: "Dispensa Eletrônica",
    pregao_eletronico: "Pregão Eletrônico",
    pregao_presencial: "Pregão Presencial",
  };
  return labels[bidType];
}

export function getBidTypeAbbreviation(bidType: BidType): string {
  const abbreviations: Record<BidType, string> = {
    chamamento_publico: "CH",
    dispensa_eletronica: "DL",
    pregao_eletronico: "PE",
    pregao_presencial: "PR",
  };
  return abbreviations[bidType];
}

export function formatBidTitle(bidType: BidType, bidNumber: string, products: string, portal: string): string {
  const title = `${getBidTypeLabel(bidType)} Nº ${bidNumber}`;
  if (products) {
    return `${title} - ${products} (${portal})`;
  }
  return `${title} (${portal})`;
}
