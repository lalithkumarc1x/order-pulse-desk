import { useEffect, useCallback, useRef } from 'react';
import { useKmsStore } from '@/store/useKmsStore';
import StationColumn from '@/components/kds/StationColumn';
import { STATIONS } from '@/types';
import { Pause, Play, ArrowLeft, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function KdsPage() {
  const { orders, selectedTicket, isPaused, isOnline, markOrderDone, setSelectedTicket, rebalanceStation, setPaused, setOnline, simulateUpdates } = useKmsStore();
  const chimeRef = useRef<AudioContext | null>(null);

  const playChime = useCallback(() => {
    try {
      if (!chimeRef.current) chimeRef.current = new AudioContext();
      const ctx = chimeRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    if (e.code === 'Space') {
      e.preventDefault();
      setPaused(!isPaused);
    } else if (e.code === 'Enter' && selectedTicket) {
      e.preventDefault();
      markOrderDone(selectedTicket);
      playChime();
      setSelectedTicket(null);
    } else if (e.key >= '1' && e.key <= '5') {
      const stationIdx = parseInt(e.key) - 1;
      if (stationIdx < STATIONS.length) {
        const stationOrders = orders
          .filter(o => o.station === STATIONS[stationIdx] && o.status !== 'done' && o.status !== 'cancelled')
          .sort((a, b) => a.createdAt - b.createdAt);
        if (stationOrders.length > 0) {
          setSelectedTicket(stationOrders[0].id);
        }
      }
    }
  }, [isPaused, selectedTicket, orders, markOrderDone, setSelectedTicket, setPaused, playChime]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {!isOnline && (
        <div className="bg-destructive text-destructive-foreground px-4 py-2 text-center text-sm font-bold animate-pulse-alert">
          ⚠ OFFLINE MODE — Changes saved locally
        </div>
      )}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/orders" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-lg font-bold text-foreground">Kitchen Display</h1>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {isOnline ? <Wifi size={12} className="text-primary" /> : <WifiOff size={12} className="text-destructive" />}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-xs text-muted-foreground hidden sm:block">
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Space</kbd> pause · 
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-1">Enter</kbd> done · 
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-1">1-5</kbd> station
          </p>
          <button
            onClick={() => setPaused(!isPaused)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              isPaused ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>
      <div className="flex-1 flex gap-2 overflow-x-auto p-2">
        {STATIONS.map(station => (
          <StationColumn
            key={station}
            station={station}
            orders={orders.filter(o => o.station === station)}
            selectedTicket={selectedTicket}
            onSelectTicket={setSelectedTicket}
            onMarkDone={(id) => { markOrderDone(id); playChime(); }}
            onRebalance={() => rebalanceStation(station)}
          />
        ))}
      </div>
    </div>
  );
}
