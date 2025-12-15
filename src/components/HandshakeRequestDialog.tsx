import { HandshakeDeal } from '@/hooks/useHandshake';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Handshake, Clock, Coins } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface HandshakeRequestDialogProps {
  deal: HandshakeDeal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequest: () => void;
}

const HandshakeRequestDialog = ({ 
  deal, 
  open, 
  onOpenChange, 
  onRequest 
}: HandshakeRequestDialogProps) => {
  if (!deal) return null;

  const departureTime = deal.departure_time ? new Date(deal.departure_time) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-primary" />
            Parkplatz verfügbar
          </DialogTitle>
          <DialogDescription>
            Jemand bietet hier einen Parkplatz an
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Departure Time */}
          {departureTime && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">Abfahrtszeit:</p>
              </div>
              <p className="text-xl font-bold text-primary">
                {format(departureTime, "HH:mm 'Uhr'", { locale: de })}
              </p>
            </div>
          )}

          {/* Credit Info */}
          <div className="p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Kosten bei Abschluss:</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-orange-500">-10</span>
              <span className="text-muted-foreground">Credits</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Für einen reservierten Parkplatz
            </p>
          </div>

          {/* Info */}
          <p className="text-sm text-muted-foreground">
            Wenn du diesen Deal annimmst, wartet der Geber auf deine Ankunft. 
            Der Parkplatz wird bei Abfahrt an dich übergeben.
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button
              className="flex-1"
              onClick={onRequest}
            >
              <Handshake className="h-4 w-4 mr-2" />
              Deal annehmen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HandshakeRequestDialog;
