import type { MenuItem, Order, Ingredient, StaffMember, SalesRecord, OrderAction } from '@/types';

export const menuItems: MenuItem[] = [
  { id: 'm1', name: 'Classic Burger', category: 'Grill', price: 14.99, prepTime: 12, ingredients: [{ ingredientId: 'i1', quantity: 1 }, { ingredientId: 'i2', quantity: 2 }, { ingredientId: 'i5', quantity: 0.15 }, { ingredientId: 'i6', quantity: 0.1 }] },
  { id: 'm2', name: 'Caesar Salad', category: 'Salad', price: 11.99, prepTime: 8, ingredients: [{ ingredientId: 'i3', quantity: 0.2 }, { ingredientId: 'i7', quantity: 0.1 }, { ingredientId: 'i10', quantity: 0.05 }] },
  { id: 'm3', name: 'Grilled Salmon', category: 'Grill', price: 22.99, prepTime: 18, ingredients: [{ ingredientId: 'i4', quantity: 0.25 }, { ingredientId: 'i8', quantity: 0.1 }, { ingredientId: 'i11', quantity: 0.05 }] },
  { id: 'm4', name: 'Margherita Pizza', category: 'Expo', price: 13.99, prepTime: 15, ingredients: [{ ingredientId: 'i9', quantity: 0.3 }, { ingredientId: 'i5', quantity: 0.2 }, { ingredientId: 'i12', quantity: 0.15 }] },
  { id: 'm5', name: 'Chicken Wings', category: 'Fry', price: 12.49, prepTime: 14, ingredients: [{ ingredientId: 'i13', quantity: 0.4 }, { ingredientId: 'i14', quantity: 0.1 }] },
  { id: 'm6', name: 'Pasta Carbonara', category: 'Expo', price: 16.99, prepTime: 12, ingredients: [{ ingredientId: 'i15', quantity: 0.2 }, { ingredientId: 'i16', quantity: 0.1 }, { ingredientId: 'i5', quantity: 0.15 }] },
  { id: 'm7', name: 'Fish & Chips', category: 'Fry', price: 15.49, prepTime: 13, ingredients: [{ ingredientId: 'i17', quantity: 0.3 }, { ingredientId: 'i18', quantity: 0.2 }, { ingredientId: 'i14', quantity: 0.15 }] },
  { id: 'm8', name: 'Garden Salad', category: 'Salad', price: 9.99, prepTime: 6, ingredients: [{ ingredientId: 'i3', quantity: 0.15 }, { ingredientId: 'i19', quantity: 0.1 }, { ingredientId: 'i10', quantity: 0.03 }] },
  { id: 'm9', name: 'Steak Frites', category: 'Grill', price: 28.99, prepTime: 20, ingredients: [{ ingredientId: 'i20', quantity: 0.35 }, { ingredientId: 'i18', quantity: 0.2 }, { ingredientId: 'i8', quantity: 0.05 }] },
  { id: 'm10', name: 'Chocolate Lava Cake', category: 'Dessert', price: 10.99, prepTime: 15, ingredients: [{ ingredientId: 'i5', quantity: 0.1 }, { ingredientId: 'i6', quantity: 0.15 }] },
  { id: 'm11', name: 'Tiramisu', category: 'Dessert', price: 9.49, prepTime: 5, ingredients: [{ ingredientId: 'i5', quantity: 0.08 }, { ingredientId: 'i16', quantity: 0.05 }] },
  { id: 'm12', name: 'Mushroom Risotto', category: 'Expo', price: 17.49, prepTime: 22, ingredients: [{ ingredientId: 'i8', quantity: 0.15 }, { ingredientId: 'i5', quantity: 0.1 }, { ingredientId: 'i11', quantity: 0.05 }] },
];

export const ingredients: Ingredient[] = [
  { id: 'i1', name: 'Beef Patty', unit: 'pc', stock: 80, par: 30, unitCost: 3.20, category: 'Protein' },
  { id: 'i2', name: 'Burger Bun', unit: 'pc', stock: 90, par: 30, unitCost: 0.60, category: 'Bakery' },
  { id: 'i3', name: 'Romaine Lettuce', unit: 'kg', stock: 12, par: 5, unitCost: 4.50, category: 'Produce' },
  { id: 'i4', name: 'Salmon Fillet', unit: 'kg', stock: 8, par: 4, unitCost: 18.00, category: 'Protein' },
  { id: 'i5', name: 'Cheese Blend', unit: 'kg', stock: 15, par: 5, unitCost: 9.00, category: 'Dairy' },
  { id: 'i6', name: 'Eggs', unit: 'dz', stock: 20, par: 8, unitCost: 4.00, category: 'Dairy' },
  { id: 'i7', name: 'Croutons', unit: 'kg', stock: 6, par: 3, unitCost: 5.50, category: 'Dry Goods' },
  { id: 'i8', name: 'Butter', unit: 'kg', stock: 10, par: 4, unitCost: 7.00, category: 'Dairy' },
  { id: 'i9', name: 'Pizza Dough', unit: 'pc', stock: 40, par: 15, unitCost: 1.80, category: 'Bakery' },
  { id: 'i10', name: 'Olive Oil', unit: 'L', stock: 8, par: 3, unitCost: 12.00, category: 'Dry Goods' },
  { id: 'i11', name: 'Garlic', unit: 'kg', stock: 5, par: 2, unitCost: 6.00, category: 'Produce' },
  { id: 'i12', name: 'Tomato Sauce', unit: 'L', stock: 12, par: 5, unitCost: 3.50, category: 'Dry Goods' },
  { id: 'i13', name: 'Chicken Wings', unit: 'kg', stock: 18, par: 8, unitCost: 5.80, category: 'Protein' },
  { id: 'i14', name: 'Frying Oil', unit: 'L', stock: 25, par: 10, unitCost: 2.50, category: 'Dry Goods' },
  { id: 'i15', name: 'Spaghetti', unit: 'kg', stock: 14, par: 5, unitCost: 2.20, category: 'Dry Goods' },
  { id: 'i16', name: 'Heavy Cream', unit: 'L', stock: 8, par: 3, unitCost: 5.50, category: 'Dairy' },
  { id: 'i17', name: 'Cod Fillet', unit: 'kg', stock: 10, par: 4, unitCost: 14.00, category: 'Protein' },
  { id: 'i18', name: 'Potatoes', unit: 'kg', stock: 30, par: 10, unitCost: 1.80, category: 'Produce' },
  { id: 'i19', name: 'Tomatoes', unit: 'kg', stock: 10, par: 4, unitCost: 3.00, category: 'Produce' },
  { id: 'i20', name: 'Ribeye Steak', unit: 'kg', stock: 12, par: 5, unitCost: 28.00, category: 'Protein' },
];

const stations = ['Grill', 'Fry', 'Salad', 'Expo', 'Dessert'];
const types: Order['type'][] = ['dine-in', 'takeout', 'delivery'];
const priorities: Order['priority'][] = ['normal', 'normal', 'normal', 'rush', 'vip'];

function generateOrders(): Order[] {
  const now = Date.now();
  const orders: Order[] = [];
  for (let i = 1; i <= 50; i++) {
    const numItems = Math.floor(Math.random() * 3) + 1;
    const items = Array.from({ length: numItems }, () => ({
      menuItemId: menuItems[Math.floor(Math.random() * menuItems.length)].id,
      quantity: Math.floor(Math.random() * 2) + 1,
      notes: Math.random() > 0.7 ? ['No onion', 'Extra sauce', 'Well done', 'Allergy: nuts'][Math.floor(Math.random() * 4)] : undefined,
    }));
    const stationForOrder = items.length > 0
      ? menuItems.find(m => m.id === items[0].menuItemId)?.category || 'Expo'
      : 'Expo';

    const createdAt = now - Math.floor(Math.random() * 3600000);
    const status: Order['status'] = i <= 20 ? 'pending' : i <= 35 ? 'in-progress' : 'done';
    const station = stations.includes(stationForOrder) ? stationForOrder : 'Expo';

    // Generate action history
    const actionHistory: OrderAction[] = [
      {
        timestamp: createdAt,
        action: 'created',
        station
      }
    ];

    // If in-progress or done, add started action
    if (status === 'in-progress' || status === 'done') {
      actionHistory.push({
        timestamp: createdAt + Math.floor(Math.random() * 300000), // 0-5 minutes after creation
        action: 'started',
        station
      });
    }

    // If done, add completed action
    if (status === 'done') {
      actionHistory.push({
        timestamp: createdAt + Math.floor(Math.random() * 600000) + 300000, // 5-15 minutes after creation
        action: 'completed',
        station
      });
    }

    orders.push({
      id: `ORD-${String(i).padStart(3, '0')}`,
      items,
      station,
      status,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      createdAt,
      slaMinutes: [10, 12, 15, 20][Math.floor(Math.random() * 4)],
      tableNumber: Math.random() > 0.3 ? Math.floor(Math.random() * 20) + 1 : undefined,
      type: types[Math.floor(Math.random() * types.length)],
      actionHistory
    });
  }
  return orders;
}

export const initialOrders = generateOrders();

export const staffMembers: StaffMember[] = [
  { id: 's1', name: 'Marco Rivera', role: 'Head Chef', hourlyRate: 32, schedule: { Mon: ['08:00-16:00'], Tue: ['08:00-16:00'], Wed: ['08:00-16:00'], Thu: ['08:00-16:00'], Fri: ['08:00-16:00'] } },
  { id: 's2', name: 'Sarah Kim', role: 'Sous Chef', hourlyRate: 26, schedule: { Mon: ['10:00-18:00'], Tue: ['10:00-18:00'], Wed: ['10:00-18:00'], Thu: ['10:00-18:00'], Fri: ['10:00-18:00'], Sat: ['10:00-18:00'] } },
  { id: 's3', name: 'Jake Thompson', role: 'Line Cook', hourlyRate: 18, schedule: { Mon: ['06:00-14:00'], Tue: ['06:00-14:00'], Wed: ['06:00-14:00'], Fri: ['06:00-14:00'], Sat: ['06:00-14:00'] } },
  { id: 's4', name: 'Maria Garcia', role: 'Line Cook', hourlyRate: 18, schedule: { Tue: ['14:00-22:00'], Wed: ['14:00-22:00'], Thu: ['14:00-22:00'], Fri: ['14:00-22:00'], Sat: ['14:00-22:00'] } },
  { id: 's5', name: 'Alex Chen', role: 'Prep Cook', hourlyRate: 16, schedule: { Mon: ['06:00-14:00'], Tue: ['06:00-14:00'], Wed: ['06:00-14:00'], Thu: ['06:00-14:00'], Fri: ['06:00-14:00'] } },
  { id: 's6', name: 'Jordan Davis', role: 'Dishwasher', hourlyRate: 14, schedule: { Mon: ['10:00-18:00'], Wed: ['10:00-18:00'], Fri: ['10:00-18:00'], Sat: ['10:00-18:00'], Sun: ['10:00-18:00'] } },
  { id: 's7', name: 'Priya Patel', role: 'Pastry Chef', hourlyRate: 22, schedule: { Mon: ['06:00-14:00'], Tue: ['06:00-14:00'], Wed: ['06:00-14:00'], Thu: ['06:00-14:00'] } },
  { id: 's8', name: 'Chris Nguyen', role: 'Expeditor', hourlyRate: 20, schedule: { Wed: ['14:00-22:00'], Thu: ['14:00-22:00'], Fri: ['14:00-22:00'], Sat: ['14:00-22:00'], Sun: ['14:00-22:00'] } },
];

export const salesHistory: SalesRecord[] = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (6 - i));
  const base = 2800 + Math.random() * 1200;
  return {
    date: d.toISOString().split('T')[0],
    revenue: Math.round(base * 100) / 100,
    orders: Math.floor(60 + Math.random() * 40),
    profit: Math.round(base * (0.18 + Math.random() * 0.12) * 100) / 100,
    topItems: menuItems.slice(0, 5).map(m => ({
      menuItemId: m.id,
      quantity: Math.floor(8 + Math.random() * 20),
      revenue: Math.round(m.price * (8 + Math.random() * 20) * 100) / 100,
    })),
  };
});
