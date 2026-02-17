import { useState, useMemo } from 'react';
import { useKmsStore, menuItems } from '@/store/useKmsStore';
import { Package, AlertTriangle, Plus, X, DollarSign } from 'lucide-react';

export default function InventoryPage() {
  const { ingredients, purchaseOrders, adjustStock, createPO } = useKmsStore();
  const [adjustModal, setAdjustModal] = useState<string | null>(null);
  const [adjustDelta, setAdjustDelta] = useState(0);
  const [showCosts, setShowCosts] = useState(false);

  const lowStockItems = ingredients.filter(i => i.stock < i.par);

  const dishCosts = useMemo(() =>
    menuItems.map(mi => {
      const cost = mi.ingredients.reduce((sum, req) => {
        const ing = ingredients.find(i => i.id === req.ingredientId);
        return sum + (ing ? ing.unitCost * req.quantity : 0);
      }, 0);
      return { ...mi, cost, margin: mi.price - cost };
    }), [ingredients]);

  const handleAdjust = () => {
    if (adjustModal && adjustDelta !== 0) {
      adjustStock(adjustModal, adjustDelta);
    }
    setAdjustModal(null);
    setAdjustDelta(0);
  };

  const suggestedReorder = (ing: typeof ingredients[0]) =>
    Math.max(0, Math.ceil((ing.par - ing.stock) * 1.5));

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">Inventory</h1>
        <button onClick={() => setShowCosts(!showCosts)}
          className="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded text-sm hover:bg-muted transition-colors">
          <DollarSign size={16} />
          {showCosts ? 'Hide' : 'Show'} Dish Costs
        </button>
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-destructive text-sm font-medium mb-2">
            <AlertTriangle size={16} /> Low Stock Alert — {lowStockItems.length} item(s) below par
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map(i => (
              <span key={i.id} className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded">
                {i.name}: {i.stock.toFixed(1)} / {i.par} {i.unit} — Reorder: {suggestedReorder(i)} {i.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
        {ingredients.map(ing => {
          const isLow = ing.stock < ing.par;
          return (
            <div key={ing.id} className={`bg-card border rounded-lg p-4 ${isLow ? 'border-destructive/50' : 'border-border'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm text-card-foreground">{ing.name}</h3>
                <span className="text-xs text-muted-foreground">{ing.category}</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="font-mono-data text-lg font-bold text-card-foreground">
                    {ing.stock.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">/ {ing.par} {ing.unit} par</div>
                </div>
                <div className="text-xs text-muted-foreground">${ing.unitCost.toFixed(2)}/{ing.unit}</div>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                <div
                  className={`h-1.5 rounded-full transition-all ${isLow ? 'bg-destructive' : 'bg-primary'}`}
                  style={{ width: `${Math.min(100, (ing.stock / ing.par) * 100)}%` }}
                />
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => { setAdjustModal(ing.id); setAdjustDelta(0); }}
                  className="flex-1 text-xs bg-secondary text-secondary-foreground py-1.5 rounded hover:bg-muted transition-colors">
                  Adjust
                </button>
                <button onClick={() => createPO(ing.id, suggestedReorder(ing))}
                  className="flex-1 text-xs bg-primary text-primary-foreground py-1.5 rounded hover:bg-primary/80 transition-colors flex items-center justify-center gap-1">
                  <Plus size={12} /> PO
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showCosts && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-foreground mb-3">Per-Dish Cost Analysis</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dishCosts.map(d => (
              <div key={d.id} className="bg-card border border-border rounded-lg p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Cost: <span className="font-mono-data">${d.cost.toFixed(2)}</span></p>
                  <p className="text-xs text-muted-foreground">Price: <span className="font-mono-data">${d.price.toFixed(2)}</span></p>
                  <p className={`text-sm font-bold font-mono-data ${d.margin > 0 ? 'text-success' : 'text-destructive'}`}>
                    ${d.margin.toFixed(2)} margin
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {purchaseOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3">Purchase Orders</h2>
          <div className="space-y-2">
            {purchaseOrders.map(po => {
              const ing = ingredients.find(i => i.id === po.ingredientId);
              return (
                <div key={po.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <span className="font-mono-data text-sm font-bold text-card-foreground">{po.id}</span>
                    <span className="ml-2 text-sm text-muted-foreground">{ing?.name} — {po.quantity} {ing?.unit}</span>
                  </div>
                  <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded capitalize">{po.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {adjustModal && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50" onClick={() => setAdjustModal(null)}>
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-card-foreground">Adjust Stock</h2>
              <button onClick={() => setAdjustModal(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {ingredients.find(i => i.id === adjustModal)?.name} — Current: {ingredients.find(i => i.id === adjustModal)?.stock.toFixed(1)}
            </p>
            <input
              type="number"
              value={adjustDelta}
              onChange={e => setAdjustDelta(Number(e.target.value))}
              placeholder="Enter +/- amount"
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground mb-4 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button onClick={handleAdjust}
              className="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:bg-primary/80 transition-colors">
              Apply Adjustment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
