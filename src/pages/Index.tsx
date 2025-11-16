import { useState, useEffect } from 'react';
import Map from '@/components/Map';
import ParkingButton from '@/components/ParkingButton';
import StatsCard from '@/components/StatsCard';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { calculateDistance } from '@/lib/utils';
import { Clock, Locate } from 'lucide-react';

interface ParkingSpot {
  id: string;
  coordinates: [number, number];
  available: boolean;
  availableSince?: Date;
}

interface UserParking {
  spotId: string;
  parkingTime: Date;
  returnTime: Date;
  durationMinutes: number;
}

const Index = () => {
  const { toast } = useToast();
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([11.5800, 48.1550]); // Default to Munich
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([
    { id: '1', coordinates: [11.5820, 48.1351], available: true, availableSince: new Date(Date.now() - 15 * 60000) },
    { id: '2', coordinates: [11.5750, 48.1380], available: true, availableSince: new Date(Date.now() - 45 * 60000) },
    { id: '3', coordinates: [11.5890, 48.1320], available: false },
    { id: '4', coordinates: [11.5680, 48.1400], available: true, availableSince: new Date(Date.now() - 5 * 60000) },
    { id: '5', coordinates: [11.5950, 48.1290], available: true, availableSince: new Date(Date.now() - 120 * 60000) },
    { id: '6', coordinates: [11.5800, 48.1420], available: false },
    { id: '7', coordinates: [11.5720, 48.1310], available: true, availableSince: new Date(Date.now() - 30 * 60000) },
    { id: '8', coordinates: [11.5800, 48.1550], available: true, availableSince: new Date(Date.now() - 10 * 60000) }, // Hohenzollernstr. 48
  ]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [userParking, setUserParking] = useState<UserParking | null>(null);
  const [showTimerDialog, setShowTimerDialog] = useState(false);
  const [parkingDuration, setParkingDuration] = useState<string>('60');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [manualPinLocation, setManualPinLocation] = useState<[number, number] | null>(null);

  const availableSpots = parkingSpots.filter(spot => spot.available).length;

  // Get user's actual location and center map
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: [number, number] = [position.coords.longitude, position.coords.latitude];
          setCurrentLocation(newLocation);
          
          // Center map on user's location
          if (mapInstance) {
            mapInstance.flyTo({
              center: newLocation,
              zoom: 15,
            });
          }
          
          toast({
            title: "Location Found",
            description: "Using your current location to find nearby parking.",
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location Access Denied",
            description: "Using default location. Enable location access for better results.",
            variant: "destructive",
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
    }
  }, [toast, mapInstance]);
  
  const getDistanceToSpot = (spot: ParkingSpot) => {
    const distance = calculateDistance(
      currentLocation[1],
      currentLocation[0],
      spot.coordinates[1],
      spot.coordinates[0]
    );
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  // Timer effect
  useEffect(() => {
    if (!userParking) {
      setTimeRemaining('');
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const minutesLeft = differenceInMinutes(userParking.returnTime, now);
      
      if (minutesLeft <= 0) {
        setTimeRemaining('Time expired!');
        toast({
          title: "Parking Time Expired",
          description: "Your parking time has expired. Please move your vehicle.",
          variant: "destructive",
        });
      } else if (minutesLeft <= 5 && minutesLeft > 0) {
        setTimeRemaining(`${minutesLeft} min left`);
        if (minutesLeft === 5) {
          toast({
            title: "Parking Time Alert",
            description: "Only 5 minutes left on your parking!",
          });
        }
      } else if (minutesLeft < 60) {
        setTimeRemaining(`${minutesLeft} min left`);
      } else {
        const hours = Math.floor(minutesLeft / 60);
        const mins = minutesLeft % 60;
        setTimeRemaining(`${hours}h ${mins}m left`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [userParking, toast]);

  const handleParkingToggle = (isParked: boolean) => {
    if (isParked) {
      // Show timer dialog to set parking duration
      setShowTimerDialog(true);
    } else {
      // User is leaving - clear their parking
      if (userParking) {
        setParkingSpots(spots =>
          spots.map(spot =>
            spot.id === userParking.spotId ? { ...spot, available: true, availableSince: new Date() } : spot
          )
        );
        setUserParking(null);
        toast({
          title: "Thanks for Sharing!",
          description: "Your spot is now available for others.",
        });
      }
    }
  };

  const handleSetParkingTimer = () => {
    const duration = parseInt(parkingDuration);
    if (isNaN(duration) || duration <= 0) {
      toast({
        title: "Invalid Duration",
        description: "Please enter a valid number of minutes.",
        variant: "destructive",
      });
      return;
    }

    const now = new Date();
    const returnTime = new Date(now.getTime() + duration * 60000);
    
    // Check if we're taking an existing spot or creating a new one
    if (selectedSpot) {
      // Taking an existing spot
      setUserParking({
        spotId: selectedSpot.id,
        parkingTime: now,
        returnTime: returnTime,
        durationMinutes: duration,
      });

      setParkingSpots(spots =>
        spots.map(spot =>
          spot.id === selectedSpot.id ? { ...spot, available: false, availableSince: undefined } : spot
        )
      );
      
      setSelectedSpot(null);
    } else {
      // Creating a new spot at manual pin location or current location
      const spotLocation = manualPinLocation || currentLocation;
      const newSpotId = `user-${Date.now()}`;
      const newSpot: ParkingSpot = {
        id: newSpotId,
        coordinates: spotLocation,
        available: false,
      };

      setUserParking({
        spotId: newSpotId,
        parkingTime: now,
        returnTime: returnTime,
        durationMinutes: duration,
      });

      // Add the new spot to the map
      setParkingSpots(spots => [...spots, newSpot]);
    }

    setShowTimerDialog(false);
    setManualPinLocation(null);
    toast({
      title: "Parking Timer Set",
      description: `You'll be reminded in ${duration} minutes.`,
    });
  };

  const handleSpotClick = (spotId: string) => {
    const spot = parkingSpots.find(s => s.id === spotId);
    if (spot && spot.available) {
      setSelectedSpot(spot);
    }
  };

  const handleTakeSpot = () => {
    if (!selectedSpot) return;

    // Taking an existing spot - just show timer dialog
    // The spot will be marked as taken when timer is set
    setShowTimerDialog(true);
  };

  const handleRecenter = () => {
    if (mapInstance && currentLocation) {
      mapInstance.flyTo({
        center: currentLocation,
        zoom: 15,
        duration: 1000,
      });
      toast({
        title: "Map Recentered",
        description: "Centered on your current location.",
      });
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
        <div className="h-full px-6 relative">
          <Map 
            parkingSpots={parkingSpots} 
            currentLocation={currentLocation}
            onSpotClick={handleSpotClick}
            onMapReady={setMapInstance}
            manualPinLocation={manualPinLocation}
            onManualPinMove={setManualPinLocation}
          />
          
          {/* Recenter Button */}
          <Button
            onClick={handleRecenter}
            size="icon"
            className="absolute bottom-20 right-4 z-10 h-12 w-12 rounded-full shadow-lg"
            aria-label="Recenter map on my location"
          >
            <Locate className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Spot Details Dialog */}
      <Dialog open={!!selectedSpot} onOpenChange={(open) => !open && setSelectedSpot(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Parking Spot Available</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>
              <strong className="text-foreground">Distance:</strong> {selectedSpot && getDistanceToSpot(selectedSpot)} away
            </div>
            <div>
              <strong className="text-foreground">Available for:</strong>{' '}
              {selectedSpot?.availableSince && formatDistanceToNow(selectedSpot.availableSince)}
            </div>
          </div>
          <div className="flex justify-center pt-4">
            <Button onClick={handleTakeSpot} size="lg" className="w-full">
              Take This Spot
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Parking Timer Dialog */}
      <Dialog open={showTimerDialog} onOpenChange={setShowTimerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Parking Duration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="duration">How long will you park? (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={parkingDuration}
                onChange={(e) => setParkingDuration(e.target.value)}
                placeholder="60"
                min="1"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              You'll receive a notification 5 minutes before your time expires.
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowTimerDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSetParkingTimer} className="flex-1">
              Set Timer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Card */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="bg-card rounded-t-[2rem] shadow-2xl border-t border-border px-6 pt-6 pb-8 pb-safe">
          <div className="space-y-4">
            {userParking && timeRemaining && (
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Parking Timer</p>
                  <p className="text-lg font-bold text-primary">{timeRemaining}</p>
                </div>
              </div>
            )}
            <StatsCard availableSpots={availableSpots} totalUsers={42} />
            <ParkingButton onToggle={handleParkingToggle} isParked={!!userParking} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
