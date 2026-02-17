import { useState, useMemo } from 'react';
import { useKmsStore, menuItems, salesHistory } from '@/store/useKmsStore';
import KpiCard from '@/components/dashboard/KpiCard';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Clock, TrendingUp, AlertTriangle, ChefHat, X, Lightbulb, Percent } from 'lucide-react';

export default function DashboardPage() {
  const { orders, ingredients } = useKmsStore();
  const [whatIf, setWhatIf] = useState(false);
  const [promoPercent, setPromoPercent] = useState(10);
  const [prepApplied, setPrepApplied] = useState(false);

  const activeOrders = orders.filter(o => o.status !== 'done' && o.status !== 'cancelled');
  const doneOrders = orders.filter(o => o.status === 'done');

  const totalRevenue = doneOrders.reduce((sum, o) =>
    sum + o.items.reduce((s, i) => {
      const mi = menuItems.find(m => m.id === i.menuItemId);
      return s + (mi ? mi.price * i.quantity : 0);
    }, 0), 0);

  const onTimePct = doneOrders.length > 0
    ? (doneOrders.filter(o => {
        const elapsed = (Date.now() - o.createdAt) / 60000;
        return elapsed <= o.slaMinutes;
      }).length / doneOrders.length * 100)
    : 100;

  const profitPerHour = totalRevenue * 0.22;
  const avgTicketTime = doneOrders.length > 0
    ? doneOrders.reduce((s, o) => s + (Date.now() - o.createdAt) / 60000, 0) / doneOrders.length
    : 0;

  const lowStock = ingredients.filter(i => i.stock < i.par);

  const itemMargins = useMemo(() =>
    menuItems.map(mi => {
      const cost = mi.ingredients.reduce((s, r) => {
        const ing = ingredients.find(i => i.id === r.ingredientId);
        return s + (ing ? ing.unitCost * r.quantity : 0);
      }, 0);
      const sold = doneOrders.reduce((s, o) =>
        s + o.items.filter(i => i.menuItemId === mi.id).reduce((ss, i) => ss + i.quantity, 0), 0);
      return { name: mi.name.split(' ').slice(0, 2).join(' '), margin: mi.price - cost, sold, revenue: sold * mi.price };
    }).sort((a, b) => b.margin * b.sold - a.margin * a.sold).slice(0, 6),
    [ingredients, doneOrders]);

  const projectedProfit = totalRevenue * 0.22 * (1 - promoPercent / 100) + (totalRevenue * promoPercent / 100 * 0.15);

  const prepSuggestions = [
    { item: 'Burger Patties', qty: 20, reason: 'Lunch rush forecast', delay: '12min' },
    { item: 'Pizza Dough', qty: 15, reason: 'Weekend peak', delay: '18min' },
    { item: 'Caesar Dressing', qty: 8, reason: 'Trend increase', delay: '5min' },
  ];

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-foreground mb-4">Owner Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard title="Profit/Hour" value={`$${profitPerHour.toFixed(0)}`} change={5.2} icon={<DollarSign size={20} />} />
        <KpiCard title="On-Time %" value={`${onTimePct.toFixed(1)}%`} change={onTimePct > 90 ? 2.1 : -3.4} icon={<Clock size={20} />} />
        <KpiCard title="Active Orders" value={String(activeOrders.length)} icon={<TrendingUp size={20} />} subtitle="across all stations" />
        <KpiCard title="Revenue Today" value={`$${totalRevenue.toFixed(0)}`} change={8.7} icon={<DollarSign size={20} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-medium text-card-foreground mb-3">7-Day Revenue</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={salesHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(215 12% 55%)' }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(215 12% 55%)' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(220 22% 12%)', border: '1px solid hsl(220 15% 20%)', borderRadius: 8, color: 'hsl(210 20% 92%)' }} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(173 58% 39%)" strokeWidth={2} dot={{ r: 4, fill: 'hsl(173 58% 39%)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-medium text-card-foreground mb-3">Top Items by Margin × Volume</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={itemMargins}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(215 12% 55%)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(215 12% 55%)' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(220 22% 12%)', border: '1px solid hsl(220 15% 20%)', borderRadius: 8, color: 'hsl(210 20% 92%)' }} />
              <Bar dataKey="margin" fill="hsl(38 92% 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Alerts Feed */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-medium text-card-foreground mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-accent" /> Alerts
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {lowStock.length > 0 && lowStock.map(i => (
              <div key={i.id} className="text-xs bg-destructive/10 border border-destructive/20 rounded p-2 text-destructive">
                ⚠ {i.name} stock at {i.stock.toFixed(1)}/{i.par} {i.unit}
              </div>
            ))}
            {activeOrders.length > 15 && (
              <div className="text-xs bg-accent/10 border border-accent/20 rounded p-2 text-accent">
                High order volume: {activeOrders.length} active tickets
              </div>
            )}
            {onTimePct < 85 && (
              <div className="text-xs bg-destructive/10 border border-destructive/20 rounded p-2 text-destructive">
                On-time rate below target: {onTimePct.toFixed(1)}%
              </div>
            )}
            {lowStock.length === 0 && activeOrders.length <= 15 && onTimePct >= 85 && (
              <div className="text-xs text-muted-foreground text-center py-4">All clear ✓</div>
            )}
          </div>
        </div>

        {/* Prep Suggestion (AI) */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-medium text-card-foreground mb-3 flex items-center gap-2">
            <ChefHat size={16} className="text-primary" /> AI Prep Suggestions
          </h3>
          <div className="space-y-2">
            {prepSuggestions.map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-muted/50 rounded p-2">
                <div>
                  <p className="text-sm text-card-foreground">{s.qty}× {s.item}</p>
                  <p className="text-xs text-muted-foreground">{s.reason} • saves {prepApplied ? '0min' : s.delay}</p>
                </div>
                {!prepApplied && (
                  <button onClick={() => setPrepApplied(true)}
                    className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/80 transition-colors">
                    Apply
                  </button>
                )}
              </div>
            ))}
            {prepApplied && (
              <p className="text-xs text-success text-center mt-2">✓ Prep applied — forecast delay reduced</p>
            )}
          </div>
        </div>

        {/* What-If */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-medium text-card-foreground mb-3 flex items-center gap-2">
            <Lightbulb size={16} className="text-accent" /> What-If Scenario
          </h3>
          <p className="text-xs text-muted-foreground mb-3">Adjust promo discount to see projected impact</p>
          <div className="flex items-center gap-3 mb-3">
            <Percent size={14} className="text-muted-foreground" />
            <input
              type="range"
              min="0"
              max="50"
              value={promoPercent}
              onChange={e => setPromoPercent(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="font-mono-data text-sm text-card-foreground w-10 text-right">{promoPercent}%</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Current profit</span>
              <span className="font-mono-data text-card-foreground">${(totalRevenue * 0.22).toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Projected w/ {promoPercent}% promo</span>
              <span className={`font-mono-data ${projectedProfit < totalRevenue * 0.22 ? 'text-destructive' : 'text-success'}`}>
                ${projectedProfit.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Impact</span>
              <span className={`font-mono-data ${projectedProfit - totalRevenue * 0.22 < 0 ? 'text-destructive' : 'text-success'}`}>
                {projectedProfit - totalRevenue * 0.22 >= 0 ? '+' : ''}{(projectedProfit - totalRevenue * 0.22).toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
