import type { Order } from "@/types";
import { menuItems } from "@/store/useKmsStore";
import { useEffect, useState, useMemo } from "react";
import { Clock, AlertTriangle, Zap, Star, Check, XCircle, History } from "lucide-react";
import { useKmsStore } from "@/store/useKmsStore";

interface Props {
  order: Order;
  isSelected: boolean;
  onSelect: () => void;
  onMarkDone: () => void;
  onVoid: () => void;
  onShowJourney: () => void;
}

export default function OrderTicket({
  order,
  isSelected,
  onSelect,
  onMarkDone,
  onVoid,
  onShowJourney,
}: Props) {
  const [tick, setTick] = useState(0);
  const markItemDone = useKmsStore((s) => s.markItemDone);
  const startItem = useKmsStore((s) => s.startItem);

  // Helper to format item timing
  const formatItemTime = (itemIndex: number) => {
    const item = order.items[itemIndex];
    if (!item) return null;

    if (item.completedAt && item.startedAt) {
      // Show completion time
      const duration = (item.completedAt - item.startedAt) / 1000;
      const mins = Math.floor(duration / 60);
      const secs = Math.floor(duration % 60);
      return `${mins}:${String(secs).padStart(2, '0')}`;
    }

    if (item.startedAt) {
      // Show elapsed time
      const elapsed = (Date.now() - item.startedAt) / 1000;
      const mins = Math.floor(elapsed / 60);
      const secs = Math.floor(elapsed % 60);
      return `${mins}:${String(secs).padStart(2, '0')}`;
    }

    return null;
  };

  useEffect(() => {
    if (order.status === "done" || order.status === "cancelled") return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [order.status]);

  // Group items by ingredient (aggregate same menuItemId)
  const groupedItems = useMemo(() => {
    const map = new Map<
      string,
      {
        menuItemId: string;
        quantity: number;
        notes: string[];
        indices: number[];
        allDone: boolean;
      }
    >();
    order.items.forEach((item, idx) => {
      const existing = map.get(item.menuItemId);
      if (existing) {
        existing.quantity += item.quantity;
        if (item.notes) existing.notes.push(item.notes);
        existing.indices.push(idx);
        if (!item.done) existing.allDone = false;
      } else {
        map.set(item.menuItemId, {
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          notes: item.notes ? [item.notes] : [],
          indices: [idx],
          allDone: !!item.done,
        });
      }
    });
    return Array.from(map.values());
  }, [order.items]);

  if (order.status === 'done' || order.status === 'cancelled') return null;

  const elapsed = (Date.now() - order.createdAt) / 1000;
  const isRushOrVip = order.priority === "rush" || order.priority === "vip";

  // Count-up for regular, countdown for rush/vip
  let timerDisplay: string;
  let timerClass: string;

  if (isRushOrVip) {
    const total = order.slaMinutes * 60;
    const remaining = Math.max(0, total - elapsed);
    const pct = remaining / total;
    const mins = Math.floor(remaining / 60);
    const secs = Math.floor(remaining % 60);
    timerDisplay = `${mins}:${String(secs).padStart(2, "0")}`;
    timerClass =
      pct > 0.75 ? "bg-sla-green" : pct > 0.5 ? "bg-sla-yellow" : "bg-sla-red";
  } else {
    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    timerDisplay = `${mins}:${String(secs).padStart(2, "0")}`;
    // Color based on how long it's been vs SLA
    const ratio = elapsed / (order.slaMinutes * 60);
    timerClass =
      ratio < 0.5
        ? "bg-sla-green"
        : ratio < 0.75
          ? "bg-sla-yellow"
          : "bg-sla-red";
  }

  const borderClass = isSelected ? "ring-2 ring-primary" : "";
  const priorityBadge =
    order.priority === "rush" ? (
      <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
        <Zap size={10} />
        RUSH
      </span>
    ) : order.priority === "vip" ? (
      <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
        <Star size={10} />
        VIP
      </span>
    ) : null;

  const doneCount = order.items.filter((i) => i.done).length;
  const totalCount = order.items.length;

  return (
    <div
      onClick={onSelect}
      onDoubleClick={onMarkDone}
      className={`bg-card border border-border rounded-lg p-3 cursor-pointer transition-all hover:border-primary/50 ${borderClass}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono-data font-bold text-sm text-card-foreground">
          {order.id}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowJourney();
            }}
            className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
            title="View order journey"
          >
            <History size={12} className="inline" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onVoid();
            }}
            className="text-xs px-1.5 py-0.5 rounded bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-colors"
            title="Void order"
          >
            <XCircle size={12} className="inline" />
          </button>
          <div
            className={`${timerClass} text-foreground px-2 py-0.5 rounded text-xs font-mono-data font-bold`}
          >
            <Clock size={10} className="inline mr-1" />
            {isRushOrVip ? "↓" : "↑"} {timerDisplay}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-1.5">
        {priorityBadge}
        <span className="text-xs text-muted-foreground capitalize">
          {order.type}
        </span>
        {order.tableNumber && (
          <span className="text-xs text-muted-foreground">
            T{order.tableNumber}
          </span>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {doneCount}/{totalCount}
        </span>
      </div>
      <ul className="space-y-0.5">
        {groupedItems.map((group) => {
          const mi = menuItems.find((m) => m.id === group.menuItemId);
          const firstItemIndex = group.indices[0];
          const firstItem = order.items[firstItemIndex];
          const itemTime = formatItemTime(firstItemIndex);

          return (
            <li
              key={group.menuItemId}
              className={`text-sm flex items-center justify-between gap-1 px-1.5 py-0.5 rounded transition-colors ${
                group.allDone
                  ? "bg-muted/50 text-muted-foreground line-through"
                  : "text-card-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5 flex-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    group.indices.forEach((idx) => {
                      if (!order.items[idx].done) markItemDone(order.id, idx);
                    });
                  }}
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    group.allDone
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground/40 hover:border-primary"
                  }`}
                >
                  {group.allDone && <Check size={10} />}
                </button>
                <span>
                  {group.quantity}× {mi?.name || "Unknown"}
                </span>
              </span>
              <span className="flex items-center gap-1.5 shrink-0">
                {itemTime && (
                  <span
                    className={`text-xs font-mono-data ${
                      firstItem.done ? 'text-green-500' : 'text-primary'
                    }`}
                  >
                    {itemTime}
                  </span>
                )}
                {!firstItem.startedAt && !firstItem.done && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      group.indices.forEach((idx) => {
                        startItem(order.id, idx);
                      });
                    }}
                    className="text-xs px-1 py-0.5 rounded bg-accent text-accent-foreground hover:bg-accent/80 transition-colors"
                  >
                    Start
                  </button>
                )}
                {group.notes.length > 0 && (
                  <AlertTriangle size={12} className="text-accent shrink-0" />
                )}
              </span>
            </li>
          );
        })}
      </ul>
      {order.items.some((i) => i.notes) && (
        <p className="text-xs text-accent mt-1 italic">
          {order.items
            .filter((i) => i.notes)
            .map((i) => i.notes)
            .join("; ")}
        </p>
      )}
    </div>
  );
}
