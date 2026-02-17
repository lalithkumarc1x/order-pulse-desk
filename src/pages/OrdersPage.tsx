import { useState, useMemo } from 'react';
import { useKmsStore, menuItems } from '@/store/useKmsStore';
import type { Order } from '@/types';
import { Search, Filter, Zap, Star, SplitSquareHorizontal, X } from 'lucide-react';

export default function OrdersPage() {
  const { orders, expediteOrder, updateOrderPriority, updateOrderStatus } = useKmsStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stationFilter, setStationFilter] = useState<string>('all');
  const [splitOrder, setSplitOrder] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (stationFilter !== 'all' && o.station !== stationFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const itemNames = o.items.map(i => menuItems.find(m => m.id === i.menuItemId)?.name || '').join(' ').toLowerCase();
        if (!o.id.toLowerCase().includes(q) && !itemNames.includes(q)) return false;
      }
      return true;
    });
  }, [orders, search, statusFilter, stationFilter]);

  const stations = ['all', 'Grill', 'Fry', 'Salad', 'Expo', 'Dessert'];
  const statuses = ['all', 'pending', 'in-progress', 'done', 'cancelled'];

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-foreground mb-4">Order Aggregator</h1>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search orders or items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-input border border-border rounded-md pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter size={14} className="text-muted-foreground" />
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2 py-1 text-xs rounded capitalize transition-colors ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {stations.map(s => (
            <button key={s} onClick={() => setStationFilter(s)}
              className={`px-2 py-1 text-xs rounded transition-colors ${stationFilter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 px-3 font-medium">Order</th>
              <th className="py-2 px-3 font-medium">Items</th>
              <th className="py-2 px-3 font-medium">Station</th>
              <th className="py-2 px-3 font-medium">Type</th>
              <th className="py-2 px-3 font-medium">Priority</th>
              <th className="py-2 px-3 font-medium">Status</th>
              <th className="py-2 px-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(order => (
              <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-2 px-3 font-mono-data font-bold">{order.id}</td>
                <td className="py-2 px-3">
                  {order.items.map((i, idx) => {
                    const mi = menuItems.find(m => m.id === i.menuItemId);
                    return <span key={idx} className="block text-xs">{i.quantity}× {mi?.name}</span>;
                  })}
                </td>
                <td className="py-2 px-3 text-xs">{order.station}</td>
                <td className="py-2 px-3 text-xs capitalize">{order.type}</td>
                <td className="py-2 px-3">
                  <select
                    value={order.priority}
                    onChange={e => updateOrderPriority(order.id, e.target.value as Order['priority'])}
                    className="bg-input border border-border rounded px-2 py-1 text-xs text-foreground"
                  >
                    <option value="normal">Normal</option>
                    <option value="rush">Rush</option>
                    <option value="vip">VIP</option>
                  </select>
                </td>
                <td className="py-2 px-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${
                    order.status === 'done' ? 'bg-success/20 text-success' :
                    order.status === 'in-progress' ? 'bg-primary/20 text-primary' :
                    order.status === 'cancelled' ? 'bg-destructive/20 text-destructive' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="py-2 px-3 flex items-center gap-1">
                  {order.status !== 'done' && order.status !== 'cancelled' && (
                    <>
                      <button onClick={() => expediteOrder(order.id)}
                        title="Expedite"
                        className="p-1 rounded hover:bg-accent/20 text-accent transition-colors">
                        <Zap size={14} />
                      </button>
                      <button onClick={() => setSplitOrder(order)}
                        title="Split ticket"
                        className="p-1 rounded hover:bg-primary/20 text-primary transition-colors">
                        <SplitSquareHorizontal size={14} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {splitOrder && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50" onClick={() => setSplitOrder(null)}>
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-card-foreground">Split Ticket — {splitOrder.id}</h2>
              <button onClick={() => setSplitOrder(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Select items to split into a new ticket:</p>
            <div className="space-y-2 mb-4">
              {splitOrder.items.map((item, idx) => {
                const mi = menuItems.find(m => m.id === item.menuItemId);
                return (
                  <label key={idx} className="flex items-center gap-2 text-sm text-card-foreground">
                    <input type="checkbox" className="rounded border-border" />
                    {item.quantity}× {mi?.name}
                  </label>
                );
              })}
            </div>
            <button
              onClick={() => setSplitOrder(null)}
              className="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:bg-primary/80 transition-colors"
            >
              Split Selected Items
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
