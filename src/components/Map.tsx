import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';

interface ParkingSpot {
  id: string;
  coordinates: [number, number];
  available: boolean;
}

interface MapProps {
  onMapReady?: (map: mapboxgl.Map) => void;
  parkingSpots: ParkingSpot[];
  currentLocation?: [number, number];
  onSpotClick?: (spotId: string) => void;
  manualPinLocation?: [number, number] | null;
  onManualPinMove?: (location: [number, number]) => void;
}

const Map = ({ onMapReady, parkingSpots, currentLocation, onSpotClick, manualPinLocation, onManualPinMove }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const currentLocationMarker = useRef<mapboxgl.Marker | null>(null);
  const manualPinMarker = useRef<mapboxgl.Marker | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  // Fetch token from proxy on mount
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error: proxyError } = await supabase.functions.invoke('mapbox-proxy', {
          body: { action: 'get-token' }
        });

        if (proxyError) {
          throw new Error('Failed to fetch map configuration');
        }

        if (data.error) {
          throw new Error(data.error);
        }

        if (data.token) {
          setMapboxToken(data.token);
        } else {
          throw new Error('No token received');
        }
      } catch (err) {
        console.error('Error fetching token:', err);
        setError(err instanceof Error ? err.message : 'Failed to load map configuration');
        setIsLoading(false);
      }
    };

    fetchToken();
  }, []);

  // Initialize map once we have the token
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: currentLocation || [11.5800, 48.1550],
        zoom: 15,
        pitch: 0,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: false,
        }),
        'top-right'
      );

      map.current.on('load', () => {
        setIsMapLoaded(true);
        setIsLoading(false);
        if (onMapReady && map.current) {
          onMapReady(map.current);
        }
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
      });

      // Add draggable manual pin on map move
      map.current.on('move', () => {
        if (map.current && !manualPinMarker.current) {
          const center = map.current.getCenter();
          const el = document.createElement('div');
          el.className = 'manual-pin-marker';
          el.innerHTML = `
            <svg width="40" height="50" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z" 
                    fill="hsl(142, 76%, 36%)" 
                    stroke="white" 
                    stroke-width="2"/>
              <text x="12" y="16" text-anchor="middle" fill="white" font-size="14" font-weight="bold">P</text>
            </svg>
          `;
          el.style.cursor = 'default';
          el.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))';
          el.style.pointerEvents = 'none';

          manualPinMarker.current = new mapboxgl.Marker(el, { draggable: false })
            .setLngLat([center.lng, center.lat])
            .addTo(map.current);

          if (onManualPinMove) {
            onManualPinMove([center.lng, center.lat]);
          }
        } else if (map.current && manualPinMarker.current) {
          const center = map.current.getCenter();
          manualPinMarker.current.setLngLat([center.lng, center.lat]);
          if (onManualPinMove) {
            onManualPinMove([center.lng, center.lat]);
          }
        }
      });

    } catch (err) {
      console.error('Error initializing map:', err);
      setError(err instanceof Error ? err.message : 'Failed to load map');
      setIsLoading(false);
    }

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, onMapReady]);

  // Update manual pin location when prop changes
  useEffect(() => {
    if (manualPinLocation && manualPinMarker.current) {
      manualPinMarker.current.setLngLat(manualPinLocation);
    } else if (!manualPinLocation && manualPinMarker.current) {
      manualPinMarker.current.remove();
      manualPinMarker.current = null;
    }
  }, [manualPinLocation]);

  // Update current location marker when location changes
  useEffect(() => {
    if (!map.current || !isMapLoaded || !currentLocation) return;

    if (!currentLocationMarker.current) {
      const el = document.createElement('div');
      el.className = 'current-location-marker';
      el.innerHTML = `
        <div class="pulse-ring"></div>
        <div class="location-dot"></div>
      `;
      currentLocationMarker.current = new mapboxgl.Marker(el)
        .setLngLat(currentLocation)
        .addTo(map.current);
    } else {
      currentLocationMarker.current.setLngLat(currentLocation);
    }
  }, [currentLocation, isMapLoaded]);

  // Update markers when parking spots change
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Remove old markers
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    // Add new markers
    parkingSpots.forEach(spot => {
      if (!map.current) return;

      const el = document.createElement('div');
      el.className = 'parking-marker';
      el.innerHTML = `
        <svg width="32" height="40" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z" 
                fill="${spot.available ? 'hsl(211, 100%, 50%)' : 'hsl(0, 0%, 70%)'}" 
                stroke="white" 
                stroke-width="2"/>
          <circle cx="12" cy="12" r="4" fill="white"/>
        </svg>
      `;
      el.style.cursor = 'pointer';
      el.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';
      el.style.transition = 'all 0.3s ease';

      if (spot.available && onSpotClick) {
        el.addEventListener('click', () => {
          onSpotClick(spot.id);
        });
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat(spot.coordinates)
        .addTo(map.current);

      markers.current[spot.id] = marker;
    });
  }, [parkingSpots, isMapLoaded]);

  if (isLoading) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-muted/50 rounded-3xl">
        <div className="text-center space-y-2">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-muted/50 rounded-3xl">
        <div className="bg-card p-6 rounded-xl shadow-lg max-w-md w-full mx-4 space-y-4 text-center">
          <p className="text-destructive font-medium">Failed to load map</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <style>{`
        .current-location-marker {
          width: 24px;
          height: 24px;
          position: relative;
        }
        
        .location-dot {
          width: 16px;
          height: 16px;
          background: hsl(var(--success));
          border: 3px solid white;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          z-index: 2;
        }
        
        .pulse-ring {
          width: 40px;
          height: 40px;
          border: 3px solid hsl(var(--success));
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: pulse 2s ease-out infinite;
          opacity: 0;
          z-index: 1;
        }
        
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
      <div ref={mapContainer} className="absolute inset-0 rounded-3xl overflow-hidden" />
    </div>
  );
};

export default Map;
