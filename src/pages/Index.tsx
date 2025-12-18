import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import Map from "@/components/Map";
import ParkingButton from "@/components/ParkingButton";
// StatsCard removed - stats are now inline
import AuthDialog from "@/components/AuthDialog";
import { useToast } from "@/hooks/use-toast";
import { usePresence } from "@/hooks/usePresence";
import { useCredits } from "@/hooks/useCredits";
import { useHandshake, HandshakeDeal } from "@/hooks/useHandshake";
import { useLanguage } from "@/contexts/LanguageContext";
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
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { calculateDistance } from "@/lib/utils";
import { calculateParkingProbability } from "@/lib/parkingProbability";
import { ProbabilityBar } from "@/components/ProbabilityBar";
import {
  Clock,
  Locate,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Navigation,
  MapPin,
  Handshake as HandshakeIcon,
  Users,
} from "lucide-react";
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

const PARKING_SESSION_KEY = "ogap_parking_session";

const Index = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const activeUsers = usePresence();
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([
    11.58, 48.155,
  ]);
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
          returnTime: parsed.returnTime ? new Date(parsed.returnTime) : null,
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
  const [manualPinLocation, setManualPinLocation] = useState<
    [number, number] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<"park" | "take" | null>(
    null
  );
  // Removed isStatsExpanded - stats are now always visible
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

  // Credit change state for animation
  const [lastCreditChange, setLastCreditChange] = useState<{
    amount: number;
    type: "gain" | "loss";
  } | null>(null);

  // Credit and Handshake hooks
  const { credits, deductCredits, refreshCredits } = useCredits(
    user,
    (change) => {
      setLastCreditChange(change);
      // Clear after animation
      setTimeout(() => setLastCreditChange(null), 2500);
    }
  );
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
    getAllOpenDeals,
  } = useHandshake(user);

  // Additional state for new handshake flow
  const [showHandshakeOfferDialog, setShowHandshakeOfferDialog] =
    useState(false);
  const [showHandshakeRequestDialog, setShowHandshakeRequestDialog] =
    useState(false);
  const [selectedDealForRequest, setSelectedDealForRequest] =
    useState<HandshakeDeal | null>(null);
  const [isTakingSpot, setIsTakingSpot] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Auth state management
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
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
      .channel("handshake-completion")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "handshake_deals",
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const deal = payload.new as any;
          console.log("Handshake deal update for receiver:", deal);

          // Check if deal just got completed
          if (deal.status === "completed" && !userParking) {
            // Set parking session for the receiver
            const now = new Date();
            const defaultDuration = 60; // 60 minutes default
            setUserParking({
              spotId: deal.spot_id,
              parkingTime: now,
              returnTime: new Date(now.getTime() + defaultDuration * 60000),
              durationMinutes: defaultDuration,
            });
            toast({
              title: "Parkplatz erhalten!",
              description:
                "Der Handshake ist abgeschlossen. Du hast jetzt den Parkplatz.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, userParking, toast]);

  const availableSpots = parkingSpots.filter((spot) => spot.available).length;

  // Fetch parking spots from database
  useEffect(() => {
    const fetchParkingSpots = async () => {
      const { data, error } = await supabase.from("parking_spots").select("*");
      if (error) {
        console.error("Error fetching parking spots:", error);
        toast({
          title: "Error Loading Spots",
          description: "Could not load parking spots from the database.",
          variant: "destructive",
        });
      } else if (data) {
        const spots: ParkingSpot[] = data.map((spot) => ({
          id: spot.id,
          coordinates: [spot.longitude, spot.latitude] as [number, number],
          available: spot.available,
          availableSince: spot.available_since
            ? new Date(spot.available_since)
            : undefined,
        }));
        setParkingSpots(spots);
      }
      setIsLoading(false);
    };
    fetchParkingSpots();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("parking-spots-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "parking_spots",
        },
        (payload) => {
          console.log("Real-time update:", payload);
          if (payload.eventType === "INSERT") {
            const newSpot = payload.new as any;
            setParkingSpots((prev) => [
              ...prev,
              {
                id: newSpot.id,
                coordinates: [newSpot.longitude, newSpot.latitude] as [
                  number,
                  number
                ],
                available: newSpot.available,
                availableSince: newSpot.available_since
                  ? new Date(newSpot.available_since)
                  : undefined,
              },
            ]);
          } else if (payload.eventType === "UPDATE") {
            const updatedSpot = payload.new as any;
            setParkingSpots((prev) =>
              prev.map((spot) =>
                spot.id === updatedSpot.id
                  ? {
                      id: updatedSpot.id,
                      coordinates: [
                        updatedSpot.longitude,
                        updatedSpot.latitude,
                      ] as [number, number],
                      available: updatedSpot.available,
                      availableSince: updatedSpot.available_since
                        ? new Date(updatedSpot.available_since)
                        : undefined,
                    }
                  : spot
              )
            );
          } else if (payload.eventType === "DELETE") {
            const deletedSpot = payload.old as any;
            setParkingSpots((prev) =>
              prev.filter((spot) => spot.id !== deletedSpot.id)
            );
          }
        }
      )
      .subscribe();
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
        variant: "destructive",
      });
      return;
    }

    const handleLocationSuccess = (position: GeolocationPosition) => {
      const newLocation: [number, number] = [
        position.coords.longitude,
        position.coords.latitude,
      ];
      setCurrentLocation(newLocation);
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
    };

    const handleLocationError = (error: GeolocationPositionError) => {
      console.error(
        "Location error code:",
        error.code,
        "message:",
        error.message
      );
      // Only show error for permission denied (code 1)
      if (error.code === 1) {
        toast({
          title: "Location Access Denied",
          description:
            "Using default location. Enable location access for better results.",
          variant: "destructive",
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
    const distance = calculateDistance(
      currentLocation[1],
      currentLocation[0],
      spot.coordinates[1],
      spot.coordinates[0]
    );
    return distance < 1
      ? `${Math.round(distance * 1000)}m`
      : `${distance.toFixed(1)}km`;
  };
  const findNearestAvailableSpot = () => {
    const availableParkingSpots = parkingSpots.filter((spot) => spot.available);
    if (availableParkingSpots.length === 0) return null;
    let nearestSpot = availableParkingSpots[0];
    let minDistance = calculateDistance(
      currentLocation[1],
      currentLocation[0],
      nearestSpot.coordinates[1],
      nearestSpot.coordinates[0]
    );
    for (const spot of availableParkingSpots) {
      const distance = calculateDistance(
        currentLocation[1],
        currentLocation[0],
        spot.coordinates[1],
        spot.coordinates[0]
      );
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
        duration: 1000,
      });
      setSelectedSpot(nearestSpot);
      toast({
        title: "Nearest Spot",
        description: `Found parking ${getDistanceToSpot(nearestSpot)} away`,
      });
    } else if (!nearestSpot) {
      toast({
        title: "No Spots Available",
        description: "There are no available parking spots nearby.",
        variant: "destructive",
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
          description:
            "Your parking time has expired. Please move your vehicle.",
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
    if (!userParking || !user || isLeaving) return;
    setIsLeaving(true);

    // Check credits
    if (!credits.canPark) {
      toast({
        title: "Nicht genug Credits",
        description: "Du benötigst mindestens 2 Credits zum Parken.",
        variant: "destructive",
      });
      setShowLeavingOptions(false);
      return;
    }

    // Close dialog early to keep UI responsive
    setShowLeavingOptions(false);

    // Deduct credits
    console.time("leave:deductCredits");
    const success = await deductCredits(userParking.spotId);
    console.timeEnd("leave:deductCredits");
    if (!success) {
      toast({
        title: "Fehler",
        description: "Credits konnten nicht abgezogen werden.",
        variant: "destructive",
      });
      setIsLeaving(false);
      return;
    }

    // Optimistically clear parking locally after successful credits
    const prevParking = userParking;
    setUserParking(null);

    // Get spot coordinates for history
    const spot = parkingSpots.find((s) => s.id === prevParking.spotId);
    const spotCoords = spot?.coordinates || currentLocation;

    // Calculate duration
    const now = new Date();
    const durationMinutes = Math.round(
      (now.getTime() - prevParking.parkingTime.getTime()) / 60000
    );

    // Save history and free spot in parallel
    console.time("leave:dbParallel");
    const [{ error: historyError }, { error: updateError }] = await Promise.all(
      [
        supabase.from("parking_history").insert({
          user_id: user.id,
          spot_id: prevParking.spotId,
          latitude: spotCoords[1],
          longitude: spotCoords[0],
          started_at: prevParking.parkingTime.toISOString(),
          ended_at: now.toISOString(),
          duration_minutes: durationMinutes,
        }),
        supabase
          .from("parking_spots")
          .update({
            available: true,
            available_since: new Date().toISOString(),
          })
          .eq("id", prevParking.spotId),
      ]
    );
    console.timeEnd("leave:dbParallel");

    if (historyError) {
      console.error("Error saving parking history:", historyError);
    }
    if (updateError) {
      console.error("Error updating spot:", updateError);
      toast({
        title: "Error",
        description: "Could not update parking spot.",
        variant: "destructive",
      });
    }

    setIsLeaving(false);
    toast({
      title: t("app.thanksForSharingTitle"),
      description: t("app.thanksForSharingDesc"),
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
    const spot = parkingSpots.find((s) => s.id === userParking.spotId);
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
    const deal = activeDeals.find((d) => d.id === dealId);
    if (!deal) {
      console.log("Deal not found:", dealId, "Available deals:", activeDeals);
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
    // Creating a new spot at manual pin location or current location
    const spotLocation = manualPinLocation || currentLocation;
    const newSpotId = `user-${Date.now()}`;

    // Close dialog immediately for perceived speed
    setShowTimerDialog(false);
    setManualPinLocation(null);

    const { error } = await supabase.from("parking_spots").insert({
      id: newSpotId,
      latitude: spotLocation[1],
      longitude: spotLocation[0],
      available: false,
      available_since: null,
    });
    if (error) {
      console.error("Error creating spot:", error);
      toast({
        title: t("app.error"),
        description: t("app.errorCreateSpot"),
        variant: "destructive",
      });
      return;
    }

    // Award +4 credits for reporting a new spot
    try {
      const response = await supabase.functions.invoke("process-credits", {
        body: { action: "new_spot_reported", spotId: newSpotId },
      });
      if (response.error) {
        console.error("Error awarding credits:", response.error);
      } else {
        refreshCredits();
      }
    } catch (e) {
      console.error("Error calling process-credits:", e);
    }

    setUserParking({
      spotId: newSpotId,
      parkingTime: now,
      returnTime: null,
      durationMinutes: null,
    });
    toast({
      title: t("app.newSpotReported"),
      description: t("app.creditsReceived"),
    });
  };

  const handleTakeExistingSpot = async () => {
    if (!selectedSpot) return;

    const now = new Date();
    // Optimistically close selection for faster perceived response
    setSelectedSpot(null);

    // Optimistically set local parking
    const takenSpotId = selectedSpot.id;
    const prevParking = userParking;
    setUserParking({
      spotId: takenSpotId,
      parkingTime: now,
      returnTime: null,
      durationMinutes: null,
    });

    // Update in database
    console.time("take:updateSpot");
    const { error } = await supabase
      .from("parking_spots")
      .update({
        available: false,
        available_since: null,
      })
      .eq("id", takenSpotId);
    console.timeEnd("take:updateSpot");
    if (error) {
      console.error("Error updating spot:", error);
      // rollback local state on failure
      setUserParking(prevParking || null);
      toast({
        title: t("app.error"),
        description: t("app.errorTakeSpot"),
        variant: "destructive",
      });
      return;
    }
    toast({
      title: t("app.spotTaken"),
      description: t("app.spotTakenDesc"),
    });
  };
  const handleSpotClick = (spotId: string) => {
    const spot = parkingSpots.find((s) => s.id === spotId);
    if (spot && spot.available) {
      setSelectedSpot(spot);
    }
  };
  const handleTakeSpot = async () => {
    if (!selectedSpot || isTakingSpot) return;
    // Check if user is authenticated before allowing to take a spot
    if (!user) {
      setPendingAction("take");
      setShowAuthDialog(true);
      return;
    }
    // Directly take the existing spot without showing timer dialog
    setIsTakingSpot(true);
    try {
      await handleTakeExistingSpot();
    } finally {
      setIsTakingSpot(false);
    }
  };
  const handleAuthSuccess = () => {
    // Execute pending action after successful auth
    if (pendingAction === "park") {
      setShowTimerDialog(true);
    } else if (pendingAction === "take" && selectedSpot) {
      // Directly take the spot after auth
      handleTakeExistingSpot();
    }
    setPendingAction(null);
  };
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserParking(null);
    toast({
      title: t("app.signedOut"),
      description: t("app.signedOutDesc"),
    });
  };
  const handleRecenter = () => {
    if (mapInstance && currentLocation) {
      mapInstance.flyTo({
        center: currentLocation,
        zoom: 15,
        duration: 1000,
      });
      toast({
        title: t("app.mapRecentered"),
        description: t("app.mapRecenteredDesc"),
      });
    }
  };

  // OS Detection for navigation
  const isIOS = () => {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  };

  // Navigation handler
  const handleNavigateToSpot = (
    spot: ParkingSpot,
    mapType: "google" | "apple"
  ) => {
    const [lng, lat] = spot.coordinates;

    if (mapType === "google") {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        "_blank"
      );
    } else {
      window.open(`https://maps.apple.com/?daddr=${lat},${lng}`, "_blank");
    }
  };
  return (
    <div className="h-[100dvh] w-full bg-background overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 pt-safe">
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button
                variant="ghost"
                size="icon"
                className="touch-target"
                aria-label="Back to home"
                style={{
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                OGAP
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Find & Share Free Parking
              </p>
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
                style={{
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <HandshakeIcon className="h-5 w-5 text-primary" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
              </Button>
            )}
            {user ? (
              <AccountMenu
                user={user}
                onSignOut={handleSignOut}
                creditBalance={credits.balance}
                lastCreditChange={lastCreditChange}
              />
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAuthDialog(true)}
                className="touch-target"
                style={{
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <div
        className="absolute inset-0 pt-20 sm:pt-28 transition-all duration-300"
        style={{
          paddingBottom: userParking ? "12rem" : "10rem",
        }}
      >
        <div className="h-full px-3 sm:px-6 relative">
          {(() => {
            // Pass ALL active deals for marker filtering, but Map will only show 'open' deals as clickable
            const activeStatuses = [
              "open",
              "pending_approval",
              "accepted",
              "giver_confirmed",
              "receiver_confirmed",
            ];
            const activeDealsForMap = activeDeals.filter((d) =>
              activeStatuses.includes(d.status)
            );
            console.log("Passing handshake deals to Map:", activeDealsForMap);
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
      <div
        className="fixed right-3 sm:right-6 z-30 transition-all duration-300"
        style={{
          bottom: userParking ? "calc(12rem + 0.5rem)" : "calc(10rem + 0.5rem)",
        }}
      >
        <Button
          onClick={handleRecenter}
          size="icon"
          variant="outline"
          className="group h-12 w-12 rounded-full shadow-lg bg-card hover:bg-primary active:scale-95 touch-target"
          aria-label="Recenter map on my location"
          style={{
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <Locate className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
        </Button>
      </div>

      {/* Spot Details Dialog */}
      <Dialog
        open={!!selectedSpot}
        onOpenChange={(open) => !open && setSelectedSpot(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Parking Spot Available</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>
              <strong className="text-foreground">Distance:</strong>{" "}
              {selectedSpot && getDistanceToSpot(selectedSpot)} away
            </div>
            <div>
              <strong className="text-foreground">Available for:</strong>{" "}
              {selectedSpot?.availableSince &&
                formatDistanceToNow(selectedSpot.availableSince)}
            </div>
            {selectedSpot?.availableSince && (
              <div className="pt-2">
                <strong className="text-foreground">
                  {t("app.availabilityChance")}:
                </strong>
                <ProbabilityBar
                  probability={calculateParkingProbability(
                    selectedSpot.availableSince
                  )}
                />
              </div>
            )}
          </div>
          <div className="space-y-2 pt-4">
            {/* Navigation Buttons - OS-based primary/secondary */}
            {selectedSpot && (
              <>
                {isIOS() ? (
                  <>
                    <Button
                      onClick={() =>
                        handleNavigateToSpot(selectedSpot, "apple")
                      }
                      size="lg"
                      variant="outline"
                      className="w-full gap-2"
                      style={{
                        touchAction: "manipulation",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      <Navigation className="h-4 w-4" />
                      Navigate with Apple Maps
                    </Button>
                    <Button
                      onClick={() =>
                        handleNavigateToSpot(selectedSpot, "google")
                      }
                      size="lg"
                      variant="ghost"
                      className="w-full gap-2 text-muted-foreground"
                      style={{
                        touchAction: "manipulation",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      <MapPin className="h-4 w-4" />
                      Open in Google Maps
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() =>
                        handleNavigateToSpot(selectedSpot, "google")
                      }
                      size="lg"
                      variant="outline"
                      className="w-full gap-2"
                      style={{
                        touchAction: "manipulation",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      <Navigation className="h-4 w-4" />
                      {t("app.openInGoogleMaps")}
                    </Button>
                    <Button
                      onClick={() =>
                        handleNavigateToSpot(selectedSpot, "apple")
                      }
                      size="lg"
                      variant="ghost"
                      className="w-full gap-2 text-muted-foreground"
                      style={{
                        touchAction: "manipulation",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      <MapPin className="h-4 w-4" />
                      {t("app.openInAppleMaps")}
                    </Button>
                  </>
                )}
              </>
            )}
            <Button
              onClick={handleTakeSpot}
              size="lg"
              className="w-full"
              disabled={isTakingSpot}
              style={{
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {isTakingSpot ? t("app.loading") : t("app.takeSpot")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report New Parking Spot Dialog - only shown when creating new spots */}
      <Dialog open={showTimerDialog} onOpenChange={setShowTimerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("app.setSpotTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("app.setSpotDesc")}
            </p>
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-sm text-primary">
              <strong>💡</strong> {t("app.setSpotHint")}
            </div>
          </div>
          <Button
            onClick={() => {
              handleConfirmParking();
            }}
            size="lg"
            className="w-full mt-4"
            style={{
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {t("app.setSpotButton")}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Bottom Card */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="bg-card rounded-t-[1.5rem] sm:rounded-t-[2rem] shadow-2xl border-t border-border px-4 sm:px-6 pb-safe pt-3 pb-6">
          {/* Drag handle - visual only */}
          <div className="w-full flex justify-center items-center pb-3">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          <div className="space-y-4">
            {/* Compact Stats Line - always visible */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleFocusNearestSpot}
                className="flex items-center gap-2 hover:bg-accent/50 rounded-xl px-3 py-2 -ml-3 transition-colors active:scale-[0.98] touch-target"
                style={{
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-foreground">
                    {availableSpots}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("app.spotsAvailable")}
                  </span>
                </div>
              </button>

              <div className="flex items-center gap-2 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-success" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-foreground">
                    {activeUsers}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("app.activeUsers")}
                  </span>
                </div>
              </div>
            </div>

            {/* Timer - only when parked */}
            {userParking && timeRemaining && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-full shrink-0">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t("app.parkingTimer")}
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {timeRemaining}
                  </p>
                </div>
              </div>
            )}

            {/* CTA Button */}
            <ParkingButton
              onToggle={handleParkingToggle}
              isParked={!!userParking}
            />
          </div>
        </div>
      </div>

      {/* Auth Dialog */}
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onSuccess={handleAuthSuccess}
      />

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
    </div>
  );
};
export default Index;
