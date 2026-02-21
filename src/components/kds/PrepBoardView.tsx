import { useMemo } from 'react';
import type { Order } from '@/types';
import { menuItems, useKmsStore } from '@/store/useKmsStore';
import { Package, ChefHat, Clock } from 'lucide-react';
import OrderTicket from './OrderTicket';

interface Props {
  orders: Order[];
  selectedTicket: string | null;
  onSelectTicket: (id: string) => void;
  onMarkDone: (id: string) => void;
  onVoid: (id: string) => void;
  onShowJourney: (id: string) => void;
}

export default function PrepBoardView({ orders, selectedTicket, onSelectTicket, onMarkDone, onVoid, onShowJourney }: Props) {
  const ingredients = useKmsStore(s => s.ingredients);
  
  // Get all active orders (pending + in-progress)
  const activeOrders = useMemo(() => {
    return orders
      .filter(o => o.status === 'pending' || o.status === 'in-progress')
      .sort((a, b) => {
        // Sort by priority first (vip > rush > normal)
        const priorityOrder = { vip: 0, rush: 1, normal: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        // Then by creation time (oldest first)
        return a.createdAt - b.createdAt;
      });
  }, [orders]);

  // Group all menu items across all active orders
  const itemCounts = useMemo(() => {
    const itemMap = new Map<string, { name: string; quantity: number; category: string }>();
    
    activeOrders.forEach(order => {
      order.items.forEach(item => {
        const menuItem = menuItems.find(m => m.id === item.menuItemId);
        if (!menuItem) return;
        
        const existing = itemMap.get(item.menuItemId);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          itemMap.set(item.menuItemId, {
            name: menuItem.name,
            quantity: item.quantity,
            category: menuItem.category,
          });
        }
      });
    });
    
    return Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity);
  }, [activeOrders]);

  // Calculate ingredient totals
  const ingredientTotals = useMemo(() => {
    const ingredientMap = new Map<string, number>();
    
    activeOrders.forEach(order => {
      order.items.forEach(item => {
        const menuItem = menuItems.find(m => m.id === item.menuItemId);
        if (!menuItem) return;
        
        menuItem.ingredients.forEach(req => {
          const totalQty = req.quantity * item.quantity;
          const existing = ingredientMap.get(req.ingredientId);
          ingredientMap.set(req.ingredientId, (existing || 0) + totalQty);
        });
      });
    });

    return Array.from(ingredientMap.entries())
      .map(([id, quantity]) => {
        const ingredient = ingredients.find(i => i.id === id);
        return {
          id,
          name: ingredient?.name || id,
          quantity,
          unit: ingredient?.unit || 'units',
        };
      })
      .sort((a, b) => b.quantity - a.quantity);
  }, [activeOrders, ingredients]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Main Content: Two Panes */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Items List */}
        <div className="w-80 border-r-2 border-border flex flex-col bg-muted/20">
          <div className="px-4 py-3 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <ChefHat size={18} className="text-primary" />
              <h3 className="font-bold text-sm text-foreground">Items to Prepare</h3>
              <span className="ml-auto text-xs text-muted-foreground">({itemCounts.length})</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3">
            {itemCounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No items
              </div>
            ) : (
              <div className="space-y-2">
                {itemCounts.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-foreground leading-tight mb-0.5">
                          {item.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <span className="font-bold font-mono-data text-base">{item.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Orders Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              <h3 className="font-bold text-sm text-foreground">Active Orders</h3>
              <span className="ml-auto text-xs text-muted-foreground">({activeOrders.length} orders)</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {activeOrders.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Clock size={48} className="mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground text-lg">No active orders</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                {activeOrders.map(order => (
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
      </div>

      {/* Bottom: Ingredient Requirements - Scrollable */}
      <div className="border-t-2 border-border bg-card">
        <div className="px-4 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-primary" />
            <h3 className="font-bold text-xs text-foreground">Ingredient Requirements</h3>
            <span className="text-xs text-muted-foreground">({ingredientTotals.length})</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <div className="px-4 py-3">
            {ingredientTotals.length === 0 ? (
              <div className="text-center py-2 text-muted-foreground text-xs">
                No ingredients needed
              </div>
            ) : (
              <div className="flex gap-2 pb-1">
                {ingredientTotals.map(ingredient => (
                  <div
                    key={ingredient.id}
                    className="flex-shrink-0 bg-muted/50 border border-border rounded px-3 py-2 min-w-[120px] hover:bg-muted transition-colors"
                  >
                    <div className="font-medium text-foreground text-xs mb-0.5 truncate" title={ingredient.name}>
                      {ingredient.name}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono-data font-bold text-sm text-primary">
                        {ingredient.quantity.toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">{ingredient.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
