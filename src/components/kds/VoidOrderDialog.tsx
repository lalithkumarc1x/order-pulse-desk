import { useState } from 'react';
import { useKmsStore } from '@/store/useKmsStore';
import { XCircle, X } from 'lucide-react';

interface Props {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function VoidOrderDialog({ orderId, isOpen, onClose }: Props) {
  const [reason, setReason] = useState('');
  const voidOrder = useKmsStore(s => s.voidOrder);

  const handleVoid = () => {
    if (orderId && reason.trim()) {
      voidOrder(orderId, reason.trim());
      setReason('');
      onClose();
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border-2 border-border rounded-lg shadow-2xl w-full max-w-md m-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <XCircle size={20} className="text-destructive" />
            <h2 className="text-xl font-bold text-foreground">Void Order</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Order ID</p>
            <p className="text-lg font-mono-data font-semibold text-foreground">{orderId}</p>
          </div>

          <div>
            <label htmlFor="void-reason" className="text-sm font-medium text-foreground mb-2 block">
              Reason for voiding <span className="text-destructive">*</span>
            </label>
            <textarea
              id="void-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Customer cancelled, Wrong order, Out of ingredients, etc."
              className="w-full min-h-[100px] px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">
              Please provide a clear reason for audit purposes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleVoid}
            disabled={!reason.trim()}
            className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            <XCircle size={16} />
            Void Order
          </button>
        </div>
      </div>
    </div>
  );
}
