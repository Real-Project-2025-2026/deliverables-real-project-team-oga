import { useRef } from "react";
import { HandshakeDeal } from "@/hooks/useHandshake";
import { User } from "@supabase/supabase-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Handshake,
  CheckCircle,
  Clock,
  X,
  UserCheck,
  UserX,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface HandshakeDialogProps {
  deal: HandshakeDeal | null;
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAcceptRequest: () => void;
  onDeclineRequest: () => void;
  onComplete: () => void;
  onCancel: () => void;
}

const HandshakeDialog = ({
  deal,
  user,
  open,
  onOpenChange,
  onAcceptRequest,
  onDeclineRequest,
  onComplete,
  onCancel,
}: HandshakeDialogProps) => {
  const touchStartRef = useRef<number>(0);

  const handleTouchEnd = (e: React.TouchEvent, callback: () => void) => {
    const touchDuration = Date.now() - touchStartRef.current;
    if (touchDuration < 200) {
      e.preventDefault();
      callback();
    }
  };

  if (!deal || !user) return null;

  const isGiver = user.id === deal.giver_id;
  const isReceiver = user.id === deal.receiver_id;
  const departureTime = deal.departure_time
    ? new Date(deal.departure_time)
    : null;
  const isPastDeparture = departureTime && new Date() >= departureTime;

  const getStatusText = () => {
    switch (deal.status) {
      case "open":
        return isGiver ? "Warte auf einen Interessenten..." : "Deal verfügbar";
      case "pending_approval":
        return isGiver
          ? "Jemand möchte deinen Parkplatz! Akzeptierst du?"
          : "Warte auf Bestätigung des Gebers...";
      case "accepted":
        if (isPastDeparture) {
          return isGiver
            ? "Abfahrtszeit erreicht! Bitte bestätige die Übergabe."
            : "Abfahrtszeit erreicht! Warte auf Übergabe.";
        }
        return departureTime
          ? `Deal bestätigt - Übergabe um ${format(departureTime, "HH:mm", {
              locale: de,
            })} Uhr`
          : "Deal akzeptiert";
      case "completed":
        return "Handshake abgeschlossen! 🎉";
      case "cancelled":
        return "Deal wurde abgebrochen";
      default:
        return "";
    }
  };

  const getStatusIcon = () => {
    if (deal.status === "completed") {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (deal.status === "pending_approval") {
      return <UserCheck className="h-5 w-5 text-amber-500" />;
    }
    return <Clock className="h-5 w-5 text-primary" />;
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
            {isGiver
              ? "Du gibst diesen Parkplatz ab"
              : "Du erhältst diesen Parkplatz"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Departure Time */}
          {departureTime && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-muted-foreground">Abfahrtszeit:</p>
              <p className="text-lg font-bold text-primary">
                {format(departureTime, "HH:mm 'Uhr'", { locale: de })}
              </p>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
            {getStatusIcon()}
            <span className="text-sm">{getStatusText()}</span>
          </div>

          {/* Credit Info */}
          <div className="p-3 rounded-lg border bg-card">
            <p className="text-sm text-muted-foreground mb-2">
              Bei Abschluss erhältst du:
            </p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">
                +{isGiver ? "20" : "10"}
              </span>
              <span className="text-muted-foreground">Credits</span>
            </div>
          </div>

          {/* Actions based on status */}
          <div className="flex gap-2">
            {/* Giver: Accept or decline pending request */}
            {deal.status === "pending_approval" && isGiver && (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onDeclineRequest}
                  onTouchStart={() => {
                    touchStartRef.current = Date.now();
                  }}
                  onTouchEnd={(e) => handleTouchEnd(e, onDeclineRequest)}
                  style={{
                    touchAction: "manipulation",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Ablehnen
                </Button>
                <Button
                  className="flex-1"
                  onClick={onAcceptRequest}
                  onTouchStart={() => {
                    touchStartRef.current = Date.now();
                  }}
                  onTouchEnd={(e) => handleTouchEnd(e, onAcceptRequest)}
                  style={{
                    touchAction: "manipulation",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Akzeptieren
                </Button>
              </>
            )}

            {/* Receiver: Waiting for giver approval */}
            {deal.status === "pending_approval" && isReceiver && (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onCancel}
                  onTouchStart={() => {
                    touchStartRef.current = Date.now();
                  }}
                  onTouchEnd={(e) => handleTouchEnd(e, onCancel)}
                  style={{
                    touchAction: "manipulation",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Anfrage zurückziehen
                </Button>
                <Button className="flex-1" disabled>
                  <Clock className="h-4 w-4 mr-2" />
                  Warte auf Geber
                </Button>
              </>
            )}

            {/* Deal accepted - waiting for departure time or ready to complete */}
            {deal.status === "accepted" && (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onCancel}
                  onTouchStart={() => {
                    touchStartRef.current = Date.now();
                  }}
                  onTouchEnd={(e) => handleTouchEnd(e, onCancel)}
                  style={{
                    touchAction: "manipulation",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Abbrechen
                </Button>
                {isGiver && isPastDeparture && (
                  <Button
                    className="flex-1"
                    onClick={onComplete}
                    onTouchStart={() => {
                      touchStartRef.current = Date.now();
                    }}
                    onTouchEnd={(e) => handleTouchEnd(e, onComplete)}
                    style={{
                      touchAction: "manipulation",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Übergabe abschließen
                  </Button>
                )}
                {isGiver && !isPastDeparture && (
                  <Button className="flex-1" disabled>
                    <Clock className="h-4 w-4 mr-2" />
                    Warte auf Abfahrtszeit
                  </Button>
                )}
                {isReceiver && (
                  <Button className="flex-1" disabled>
                    <Clock className="h-4 w-4 mr-2" />
                    Warte auf Übergabe
                  </Button>
                )}
              </>
            )}

            {/* Open deal - only cancel for giver */}
            {deal.status === "open" && isGiver && (
              <Button variant="outline" className="flex-1" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Angebot zurückziehen
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HandshakeDialog;
