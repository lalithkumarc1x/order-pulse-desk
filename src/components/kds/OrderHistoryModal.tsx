import { useMemo } from 'react';
import type { Order } from '@/types';
import { menuItems, useKmsStore } from '@/store/useKmsStore';
import { X, RotateCcw, Clock, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderHistoryModal({ isOpen, onClose }: Props) {
  const orders = useKmsStore(s => s.orders);
  const recallOrder = useKmsStore(s => s.recallOrder);

  // Get completed orders sorted by completion time (newest first)
  const completedOrders = useMemo(() => {
    return orders
      .filter(o => o.status === 'done' || o.status === 'cancelled')
      .sort((a, b) => b.createdAt - a.createdAt); // Assuming createdAt as proxy for completion time
  }, [orders]);

  if (!isOpen) return null;

  const handleRecall = (orderId: string) => {
    recallOrder(orderId);
    // Optionally close modal or show confirmation
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border-2 border-border rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            <h2 className="text-xl font-bold text-foreground">Order History</h2>
            <span className="text-sm text-muted-foreground">({completedOrders.length} orders)</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {completedOrders.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Clock size={48} className="mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground text-lg">No completed orders</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {completedOrders.map(order => (
                <div
                  key={order.id}
                  className={`bg-muted/30 border-2 rounded-lg p-4 transition-all ${
                    order.status === 'cancelled' ? 'border-destructive/30' : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Order Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono-data font-bold text-base text-foreground">
                          {order.id}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          order.status === 'done' 
                            ? 'bg-green-500/20 text-green-700 dark:text-green-300 border border-green-500/30' 
                            : 'bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30'
                        }`}>
                          {order.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {order.type}
                        </span>
                        {order.tableNumber && (
                          <span className="text-xs text-muted-foreground">
                            Table {order.tableNumber}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {order.station}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
                        {order.items.map((item, idx) => {
                          const mi = menuItems.find(m => m.id === item.menuItemId);
                          return (
                            <div key={idx} className="text-sm flex items-start gap-1.5">
                              <span className="font-medium text-primary">{item.quantity}×</span>
                              <span className="text-foreground flex-1">{mi?.name || 'Unknown'}</span>
                              {item.notes && <AlertTriangle size={12} className="text-orange-500 flex-shrink-0 mt-0.5" />}
                            </div>
                          );
                        })}
                      </div>

                      {/* Notes */}
                      {order.items.some(i => i.notes) && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <p className="text-xs text-orange-600 dark:text-orange-400 italic">
                            {order.items.filter(i => i.notes).map(i => i.notes).join('; ')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Recall Button */}
                    {order.status === 'done' && (
                      <button
                        onClick={() => handleRecall(order.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm whitespace-nowrap"
                      >
                        <RotateCcw size={16} />
                        Recall
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
