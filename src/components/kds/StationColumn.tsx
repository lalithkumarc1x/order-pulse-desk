import type { Order } from '@/types';
import OrderTicket from './OrderTicket';
import { AlertTriangle, Maximize2, Minimize2, Pin, PinOff, ChefHat, ChevronDown, ChevronRight, Play, CheckCircle2, ChevronLeft, Square, Clock } from 'lucide-react';
import { useKmsStore, menuItems } from '@/store/useKmsStore';
import { useMemo, useState, useEffect } from 'react';

interface Props {
  station: string;
  orders: Order[];
  selectedTicket: string | null;
  onSelectTicket: (id: string) => void;
  onMarkDone: (id: string) => void;
  onRebalance: () => void;
  onVoid: (id: string) => void;
  onShowJourney: (id: string) => void;
}

export default function StationColumn({ station, orders, selectedTicket, onSelectTicket, onMarkDone, onRebalance, onVoid, onShowJourney }: Props) {
  const expandedStation = useKmsStore(s => s.expandedStation);
  const pinnedStations = useKmsStore(s => s.pinnedStations);
  const setExpandedStation = useKmsStore(s => s.setExpandedStation);
  const togglePinnedStation = useKmsStore(s => s.togglePinnedStation);
  const startItem = useKmsStore(s => s.startItem);
  const markItemDone = useKmsStore(s => s.markItemDone);

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [partialCounts, setPartialCounts] = useState<Map<string, number>>(new Map());
  const [itemsPaneExpanded, setItemsPaneExpanded] = useState(true);
  const [ordersPaneExpanded, setOrdersPaneExpanded] = useState(true);
  const [tick, setTick] = useState(0);

  const activeOrders = orders.filter(o => o.status !== 'done' && o.status !== 'cancelled');
  const isBottleneck = activeOrders.length > 4;
  const isExpanded = expandedStation === station;
  const isPinned = pinnedStations.includes(station);

  // Aggregate items across all active orders when expanded, with order references
  const itemCounts = useMemo(() => {
    if (!isExpanded) return [];

    const itemMap = new Map<string, {
      menuItemId: string;
      name: string;
      quantity: number;
      orderItems: { orderId: string; orderNum: string; itemIndices: number[] }[];
    }>();

    activeOrders.forEach(order => {
      order.items.forEach((item, itemIndex) => {
        const menuItem = menuItems.find(m => m.id === item.menuItemId);
        if (!menuItem) return;

        const existing = itemMap.get(item.menuItemId);
        if (existing) {
          existing.quantity += item.quantity;
          const orderRef = existing.orderItems.find(oi => oi.orderId === order.id);
          if (orderRef) {
            orderRef.itemIndices.push(itemIndex);
          } else {
            existing.orderItems.push({
              orderId: order.id,
              orderNum: order.id,
              itemIndices: [itemIndex]
            });
          }
        } else {
          itemMap.set(item.menuItemId, {
            menuItemId: item.menuItemId,
            name: menuItem.name,
            quantity: item.quantity,
            orderItems: [{
              orderId: order.id,
              orderNum: order.id,
              itemIndices: [itemIndex]
            }]
          });
        }
      });
    });

    return Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity);
  }, [isExpanded, activeOrders]);

  const toggleItemExpansion = (menuItemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(menuItemId)) {
        next.delete(menuItemId);
      } else {
        next.add(menuItemId);
      }
      return next;
    });
  };

  const startAllItemInstances = (item: typeof itemCounts[0]) => {
    // Start all instances of this item across all orders
    item.orderItems.forEach(orderItem => {
      orderItem.itemIndices.forEach(itemIndex => {
        startItem(orderItem.orderId, itemIndex);
      });
    });
  };

  // Get all notes for an item across orders
  const getItemNotes = (item: typeof itemCounts[0]) => {
    const notes: string[] = [];
    item.orderItems.forEach(orderItem => {
      const order = activeOrders.find(o => o.id === orderItem.orderId);
      if (order) {
        orderItem.itemIndices.forEach(itemIndex => {
          const orderItemData = order.items[itemIndex];
          if (orderItemData?.notes) {
            notes.push(`${orderItem.orderNum}: ${orderItemData.notes}`);
          }
        });
      }
    });
    return notes.length > 0 ? notes.join('\n') : '';
  };

  const completeAllItemInstances = (item: typeof itemCounts[0]) => {
    // Mark all instances of this item as done
    item.orderItems.forEach(orderItem => {
      orderItem.itemIndices.forEach(itemIndex => {
        markItemDone(orderItem.orderId, itemIndex);
      });
    });
  };

  const completePartialItems = (item: typeof itemCounts[0], count: number) => {
    // Mark a partial count of items as done
    let completed = 0;

    // First collect all incomplete items
    const incompleteItems: { orderId: string; itemIndex: number }[] = [];
    for (const orderItem of item.orderItems) {
      const order = activeOrders.find(o => o.id === orderItem.orderId);
      if (!order) continue;

      for (const itemIndex of orderItem.itemIndices) {
        const orderItemData = order.items[itemIndex];
        if (!orderItemData?.done) {
          incompleteItems.push({ orderId: orderItem.orderId, itemIndex });
        }
      }
    }

    // Mark the specified count as done
    for (let i = 0; i < Math.min(count, incompleteItems.length); i++) {
      const { orderId, itemIndex } = incompleteItems[i];
      const order = activeOrders.find(o => o.id === orderId);
      const orderItemData = order?.items[itemIndex];

      // Start if not started
      if (orderItemData && !orderItemData.startedAt) {
        startItem(orderId, itemIndex);
      }
      markItemDone(orderId, itemIndex);
    }
  };

  const handlePartialComplete = (item: typeof itemCounts[0]) => {
    const count = partialCounts.get(item.menuItemId) || 0;
    if (count > 0 && count <= item.quantity) {
      completePartialItems(item, count);
      // Reset the input
      setPartialCounts(prev => {
        const next = new Map(prev);
        next.delete(item.menuItemId);
        return next;
      });
    }
  };

  // Check if all instances of an item are started
  const areAllItemsStarted = (item: typeof itemCounts[0]) => {
    return item.orderItems.every(orderItem => {
      const order = activeOrders.find(o => o.id === orderItem.orderId);
      if (!order) return false;
      return orderItem.itemIndices.every(idx => order.items[idx]?.startedAt);
    });
  };

  // Check if all instances of an item are done
  const areAllItemsDone = (item: typeof itemCounts[0]) => {
    return item.orderItems.every(orderItem => {
      const order = activeOrders.find(o => o.id === orderItem.orderId);
      if (!order) return false;
      return orderItem.itemIndices.every(idx => order.items[idx]?.done);
    });
  };

  // Get earliest start time for an item
  const getItemStartTime = (item: typeof itemCounts[0]) => {
    let earliest: number | null = null;
    item.orderItems.forEach(orderItem => {
      const order = activeOrders.find(o => o.id === orderItem.orderId);
      if (!order) return;
      orderItem.itemIndices.forEach(idx => {
        const startedAt = order.items[idx]?.startedAt;
        if (startedAt && (earliest === null || startedAt < earliest)) {
          earliest = startedAt;
        }
      });
    });
    return earliest;
  };

  // Format elapsed time
  const formatElapsedTime = (startTime: number) => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // Stop/Reset all item instances (marks them as done to complete the workflow)
  const stopAllItemInstances = (item: typeof itemCounts[0]) => {
    // For now, stop means complete all remaining items
    completeAllItemInstances(item);
  };

  // Timer update effect
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex flex-col shrink-0 ${isExpanded ? 'fixed inset-0 z-40 bg-background' : isPinned ? 'sticky left-0 z-10 min-w-[280px] max-w-[320px]' : 'min-w-[280px] max-w-[320px]'}`}>
      <div className={`px-4 py-3 ${isExpanded ? '' : 'rounded-t-lg'} flex items-center justify-between ${isBottleneck ? 'bg-destructive/20 border border-destructive' : 'bg-secondary'} ${isPinned ? 'border-2 border-primary' : ''}`}>
        <div className="flex items-center gap-2">
          <h3 className={`font-bold ${isExpanded ? 'text-xl' : 'text-sm'} text-foreground`}>{station}</h3>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-mono-data">
            {activeOrders.length}
          </span>
          {isPinned && (
            <span className="text-xs text-primary font-semibold">PINNED</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Pin Button */}
          <button
            onClick={() => togglePinnedStation(station)}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
              isPinned
                ? 'bg-primary text-primary-foreground hover:bg-primary/80'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            title={isPinned ? 'Unpin station' : 'Pin station'}
          >
            {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
          </button>

          {/* Expand Button */}
          <button
            onClick={() => setExpandedStation(isExpanded ? null : station)}
            className="flex items-center gap-1 text-xs bg-accent text-accent-foreground px-2 py-1 rounded hover:bg-accent/80 transition-colors"
            title={isExpanded ? 'Minimize station' : 'Expand station'}
          >
            {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>

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
      </div>

      {/* Two-pane layout when expanded, single column when not */}
      {isExpanded ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Pane: Item Counts - 75% width when orders expanded, 100% when collapsed */}
          {itemsPaneExpanded ? (
            <div
              className="flex flex-col bg-muted/20 relative border-r-2 border-border"
              style={{ width: ordersPaneExpanded ? '75%' : 'calc(100% - 48px)' }}
            >
              <div className="px-4 py-3 border-b border-border bg-card">
                <div className="flex items-center gap-2">
                  <ChefHat size={18} className="text-primary" />
                  <h3 className="font-bold text-sm text-foreground">Items to Prepare</h3>
                  <span className="ml-auto text-xs text-muted-foreground">({itemCounts.length})</span>
                  <button
                    onClick={() => setItemsPaneExpanded(false)}
                    className="p-1 hover:bg-muted rounded transition-colors"
                    title="Collapse items pane"
                  >
                    <ChevronLeft size={16} className="text-muted-foreground" />
                  </button>
                </div>
              </div>

            <div className="flex-1 overflow-y-auto p-4">
              {itemCounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No items
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 h-full">
                  {/* New Order Column */}
                  <div className="flex flex-col">
                    <div className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 border-b-2 border-blue-500 rounded-t-lg mb-3">
                      <h4 className="font-bold text-sm text-blue-700 dark:text-blue-300">New Order</h4>
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        {itemCounts.filter(item => !areAllItemsStarted(item)).length} items
                      </span>
                    </div>
                    <div className="flex-1 space-y-2 overflow-y-auto">
                      {itemCounts
                        .filter(item => !areAllItemsStarted(item))
                        .map((item) => {
                          const itemNotes = getItemNotes(item);
                          return (
                            <div
                              key={item.menuItemId}
                              onDoubleClick={() => startAllItemInstances(item)}
                              className="bg-card border border-border rounded-lg p-3 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                              title="Double-click to start"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-semibold text-sm text-foreground flex-1">{item.name}</h5>
                                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                                  <span className="font-bold font-mono-data text-xs">{item.quantity}</span>
                                </div>
                              </div>
                              {itemNotes && (
                                <div className="bg-muted border-l-2 border-muted-foreground rounded px-2 py-1 mt-2">
                                  <div className="text-xs text-muted-foreground">{itemNotes}</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* In Progress Column */}
                  <div className="flex flex-col">
                    <div className="px-3 py-2 bg-orange-100 dark:bg-orange-900/30 border-b-2 border-orange-500 rounded-t-lg mb-3">
                      <h4 className="font-bold text-sm text-orange-700 dark:text-orange-300">In Progress</h4>
                      <span className="text-xs text-orange-600 dark:text-orange-400">
                        {itemCounts.filter(item => areAllItemsStarted(item) && !areAllItemsDone(item)).length} items
                      </span>
                    </div>
                    <div className="flex-1 space-y-2 overflow-y-auto">
                      {itemCounts
                        .filter(item => areAllItemsStarted(item) && !areAllItemsDone(item))
                        .map((item) => {
                          const itemNotes = getItemNotes(item);
                          const startTime = getItemStartTime(item);
                          return (
                            <div
                              key={item.menuItemId}
                              onDoubleClick={() => completeAllItemInstances(item)}
                              className="bg-card border border-border rounded-lg p-3 hover:border-orange-500 hover:shadow-md transition-all cursor-pointer"
                              title="Double-click to complete"
                            >
                              {startTime && (
                                <div className="flex items-center justify-center gap-1 mb-2 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded">
                                  <Clock size={12} className="text-orange-600 dark:text-orange-400" />
                                  <span className="font-mono-data font-semibold text-xs text-orange-700 dark:text-orange-300">
                                    {formatElapsedTime(startTime)}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-semibold text-sm text-foreground flex-1">{item.name}</h5>
                                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center">
                                  <span className="font-bold font-mono-data text-xs">{item.quantity}</span>
                                </div>
                              </div>
                              {itemNotes && (
                                <div className="bg-muted border-l-2 border-muted-foreground rounded px-2 py-1 mt-2">
                                  <div className="text-xs text-muted-foreground">{itemNotes}</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Done Column */}
                  <div className="flex flex-col">
                    <div className="px-3 py-2 bg-green-100 dark:bg-green-900/30 border-b-2 border-green-500 rounded-t-lg mb-3">
                      <h4 className="font-bold text-sm text-green-700 dark:text-green-300">Done</h4>
                      <span className="text-xs text-green-600 dark:text-green-400">
                        {itemCounts.filter(item => areAllItemsDone(item)).length} items
                      </span>
                    </div>
                    <div className="flex-1 space-y-2 overflow-y-auto">
                      {itemCounts
                        .filter(item => areAllItemsDone(item))
                        .map((item) => {
                          const itemNotes = getItemNotes(item);
                          return (
                            <div
                              key={item.menuItemId}
                              className="bg-card border border-green-200 dark:border-green-800 rounded-lg p-3 opacity-60"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-semibold text-sm text-foreground flex-1 line-through">{item.name}</h5>
                                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                                  <span className="font-bold font-mono-data text-xs">{item.quantity}</span>
                                </div>
                              </div>
                              {itemNotes && (
                                <div className="bg-muted border-l-2 border-muted-foreground rounded px-2 py-1 mt-2">
                                  <div className="text-xs text-muted-foreground">{itemNotes}</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          ) : (
            /* Collapsed Items Pane - Narrow Strip */
            <div className="w-12 border-r-2 border-border flex flex-col bg-muted/20">
              <div className="flex-1 flex items-center justify-center">
                <button
                  onClick={() => setItemsPaneExpanded(true)}
                  className="p-2 hover:bg-muted rounded transition-colors rotate-90 whitespace-nowrap"
                  title="Expand items pane"
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight size={16} className="text-muted-foreground -rotate-90" />
                    <span className="text-xs font-semibold text-muted-foreground">Items ({itemCounts.length})</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Right Pane: Order Tickets - Collapsible */}
          {ordersPaneExpanded ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-muted/30 border-l-2 border-border">
              <div className="px-3 py-2 border-b border-border bg-card">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs text-foreground flex-1">Orders ({activeOrders.length})</h3>
                  <button
                    onClick={() => setOrdersPaneExpanded(false)}
                    className="p-1 hover:bg-muted rounded transition-colors"
                    title="Collapse orders pane"
                  >
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {activeOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">No orders</div>
                ) : (
                  <div className="space-y-2">
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
                          onVoid={() => onVoid(order.id)}
                          onShowJourney={() => onShowJourney(order.id)}
                        />
                      ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Collapsed Orders Pane - Narrow Strip */
            <div className="w-12 border-l-2 border-border flex flex-col bg-muted/20">
              <div className="flex-1 flex items-center justify-center">
                <button
                  onClick={() => setOrdersPaneExpanded(true)}
                  className="p-2 hover:bg-muted rounded transition-colors rotate-90 whitespace-nowrap"
                  title="Expand orders pane"
                >
                  <div className="flex items-center gap-2">
                    <ChevronLeft size={16} className="text-muted-foreground -rotate-90" />
                    <span className="text-xs font-semibold text-muted-foreground">Orders ({activeOrders.length})</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={`flex-1 bg-muted/30 rounded-b-lg p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]`}>
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
                onVoid={() => onVoid(order.id)}
                onShowJourney={() => onShowJourney(order.id)}
              />
            ))}
          {activeOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">No active orders</div>
          )}
        </div>
      )}
    </div>
  );
}
