import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bid, BidStatus } from "@/types";
import { bidStorage } from "@/lib/storage";
import { Calendar } from "@/components/Calendar";
import { SearchResults } from "@/components/SearchResults";
import { BidDetail } from "@/components/BidDetail";
import { BidForm } from "@/components/BidForm";
import { Plus, Settings, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { getStatusLabel } from "@/lib/bid-utils";

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

const STATUS_OPTIONS: BidStatus[] = ["cadastrado", "codificado", "nao_codificado_flamingo", "questionamento", "suspenso", "won", "lost", "nao_temos"];

export default function BidsCalendar() {
  const navigate = useNavigate();
  const [bids, setBids] = useState<Bid[]>([]);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState<string>("");
  const [filterCity, setFilterCity] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterDateStart, setFilterDateStart] = useState<string>("");
  const [filterDateEnd, setFilterDateEnd] = useState<string>("");
  const [filterItem, setFilterItem] = useState<string>("");

  useEffect(() => {
    loadBids();
  }, []);

  const loadBids = () => {
    const loadedBids = bidStorage.getBids();
    setBids(loadedBids);
  };

  const handleSaveBid = (bid: Bid) => {
    bidStorage.saveBid(bid);
    loadBids();
    setIsCreating(false);
    setSelectedBid(null);
  };

  const handleEditBid = (bid: Bid) => {
    bidStorage.saveBid(bid);
    loadBids();
    setSelectedBid(bid);
  };

  const handleDeleteBid = (id: string) => {
    bidStorage.deleteBid(id);
    loadBids();
    setSelectedBid(null);
  };

  const getFilteredBids = () => {
    return bids.filter((bid) => {
      const searchLower = searchQuery.toLowerCase();

      const matchesSearch =
        searchQuery === "" ||
        `${bid.bidNumber}`.toLowerCase().includes(searchLower) ||
        bid.bidType.toLowerCase().includes(searchLower) ||
        bid.portal.toLowerCase().includes(searchLower) ||
        bid.city.toLowerCase().includes(searchLower) ||
        bid.notes.toLowerCase().includes(searchLower) ||
        bid.disputeDate.toLocaleDateString("pt-BR").includes(searchLower) ||
        // Buscar nos itens cadastrados
        bid.items.itemsRegistered.some((item) =>
          item.description.toLowerCase().includes(searchLower) ||
          item.code.toLowerCase().includes(searchLower) ||
          item.number.toLowerCase().includes(searchLower)
        ) ||
        // Buscar nos itens ganhos
        bid.items.itemsWon.some((item) =>
          item.description.toLowerCase().includes(searchLower) ||
          item.code.toLowerCase().includes(searchLower) ||
          item.number.toLowerCase().includes(searchLower)
        ) ||
        // Buscar nos itens perdidos
        bid.items.itemsLost.some((item) =>
          item.description.toLowerCase().includes(searchLower) ||
          item.code.toLowerCase().includes(searchLower) ||
          item.number.toLowerCase().includes(searchLower)
        );

      const matchesState = filterState === "all" || filterState === "" || bid.state === filterState;
      const matchesCity =
        filterCity === "all" || filterCity === "" ||
        bid.city.toLowerCase().includes(filterCity.toLowerCase());
      const matchesYear =
        filterYear === "all" || filterYear === "" || bid.year.toString() === filterYear;

      // Status filter
      const matchesStatus =
        filterStatus === "all" || filterStatus === "" || bid.status === filterStatus;

      // Date range filter
      let matchesDateRange = true;
      if (filterDateStart || filterDateEnd) {
        const bidDate = bid.disputeDate;
        if (filterDateStart) {
          const startDate = new Date(filterDateStart);
          matchesDateRange = matchesDateRange && bidDate >= startDate;
        }
        if (filterDateEnd) {
          const endDate = new Date(filterDateEnd);
          endDate.setHours(23, 59, 59, 999);
          matchesDateRange = matchesDateRange && bidDate <= endDate;
        }
      }

      // Item filter
      const itemLower = filterItem.toLowerCase();
      const matchesItem =
        filterItem === "" ||
        bid.items.itemsRegistered.some((item) =>
          item.description.toLowerCase().includes(itemLower) ||
          item.code.toLowerCase().includes(itemLower) ||
          item.number.toLowerCase().includes(itemLower)
        ) ||
        bid.items.itemsWon.some((item) =>
          item.description.toLowerCase().includes(itemLower) ||
          item.code.toLowerCase().includes(itemLower) ||
          item.number.toLowerCase().includes(itemLower)
        ) ||
        bid.items.itemsLost.some((item) =>
          item.description.toLowerCase().includes(itemLower) ||
          item.code.toLowerCase().includes(itemLower) ||
          item.number.toLowerCase().includes(itemLower)
        );

      return matchesSearch && matchesState && matchesCity && matchesYear && matchesStatus && matchesDateRange && matchesItem;
    });
  };

  const getStatusBreakdownForCurrentMonth = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const bidsInCurrentMonth = bids.filter((bid) => {
      const bidDate = bid.disputeDate;
      return bidDate.getMonth() === currentMonth && bidDate.getFullYear() === currentYear;
    });

    return {
      won: bidsInCurrentMonth.filter((b) => b.status === "won").length,
      lost: bidsInCurrentMonth.filter((b) => b.status === "lost").length,
      suspenso: bidsInCurrentMonth.filter((b) => b.status === "suspenso").length,
      nao_codificado_flamingo: bidsInCurrentMonth.filter((b) => b.status === "nao_codificado_flamingo").length,
      total: bidsInCurrentMonth.length,
    };
  };

  const statusBreakdown = getStatusBreakdownForCurrentMonth();
  const filteredBids = getFilteredBids();
  const uniqueCities = Array.from(new Set(bids.map((b) => b.city)))
    .filter(Boolean)
    .sort();
  const uniqueYears = Array.from(new Set(bids.map((b) => b.year))).sort(
    (a, b) => b - a
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
          {/* Action Buttons */}
        <div className="p-4 border-b border-gray-200 space-y-2">
          <Button
            onClick={() => setIsCreating(true)}
            className="w-full bg-primary text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Licitação
          </Button>
          <Button
            onClick={() => navigate("/settings")}
            variant="outline"
            className="w-full"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar licitações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 space-y-3 overflow-y-auto flex-1">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Estado (UF)
            </label>
            <Select value={filterState} onValueChange={setFilterState}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Todos os estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                {BRAZILIAN_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Município
            </label>
            <Select value={filterCity} onValueChange={setFilterCity}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Todos os municípios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os municípios</SelectItem>
                {uniqueCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Ano
            </label>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Todos os anos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os anos</SelectItem>
                {uniqueYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Status
            </label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {getStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Data de Disputa
            </label>
            <div className="space-y-2">
              <Input
                type="date"
                value={filterDateStart}
                onChange={(e) => setFilterDateStart(e.target.value)}
                placeholder="Data inicial"
                className="h-8 text-sm"
              />
              <Input
                type="date"
                value={filterDateEnd}
                onChange={(e) => setFilterDateEnd(e.target.value)}
                placeholder="Data final"
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Filtrar por Item
            </label>
            <div className="relative">
              <Input
                placeholder="Número, código ou descrição"
                value={filterItem}
                onChange={(e) => setFilterItem(e.target.value)}
                className="h-8 text-sm"
              />
              {filterItem && (
                <button
                  onClick={() => setFilterItem("")}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Breakdown - Current Month */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
          <div className="text-xs font-semibold text-gray-700 mb-3">
            MÊS ATUAL
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Ganho</span>
              <span className="font-semibold text-status-won">
                {statusBreakdown.won}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Perdido</span>
              <span className="font-semibold text-status-lost">
                {statusBreakdown.lost}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Suspenso</span>
              <span className="font-semibold text-status-suspenso">
                {statusBreakdown.suspenso}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Não codificado</span>
              <span className="font-semibold text-status-nao_codificado_flamingo">
                {statusBreakdown.nao_codificado_flamingo}
              </span>
            </div>
            <div className="h-px bg-gray-200 my-2"></div>
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">{statusBreakdown.total}</span>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="p-4 bg-white border-t border-gray-200 text-sm text-gray-600">
          {filteredBids.length} licitação{filteredBids.length !== 1 ? "s" : ""} encontrada{filteredBids.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {isCreating ? (
          <div className="flex-1 overflow-y-auto">
            <div className="border-b border-gray-200 p-4 bg-white sticky top-0 z-10">
              <div className="flex items-center justify-between max-w-6xl mx-auto">
                <h2 className="text-xl font-semibold text-gray-900">
                  Criar Nova Licitação
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreating(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="max-w-6xl mx-auto p-6">
              <BidForm
                onSave={handleSaveBid}
                onCancel={() => setIsCreating(false)}
              />
            </div>
          </div>
        ) : selectedBid ? (
          <div className="flex-1 overflow-y-auto">
            <BidDetail
              bid={selectedBid}
              onEdit={handleEditBid}
              onDelete={handleDeleteBid}
              onClose={() => setSelectedBid(null)}
            />
          </div>
        ) : searchQuery ? (
          <SearchResults
            bids={filteredBids}
            onSelectBid={setSelectedBid}
            onNewBid={() => setIsCreating(true)}
          />
        ) : (
          <Calendar
            bids={filteredBids}
            onSelectBid={setSelectedBid}
            onNewBid={() => setIsCreating(true)}
          />
        )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-3 px-6 text-center text-sm text-gray-600">
        Feito por Luan Mendes
      </footer>
    </div>
  );
}
