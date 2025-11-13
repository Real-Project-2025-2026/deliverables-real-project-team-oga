import { useState } from 'react';
import Map from '@/components/Map';
import ParkingButton from '@/components/ParkingButton';
import StatsCard from '@/components/StatsCard';
import { useToast } from '@/hooks/use-toast';

interface ParkingSpot {
  id: string;
  coordinates: [number, number];
  available: boolean;
}

const Index = () => {
  const { toast } = useToast();
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([
    { id: '1', coordinates: [11.5820, 48.1351], available: true },
    { id: '2', coordinates: [11.5750, 48.1380], available: true },
    { id: '3', coordinates: [11.5890, 48.1320], available: false },
    { id: '4', coordinates: [11.5680, 48.1400], available: true },
    { id: '5', coordinates: [11.5950, 48.1290], available: true },
    { id: '6', coordinates: [11.5800, 48.1420], available: false },
    { id: '7', coordinates: [11.5720, 48.1310], available: true },
    { id: '8', coordinates: [11.5800, 48.1550], available: true }, // Hohenzollernstr. 48
  ]);

  const availableSpots = parkingSpots.filter(spot => spot.available).length;

  const handleParkingToggle = (isParked: boolean) => {
    if (isParked) {
      // User is parking - mark a random available spot as taken
      const availableSpot = parkingSpots.find(spot => spot.available);
      if (availableSpot) {
        setParkingSpots(spots =>
          spots.map(spot =>
            spot.id === availableSpot.id ? { ...spot, available: false } : spot
          )
        );
        toast({
          title: "Parked Successfully",
          description: "Your parking spot is now marked on the map.",
        });
      }
    } else {
      // User is leaving - mark a random taken spot as available
      const takenSpot = parkingSpots.find(spot => !spot.available);
      if (takenSpot) {
        setParkingSpots(spots =>
          spots.map(spot =>
            spot.id === takenSpot.id ? { ...spot, available: true } : spot
          )
        );
        toast({
          title: "Thanks for Sharing!",
          description: "Your spot is now available for others.",
        });
      }
    }
  };

  return (
    <div className="h-screen w-full bg-background overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 pt-safe">
        <div className="px-6 pt-6 pb-4">
          <h1 className="text-3xl font-bold text-foreground">OGAP</h1>
          <p className="text-sm text-muted-foreground mt-1">Find & Share Free Parking</p>
        </div>
      </div>

      {/* Map */}
      <div className="absolute inset-0 pt-28 pb-64">
        <div className="h-full px-6">
          <Map parkingSpots={parkingSpots} />
        </div>
      </div>

      {/* Bottom Card */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="bg-card rounded-t-[2rem] shadow-2xl border-t border-border px-6 pt-6 pb-8 pb-safe">
          <div className="space-y-4">
            <StatsCard availableSpots={availableSpots} totalUsers={42} />
            <ParkingButton onToggle={handleParkingToggle} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
