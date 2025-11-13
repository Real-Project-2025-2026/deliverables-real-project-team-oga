import { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface ParkingButtonProps {
  onToggle: (isParked: boolean) => void;
}

const ParkingButton = ({ onToggle }: ParkingButtonProps) => {
  const [isParked, setIsParked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    const newState = !isParked;
    setIsParked(newState);
    onToggle(newState);
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        relative w-full h-20 rounded-3xl font-semibold text-lg
        transition-all duration-300 ease-out
        active:scale-95
        shadow-lg
        ${isParked 
          ? 'bg-success text-white' 
          : 'bg-primary text-primary-foreground'
        }
        ${isAnimating ? 'scale-95' : ''}
      `}
    >
      <div className="flex items-center justify-center gap-3">
        {isParked ? (
          <>
            <Navigation className="w-6 h-6" />
            <span>I'm Leaving</span>
          </>
        ) : (
          <>
            <MapPin className="w-6 h-6" />
            <span>I'm Parking Here</span>
          </>
        )}
      </div>
    </button>
  );
};

export default ParkingButton;
