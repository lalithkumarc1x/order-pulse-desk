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

  markOrderDone: (orderId: string) => void;
  markItemDone: (orderId: string, itemIndex: number) => void;
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
}

export const useKmsStore = create<KmsState>((set, get) => ({
  orders: initialOrders,
  ingredients: [...initialIngredients],
  purchaseOrders: [],
  isOnline: navigator.onLine,
  isPaused: false,
  selectedTicket: null,

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
        const newItems = o.items.map((item, idx) => idx === itemIndex ? { ...item, done: true } : item);
        const allDone = newItems.every(i => i.done);
        if (allDone) {
          const order = { ...o, items: newItems, status: 'done' as const };
          get().deductIngredients(order);
          return order;
        }
        return { ...o, items: newItems, status: 'in-progress' as const };
      });
      return { orders: newOrders };
    });
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
}));

export { menuItems, salesHistory, staffMembers };
