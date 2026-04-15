import { Bid } from "@/types";
import { formatBidTitle, getBidColor, getBidTypeAbbreviation } from "@/lib/bid-utils";
import { cn } from "@/lib/utils";

interface SearchResultsProps {
  bids: Bid[];
  onSelectBid: (bid: Bid) => void;
  onNewBid: () => void;
}

export function SearchResults({ bids, onSelectBid, onNewBid }: SearchResultsProps) {
  if (bids.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center overflow-auto">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nenhuma licitação encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="divide-y divide-gray-200">
        {bids.map((bid) => (
          <div
            key={bid.id}
            className="p-4 bg-white hover:bg-gray-50 cursor-pointer transition-colors border-l-4 border-gray-300"
            onClick={() => onSelectBid(bid)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    getBidColor(bid.status).bg
                  )} />
                  <span className="text-xs font-semibold text-gray-600 uppercase">
                    {getBidTypeAbbreviation(bid.bidType)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {bid.bidNumber}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {formatBidTitle(bid.bidType, bid.bidNumber, bid.products, bid.portal)}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {bid.city}, {bid.state}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{bid.portal}</span>
                  <span>{bid.disputeDate.toLocaleDateString('pt-BR')} {bid.disputeTime}</span>
                  <span className="inline-block px-2 py-1 rounded bg-gray-100 text-gray-700">
                    {bid.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
