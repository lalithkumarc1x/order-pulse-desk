import { useEffect, useCallback, useRef } from 'react';
import { useKmsStore } from '@/store/useKmsStore';
import StationColumn from '@/components/kds/StationColumn';
import { STATIONS } from '@/types';
import { Pause, Play } from 'lucide-react';

export default function KdsPage() {
  const { orders, selectedTicket, isPaused, markOrderDone, setSelectedTicket, rebalanceStation, setPaused } = useKmsStore();
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

  return (
    <div className="p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Kitchen Display</h1>
          <p className="text-xs text-muted-foreground">
            Keys: <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Space</kbd> pause · 
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-1">Enter</kbd> done · 
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-1">1-5</kbd> jump station
          </p>
        </div>
        <button
          onClick={() => setPaused(!isPaused)}
          className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
            isPaused ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'
          }`}
        >
          {isPaused ? <Play size={16} /> : <Pause size={16} />}
          {isPaused ? 'Resume' : 'Pause'}
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4">
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
