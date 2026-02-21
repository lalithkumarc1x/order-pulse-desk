import { useEffect, useCallback, useRef, useState } from 'react';
import { useKmsStore } from '@/store/useKmsStore';
import StationColumn from '@/components/kds/StationColumn';
import PrepBoardView from '@/components/kds/PrepBoardView';
import OrderHistoryModal from '@/components/kds/OrderHistoryModal';
import VoidOrderDialog from '@/components/kds/VoidOrderDialog';
import OrderJourneyModal from '@/components/kds/OrderJourneyModal';
import { STATIONS } from '@/types';
import { Pause, Play, ArrowLeft, Wifi, WifiOff, LayoutGrid, Columns, Plus, History, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Order } from '@/types';

export default function KdsPage() {
  const { orders, selectedTicket, isPaused, isOnline, currentView, expandedStation, pinnedStations, markOrderDone, setSelectedTicket, rebalanceStation, setPaused, setOnline, simulateUpdates, setCurrentView, addSimulatedOrder, recallOrder } = useKmsStore();
  const chimeRef = useRef<AudioContext | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [voidOrderId, setVoidOrderId] = useState<string | null>(null);
  const [journeyOrderId, setJourneyOrderId] = useState<string | null>(null);

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

  const playOrderSound = useCallback((priority: Order['priority']) => {
    try {
      if (!chimeRef.current) chimeRef.current = new AudioContext();
      const ctx = chimeRef.current;
      
      if (priority === 'vip') {
        // VIP: Distinctive three-tone alert
        [800, 1000, 1200].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          osc.type = 'square';
          const startTime = ctx.currentTime + i * 0.15;
          gain.gain.setValueAtTime(0.4, startTime);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
          osc.start(startTime);
          osc.stop(startTime + 0.15);
        });
      } else if (priority === 'rush') {
        // Rush: Urgent rapid beeps
        [0, 0.12, 0.24].forEach((delay) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 1200;
          osc.type = 'sawtooth';
          const startTime = ctx.currentTime + delay;
          gain.gain.setValueAtTime(0.35, startTime);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
          osc.start(startTime);
          osc.stop(startTime + 0.1);
        });
      } else {
        // Normal: Gentle chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 660;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {}
  }, []);

  const handleSimulateOrder = useCallback(() => {
    const newOrder = addSimulatedOrder();
    playOrderSound(newOrder.priority);
  }, [addSimulatedOrder, playOrderSound]);

  const handleRecallLast = useCallback(() => {
    const completedOrders = orders
      .filter(o => o.status === 'done')
      .sort((a, b) => b.createdAt - a.createdAt);
    
    if (completedOrders.length > 0) {
      recallOrder(completedOrders[0].id);
    }
  }, [orders, recallOrder]);

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
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-muted rounded p-1">
            <button
              onClick={() => setCurrentView('station')}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                currentView === 'station' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Columns size={12} />
              Station
            </button>
            <button
              onClick={() => setCurrentView('prep')}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                currentView === 'prep' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid size={12} />
              Prep Board
            </button>
          </div>

          {/* Simulate Order Button */}
          <button
            onClick={handleSimulateOrder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/80 transition-colors"
          >
            <Plus size={14} />
            Simulate Order
          </button>

          {/* History Button */}
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <History size={14} />
            History
          </button>

          {/* Recall Last Button */}
          <button
            onClick={handleRecallLast}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            title="Recall last completed order"
          >
            <RotateCcw size={14} />
            Recall
          </button>

          <p className="text-xs text-muted-foreground hidden lg:block">
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Space</kbd> pause · 
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-1">Enter</kbd> done
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
      <div className="flex-1 overflow-hidden">
        {currentView === 'station' ? (
          <>
            {/* Backdrop when station is expanded */}
            {expandedStation && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30" />
            )}

            <div className="flex gap-2 overflow-x-auto p-2 h-full">
              {/* Render pinned stations first */}
              {pinnedStations.map(station => (
                <StationColumn
                  key={station}
                  station={station}
                  orders={orders.filter(o => o.station === station)}
                  selectedTicket={selectedTicket}
                  onSelectTicket={setSelectedTicket}
                  onMarkDone={(id) => { markOrderDone(id); playChime(); }}
                  onRebalance={() => rebalanceStation(station)}
                  onVoid={setVoidOrderId}
                  onShowJourney={setJourneyOrderId}
                />
              ))}

              {/* Render other stations (not pinned and not expanded, or is the expanded one) */}
              {STATIONS.filter(st => !pinnedStations.includes(st))
                .map(station => (
                  <StationColumn
                    key={station}
                    station={station}
                    orders={orders.filter(o => o.station === station)}
                    selectedTicket={selectedTicket}
                    onSelectTicket={setSelectedTicket}
                    onMarkDone={(id) => { markOrderDone(id); playChime(); }}
                    onRebalance={() => rebalanceStation(station)}
                    onVoid={setVoidOrderId}
                    onShowJourney={setJourneyOrderId}
                  />
                ))}
            </div>
          </>
        ) : (
          <PrepBoardView
            orders={orders}
            selectedTicket={selectedTicket}
            onSelectTicket={setSelectedTicket}
            onMarkDone={(id) => { markOrderDone(id); playChime(); }}
            onVoid={setVoidOrderId}
            onShowJourney={setJourneyOrderId}
          />
        )}
      </div>

      {/* Order History Modal */}
      <OrderHistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} />

      {/* Void Order Dialog */}
      <VoidOrderDialog
        orderId={voidOrderId}
        isOpen={voidOrderId !== null}
        onClose={() => setVoidOrderId(null)}
      />

      {/* Order Journey Modal */}
      <OrderJourneyModal
        orderId={journeyOrderId}
        isOpen={journeyOrderId !== null}
        onClose={() => setJourneyOrderId(null)}
      />
    </div>
  );
}
