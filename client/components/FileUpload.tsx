import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BidAttachment } from "@/types";
import { Upload, X, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { generateUUID } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FileUploadProps {
  attachments: BidAttachment[];
  onAdd: (attachment: BidAttachment) => void;
  onRemove: (id: string) => void;
}

const ATTACHMENT_TYPES = [
  { id: "proposta-inicial", label: "Proposta Inicial" },
  { id: "proposta-final", label: "Proposta Final" },
  { id: "empenhos", label: "Empenhos" },
  { id: "atas", label: "Atas" },
  { id: "edital", label: "Edital" },
  { id: "termo", label: "Termo de Referência" },
  { id: "resultado", label: "Resultado" },
  { id: "outro", label: "Outros" },
] as const;

export function FileUpload({
  attachments,
  onAdd,
  onRemove,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedType, setSelectedType] = useState<BidAttachment["type"]>("outro");

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const attachment: BidAttachment = {
          id: generateUUID(),
          name: file.name,
          type: selectedType,
          url: content, // Em um app real, isso seria enviado para um servidor
          uploadedAt: new Date(),
        };
        onAdd(attachment);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      {/* Type Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Tipo de Anexo
        </label>
        <Select value={selectedType} onValueChange={(value) => setSelectedType(value as BidAttachment["type"])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ATTACHMENT_TYPES.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          id="file-input"
        />
        <label htmlFor="file-input" className="flex flex-col items-center gap-2 cursor-pointer">
          <Upload className="h-8 w-8 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">
            Arraste arquivos aqui ou clique para selecionar
          </p>
          <p className="text-xs text-gray-500">
            PDF, DOC, DOCX, XLS, XLSX e imagens são suportados
          </p>
        </label>
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">
            Arquivos Enviados ({attachments.length})
          </h3>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 flex-1">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {ATTACHMENT_TYPES.find((t) => t.id === attachment.type)?.label || attachment.type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(attachment.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
