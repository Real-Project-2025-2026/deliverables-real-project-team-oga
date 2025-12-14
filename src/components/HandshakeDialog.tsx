import { HandshakeDeal } from '@/hooks/useHandshake';
import { User } from '@supabase/supabase-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Handshake, CheckCircle, Clock, X } from 'lucide-react';

interface HandshakeDialogProps {
  deal: HandshakeDeal | null;
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const HandshakeDialog = ({ 
  deal, 
  user, 
  open, 
  onOpenChange, 
  onConfirm, 
  onCancel 
}: HandshakeDialogProps) => {
  if (!deal || !user) return null;

  const isGiver = user.id === deal.giver_id;
  const isReceiver = user.id === deal.receiver_id;

  const getStatusText = () => {
    switch (deal.status) {
      case 'open':
        return isGiver 
          ? 'Warte auf einen Interessenten...' 
          : 'Deal verfügbar';
      case 'accepted':
        return 'Deal akzeptiert - Koordiniert die Übergabe';
      case 'giver_confirmed':
        return isGiver 
          ? 'Du hast bestätigt. Warte auf Empfänger.' 
          : 'Geber hat bestätigt. Bitte bestätige auch.';
      case 'receiver_confirmed':
        return isReceiver 
          ? 'Du hast bestätigt. Warte auf Geber.' 
          : 'Empfänger hat bestätigt. Bitte bestätige auch.';
      case 'completed':
        return 'Handshake abgeschlossen! 🎉';
      case 'cancelled':
        return 'Deal wurde abgebrochen';
      default:
        return '';
    }
  };

  const canConfirm = () => {
    if (deal.status === 'accepted') return true;
    if (deal.status === 'giver_confirmed' && isReceiver) return true;
    if (deal.status === 'receiver_confirmed' && isGiver) return true;
    return false;
  };

  const hasConfirmed = () => {
    if (deal.status === 'giver_confirmed' && isGiver) return true;
    if (deal.status === 'receiver_confirmed' && isReceiver) return true;
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-primary" />
            Handshake Deal
          </DialogTitle>
          <DialogDescription>
            {isGiver ? 'Du gibst diesen Parkplatz ab' : 'Du erhältst diesen Parkplatz'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
            {deal.status === 'completed' ? (
              <CheckCircle className="h-5 w-5 text-success" />
            ) : (
              <Clock className="h-5 w-5 text-primary" />
            )}
            <span className="text-sm">{getStatusText()}</span>
          </div>

          {/* Credit Info */}
          <div className="p-3 rounded-lg border bg-card">
            <p className="text-sm text-muted-foreground mb-2">Bei Abschluss erhältst du:</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">
                +{isGiver ? '20' : '10'}
              </span>
              <span className="text-muted-foreground">Credits</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {deal.status !== 'completed' && deal.status !== 'cancelled' && (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onCancel}
                >
                  <X className="h-4 w-4 mr-2" />
                  Abbrechen
                </Button>
                
                {canConfirm() && !hasConfirmed() && (
                  <Button
                    className="flex-1"
                    onClick={onConfirm}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Übergabe bestätigen
                  </Button>
                )}
                
                {hasConfirmed() && (
                  <Button
                    className="flex-1"
                    disabled
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Warte auf Partner
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HandshakeDialog;
