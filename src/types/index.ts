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
