import { MapPin, Users } from 'lucide-react';

interface StatsCardProps {
  availableSpots: number;
  totalUsers: number;
}

const StatsCard = ({ availableSpots, totalUsers }: StatsCardProps) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
        </div>
        <div className="text-2xl font-bold text-foreground">{availableSpots}</div>
        <div className="text-sm text-muted-foreground">Available Spots</div>
      </div>
      
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-success" />
          </div>
        </div>
        <div className="text-2xl font-bold text-foreground">{totalUsers}</div>
        <div className="text-sm text-muted-foreground">Active Users</div>
      </div>
    </div>
  );
};

export default StatsCard;
