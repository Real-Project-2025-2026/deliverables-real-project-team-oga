import { MapPin, Users } from 'lucide-react';

interface StatsCardProps {
  availableSpots: number;
  totalUsers: number;
  onSpotsClick?: () => void;
}

const StatsCard = ({ availableSpots, totalUsers, onSpotsClick }: StatsCardProps) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button 
        onClick={onSpotsClick}
        className="bg-card rounded-2xl p-4 shadow-sm border border-border text-left hover:bg-accent/50 transition-colors active:scale-[0.98] touch-target"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
        </div>
        <div className="text-2xl font-bold text-foreground">{availableSpots}</div>
        <div className="text-sm text-muted-foreground">Available Spots</div>
      </button>
      
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-success" />
          </div>
        </div>
        <div className="text-2xl font-bold text-foreground">{totalUsers}</div>
        <div className="text-sm text-muted-foreground">Active Users</div>
      </div>
    </div>
  );
};

export default StatsCard;
