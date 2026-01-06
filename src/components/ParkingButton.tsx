import { useState, useRef } from "react";
import { MapPin, Navigation } from "lucide-react";

interface ParkingButtonProps {
  onToggle: (isParked: boolean) => void;
  isParked?: boolean;
}

const ParkingButton = ({ onToggle, isParked = false }: ParkingButtonProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartRef = useRef<number>(0);
  const isProcessingRef = useRef(false);

  const handleToggle = () => {
    // Prevent double-triggers
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    setIsAnimating(true);
    const newState = !isParked;
    onToggle(newState);

    setTimeout(() => {
      setIsAnimating(false);
      isProcessingRef.current = false;
    }, 300);
  };

  // Mobile-optimized touch handler - removes 300ms click delay
  const handleTouchStart = () => {
    touchStartRef.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchDuration = Date.now() - touchStartRef.current;
    // Only trigger on quick taps (< 200ms), not on holds
    if (touchDuration < 200) {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <button
      onClick={handleToggle}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`
        relative w-full min-h-[56px] rounded-2xl font-semibold text-base
        transition-all duration-300 ease-out
        active:scale-[0.98]
        shadow-lg
        touch-target
        ${
          isParked
            ? "bg-success text-white"
            : "bg-primary text-primary-foreground"
        }
        ${isAnimating ? "scale-[0.98]" : ""}
      `}
      style={{
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
        WebkitTouchCallout: "none",
      }}
    >
      <div className="flex items-center justify-center gap-3 py-4 px-6">
        {isParked ? (
          <>
            <Navigation className="w-5 h-5 shrink-0" />
            <span>I'm Leaving</span>
          </>
        ) : (
          <>
            <MapPin className="w-5 h-5 shrink-0" />
            <span>I'm Parking Here</span>
          </>
        )}
      </div>
    </button>
  );
};

export default ParkingButton;
