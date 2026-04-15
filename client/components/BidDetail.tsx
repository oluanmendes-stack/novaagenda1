import { useState } from "react";
import { Bid, BidAttachment } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit2, Trash2, FolderOpen, X } from "lucide-react";
import { getBidColor, getStatusLabel, formatDateTime, formatBidTitle } from "@/lib/bid-utils";
import { BidForm } from "./BidForm";
import { settingsStorage } from "@/lib/storage";

interface BidDetailProps {
  bid: Bid;
  onEdit: (bid: Bid) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const ATTACHMENT_SECTION_ORDER = [
  { type: "proposta-inicial" as const, label: "Proposta Inicial" },
  { type: "proposta-final" as const, label: "Proposta Final" },
  { type: "empenhos" as const, label: "Empenhos" },
  { type: "atas" as const, label: "Atas" },
  { type: "edital" as const, label: "Edital" },
  { type: "termo" as const, label: "Termo de Referência" },
  { type: "resultado" as const, label: "Resultado" },
  { type: "outro" as const, label: "Outros" },
];

function getAttachmentSections(attachments: BidAttachment[]) {
  const sections = ATTACHMENT_SECTION_ORDER.map((section) => ({
    type: section.type,
    label: section.label,
    attachments: attachments.filter((att) => att.type === section.type),
  })).filter((section) => section.attachments.length > 0);

  return sections;
}

// Map attachment types to folder names (must match server-side mapping)
const ATTACHMENT_FOLDERS: Record<string, string> = {
  "proposta-inicial": "Proposta Inicial",
  "proposta-final": "Proposta Final",
  "empenhos": "Empenhos",
  "atas": "Atas",
  "edital": "Edital",
  "termo": "Termo de Referência",
  "resultado": "Resultado",
  "outro": "Outros",
};

function buildAttachmentPath(bid: Bid, attachment: BidAttachment): string {
  const settings = settingsStorage.getSettings();
  // Use clientBasePath to open files on user's computer
  let basePath = settings.clientBasePath || settings.rootPath;

  if (!basePath) {
    return "";
  }

  // Detect separator used in basePath and use the same
  const separator = basePath.includes("\\") ? "\\" : "/";
  const folderName = ATTACHMENT_FOLDERS[attachment.type] || ATTACHMENT_FOLDERS["outro"];
  const filePath = [basePath, bid.year.toString(), bid.state.toUpperCase(), bid.city, bid.bidNumber, "Anexos", folderName, attachment.name].join(separator);

  return filePath;
}

function buildBidFolderPath(bid: Bid): string {
  const settings = settingsStorage.getSettings();
  // Use clientBasePath to open folders on user's computer
  let basePath = settings.clientBasePath || settings.rootPath;

  if (!basePath) {
    return "";
  }

  // Detect separator used in basePath and use the same
  const separator = basePath.includes("\\") ? "\\" : "/";
  const folderPath = [basePath, bid.year.toString(), bid.state.toUpperCase(), bid.city, bid.bidNumber].join(separator);

  return folderPath;
}

export function BidDetail({ bid, onEdit, onDelete, onClose }: BidDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isOpeningFile, setIsOpeningFile] = useState(false);

  const handleOpenFile = async (attachment: BidAttachment) => {
    try {
      setIsOpeningFile(true);
      const filePath = buildAttachmentPath(bid, attachment);

      if (!filePath) {
        alert("Caminho do cliente não configurado. Configure em Configurações > Caminho Raiz do Seu Computador (Cliente)");
        setIsOpeningFile(false);
        return;
      }

      // Try local server first (http://localhost:8080)
      try {
        const response = await fetch("http://localhost:8080/abrir-pasta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filePath }),
        });

        if (response.ok) {
          // Success, file opened on local machine
          return;
        }
      } catch (localError) {
        // Local server not available, fall back to copying path
        console.log("Local server not available, copying path instead");
      }

      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(filePath);
      alert(`Caminho copiado para área de transferência:\n\n${filePath}\n\nAbra o Explorador do Windows (Win + E) e cole o caminho na barra de endereço.\n\n📌 Dica: Execute 'python local-server.py' para abrir automaticamente.`);
    } catch (error) {
      console.error("Error opening file:", error);
      alert("Erro ao abrir arquivo");
    } finally {
      setIsOpeningFile(false);
    }
  };

  const handleOpenBidFolder = async () => {
    try {
      setIsOpeningFile(true);
      const folderPath = buildBidFolderPath(bid);

      if (!folderPath) {
        alert("Caminho do cliente não configurado. Configure em Configurações > Caminho Raiz do Seu Computador (Cliente)");
        setIsOpeningFile(false);
        return;
      }

      // Try local server first (http://localhost:8080)
      try {
        const response = await fetch("http://localhost:8080/abrir-pasta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filePath: folderPath }),
        });

        if (response.ok) {
          // Success, folder opened on local machine
          return;
        }
      } catch (localError) {
        // Local server not available, fall back to copying path
        console.log("Local server not available, copying path instead");
      }

      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(folderPath);
      alert(`Caminho copiado para área de transferência:\n\n${folderPath}\n\nAbra o Explorador do Windows (Win + E) e cole o caminho na barra de endereço.\n\n📌 Dica: Execute 'python local-server.py' para abrir automaticamente.`);
    } catch (error) {
      console.error("Error opening folder:", error);
      alert("Erro ao abrir pasta do processo");
    } finally {
      setIsOpeningFile(false);
    }
  };

  if (isEditing) {
    return (
      <div className="max-h-screen overflow-y-auto p-6 bg-white">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(false)}
          className="mb-4"
        >
          Voltar aos Detalhes
        </Button>
        <BidForm
          bid={bid}
          onSave={(updatedBid) => {
            onEdit(updatedBid);
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <>
      <div className="max-h-screen overflow-y-auto">
        {/* Header */}
        <div
          className={`${getBidColor(bid.status).bg} ${
            getBidColor(bid.status).text
          } p-6 border-b`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{formatBidTitle(bid.bidType, bid.bidNumber, bid.products, bid.portal)}</h1>
              <p className="opacity-90 text-sm">{bid.observation}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleOpenBidFolder}
                disabled={isOpeningFile}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Pasta
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={onClose}
                className="text-white hover:bg-black/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Key Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      getBidColor(bid.status).bg
                    }`}
                  />
                  <span className="font-semibold">
                    {getStatusLabel(bid.status)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Data & Hora da Disputa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">
                  {formatDateTime(bid.disputeDate, bid.disputeTime)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Portal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{bid.portal}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Codigo Effecti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{bid.codigoEffecti || "-"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  UASG
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{bid.uasg || "-"}</p>
              </CardContent>
            </Card>

            {bid.portal === "LICITACOES-E" && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Codigo Banco do Brasil
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{bid.codigoBancoDoBrasil || "-"}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Location Info */}
          <Card>
            <CardHeader>
              <CardTitle>Localização & Ano</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Ano</p>
                  <p className="font-semibold">{bid.year}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Estado</p>
                  <p className="font-semibold">{bid.state}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Município</p>
                  <p className="font-semibold">{bid.city}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for detailed content */}
          <Tabs defaultValue="notes">
            <TabsList>
              <TabsTrigger value="notes">Diário do Processo</TabsTrigger>
              <TabsTrigger value="items">Itens</TabsTrigger>
              <TabsTrigger value="attachments">Anexos</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            {/* Process Journal */}
            <TabsContent value="notes">
              <Card>
                <CardContent className="pt-6">
                  {bid.notes ? (
                    <p className="whitespace-pre-wrap text-sm">{bid.notes}</p>
                  ) : (
                    <p className="text-gray-500 text-sm italic">
                      Nenhuma anotação adicionada ainda
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Items */}
            <TabsContent value="items">
              <div className="space-y-4">
                {bid.items.itemsRegistered.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Itens Cadastrados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {bid.items.itemsRegistered.map((item) => (
                          <li
                            key={item.id}
                            className="text-sm p-2 bg-gray-50 rounded text-gray-700"
                          >
                            {item.number} - {item.code}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {bid.items.itemsWon.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base text-status-won">
                        O Que Ganhamos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {bid.items.itemsWon.map((item) => (
                          <li
                            key={item.id}
                            className="text-sm p-2 bg-status-won-light rounded text-gray-700"
                          >
                            {item.number} - {item.code}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {bid.items.itemsLost.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base text-status-lost">
                        O Que Perdemos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {bid.items.itemsLost.map((item) => (
                          <li
                            key={item.id}
                            className="text-sm p-2 bg-status-lost-light rounded text-gray-700"
                          >
                            {item.number} - {item.code}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {!bid.items.itemsRegistered.length &&
                  !bid.items.itemsWon.length &&
                  !bid.items.itemsLost.length && (
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-gray-500 text-sm italic">
                          Nenhum item adicionado ainda
                        </p>
                      </CardContent>
                    </Card>
                  )}
              </div>
            </TabsContent>

            {/* Attachments */}
            <TabsContent value="attachments">
              {bid.attachments.length > 0 ? (
                <div className="space-y-4">
                  {getAttachmentSections(bid.attachments).map((section) => (
                    <Card key={section.type}>
                      <CardHeader>
                        <CardTitle className="text-base">{section.label}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {section.attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                            >
                              <div>
                                <p className="font-medium text-sm">
                                  {attachment.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Enviado em{" "}
                                  {attachment.uploadedAt.toLocaleDateString("pt-BR")}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenFile(attachment)}
                                disabled={isOpeningFile}
                              >
                                <FolderOpen className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-gray-500 text-sm italic">
                      Nenhum anexo adicionado ainda
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* History */}
            <TabsContent value="history">
              <Card>
                <CardContent className="pt-6">
                  {bid.processHistory.length > 0 ? (
                    <div className="space-y-3">
                      {bid.processHistory.map((entry, idx) => (
                        <div key={idx} className="border-l-2 border-primary pl-4 py-2">
                          <p className="font-medium text-sm">{entry.title}</p>
                          <p className="text-xs text-gray-500 mb-1">
                            {entry.date.toLocaleDateString("pt-BR")}
                          </p>
                          <p className="text-sm">{entry.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic">
                      Nenhum registro de histórico ainda
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Additional Info */}
          <Card className="text-xs text-gray-500">
            <CardContent className="pt-6">
              <p>Criado em: {bid.createdAt.toLocaleDateString("pt-BR")}</p>
              <p>Última atualização: {bid.updatedAt.toLocaleDateString("pt-BR")}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Deletar Licitação</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza de que deseja deletar esta licitação? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(bid.id);
                onClose();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Deletar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
