import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Input } from './ui/input';
import { Button } from './ui/button';

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

const MAPBOX_TOKEN_KEY = 'mapbox_access_token';

const Map = ({ onMapReady, parkingSpots, currentLocation, onSpotClick, manualPinLocation, onManualPinMove }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const currentLocationMarker = useRef<mapboxgl.Marker | null>(null);
  const manualPinMarker = useRef<mapboxgl.Marker | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [status, setStatus] = useState<'loading' | 'input' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // On mount, check for cached token or fetch from server
  useEffect(() => {
    const cachedToken = localStorage.getItem(MAPBOX_TOKEN_KEY);
    
    if (cachedToken) {
      setMapboxToken(cachedToken);
      return;
    }

    // Try to fetch token from edge function
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('mapbox-proxy', {
          body: { action: 'get-token' }
        });

        if (error || data?.error || !data?.token) {
          console.log('Edge function failed, showing token input');
          setStatus('input');
          return;
        }

        localStorage.setItem(MAPBOX_TOKEN_KEY, data.token);
        setMapboxToken(data.token);
      } catch (err) {
        console.log('Edge function error:', err);
        setStatus('input');
      }
    };

    // Set a short timeout to prevent hanging
    const timeout = setTimeout(() => {
      if (status === 'loading' && !mapboxToken) {
        setStatus('input');
      }
    }, 5000);

    fetchToken();

    return () => clearTimeout(timeout);
  }, []);

  const handleSaveToken = useCallback(() => {
    if (tokenInput.trim()) {
      const token = tokenInput.trim();
      localStorage.setItem(MAPBOX_TOKEN_KEY, token);
      setMapboxToken(token);
      setStatus('loading');
    }
  }, [tokenInput]);

  const handleClearToken = useCallback(() => {
    localStorage.removeItem(MAPBOX_TOKEN_KEY);
    setMapboxToken(null);
    setStatus('input');
    setErrorMsg(null);
  }, []);

  // Initialize map when token is available
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

      const loadTimeout = setTimeout(() => {
        if (status !== 'ready') {
          setErrorMsg('Map took too long to load');
          setStatus('error');
        }
      }, 20000);

      map.current.addControl(
        new mapboxgl.NavigationControl({ visualizePitch: false }),
        'top-right'
      );

      map.current.on('load', () => {
        clearTimeout(loadTimeout);
        setIsMapLoaded(true);
        setStatus('ready');
        if (onMapReady && map.current) {
          onMapReady(map.current);
        }
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
        clearTimeout(loadTimeout);
        const msg = e.error?.message || 'Map failed to load';
        if (msg.includes('access') || msg.includes('token') || msg.includes('401')) {
          handleClearToken();
        } else {
          setErrorMsg(msg);
          setStatus('error');
        }
      });

      map.current.on('move', () => {
        if (!map.current) return;
        
        const center = map.current.getCenter();
        
        if (!manualPinMarker.current) {
          const el = document.createElement('div');
          el.className = 'manual-pin-marker';
          el.innerHTML = `
            <svg width="40" height="50" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z" 
                    fill="hsl(142, 76%, 36%)" stroke="white" stroke-width="2"/>
              <text x="12" y="16" text-anchor="middle" fill="white" font-size="14" font-weight="bold">P</text>
            </svg>
          `;
          el.style.cursor = 'default';
          el.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))';
          el.style.pointerEvents = 'none';

          manualPinMarker.current = new mapboxgl.Marker(el, { draggable: false })
            .setLngLat([center.lng, center.lat])
            .addTo(map.current);
        } else {
          manualPinMarker.current.setLngLat([center.lng, center.lat]);
        }
        
        onManualPinMove?.([center.lng, center.lat]);
      });

    } catch (err) {
      console.error('Map init error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to initialize map');
      setStatus('error');
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken, onMapReady, handleClearToken]);

  // Update manual pin
  useEffect(() => {
    if (manualPinLocation && manualPinMarker.current) {
      manualPinMarker.current.setLngLat(manualPinLocation);
    } else if (!manualPinLocation && manualPinMarker.current) {
      manualPinMarker.current.remove();
      manualPinMarker.current = null;
    }
  }, [manualPinLocation]);

  // Update current location marker
  useEffect(() => {
    if (!map.current || !isMapLoaded || !currentLocation) return;

    if (!currentLocationMarker.current) {
      const el = document.createElement('div');
      el.className = 'current-location-marker';
      el.innerHTML = `<div class="pulse-ring"></div><div class="location-dot"></div>`;
      currentLocationMarker.current = new mapboxgl.Marker(el)
        .setLngLat(currentLocation)
        .addTo(map.current);
    } else {
      currentLocationMarker.current.setLngLat(currentLocation);
    }
  }, [currentLocation, isMapLoaded]);

  // Update parking spot markers
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    parkingSpots.forEach(spot => {
      if (!map.current) return;

      const el = document.createElement('div');
      el.className = 'parking-marker';
      el.innerHTML = `
        <svg width="32" height="40" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z" 
                fill="${spot.available ? 'hsl(211, 100%, 50%)' : 'hsl(0, 0%, 70%)'}" 
                stroke="white" stroke-width="2"/>
          <circle cx="12" cy="12" r="4" fill="white"/>
        </svg>
      `;
      el.style.cursor = 'pointer';
      el.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';
      el.style.transition = 'all 0.3s ease';

      if (spot.available && onSpotClick) {
        el.addEventListener('click', () => onSpotClick(spot.id));
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat(spot.coordinates)
        .addTo(map.current);

      markers.current[spot.id] = marker;
    });
  }, [parkingSpots, isMapLoaded, onSpotClick]);

  // Render token input form
  if (status === 'input') {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-muted/50 rounded-3xl">
        <div className="bg-card p-6 rounded-xl shadow-lg max-w-md w-full mx-4 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Mapbox Access Token Required</h3>
          <p className="text-sm text-muted-foreground">
            Enter your Mapbox public access token. Get one free at{' '}
            <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              mapbox.com
            </a>
          </p>
          <Input
            type="text"
            placeholder="pk.eyJ1..."
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveToken()}
          />
          <Button onClick={handleSaveToken} className="w-full" disabled={!tokenInput.trim()}>
            Save Token
          </Button>
        </div>
      </div>
    );
  }

  // Render loading state
  if (status === 'loading') {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-muted/50 rounded-3xl">
        <div className="text-center space-y-2">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (status === 'error') {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-muted/50 rounded-3xl">
        <div className="bg-card p-6 rounded-xl shadow-lg max-w-md w-full mx-4 space-y-4 text-center">
          <p className="text-destructive font-medium">Failed to load map</p>
          <p className="text-sm text-muted-foreground">{errorMsg}</p>
          <Button variant="outline" onClick={handleClearToken}>
            Enter Token Manually
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <style>{`
        .current-location-marker { width: 24px; height: 24px; position: relative; }
        .location-dot {
          width: 16px; height: 16px;
          background: hsl(var(--success));
          border: 3px solid white; border-radius: 50%;
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3); z-index: 2;
        }
        .pulse-ring {
          width: 40px; height: 40px;
          border: 3px solid hsl(var(--success)); border-radius: 50%;
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          animation: pulse 2s ease-out infinite; opacity: 0; z-index: 1;
        }
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
      `}</style>
      <div ref={mapContainer} className="absolute inset-0 rounded-3xl overflow-hidden" />
    </div>
  );
};

export default Map;
