import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Handshake, Clock, Coins } from "lucide-react";
import { useState, useRef } from "react";

interface HandshakeOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOffer: (departureTime: Date) => void;
}

const HandshakeOfferDialog = ({
  open,
  onOpenChange,
  onOffer,
}: HandshakeOfferDialogProps) => {
  const touchStartRef = useRef<number>(0);

  const handleTouchEnd = (e: React.TouchEvent, callback: () => void) => {
    const touchDuration = Date.now() - touchStartRef.current;
    if (touchDuration < 200) {
      e.preventDefault();
      callback();
    }
  };

  // Default to 30 minutes from now, rounded to next 5 min
  const getDefaultTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    // Round to next 5 minutes
    const mins = now.getMinutes();
    const roundedMins = Math.ceil(mins / 5) * 5;
    now.setMinutes(roundedMins);
    now.setSeconds(0);
    return now;
  };

  const [departureTime, setDepartureTime] = useState<string>(() => {
    const defaultTime = getDefaultTime();
    return `${String(defaultTime.getHours()).padStart(2, "0")}:${String(
      defaultTime.getMinutes()
    ).padStart(2, "0")}`;
  });

  const handleSubmit = () => {
    const [hours, minutes] = departureTime.split(":").map(Number);
    const departure = new Date();
    departure.setHours(hours, minutes, 0, 0);

    // If time is in the past, assume tomorrow
    if (departure <= new Date()) {
      departure.setDate(departure.getDate() + 1);
    }

    onOffer(departure);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-primary" />
            Handshake anbieten
          </DialogTitle>
          <DialogDescription>
            Gib an, wann du den Parkplatz verlässt
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Time Picker */}
          <div className="space-y-2">
            <Label htmlFor="departure-time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Wann fährst du ab?
            </Label>
            <Input
              id="departure-time"
              type="time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="text-lg font-medium"
            />
          </div>

          {/* Credit Info */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="h-4 w-4 text-primary" />
              <p className="text-sm text-muted-foreground">
                Bei erfolgreicher Übergabe:
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">+20</span>
              <span className="text-muted-foreground">Credits</span>
            </div>
          </div>

          {/* Info */}
          <p className="text-sm text-muted-foreground">
            Dein Angebot erscheint auf der Karte. Wenn jemand Interesse zeigt,
            wirst du benachrichtigt und kannst die Anfrage akzeptieren.
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              onTouchStart={() => {
                touchStartRef.current = Date.now();
              }}
              onTouchEnd={(e) => handleTouchEnd(e, () => onOpenChange(false))}
              style={{
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              Abbrechen
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              onTouchStart={() => {
                touchStartRef.current = Date.now();
              }}
              onTouchEnd={(e) => handleTouchEnd(e, handleSubmit)}
              style={{
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <Handshake className="h-4 w-4 mr-2" />
              Anbieten
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HandshakeOfferDialog;
