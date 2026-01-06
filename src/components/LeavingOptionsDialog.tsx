import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Navigation, Handshake, Coins } from "lucide-react";
interface LeavingOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNormalLeave: () => void;
  onHandshakeOffer: () => void;
}
const LeavingOptionsDialog = ({
  open,
  onOpenChange,
  onNormalLeave,
  onHandshakeOffer,
}: LeavingOptionsDialogProps) => {
  const touchStartRef = useRef<number>(0);
  const { t } = useLanguage();

  const handleTouchEnd = (e: React.TouchEvent, callback: () => void) => {
    const touchDuration = Date.now() - touchStartRef.current;
    if (touchDuration < 200) {
      e.preventDefault();
      callback();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("leaveDialog.title")}</DialogTitle>
          <DialogDescription>{t("leaveDialog.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Normal Leave */}
          <Button
            variant="outline"
            onClick={onNormalLeave}
            className="w-full h-auto py-4 flex flex-col items-start gap-2 hover:bg-transparent shadow-sm"
            style={{
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <div className="flex items-center gap-2 w-full">
              <Navigation className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold text-foreground">
                {t("leaveDialog.normalLeave")}
              </span>
            </div>
          </Button>

          {/* Handshake */}
          <Button
            className="w-full h-auto py-4 flex flex-col items-start gap-2"
            onClick={onHandshakeOffer}
            style={{
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <div className="flex items-center gap-2 w-full">
              <Handshake className="h-5 w-5" />
              <span className="font-semibold">
                {t("leaveDialog.handshake")}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-primary-foreground/80">
              <Coins className="h-3 w-3" />
              <span>{t("leaveDialog.handshakeReward")}</span>
            </div>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          {t("leaveDialog.info")}
        </p>
      </DialogContent>
    </Dialog>
  );
};
export default LeavingOptionsDialog;
