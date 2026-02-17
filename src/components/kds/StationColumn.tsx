import type { Order } from '@/types';
import OrderTicket from './OrderTicket';
import { AlertTriangle } from 'lucide-react';

interface Props {
  station: string;
  orders: Order[];
  selectedTicket: string | null;
  onSelectTicket: (id: string) => void;
  onMarkDone: (id: string) => void;
  onRebalance: () => void;
}

export default function StationColumn({ station, orders, selectedTicket, onSelectTicket, onMarkDone, onRebalance }: Props) {
  const activeOrders = orders.filter(o => o.status !== 'done' && o.status !== 'cancelled');
  const isBottleneck = activeOrders.length > 4;

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] shrink-0">
      <div className={`px-4 py-3 rounded-t-lg flex items-center justify-between ${isBottleneck ? 'bg-destructive/20 border border-destructive' : 'bg-secondary'}`}>
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm text-foreground">{station}</h3>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-mono-data">
            {activeOrders.length}
          </span>
        </div>
        {isBottleneck && (
          <button
            onClick={onRebalance}
            className="flex items-center gap-1 text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded hover:bg-destructive/80 transition-colors"
          >
            <AlertTriangle size={12} />
            Rebalance
          </button>
        )}
      </div>
      <div className="flex-1 bg-muted/30 rounded-b-lg p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
        {activeOrders
          .sort((a, b) => {
            const priorityOrder = { vip: 0, rush: 1, normal: 2 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority])
              return priorityOrder[a.priority] - priorityOrder[b.priority];
            return a.createdAt - b.createdAt;
          })
          .map(order => (
            <OrderTicket
              key={order.id}
              order={order}
              isSelected={selectedTicket === order.id}
              onSelect={() => onSelectTicket(order.id)}
              onMarkDone={() => onMarkDone(order.id)}
            />
          ))}
        {activeOrders.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">No active orders</div>
        )}
      </div>
    </div>
  );
}
