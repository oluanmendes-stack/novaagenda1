import { useState } from "react";
import { Bid } from "@/types";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBidColor, formatBidTitle, getBidTypeAbbreviation } from "@/lib/bid-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MonthViewProps {
  date: Date;
  bids: Bid[];
  onSelectBid: (bid: Bid) => void;
  onNewBid: () => void;
}

export function MonthView({
  date,
  bids,
  onSelectBid,
  onNewBid,
}: MonthViewProps) {
  const [expandedDate, setExpandedDate] = useState<Date | null>(null);

  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getBidsForDate = (date: Date): Bid[] => {
    return bids.filter(
      (bid) =>
        bid.disputeDate.getDate() === date.getDate() &&
        bid.disputeDate.getMonth() === date.getMonth() &&
        bid.disputeDate.getFullYear() === date.getFullYear()
    );
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date | null): boolean => {
    return date ? date.getMonth() === month : false;
  };

  return (
    <div className="w-full h-full p-4">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {weeks.map((week, weekIdx) =>
          week.map((date, dayIdx) => {
            const daysForDate = date ? getBidsForDate(date) : [];
            const isCurrentDay = date && isCurrentMonth(date);
            const isTodayDate = date && isToday(date);

            return (
              <div
                key={`${weekIdx}-${dayIdx}`}
                className={cn(
                  "min-h-24 border rounded-lg p-1 cursor-pointer hover:bg-gray-50 transition-colors",
                  !isCurrentDay && "bg-gray-50",
                  isTodayDate && "border-primary border-2 bg-blue-50"
                )}
                onClick={onNewBid}
              >
                <div
                  className={cn(
                    "text-xs font-semibold mb-1",
                    isCurrentDay ? "text-gray-900" : "text-gray-400"
                  )}
                >
                  {date ? date.getDate() : ""}
                </div>
                <div className="space-y-1">
                  {daysForDate.slice(0, 3).map((bid) => (
                    <div
                      key={bid.id}
                      className="text-xs flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity py-0.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBid(bid);
                      }}
                      title={formatBidTitle(bid.bidType, bid.bidNumber, bid.products, bid.portal)}
                    >
                      <div className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        getBidColor(bid.status).bg
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs">{bid.disputeTime} {getBidTypeAbbreviation(bid.bidType)} {bid.bidNumber}</div>
                        <div className="truncate text-xs text-gray-600">({bid.portal})</div>
                      </div>
                    </div>
                  ))}
                  {daysForDate.length > 3 && (
                    <button
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium px-1 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedDate(date);
                      }}
                    >
                      +{daysForDate.length - 3} mais
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Expanded day modal */}
      <Dialog open={expandedDate !== null} onOpenChange={() => setExpandedDate(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {expandedDate?.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {expandedDate && getBidsForDate(expandedDate).map((bid) => (
              <div
                key={bid.id}
                className="text-sm flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => {
                  onSelectBid(bid);
                  setExpandedDate(null);
                }}
              >
                <div className={cn(
                  "w-3 h-3 rounded-full flex-shrink-0 mt-1.5",
                  getBidColor(bid.status).bg
                )} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{bid.disputeTime}</div>
                  <div className="text-gray-600 text-xs">{bid.state} - {bid.city}</div>
                  <div className="text-gray-700 mt-1">{formatBidTitle(bid.bidType, bid.bidNumber, bid.products, bid.portal)}</div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
