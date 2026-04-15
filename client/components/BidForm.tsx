import { useState, useEffect, useMemo } from "react";
import { Bid, BidStatus, BidAttachment, BidType, BidItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBidColor } from "@/lib/bid-utils";
import { settingsStorage, bidStorage } from "@/lib/storage";
import { generateUUID } from "@/lib/utils";
import { FileUpload } from "./FileUpload";
import { ItemsManager } from "./ItemsManager";
import { AutocompleteInput } from "./AutocompleteInput";
import { AlertCircle } from "lucide-react";

interface BidFormProps {
  bid?: Bid;
  onSave: (bid: Bid) => void;
  onCancel: () => void;
}

const BRAZILIAN_STATES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

const BID_TYPE_OPTIONS: BidType[] = ["chamamento_publico", "dispensa_eletronica", "pregao_eletronico", "pregao_presencial"];

const BID_TYPE_LABELS: Record<BidType, string> = {
  chamamento_publico: "Chamamento Público",
  dispensa_eletronica: "Dispensa Eletrônica",
  pregao_eletronico: "Pregão Eletrônico",
  pregao_presencial: "Pregão Presencial",
};

const STATUS_OPTIONS: BidStatus[] = ["cadastrado", "codificado", "nao_codificado_flamingo", "questionamento", "suspenso", "won", "lost", "nao_temos"];

function calculateStatusFromItems(items: {
  itemsRegistered: BidItem[];
  itemsWon: BidItem[];
  itemsLost: BidItem[];
}): BidStatus {
  // Se tem itens ganhos, status é "won"
  if (items.itemsWon.length > 0) {
    return "won";
  }

  // Se tem itens e todos estão em perdidos, status é "lost"
  const totalItems = items.itemsRegistered.length + items.itemsWon.length + items.itemsLost.length;
  if (totalItems > 0 && items.itemsWon.length === 0 && items.itemsLost.length === totalItems) {
    return "lost";
  }

  // Padrão é cadastrado
  return "cadastrado";
}

export function BidForm({ bid, onSave, onCancel }: BidFormProps) {
  const [formData, setFormData] = useState<Bid>(() => {
    try {
      if (bid) {
        return bid;
      }

      return {
        id: generateUUID(),
        title: "",
        bidType: "pregao_eletronico",
        bidNumber: "",
        products: "",
        observation: "",
        disputeDate: new Date(),
        disputeTime: "09:00",
        portal: "",
        codigoEffecti: "",
        uasg: "",
        codigoBancoDoBrasil: "",
        status: "cadastrado",
        year: new Date().getFullYear(),
        state: "",
        city: "",
        notes: "",
        items: {
          itemsRegistered: [],
          itemsWon: [],
          itemsLost: [],
        },
        attachments: [],
        processHistory: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Error initializing BidForm:", error);
      return {
        id: generateUUID(),
        title: "",
        bidType: "pregao_eletronico",
        bidNumber: "",
        products: "",
        observation: "",
        disputeDate: new Date(),
        disputeTime: "09:00",
        portal: "",
        codigoEffecti: "",
        uasg: "",
        codigoBancoDoBrasil: "",
        status: "cadastrado",
        year: new Date().getFullYear(),
        state: "",
        city: "",
        notes: "",
        items: {
          itemsRegistered: [],
          itemsWon: [],
          itemsLost: [],
        },
        attachments: [],
        processHistory: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get suggestions from bid history
  const suggestions = useMemo(() => {
    try {
      const allBids = bidStorage.getBids();

      return {
        bidNumbers: Array.from(new Set(allBids.map(b => b.bidNumber).filter(Boolean))).sort(),
        portals: Array.from(new Set(allBids.map(b => b.portal).filter(Boolean))).sort(),
        products: Array.from(new Set(allBids.map(b => b.products).filter(Boolean))).sort(),
        cities: Array.from(new Set(allBids.map(b => b.city).filter(Boolean))).sort(),
        years: Array.from(new Set(allBids.map(b => b.year.toString()).filter(Boolean))).sort().reverse(),
      };
    } catch (error) {
      console.error("Error loading suggestions:", error);
      return {
        bidNumbers: [],
        portals: [],
        products: [],
        cities: [],
        years: [],
      };
    }
  }, []);


  const handleChange = (
    field: keyof Bid,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      updatedAt: new Date(),
    }));
  };


  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validar campos obrigatórios: Número, Portal, Produtos, Anexos
      if (!formData.bidNumber.trim()) {
        setError("O campo 'Número' é obrigatório.");
        setIsLoading(false);
        return;
      }

      if (!formData.portal.trim()) {
        setError("O campo 'Portal' é obrigatório.");
        setIsLoading(false);
        return;
      }

      if (!formData.products.trim()) {
        setError("O campo 'Produtos' é obrigatório.");
        setIsLoading(false);
        return;
      }

      if (formData.attachments.length === 0) {
        setError("É necessário adicionar pelo menos um anexo.");
        setIsLoading(false);
        return;
      }

      // Create folder structure if basePath is configured
      const basePath = settingsStorage.getBasePath();
      if (basePath && basePath.trim()) {
        try {
          const response = await fetch("/api/bids/create-folder", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              basePath,
              bid: {
                id: formData.id,
                year: formData.year,
                state: formData.state,
                city: formData.city,
                bidNumber: formData.bidNumber,
                notes: formData.notes,
                attachments: formData.attachments,
              },
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            const errorMsg = errorData.details || errorData.error;

            setError(
              `Não foi possível criar a pasta da licitação:\n\n${errorMsg}\n\nVerifique se:\n• O caminho está correto\n• Você tem permissão de escrita\n• A unidade de rede está conectada`
            );
            setIsLoading(false);
            return;
          }
        } catch (folderError) {
          const errorMsg = folderError instanceof Error ? folderError.message : String(folderError);
          setError(
            `Erro ao conectar ao servidor para criar pasta:\n\n${errorMsg}`
          );
          setIsLoading(false);
          return;
        }
      }

      // Save the bid after confirming folder was created
      onSave(formData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao salvar licitação"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Licitação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Tipo</label>
              <Select
                value={formData.bidType}
                onValueChange={(value) =>
                  handleChange("bidType", value as BidType)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BID_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {BID_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Número</label>
              <Input
                value={formData.bidNumber}
                onChange={(e) => handleChange("bidNumber", e.target.value)}
                placeholder="ex: 123"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Portal</label>
              <AutocompleteInput
                value={formData.portal}
                onChange={(value) => handleChange("portal", value)}
                placeholder="ex: ComprasNet, BLL, Licitanet"
                suggestions={suggestions.portals}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Produtos</label>
            <AutocompleteInput
              value={formData.products}
              onChange={(value) => handleChange("products", value)}
              placeholder="ex: Alimentos, Equipamentos, Peças"
              suggestions={suggestions.products}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Codigo Effecti</label>
              <Input
                value={formData.codigoEffecti}
                onChange={(e) => handleChange("codigoEffecti", e.target.value)}
                placeholder="ex: 123456"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">UASG</label>
              <Input
                value={formData.uasg}
                onChange={(e) => handleChange("uasg", e.target.value)}
                placeholder="ex: 123456"
                className="mt-1"
              />
            </div>
          </div>

          {formData.portal === "LICITACOES-E" && (
            <div>
              <label className="text-sm font-medium text-gray-700">Codigo Banco do Brasil</label>
              <Input
                value={formData.codigoBancoDoBrasil || ""}
                onChange={(e) => handleChange("codigoBancoDoBrasil", e.target.value)}
                placeholder="ex: 123456"
                className="mt-1"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Data da Disputa
              </label>
              <Input
                type="date"
                value={formData.disputeDate.toISOString().split("T")[0]}
                onChange={(e) =>
                  handleChange("disputeDate", new Date(e.target.value))
                }
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Hora da Disputa
              </label>
              <Input
                type="time"
                value={formData.disputeTime}
                onChange={(e) => handleChange("disputeTime", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status and Location */}
      <Card>
        <CardHeader>
          <CardTitle>Status & Localização</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                handleChange("status", value as BidStatus)
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cadastrado">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getBidColor("cadastrado").bg}`} />
                    Cadastrado
                  </div>
                </SelectItem>
                <SelectItem value="codificado">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getBidColor("codificado").bg}`} />
                    Codificado
                  </div>
                </SelectItem>
                <SelectItem value="nao_codificado_flamingo">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getBidColor("nao_codificado_flamingo").bg}`} />
                    Não codificado
                  </div>
                </SelectItem>
                <SelectItem value="questionamento">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getBidColor("questionamento").bg}`} />
                    Questionamento
                  </div>
                </SelectItem>
                <SelectItem value="suspenso">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getBidColor("suspenso").bg}`} />
                    Suspenso
                  </div>
                </SelectItem>
                <SelectItem value="won">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getBidColor("won").bg}`} />
                    Ganho
                  </div>
                </SelectItem>
                <SelectItem value="lost">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getBidColor("lost").bg}`} />
                    Perdido
                  </div>
                </SelectItem>
                <SelectItem value="nao_temos">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getBidColor("nao_temos").bg}`} />
                    Não temos
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Ano</label>
              <AutocompleteInput
                value={formData.year.toString()}
                onChange={(value) => {
                  const numValue = parseInt(value) || new Date().getFullYear();
                  handleChange("year", numValue);
                }}
                placeholder={new Date().getFullYear().toString()}
                suggestions={suggestions.years}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Estado (UF)</label>
              <Select value={formData.state} onValueChange={(value) =>
                handleChange("state", value)
              }>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione um estado" />
                </SelectTrigger>
                <SelectContent>
                  {BRAZILIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Município</label>
              <AutocompleteInput
                value={formData.city}
                onChange={(value) => handleChange("city", value)}
                placeholder="Nome do município"
                suggestions={suggestions.cities}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Diário do Processo & Anotações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="Documente o processo de licitação aqui: andamento, decisões, problemas, estratégias..."
            className="min-h-24"
          />
        </CardContent>
      </Card>

      {/* Items Management */}
      <ItemsManager
        items={formData.items}
        onItemsChange={(newItems, changeType) => {
          const newStatus = calculateStatusFromItems(newItems);
          setFormData((prev) => ({
            ...prev,
            items: newItems,
            status: newStatus,
            updatedAt: new Date(),
          }));
        }}
      />

      {/* File Attachments */}
      <Card>
        <CardHeader>
          <CardTitle>Anexos</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            attachments={formData.attachments}
            onAdd={(attachment) => {
              setFormData((prev) => ({
                ...prev,
                attachments: [...prev.attachments, attachment],
                updatedAt: new Date(),
              }));
            }}
            onRemove={(id) => {
              setFormData((prev) => ({
                ...prev,
                attachments: prev.attachments.filter((a) => a.id !== id),
                updatedAt: new Date(),
              }));
            }}
          />
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Erro</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          className="bg-primary text-white"
          disabled={isLoading}
        >
          {isLoading ? "Salvando..." : "Salvar Licitação"}
        </Button>
      </div>
    </div>
  );
}
