import { create } from 'zustand';
import type { Order, Ingredient, PurchaseOrder } from '@/types';
import { initialOrders, menuItems, ingredients as initialIngredients, salesHistory, staffMembers } from '@/data/mockData';

interface KmsState {
  orders: Order[];
  ingredients: Ingredient[];
  purchaseOrders: PurchaseOrder[];
  isOnline: boolean;
  isPaused: boolean;
  selectedTicket: string | null;
  currentView: 'station' | 'prep';
  expandedStation: string | null;
  pinnedStations: string[];

  markOrderDone: (orderId: string) => void;
  markItemDone: (orderId: string, itemIndex: number) => void;
  startItem: (orderId: string, itemIndex: number) => void;
  voidOrder: (orderId: string, reason: string) => void;
  expediteOrder: (orderId: string) => void;
  updateOrderPriority: (orderId: string, priority: Order['priority']) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  adjustStock: (ingredientId: string, delta: number) => void;
  createPO: (ingredientId: string, quantity: number) => void;
  rebalanceStation: (fromStation: string) => void;
  setOnline: (online: boolean) => void;
  setPaused: (paused: boolean) => void;
  setSelectedTicket: (id: string | null) => void;
  simulateUpdates: () => void;
  deductIngredients: (order: Order) => void;
  setCurrentView: (view: 'station' | 'prep') => void;
  addSimulatedOrder: () => Order;
  recallOrder: (orderId: string) => void;
  setExpandedStation: (station: string | null) => void;
  togglePinnedStation: (station: string) => void;
}

export const useKmsStore = create<KmsState>((set, get) => ({
  orders: initialOrders,
  ingredients: [...initialIngredients],
  purchaseOrders: [],
  isOnline: navigator.onLine,
  isPaused: false,
  selectedTicket: null,
  currentView: 'station',
  expandedStation: null,
  pinnedStations: [],

  markOrderDone: (orderId) => {
    const state = get();
    const order = state.orders.find(o => o.id === orderId);
    if (order && order.status !== 'done') {
      state.deductIngredients(order);
      set(s => ({ orders: s.orders.map(o => o.id === orderId ? { ...o, status: 'done', items: o.items.map(i => ({ ...i, done: true })) } : o) }));
    }
  },

  markItemDone: (orderId, itemIndex) => {
    set(s => {
      const newOrders = s.orders.map(o => {
        if (o.id !== orderId) return o;

        const now = Date.now();
        const newItems = o.items.map((item, idx) =>
          idx === itemIndex
            ? { ...item, done: true, completedAt: now }
            : item
        );

        const allDone = newItems.every(i => i.done);

        const itemCompletedAction = {
          timestamp: now,
          action: 'item_completed' as const,
          itemIndex,
          station: o.station
        };

        const newHistory = [...(o.actionHistory || []), itemCompletedAction];

        if (allDone) {
          const completeAction = {
            timestamp: now,
            action: 'completed' as const,
            station: o.station
          };
          const order = {
            ...o,
            items: newItems,
            status: 'done' as const,
            actionHistory: [...newHistory, completeAction]
          };
          get().deductIngredients(order);
          return order;
        }

        return {
          ...o,
          items: newItems,
          status: 'in-progress' as const,
          actionHistory: newHistory
        };
      });
      return { orders: newOrders };
    });
  },

  startItem: (orderId, itemIndex) => {
    set(s => ({
      orders: s.orders.map(o => {
        if (o.id !== orderId) return o;

        const now = Date.now();
        const newItems = o.items.map((item, idx) =>
          idx === itemIndex && !item.startedAt
            ? { ...item, startedAt: now }
            : item
        );

        const action = {
          timestamp: now,
          action: 'item_started' as const,
          itemIndex,
          station: o.station
        };

        // Auto-transition to in-progress if not already
        const newStatus = o.status === 'pending' ? 'in-progress' : o.status;
        const statusAction = o.status === 'pending' ? {
          timestamp: now,
          action: 'started' as const,
          station: o.station
        } : null;

        return {
          ...o,
          items: newItems,
          status: newStatus as Order['status'],
          actionHistory: [
            ...(o.actionHistory || []),
            ...(statusAction ? [statusAction] : []),
            action
          ]
        };
      })
    }));
  },

  voidOrder: (orderId, reason) => {
    set(s => ({
      orders: s.orders.map(o => {
        if (o.id !== orderId) return o;

        const now = Date.now();
        const action = {
          timestamp: now,
          action: 'voided' as const,
          station: o.station,
          reason
        };

        return {
          ...o,
          status: 'cancelled' as const,
          voidedAt: now,
          voidReason: reason,
          actionHistory: [...(o.actionHistory || []), action]
        };
      })
    }));
  },

  expediteOrder: (orderId) =>
    set(s => ({ orders: s.orders.map(o => o.id === orderId ? { ...o, priority: 'rush' } : o) })),

  updateOrderPriority: (orderId, priority) =>
    set(s => ({ orders: s.orders.map(o => o.id === orderId ? { ...o, priority } : o) })),

  updateOrderStatus: (orderId, status) =>
    set(s => ({ orders: s.orders.map(o => o.id === orderId ? { ...o, status } : o) })),

  adjustStock: (ingredientId, delta) =>
    set(s => ({
      ingredients: s.ingredients.map(i =>
        i.id === ingredientId ? { ...i, stock: Math.max(0, i.stock + delta) } : i
      ),
    })),

  createPO: (ingredientId, quantity) =>
    set(s => ({
      purchaseOrders: [...s.purchaseOrders, {
        id: `PO-${String(s.purchaseOrders.length + 1).padStart(3, '0')}`,
        ingredientId,
        quantity,
        status: 'pending',
        createdAt: Date.now(),
      }],
    })),

  rebalanceStation: (fromStation) =>
    set(s => {
      const stationOrders = s.orders.filter(o => o.station === fromStation && o.status !== 'done' && o.status !== 'cancelled');
      if (stationOrders.length <= 4) return s;
      const allStations = ['Grill', 'Fry', 'Salad', 'Expo', 'Dessert'];
      const counts = allStations.map(st => ({
        station: st,
        count: s.orders.filter(o => o.station === st && o.status !== 'done' && o.status !== 'cancelled').length,
      }));
      const leastBusy = counts.sort((a, b) => a.count - b.count)[0];
      const ticketToMove = stationOrders[stationOrders.length - 1];
      return { orders: s.orders.map(o => o.id === ticketToMove.id ? { ...o, station: leastBusy.station } : o) };
    }),

  setOnline: (online) => set({ isOnline: online }),
  setPaused: (paused) => set({ isPaused: paused }),
  setSelectedTicket: (id) => set({ selectedTicket: id }),

  deductIngredients: (order) => {
    set(s => {
      const newIngredients = [...s.ingredients];
      for (const item of order.items) {
        const menuItem = menuItems.find(m => m.id === item.menuItemId);
        if (!menuItem) continue;
        for (const req of menuItem.ingredients) {
          const idx = newIngredients.findIndex(i => i.id === req.ingredientId);
          if (idx >= 0) {
            newIngredients[idx] = {
              ...newIngredients[idx],
              stock: Math.max(0, newIngredients[idx].stock - req.quantity * item.quantity),
            };
          }
        }
      }
      return { ingredients: newIngredients };
    });
  },

  simulateUpdates: () => {
    if (get().isPaused) return;
    set(s => {
      const updated = s.orders.map(o => {
        if (o.status === 'pending' && Math.random() < 0.05) {
          return { ...o, status: 'in-progress' as const };
        }
        return o;
      });
      return { orders: updated };
    });
  },

  setCurrentView: (view) => set({ currentView: view }),

  addSimulatedOrder: () => {
    const state = get();
    const orderNum = state.orders.length + 1;
    const priorities: Order['priority'][] = ['normal', 'normal', 'rush', 'vip'];
    const types: Order['type'][] = ['dine-in', 'takeout', 'delivery'];
    const stations = ['Grill', 'Fry', 'Salad', 'Expo', 'Dessert'];
    
    const numItems = Math.floor(Math.random() * 3) + 1;
    const items = Array.from({ length: numItems }, () => ({
      menuItemId: menuItems[Math.floor(Math.random() * menuItems.length)].id,
      quantity: Math.floor(Math.random() * 2) + 1,
      notes: Math.random() > 0.8 ? ['No onion', 'Extra sauce', 'Well done'][Math.floor(Math.random() * 3)] : undefined,
    }));

    const stationForOrder = items.length > 0
      ? menuItems.find(m => m.id === items[0].menuItemId)?.category || 'Expo'
      : 'Expo';

    const station = stations.includes(stationForOrder) ? stationForOrder : 'Expo';
    const createdAt = Date.now();

    const newOrder: Order = {
      id: `ORD-${String(orderNum).padStart(3, '0')}`,
      items,
      station,
      status: 'pending',
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      createdAt,
      slaMinutes: [10, 12, 15, 20][Math.floor(Math.random() * 4)],
      tableNumber: Math.random() > 0.3 ? Math.floor(Math.random() * 20) + 1 : undefined,
      type: types[Math.floor(Math.random() * types.length)],
      actionHistory: [
        {
          timestamp: createdAt,
          action: 'created',
          station
        }
      ]
    };

    set(s => ({ orders: [...s.orders, newOrder] }));
    return newOrder;
  },

  recallOrder: (orderId) => {
    set(s => ({
      orders: s.orders.map(o => {
        if (o.id !== orderId) return o;

        const now = Date.now();
        const action = {
          timestamp: now,
          action: 'recalled' as const,
          station: o.station
        };

        return {
          ...o,
          status: 'pending' as const,
          items: o.items.map(i => ({ ...i, done: false })),
          actionHistory: [...(o.actionHistory || []), action]
        };
      }),
    }));
  },

  setExpandedStation: (station) => set({ expandedStation: station }),

  togglePinnedStation: (station) => {
    set(s => ({
      pinnedStations: s.pinnedStations.includes(station)
        ? s.pinnedStations.filter(st => st !== station)
        : [...s.pinnedStations, station]
    }));
  },
}));

export { menuItems, salesHistory, staffMembers };
