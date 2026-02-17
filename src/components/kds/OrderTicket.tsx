import type { Order } from '@/types';
import { menuItems } from '@/store/useKmsStore';
import { useEffect, useState } from 'react';
import { Clock, AlertTriangle, Zap, Star } from 'lucide-react';

interface Props {
  order: Order;
  isSelected: boolean;
  onSelect: () => void;
  onMarkDone: () => void;
}

function getSlaInfo(order: Order) {
  const elapsed = (Date.now() - order.createdAt) / 1000;
  const total = order.slaMinutes * 60;
  const remaining = Math.max(0, total - elapsed);
  const pct = remaining / total;
  return { remaining, pct };
}

export default function OrderTicket({ order, isSelected, onSelect, onMarkDone }: Props) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (order.status === 'done' || order.status === 'cancelled') return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [order.status]);

  if (order.status === 'done' || order.status === 'cancelled') return null;

  const { remaining, pct } = getSlaInfo(order);
  const mins = Math.floor(remaining / 60);
  const secs = Math.floor(remaining % 60);
  const slaClass = pct > 0.75 ? 'bg-sla-green' : pct > 0.5 ? 'bg-sla-yellow' : 'bg-sla-red';
  const borderClass = isSelected ? 'ring-2 ring-primary' : '';
  const priorityBadge = order.priority === 'rush'
    ? <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-accent text-accent-foreground"><Zap size={10} />RUSH</span>
    : order.priority === 'vip'
    ? <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-primary text-primary-foreground"><Star size={10} />VIP</span>
    : null;

  return (
    <div
      onClick={onSelect}
      onDoubleClick={onMarkDone}
      className={`bg-card border border-border rounded-lg p-3 cursor-pointer transition-all hover:border-primary/50 ${borderClass}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono-data font-bold text-sm text-card-foreground">{order.id}</span>
        <div className={`${slaClass} text-foreground px-2 py-0.5 rounded text-xs font-mono-data font-bold`}>
          <Clock size={10} className="inline mr-1" />
          {mins}:{String(secs).padStart(2, '0')}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        {priorityBadge}
        <span className="text-xs text-muted-foreground capitalize">{order.type}</span>
        {order.tableNumber && <span className="text-xs text-muted-foreground">T{order.tableNumber}</span>}
      </div>
      <ul className="space-y-1">
        {order.items.map((item, idx) => {
          const mi = menuItems.find(m => m.id === item.menuItemId);
          return (
            <li key={idx} className="text-sm text-card-foreground flex justify-between">
              <span>{item.quantity}× {mi?.name || 'Unknown'}</span>
              {item.notes && <AlertTriangle size={12} className="text-accent shrink-0 mt-0.5" />}
            </li>
          );
        })}
      </ul>
      {order.items.some(i => i.notes) && (
        <p className="text-xs text-accent mt-1 italic">
          {order.items.filter(i => i.notes).map(i => i.notes).join('; ')}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className={`text-xs font-medium capitalize ${order.status === 'in-progress' ? 'text-primary' : 'text-muted-foreground'}`}>
          {order.status}
        </span>
      </div>
    </div>
  );
}
