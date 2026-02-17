import { NavLink, Outlet } from 'react-router-dom';
import { Monitor, ClipboardList, Package, BarChart3, Calendar, Wifi, WifiOff } from 'lucide-react';
import { useKmsStore } from '@/store/useKmsStore';
import { useEffect } from 'react';

const navItems = [
  { to: '/kds', icon: Monitor, label: 'KDS' },
  { to: '/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/dashboard', icon: BarChart3, label: 'Dashboard' },
  { to: '/scheduler', icon: Calendar, label: 'Scheduler' },
];

export default function AppLayout() {
  const { isOnline, setOnline, simulateUpdates } = useKmsStore();

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const interval = setInterval(simulateUpdates, 3000);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [setOnline, simulateUpdates]);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-16 lg:w-48 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
        <div className="p-3 lg:p-4 border-b border-sidebar-border">
          <h1 className="hidden lg:block text-lg font-bold text-sidebar-primary">KitchenOS</h1>
          <Monitor className="lg:hidden text-sidebar-primary mx-auto" size={24} />
        </div>
        <nav className="flex-1 py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 lg:px-4 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary border-r-2 border-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`
              }
            >
              <Icon size={20} className="shrink-0 mx-auto lg:mx-0" />
              <span className="hidden lg:inline">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border flex items-center justify-center lg:justify-start gap-2 text-xs text-sidebar-foreground">
          {isOnline ? <Wifi size={14} className="text-success" /> : <WifiOff size={14} className="text-destructive" />}
          <span className="hidden lg:inline">{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        {!isOnline && (
          <div className="bg-destructive text-destructive-foreground px-4 py-2 text-center text-sm font-bold animate-pulse-alert">
            ⚠ OFFLINE MODE — Changes saved locally
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
