export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  ingredients: { ingredientId: string; quantity: number }[];
  prepTime: number;
}

export interface OrderItem {
  menuItemId: string;
  quantity: number;
  notes?: string;
  done?: boolean;
  startedAt?: number;      // When item prep started
  completedAt?: number;    // When item was marked done
}

export interface OrderAction {
  timestamp: number;
  action: 'created' | 'started' | 'item_started' | 'item_completed' | 'completed' | 'cancelled' | 'voided' | 'recalled';
  itemIndex?: number;       // For item-specific actions
  userId?: string;          // Future: track who performed action
  station?: string;         // Track station when action occurred
  reason?: string;          // For void/cancel actions
}

export interface Order {
  id: string;
  items: OrderItem[];
  station: string;
  status: 'pending' | 'in-progress' | 'done' | 'cancelled';
  priority: 'normal' | 'rush' | 'vip';
  createdAt: number;
  slaMinutes: number;
  tableNumber?: number;
  type: 'dine-in' | 'takeout' | 'delivery';
  actionHistory?: OrderAction[];  // Complete audit trail
  voidedAt?: number;              // When order was voided
  voidReason?: string;            // Why order was voided
  voidedBy?: string;              // Who voided it (future)
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stock: number;
  par: number;
  unitCost: number;
  category: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  hourlyRate: number;
  schedule: Record<string, string[]>;
}

export interface SalesRecord {
  date: string;
  revenue: number;
  orders: number;
  profit: number;
  topItems: { menuItemId: string; quantity: number; revenue: number }[];
}

export interface PurchaseOrder {
  id: string;
  ingredientId: string;
  quantity: number;
  status: 'pending' | 'ordered' | 'received';
  createdAt: number;
}

export const STATIONS = ['Grill', 'Fry', 'Salad', 'Expo', 'Dessert'] as const;
export type Station = typeof STATIONS[number];
