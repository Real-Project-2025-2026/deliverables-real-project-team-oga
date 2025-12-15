import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Navigation, Handshake, Coins } from 'lucide-react';

interface LeavingOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNormalLeave: () => void;
  onHandshakeOffer: () => void;
  hasEnoughCredits: boolean;
}

const LeavingOptionsDialog = ({
  open,
  onOpenChange,
  onNormalLeave,
  onHandshakeOffer,
  hasEnoughCredits
}: LeavingOptionsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Wie möchtest du gehen?</DialogTitle>
          <DialogDescription>
            Wähle ob du einfach gehst oder einen Handshake anbietest
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Normal Leave */}
          <Button
            variant="outline"
            className="w-full h-auto py-4 flex flex-col items-start gap-2"
            onClick={onNormalLeave}
          >
            <div className="flex items-center gap-2 w-full">
              <Navigation className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">Einfach gehen</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Coins className="h-3 w-3" />
              <span>+2 Credits zurück</span>
            </div>
            {!hasEnoughCredits && (
              <span className="text-xs text-destructive">Nicht genug Credits!</span>
            )}
          </Button>

          {/* Handshake */}
          <Button
            className="w-full h-auto py-4 flex flex-col items-start gap-2"
            onClick={onHandshakeOffer}
          >
            <div className="flex items-center gap-2 w-full">
              <Handshake className="h-5 w-5" />
              <span className="font-semibold">Handshake anbieten</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-primary-foreground/80">
              <Coins className="h-3 w-3" />
              <span>+20 Credits bei Übergabe</span>
            </div>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          Mit einem Handshake kannst du deinen Parkplatz direkt übergeben und Credits verdienen!
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default LeavingOptionsDialog;
