import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import Map from "@/components/Map";
import ParkingButton from "@/components/ParkingButton";
import StatsCard from "@/components/StatsCard";
import AuthDialog from "@/components/AuthDialog";
import { useToast } from "@/hooks/use-toast";
import { usePresence } from "@/hooks/usePresence";
import { useCredits } from "@/hooks/useCredits";
import { useHandshake, HandshakeDeal } from "@/hooks/useHandshake";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { calculateDistance } from "@/lib/utils";
import { Clock, Locate, ChevronUp, ChevronDown, ArrowLeft, Navigation, MapPin, Handshake as HandshakeIcon } from "lucide-react";
import AccountMenu from "@/components/AccountMenu";
import LeavingOptionsDialog from "@/components/LeavingOptionsDialog";
import HandshakeDialog from "@/components/HandshakeDialog";
import HandshakeOfferDialog from "@/components/HandshakeOfferDialog";
import HandshakeRequestDialog from "@/components/HandshakeRequestDialog";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ParkingSpot {
  id: string;
  coordinates: [number, number];
  available: boolean;
  availableSince?: Date;
  isHandshake?: boolean;
}

interface UserParking {
  spotId: string;
  parkingTime: Date;
  returnTime: Date | null;
  durationMinutes: number | null;
}

const PARKING_SESSION_KEY = 'ogap_parking_session';

const Index = () => {
  const { toast } = useToast();
  const activeUsers = usePresence();
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([11.58, 48.155]);
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [userParking, setUserParking] = useState<UserParking | null>(() => {
    // Restore parking session from localStorage
    const saved = localStorage.getItem(PARKING_SESSION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          parkingTime: new Date(parsed.parkingTime),
          returnTime: parsed.returnTime ? new Date(parsed.returnTime) : null
        };
      } catch {
        return null;
      }
    }
    return null;
  });
  const [showTimerDialog, setShowTimerDialog] = useState(false);
  
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [manualPinLocation, setManualPinLocation] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<"park" | "take" | null>(null);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [showLeavingOptions, setShowLeavingOptions] = useState(false);
  const [showHandshakeDialog, setShowHandshakeDialog] = useState(false);

  // Persist parking session to localStorage
  useEffect(() => {
    if (userParking) {
      localStorage.setItem(PARKING_SESSION_KEY, JSON.stringify(userParking));
    } else {
      localStorage.removeItem(PARKING_SESSION_KEY);
    }
  }, [userParking]);

  // Credit and Handshake hooks
  const { credits, deductCredits, refreshCredits } = useCredits(user);
  const { 
    myDeal, 
    activeDeals, 
    createHandshakeOffer, 
    requestDeal,
    acceptRequest,
    declineRequest,
    completeDeal, 
    cancelDeal,
    getOpenDeals,
    getAllOpenDeals 
  } = useHandshake(user);

  // Additional state for new handshake flow
  const [showHandshakeOfferDialog, setShowHandshakeOfferDialog] = useState(false);
  const [showHandshakeRequestDialog, setShowHandshakeRequestDialog] = useState(false);
  const [selectedDealForRequest, setSelectedDealForRequest] = useState<HandshakeDeal | null>(null);

  // Auth state management
  useEffect(() => {
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Watch for completed handshake deals where user is receiver
  // This creates a parking session for the receiver when the giver completes the deal
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('handshake-completion')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'handshake_deals',
          filter: `receiver_id=eq.${user.id}`
        },
        async (payload) => {
          const deal = payload.new as any;
          console.log('Handshake deal update for receiver:', deal);
          
          // Check if deal just got completed
          if (deal.status === 'completed' && !userParking) {
            // Set parking session for the receiver
            const now = new Date();
            const defaultDuration = 60; // 60 minutes default
            setUserParking({
              spotId: deal.spot_id,
              parkingTime: now,
              returnTime: new Date(now.getTime() + defaultDuration * 60000),
              durationMinutes: defaultDuration
            });
            toast({
              title: 'Parkplatz erhalten!',
              description: 'Der Handshake ist abgeschlossen. Du hast jetzt den Parkplatz.'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, userParking, toast]);

  const availableSpots = parkingSpots.filter(spot => spot.available).length;

  // Fetch parking spots from database
  useEffect(() => {
    const fetchParkingSpots = async () => {
      const {
        data,
        error
      } = await supabase.from("parking_spots").select("*");
      if (error) {
        console.error("Error fetching parking spots:", error);
        toast({
          title: "Error Loading Spots",
          description: "Could not load parking spots from the database.",
          variant: "destructive"
        });
      } else if (data) {
        const spots: ParkingSpot[] = data.map(spot => ({
          id: spot.id,
          coordinates: [spot.longitude, spot.latitude] as [number, number],
          available: spot.available,
          availableSince: spot.available_since ? new Date(spot.available_since) : undefined
        }));
        setParkingSpots(spots);
      }
      setIsLoading(false);
    };
    fetchParkingSpots();

    // Subscribe to real-time updates
    const channel = supabase.channel("parking-spots-changes").on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "parking_spots"
    }, payload => {
      console.log("Real-time update:", payload);
      if (payload.eventType === "INSERT") {
        const newSpot = payload.new as any;
        setParkingSpots(prev => [...prev, {
          id: newSpot.id,
          coordinates: [newSpot.longitude, newSpot.latitude] as [number, number],
          available: newSpot.available,
          availableSince: newSpot.available_since ? new Date(newSpot.available_since) : undefined
        }]);
      } else if (payload.eventType === "UPDATE") {
        const updatedSpot = payload.new as any;
        setParkingSpots(prev => prev.map(spot => spot.id === updatedSpot.id ? {
          id: updatedSpot.id,
          coordinates: [updatedSpot.longitude, updatedSpot.latitude] as [number, number],
          available: updatedSpot.available,
          availableSince: updatedSpot.available_since ? new Date(updatedSpot.available_since) : undefined
        } : spot));
      } else if (payload.eventType === "DELETE") {
        const deletedSpot = payload.old as any;
        setParkingSpots(prev => prev.filter(spot => spot.id !== deletedSpot.id));
      }
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  // Get user's actual location and center map
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive"
      });
      return;
    }

    const handleLocationSuccess = (position: GeolocationPosition) => {
      const newLocation: [number, number] = [position.coords.longitude, position.coords.latitude];
      setCurrentLocation(newLocation);
      if (mapInstance) {
        mapInstance.flyTo({
          center: newLocation,
          zoom: 15
        });
      }
      toast({
        title: "Location Found",
        description: "Using your current location to find nearby parking."
      });
    };

    const handleLocationError = (error: GeolocationPositionError) => {
      console.error("Location error code:", error.code, "message:", error.message);
      // Only show error for permission denied (code 1)
      if (error.code === 1) {
        toast({
          title: "Location Access Denied",
          description: "Using default location. Enable location access for better results.",
          variant: "destructive"
        });
      }
    };

    // Try with low accuracy first (faster, works in browsers without GPS)
    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      (error) => {
        // If low accuracy fails with POSITION_UNAVAILABLE or TIMEOUT, try high accuracy
        if (error.code === 2 || error.code === 3) {
          navigator.geolocation.getCurrentPosition(
            handleLocationSuccess,
            handleLocationError,
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
          );
        } else {
          handleLocationError(error);
        }
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );
  }, [toast, mapInstance]);
  const getDistanceToSpot = (spot: ParkingSpot) => {
    const distance = calculateDistance(currentLocation[1], currentLocation[0], spot.coordinates[1], spot.coordinates[0]);
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };
  const findNearestAvailableSpot = () => {
    const availableParkingSpots = parkingSpots.filter(spot => spot.available);
    if (availableParkingSpots.length === 0) return null;
    let nearestSpot = availableParkingSpots[0];
    let minDistance = calculateDistance(currentLocation[1], currentLocation[0], nearestSpot.coordinates[1], nearestSpot.coordinates[0]);
    for (const spot of availableParkingSpots) {
      const distance = calculateDistance(currentLocation[1], currentLocation[0], spot.coordinates[1], spot.coordinates[0]);
      if (distance < minDistance) {
        minDistance = distance;
        nearestSpot = spot;
      }
    }
    return nearestSpot;
  };
  const handleFocusNearestSpot = () => {
    const nearestSpot = findNearestAvailableSpot();
    if (nearestSpot && mapInstance) {
      mapInstance.flyTo({
        center: nearestSpot.coordinates,
        zoom: 17,
        duration: 1000
      });
      setSelectedSpot(nearestSpot);
      toast({
        title: "Nearest Spot",
        description: `Found parking ${getDistanceToSpot(nearestSpot)} away`
      });
    } else if (!nearestSpot) {
      toast({
        title: "No Spots Available",
        description: "There are no available parking spots nearby.",
        variant: "destructive"
      });
    }
  };

  // Timer effect
  useEffect(() => {
    if (!userParking || !userParking.returnTime) {
      setTimeRemaining("");
      return;
    }
    const updateTimer = () => {
      const now = new Date();
      const minutesLeft = differenceInMinutes(userParking.returnTime!, now);
      if (minutesLeft <= 0) {
        setTimeRemaining("Time expired!");
        toast({
          title: "Parking Time Expired",
          description: "Your parking time has expired. Please move your vehicle.",
          variant: "destructive"
        });
      } else if (minutesLeft <= 5 && minutesLeft > 0) {
        setTimeRemaining(`${minutesLeft} min left`);
        if (minutesLeft === 5) {
          toast({
            title: "Parking Time Alert",
            description: "Only 5 minutes left on your parking!"
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
    const interval = setInterval(updateTimer, 30000);
    return () => clearInterval(interval);
  }, [userParking, toast]);
  const handleParkingToggle = async (isParked: boolean) => {
    if (isParked) {
      // Check if user is authenticated before allowing parking
      if (!user) {
        setPendingAction("park");
        setShowAuthDialog(true);
        return;
      }
      setShowTimerDialog(true);
    } else {
      // User wants to leave - show options dialog
      if (userParking) {
        setShowLeavingOptions(true);
      }
    }
  };

  const handleNormalLeave = async () => {
    if (!userParking || !user) return;
    
    // Check credits
    if (!credits.canPark) {
      toast({
        title: "Nicht genug Credits",
        description: "Du benötigst mindestens 2 Credits zum Parken.",
        variant: "destructive"
      });
      setShowLeavingOptions(false);
      return;
    }

    // Deduct credits
    const success = await deductCredits(userParking.spotId);
    if (!success) {
      toast({
        title: "Fehler",
        description: "Credits konnten nicht abgezogen werden.",
        variant: "destructive"
      });
      return;
    }

    // Get spot coordinates for history
    const spot = parkingSpots.find(s => s.id === userParking.spotId);
    const spotCoords = spot?.coordinates || currentLocation;

    // Calculate duration
    const now = new Date();
    const durationMinutes = Math.round((now.getTime() - userParking.parkingTime.getTime()) / 60000);

    // Save to parking history
    const { error: historyError } = await supabase.from("parking_history").insert({
      user_id: user.id,
      spot_id: userParking.spotId,
      latitude: spotCoords[1],
      longitude: spotCoords[0],
      started_at: userParking.parkingTime.toISOString(),
      ended_at: now.toISOString(),
      duration_minutes: durationMinutes
    });

    if (historyError) {
      console.error("Error saving parking history:", historyError);
      // Continue anyway - history is not critical
    }

    // Update spot in database to be available again
    const { error } = await supabase.from("parking_spots").update({
      available: true,
      available_since: new Date().toISOString()
    }).eq("id", userParking.spotId);

    if (error) {
      console.error("Error updating spot:", error);
      toast({
        title: "Error",
        description: "Could not update parking spot.",
        variant: "destructive"
      });
      return;
    }

    setUserParking(null);
    setShowLeavingOptions(false);
    toast({
      title: "Danke fürs Teilen!",
      description: "Dein Platz ist jetzt für andere verfügbar. (-2 Credits)"
    });
  };

  const handleHandshakeOffer = async () => {
    if (!userParking || !user) return;
    setShowLeavingOptions(false);
    setShowHandshakeOfferDialog(true);
  };

  const handleCreateHandshakeOffer = async (departureTime: Date) => {
    if (!userParking || !user) return;

    // Get spot coordinates
    const spot = parkingSpots.find(s => s.id === userParking.spotId);
    if (!spot) return;

    const deal = await createHandshakeOffer(
      userParking.spotId,
      spot.coordinates[1],
      spot.coordinates[0],
      departureTime
    );

    if (deal) {
      setShowHandshakeOfferDialog(false);
      setShowHandshakeDialog(true);
    }
  };

  const handleAcceptRequest = async () => {
    if (!myDeal) return;
    const success = await acceptRequest(myDeal.id);
    if (success) {
      // Stay in dialog to show updated status
    }
  };

  const handleDeclineRequest = async () => {
    if (!myDeal) return;
    await declineRequest(myDeal.id);
  };

  const handleCompleteDeal = async () => {
    if (!myDeal || !user) return;
    const result = await completeDeal(myDeal.id);
    if (result.success) {
      // Check if current user is the giver or receiver
      if (user.id === result.giverId) {
        // Giver: Clear parking session
        setUserParking(null);
      }
      // Note: Receiver's parking session will be set via real-time update or separate action
      setShowHandshakeDialog(false);
    }
  };

  const handleCancelDeal = async () => {
    if (!myDeal) return;
    await cancelDeal(myDeal.id);
    setShowHandshakeDialog(false);
  };

  const handleHandshakeDealClick = async (dealId: string) => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    // Check if this is the user's own deal - show the dialog
    if (myDeal && myDeal.id === dealId) {
      setShowHandshakeDialog(true);
      return;
    }

    // Find the deal from all active deals
    const deal = activeDeals.find(d => d.id === dealId);
    if (!deal) {
      console.log('Deal not found:', dealId, 'Available deals:', activeDeals);
      return;
    }

    // Can't accept own deal (double check with giver_id)
    if (deal.giver_id === user.id) {
      // This is the user's own offer - show the handshake dialog
      setShowHandshakeDialog(true);
      return;
    }

    // Show request dialog for the receiver
    setSelectedDealForRequest(deal);
    setShowHandshakeRequestDialog(true);
  };

  const handleRequestDeal = async () => {
    if (!selectedDealForRequest) return;
    const success = await requestDeal(selectedDealForRequest.id);
    if (success) {
      setShowHandshakeRequestDialog(false);
      setSelectedDealForRequest(null);
      setShowHandshakeDialog(true);
    }
  };

  const handleConfirmParking = async () => {
    const now = new Date();
    if (selectedSpot) {
      // Taking an existing spot - update in database
      const {
        error
      } = await supabase.from("parking_spots").update({
        available: false,
        available_since: null
      }).eq("id", selectedSpot.id);
      if (error) {
        console.error("Error updating spot:", error);
        toast({
          title: "Error",
          description: "Could not take this parking spot.",
          variant: "destructive"
        });
        return;
      }
      setUserParking({
        spotId: selectedSpot.id,
        parkingTime: now,
        returnTime: null,
        durationMinutes: null
      });
      setSelectedSpot(null);
      toast({
        title: "Parkplatz gesetzt",
        description: "Du hast den Parkplatz übernommen."
      });
    } else {
      // Creating a new spot at manual pin location or current location
      const spotLocation = manualPinLocation || currentLocation;
      const newSpotId = `user-${Date.now()}`;
      const {
        error
      } = await supabase.from("parking_spots").insert({
        id: newSpotId,
        latitude: spotLocation[1],
        longitude: spotLocation[0],
        available: false,
        available_since: null
      });
      if (error) {
        console.error("Error creating spot:", error);
        toast({
          title: "Error",
          description: "Could not create parking spot.",
          variant: "destructive"
        });
        return;
      }
      
      // Award +4 credits for reporting a new spot
      try {
        const response = await supabase.functions.invoke('process-credits', {
          body: { action: 'new_spot_reported', spotId: newSpotId }
        });
        if (response.error) {
          console.error('Error awarding credits:', response.error);
        } else {
          refreshCredits();
        }
      } catch (e) {
        console.error('Error calling process-credits:', e);
      }
      
      setUserParking({
        spotId: newSpotId,
        parkingTime: now,
        returnTime: null,
        durationMinutes: null
      });
      toast({
        title: "Neuer Parkplatz gemeldet!",
        description: "+4 Credits erhalten!"
      });
    }
    setShowTimerDialog(false);
    setManualPinLocation(null);
  };
  const handleSpotClick = (spotId: string) => {
    const spot = parkingSpots.find(s => s.id === spotId);
    if (spot && spot.available) {
      setSelectedSpot(spot);
    }
  };
  const handleTakeSpot = () => {
    if (!selectedSpot) return;
    // Check if user is authenticated before allowing to take a spot
    if (!user) {
      setPendingAction("take");
      setShowAuthDialog(true);
      return;
    }
    setShowTimerDialog(true);
  };
  const handleAuthSuccess = () => {
    // Execute pending action after successful auth
    if (pendingAction === "park") {
      setShowTimerDialog(true);
    } else if (pendingAction === "take" && selectedSpot) {
      setShowTimerDialog(true);
    }
    setPendingAction(null);
  };
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserParking(null);
    toast({
      title: "Signed Out",
      description: "You've been signed out successfully."
    });
  };
  const handleRecenter = () => {
    if (mapInstance && currentLocation) {
      mapInstance.flyTo({
        center: currentLocation,
        zoom: 15,
        duration: 1000
      });
      toast({
        title: "Map Recentered",
        description: "Centered on your current location."
      });
    }
  };

  // OS Detection for navigation
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  };

  // Navigation handler
  const handleNavigateToSpot = (spot: ParkingSpot, mapType: 'google' | 'apple') => {
    const [lng, lat] = spot.coordinates;
    
    if (mapType === 'google') {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else {
      window.open(`https://maps.apple.com/?daddr=${lat},${lng}`, '_blank');
    }
  };
  return <div className="h-[100dvh] w-full bg-background overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 pt-safe">
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="touch-target" aria-label="Back to home">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">OGAP</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Find & Share Free Parking</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Active Handshake Deal Indicator */}
            {myDeal && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHandshakeDialog(true)}
                className="touch-target relative"
                aria-label="Active handshake deal"
              >
                <HandshakeIcon className="h-5 w-5 text-primary" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
              </Button>
            )}
            {user ? (
              <AccountMenu user={user} onSignOut={handleSignOut} creditBalance={credits.balance} />
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowAuthDialog(true)} className="touch-target">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="absolute inset-0 pt-20 sm:pt-28 transition-all duration-300" style={{
      paddingBottom: isStatsExpanded ? "14rem" : "7rem"
    }}>
        <div className="h-full px-3 sm:px-6 relative">
          {(() => {
            // Pass ALL active deals for marker filtering, but Map will only show 'open' deals as clickable
            const activeStatuses = ['open', 'pending_approval', 'accepted', 'giver_confirmed', 'receiver_confirmed'];
            const activeDealsForMap = activeDeals.filter(d => activeStatuses.includes(d.status));
            console.log('Passing handshake deals to Map:', activeDealsForMap);
            return (
              <Map 
                parkingSpots={parkingSpots} 
                currentLocation={currentLocation} 
                onSpotClick={handleSpotClick} 
                onMapReady={setMapInstance} 
                manualPinLocation={manualPinLocation} 
                onManualPinMove={setManualPinLocation}
                handshakeDeals={activeDealsForMap}
                onHandshakeDealClick={handleHandshakeDealClick}
                currentUserId={user?.id}
              />
            );
          })()}
        </div>
      </div>

      {/* Recenter Button - floating above bottom panel */}
      <div className="fixed right-3 sm:right-6 z-30 transition-all duration-300" style={{
      bottom: isStatsExpanded ? "calc(14rem + 0.5rem)" : "calc(7rem + 0.5rem)"
    }}>
        <Button onClick={handleRecenter} size="icon" variant="outline" className="group h-12 w-12 rounded-full shadow-lg bg-card hover:bg-primary active:scale-95 touch-target" aria-label="Recenter map on my location">
          <Locate className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
        </Button>
      </div>

      {/* Spot Details Dialog */}
      <Dialog open={!!selectedSpot} onOpenChange={open => !open && setSelectedSpot(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Parking Spot Available</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>
              <strong className="text-foreground">Distance:</strong> {selectedSpot && getDistanceToSpot(selectedSpot)}{" "}
              away
            </div>
            <div>
              <strong className="text-foreground">Available for:</strong>{" "}
              {selectedSpot?.availableSince && formatDistanceToNow(selectedSpot.availableSince)}
            </div>
          </div>
          <div className="space-y-2 pt-4">
            {/* Navigation Buttons - OS-based primary/secondary */}
            {selectedSpot && (
              <>
                {isIOS() ? (
                  <>
                    <Button 
                      onClick={() => handleNavigateToSpot(selectedSpot, 'apple')} 
                      size="lg" 
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <Navigation className="h-4 w-4" />
                      Navigate with Apple Maps
                    </Button>
                    <Button 
                      onClick={() => handleNavigateToSpot(selectedSpot, 'google')} 
                      size="lg" 
                      variant="ghost"
                      className="w-full gap-2 text-muted-foreground"
                    >
                      <MapPin className="h-4 w-4" />
                      Open in Google Maps
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      onClick={() => handleNavigateToSpot(selectedSpot, 'google')} 
                      size="lg" 
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <Navigation className="h-4 w-4" />
                      Navigate with Google Maps
                    </Button>
                    <Button 
                      onClick={() => handleNavigateToSpot(selectedSpot, 'apple')} 
                      size="lg" 
                      variant="ghost"
                      className="w-full gap-2 text-muted-foreground"
                    >
                      <MapPin className="h-4 w-4" />
                      Open in Apple Maps
                    </Button>
                  </>
                )}
              </>
            )}
            <Button onClick={handleTakeSpot} size="lg" className="w-full">
              Take This Spot
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Set Parking Spot Dialog */}
      <Dialog open={showTimerDialog} onOpenChange={setShowTimerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Parkplatz setzen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Du parkst hier? Bestätige deinen Parkplatz.
            </p>
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-sm text-primary">
              <strong>Tipp:</strong> Wenn du einen komplett neuen Parkplatz meldest, erhältst du <strong>+4 Credits</strong>!
            </div>
          </div>
          <Button onClick={() => {
            setShowTimerDialog(false);
            handleConfirmParking();
          }} size="lg" className="w-full mt-4">
            Parkplatz setzen
          </Button>
        </DialogContent>
      </Dialog>

      {/* Bottom Card */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="bg-card rounded-t-[1.5rem] sm:rounded-t-[2rem] shadow-2xl border-t border-border px-4 sm:px-6 pb-safe py-[24px] pt-0 pb-[24px]">
          {/* Drag handle */}
          <button onClick={() => setIsStatsExpanded(!isStatsExpanded)} className="w-full flex justify-center items-center pb-2 touch-target" aria-label={isStatsExpanded ? "Collapse stats" : "Expand stats"}>
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
          </button>

          <div className="space-y-3">
            {/* Collapsible Stats Section */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isStatsExpanded ? "max-h-60 opacity-100" : "max-h-0 opacity-0"}`}>
              <div className="space-y-3 pb-3">
                {userParking && timeRemaining && <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 sm:p-4 flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-full shrink-0">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">Parking Timer</p>
                      <p className="text-lg font-bold text-primary truncate">{timeRemaining}</p>
                    </div>
                  </div>}
                <StatsCard availableSpots={availableSpots} totalUsers={activeUsers} onSpotsClick={handleFocusNearestSpot} />
              </div>
            </div>

            {/* Expand/Collapse Button with Mini Preview */}
            <div className="w-full flex items-center justify-center gap-3 py-1">
              {isStatsExpanded ? <button onClick={() => setIsStatsExpanded(false)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors touch-target active:scale-95">
                  <ChevronDown className="h-4 w-4" />
                  <span className="text-sm">Hide stats</span>
                </button> : <button onClick={handleFocusNearestSpot} className="flex items-center justify-center bg-primary/10 px-4 py-2 rounded-full hover:bg-primary/20 transition-colors active:scale-95 touch-target gap-[8px] text-left">
                  <div className="w-2 h-2 shrink-0 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-medium text-primary leading-none">
                    {availableSpots} spots available
                  </span>
                </button>}
            </div>

            {/* Always visible parking button */}
            <div className="pb-4">
              <ParkingButton onToggle={handleParkingToggle} isParked={!!userParking} />
            </div>
          </div>
        </div>
      </div>

      {/* Auth Dialog */}
      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} onSuccess={handleAuthSuccess} />

      {/* Leaving Options Dialog */}
      <LeavingOptionsDialog
        open={showLeavingOptions}
        onOpenChange={setShowLeavingOptions}
        onNormalLeave={handleNormalLeave}
        onHandshakeOffer={handleHandshakeOffer}
        hasEnoughCredits={credits.canPark}
      />

      {/* Handshake Dialog */}
      <HandshakeDialog
        deal={myDeal}
        user={user}
        open={showHandshakeDialog}
        onOpenChange={setShowHandshakeDialog}
        onAcceptRequest={handleAcceptRequest}
        onDeclineRequest={handleDeclineRequest}
        onComplete={handleCompleteDeal}
        onCancel={handleCancelDeal}
      />

      {/* Handshake Offer Dialog (for giver to set departure time) */}
      <HandshakeOfferDialog
        open={showHandshakeOfferDialog}
        onOpenChange={setShowHandshakeOfferDialog}
        onOffer={handleCreateHandshakeOffer}
      />

      {/* Handshake Request Dialog (for receiver to request a deal) */}
      <HandshakeRequestDialog
        deal={selectedDealForRequest}
        open={showHandshakeRequestDialog}
        onOpenChange={setShowHandshakeRequestDialog}
        onRequest={handleRequestDeal}
      />
    </div>;
};
export default Index;