import { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface ParkingButtonProps {
  onToggle: (isParked: boolean) => void;
  isParked?: boolean;
}

const ParkingButton = ({ onToggle, isParked = false }: ParkingButtonProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    const newState = !isParked;
    onToggle(newState);
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      onClick={handleToggle}
      style={{ touchAction: 'manipulation' }}
      className={`
        relative w-full min-h-[56px] rounded-2xl font-semibold text-base
        transition-all duration-150 ease-out
        active:scale-[0.95] active:opacity-90
        shadow-lg
        touch-target
        select-none
        ${isParked 
          ? 'bg-success text-white' 
          : 'bg-primary text-primary-foreground'
        }
        ${isAnimating ? 'scale-[0.95]' : ''}
      `}
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
