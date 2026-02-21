import { useMemo } from 'react';
import type { Order, OrderAction } from '@/types';
import { useKmsStore, menuItems } from '@/store/useKmsStore';
import { X, Clock, CheckCircle, XCircle, PlayCircle, RotateCcw, AlertCircle } from 'lucide-react';

interface Props {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderJourneyModal({ orderId, isOpen, onClose }: Props) {
  const orders = useKmsStore(s => s.orders);

  const order = useMemo(() => {
    return orders.find(o => o.id === orderId);
  }, [orders, orderId]);

  if (!isOpen || !order) return null;

  const actionHistory = order.actionHistory || [];

  // Helper to get icon for action type
  const getActionIcon = (action: OrderAction['action']) => {
    switch (action) {
      case 'created': return Clock;
      case 'started': return PlayCircle;
      case 'item_started': return PlayCircle;
      case 'item_completed': return CheckCircle;
      case 'completed': return CheckCircle;
      case 'cancelled':
      case 'voided': return XCircle;
      case 'recalled': return RotateCcw;
      default: return AlertCircle;
    }
  };

  const getActionColor = (action: OrderAction['action']) => {
    switch (action) {
      case 'created': return 'text-muted-foreground';
      case 'started':
      case 'item_started': return 'text-blue-500';
      case 'item_completed':
      case 'completed': return 'text-green-500';
      case 'cancelled':
      case 'voided': return 'text-red-500';
      case 'recalled': return 'text-orange-500';
      default: return 'text-muted-foreground';
    }
  };

  const formatActionName = (action: OrderAction['action']) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border-2 border-border rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            <h2 className="text-xl font-bold text-foreground">Order Journey: {order.id}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {actionHistory.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p>No action history available for this order.</p>
              <p className="text-sm mt-2">This order may have been created before journey tracking was enabled.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {actionHistory.map((action, idx) => {
                const Icon = getActionIcon(action.action);
                const color = getActionColor(action.action);
                const isLast = idx === actionHistory.length - 1;

                // Get item name if item-specific action
                const itemName = action.itemIndex !== undefined
                  ? menuItems.find(m => m.id === order.items[action.itemIndex!]?.menuItemId)?.name
                  : null;

                // Calculate time delta
                const timeDelta = idx > 0
                  ? Math.floor((action.timestamp - actionHistory[idx - 1].timestamp) / 1000)
                  : null;

                const formatDelta = (seconds: number) => {
                  if (seconds < 60) return `+${seconds}s`;
                  const mins = Math.floor(seconds / 60);
                  const secs = seconds % 60;
                  return `+${mins}m${secs > 0 ? ` ${secs}s` : ''}`;
                };

                return (
                  <div key={idx} className="flex gap-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-card ${color} border-current`}>
                        <Icon size={16} />
                      </div>
                      {!isLast && (
                        <div className="w-0.5 flex-1 bg-border min-h-[40px]" />
                      )}
                    </div>

                    {/* Action details */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-foreground">
                            {formatActionName(action.action)}
                          </p>
                          {itemName && (
                            <p className="text-sm text-muted-foreground">
                              Item: <span className="font-medium">{itemName}</span>
                            </p>
                          )}
                          {action.reason && (
                            <p className="text-sm text-muted-foreground italic mt-1">
                              Reason: {action.reason}
                            </p>
                          )}
                          {action.station && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Station: {action.station}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-mono-data text-muted-foreground">
                            {new Date(action.timestamp).toLocaleTimeString()}
                          </p>
                          {timeDelta !== null && (
                            <p className="text-xs text-muted-foreground font-mono-data mt-0.5">
                              {formatDelta(timeDelta)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {actionHistory.length > 0 && (
              <span>
                {actionHistory.length} action{actionHistory.length !== 1 ? 's' : ''} tracked
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
