import { useState } from "react";
import { BidItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { cn, generateUUID } from "@/lib/utils";

interface ItemsManagerProps {
  items: {
    itemsRegistered: BidItem[];
    itemsWon: BidItem[];
    itemsLost: BidItem[];
  };
  onItemsChange: (items: {
    itemsRegistered: BidItem[];
    itemsWon: BidItem[];
    itemsLost: BidItem[];
  }, changeType?: 'add' | 'move') => void;
}

export function ItemsManager({ items, onItemsChange }: ItemsManagerProps) {
  const [newNumber, setNewNumber] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [draggedItem, setDraggedItem] = useState<{ category: string; id: string } | null>(null);

  const handleAddItem = () => {
    if (newNumber.trim() && newCode.trim()) {
      const newItem: BidItem = {
        id: generateUUID(),
        number: newNumber,
        code: newCode,
        description: newDescription || `${newNumber} - ${newCode}`,
      };

      const updatedItems = {
        ...items,
        itemsRegistered: [...items.itemsRegistered, newItem],
      };

      onItemsChange(updatedItems, 'add');

      setNewNumber("");
      setNewCode("");
      setNewDescription("");
    }
  };

  const handleRemoveItem = (category: "itemsRegistered" | "itemsWon" | "itemsLost", id: string) => {
    onItemsChange({
      ...items,
      [category]: items[category].filter((item) => item.id !== id),
    });
  };

  const handleDragStart = (e: React.DragEvent, category: string, id: string) => {
    setDraggedItem({ category, id });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetCategory: "itemsRegistered" | "itemsWon" | "itemsLost") => {
    e.preventDefault();
    if (!draggedItem) return;

    const sourceCategory = draggedItem.category as "itemsRegistered" | "itemsWon" | "itemsLost";
    const itemId = draggedItem.id;

    // Find the item in the source category
    const item = items[sourceCategory].find((i) => i.id === itemId);
    if (!item) return;

    // Remove from source and add to target
    const updatedItems = {
      ...items,
      [sourceCategory]: items[sourceCategory].filter((i) => i.id !== itemId),
      [targetCategory]: [...items[targetCategory], item],
    };

    onItemsChange(updatedItems, 'move');
    setDraggedItem(null);
  };

  const renderItem = (
    item: BidItem,
    category: "itemsRegistered" | "itemsWon" | "itemsLost",
    bgColor: string
  ) => (
    <div
      key={item.id}
      draggable
      onDragStart={(e) => handleDragStart(e, category, item.id)}
      className={cn(
        "flex items-center justify-between p-3 rounded border cursor-move transition-opacity hover:opacity-75 active:opacity-50",
        bgColor
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{item.number} - {item.code}</p>
      </div>
      <button
        onClick={() => handleRemoveItem(category, item.id)}
        className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestão de Itens</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Item */}
        <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              placeholder="Número do item *"
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleAddItem();
              }}
            />
            <Input
              placeholder="Código *"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleAddItem();
              }}
            />
            <Button onClick={handleAddItem} size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
          <p className="text-xs text-gray-500">* Campos obrigatórios. A descrição é opcional.</p>
        </div>

        {/* Registered Items */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-3">
            📋 Itens Cadastrados (Deslizar para Ganhamos/Perdemos)
          </label>
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, "itemsRegistered")}
            className="space-y-2 p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 min-h-24"
          >
            {items.itemsRegistered.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Nenhum item cadastrado</p>
            ) : (
              items.itemsRegistered.map((item) =>
                renderItem(item, "itemsRegistered", "bg-white border-gray-200")
              )
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Won Items */}
          <div>
            <label className="text-sm font-medium text-status-won block mb-3">
              ✅ O Que Ganhamos
            </label>
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "itemsWon")}
              className="space-y-2 p-3 bg-status-won-light rounded-lg border-2 border-dashed border-status-won min-h-24"
            >
              {items.itemsWon.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Deslizar itens aqui</p>
              ) : (
                items.itemsWon.map((item) =>
                  renderItem(item, "itemsWon", "bg-white border-status-won")
                )
              )}
            </div>
          </div>

          {/* Lost Items */}
          <div>
            <label className="text-sm font-medium text-status-lost block mb-3">
              ❌ O Que Perdemos
            </label>
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "itemsLost")}
              className="space-y-2 p-3 bg-status-lost-light rounded-lg border-2 border-dashed border-status-lost min-h-24"
            >
              {items.itemsLost.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Deslizar itens aqui</p>
              ) : (
                items.itemsLost.map((item) =>
                  renderItem(item, "itemsLost", "bg-white border-status-lost")
                )
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
