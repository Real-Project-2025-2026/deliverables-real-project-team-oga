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

interface HandshakeDeal {
  id: string;
  spot_id: string;
  latitude: number;
  longitude: number;
  status: string;
}

interface MapProps {
  onMapReady?: (map: mapboxgl.Map) => void;
  parkingSpots: ParkingSpot[];
  currentLocation?: [number, number];
  onSpotClick?: (spotId: string) => void;
  manualPinLocation?: [number, number] | null;
  onManualPinMove?: (location: [number, number]) => void;
  handshakeDeals?: HandshakeDeal[];
  onHandshakeDealClick?: (dealId: string) => void;
}

const MAPBOX_TOKEN_KEY = 'mapbox_access_token';

const Map = ({ onMapReady, parkingSpots, currentLocation, onSpotClick, manualPinLocation, onManualPinMove, handshakeDeals = [], onHandshakeDealClick }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const handshakeMarkers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const currentLocationMarker = useRef<mapboxgl.Marker | null>(null);
  const manualPinMarker = useRef<mapboxgl.Marker | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [status, setStatus] = useState<'loading' | 'input' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fetchAttempted = useRef(false);
  const tokenFetched = useRef(false);

  // On mount, try to get token
  useEffect(() => {
    if (fetchAttempted.current) return;
    fetchAttempted.current = true;

    const init = async () => {
      // Check localStorage first
      const cachedToken = localStorage.getItem(MAPBOX_TOKEN_KEY);
      
      if (cachedToken && cachedToken.startsWith('pk.')) {
        console.log('Using cached Mapbox token');
        tokenFetched.current = true;
        setMapboxToken(cachedToken);
        return;
      }

      // Clear any invalid cached token
      localStorage.removeItem(MAPBOX_TOKEN_KEY);

      // Try edge function
      console.log('Fetching token from edge function...');
      try {
        const { data, error } = await supabase.functions.invoke('mapbox-proxy', {
          body: { action: 'get-token' }
        });

        console.log('Edge function response:', { data, error });

        if (!error && data?.token && data.token.startsWith('pk.')) {
          console.log('Got valid token from edge function');
          tokenFetched.current = true;
          localStorage.setItem(MAPBOX_TOKEN_KEY, data.token);
          setMapboxToken(data.token);
          return;
        }
      } catch (err) {
        console.log('Edge function error:', err);
      }

      // Fallback to manual input
      console.log('Showing manual token input');
      setStatus('input');
    };

    // Set timeout for fallback - use ref to check actual state
    const timeout = setTimeout(() => {
      if (!tokenFetched.current) {
        console.log('Timeout - showing manual input');
        setStatus('input');
      }
    }, 8000);

    init();

    return () => clearTimeout(timeout);
  }, []);

  const handleSaveToken = useCallback(() => {
    const token = tokenInput.trim();
    if (token && token.startsWith('pk.')) {
      localStorage.setItem(MAPBOX_TOKEN_KEY, token);
      setMapboxToken(token);
      setStatus('loading');
      setErrorMsg(null);
    }
  }, [tokenInput]);

  const handleClearToken = useCallback(() => {
    localStorage.removeItem(MAPBOX_TOKEN_KEY);
    tokenFetched.current = false;
    setMapboxToken(null);
    setStatus('input');
    setErrorMsg(null);
    setIsMapLoaded(false);
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
  }, []);

  // Initialize map when token is available AND container is ready
  useEffect(() => {
    if (!mapboxToken || map.current) return;
    
    // Wait for container to be available
    const initMap = () => {
      if (!mapContainer.current) {
        console.log('Map container not ready, retrying...');
        setTimeout(initMap, 100);
        return;
      }

      console.log('Initializing Mapbox map...');

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
            console.log('Map load timeout');
            setErrorMsg('Map took too long to load. Try clearing token and re-entering.');
            setStatus('error');
          }
        }, 20000);

        // Only show navigation controls on larger screens
        if (window.innerWidth >= 768) {
          map.current.addControl(
            new mapboxgl.NavigationControl({ visualizePitch: false }),
            'top-right'
          );
        }

        map.current.on('load', () => {
          console.log('Map loaded successfully!');
          clearTimeout(loadTimeout);
          setIsMapLoaded(true);
          setStatus('ready');
          onMapReady?.(map.current!);
        });

        map.current.on('error', (e) => {
          console.error('Map error:', e);
          clearTimeout(loadTimeout);
          handleClearToken();
          setErrorMsg('Invalid token or map error. Please re-enter your token.');
          setStatus('input');
        });

        map.current.on('move', () => {
          if (!map.current) return;
          
          const center = map.current.getCenter();
          
          if (!manualPinMarker.current) {
            const el = document.createElement('div');
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
    };

    initMap();
  }, [mapboxToken, onMapReady, handleClearToken, onManualPinMove, currentLocation, status]);

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
      el.innerHTML = `<div class="pulse-ring"></div><div class="location-dot"></div>`;
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.position = 'relative';
      currentLocationMarker.current = new mapboxgl.Marker(el)
        .setLngLat(currentLocation)
        .addTo(map.current);
    } else {
      currentLocationMarker.current.setLngLat(currentLocation);
    }
  }, [currentLocation, isMapLoaded]);

  // Combined effect for parking spots AND handshake markers to avoid race conditions
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    console.log('=== MARKER UPDATE ===');
    console.log('Parking spots:', parkingSpots.length);
    console.log('Handshake deals:', handshakeDeals.length, handshakeDeals.map(d => ({ id: d.id, status: d.status, spot_id: d.spot_id })));

    // Get spot IDs that have ANY active handshake deals
    const activeStatuses = ['open', 'pending_approval', 'accepted', 'giver_confirmed', 'receiver_confirmed'];
    const handshakeSpotIds = new Set(
      handshakeDeals
        .filter(d => activeStatuses.includes(d.status))
        .map(d => d.spot_id)
    );
    console.log('Spots with active handshake deals:', Array.from(handshakeSpotIds));

    // Clear ALL markers first
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};
    Object.values(handshakeMarkers.current).forEach(marker => marker.remove());
    handshakeMarkers.current = {};

    // 1. Add parking spot markers (excluding spots with active handshake deals)
    parkingSpots.forEach(spot => {
      if (!map.current) return;
      
      // Skip spots that have an active handshake deal - they'll get handshake markers instead
      if (handshakeSpotIds.has(spot.id)) {
        console.log('Skipping parking marker for spot with handshake:', spot.id);
        return;
      }

      const el = document.createElement('div');
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

      if (spot.available && onSpotClick) {
        el.addEventListener('click', () => onSpotClick(spot.id));
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat(spot.coordinates)
        .addTo(map.current);

      markers.current[spot.id] = marker;
    });

    // 2. Add handshake markers for ALL active deals (giver sees their own deal too)
    handshakeDeals.forEach(deal => {
      if (!map.current) return;
      
      // Only show markers for active deals
      if (!activeStatuses.includes(deal.status)) {
        console.log('Skipping handshake marker - inactive status:', deal.id, deal.status);
        return;
      }

      console.log('Creating handshake marker for:', deal.id, 'status:', deal.status);

      const el = document.createElement('div');
      el.innerHTML = `
        <div class="handshake-marker">
          <svg width="44" height="52" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z" 
                  fill="hsl(38, 92%, 50%)" 
                  stroke="white" stroke-width="2"/>
            <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">🤝</text>
          </svg>
          <div class="handshake-pulse"></div>
        </div>
      `;
      el.style.cursor = 'pointer';
      el.style.position = 'relative';
      el.style.zIndex = '1000';

      // Only allow clicking on 'open' deals (for other users to request)
      if (deal.status === 'open' && onHandshakeDealClick) {
        el.addEventListener('click', () => onHandshakeDealClick(deal.id));
      }

      try {
        const marker = new mapboxgl.Marker(el)
          .setLngLat([deal.longitude, deal.latitude])
          .addTo(map.current);

        handshakeMarkers.current[deal.id] = marker;
        console.log('Handshake marker added successfully:', deal.id);
      } catch (err) {
        console.error('Error adding handshake marker:', deal.id, err);
      }
    });

    console.log('=== END MARKER UPDATE ===');
  }, [parkingSpots, handshakeDeals, isMapLoaded, onSpotClick, onHandshakeDealClick]);

  // Token input form - render as overlay
  if (status === 'input') {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-muted/50 rounded-3xl">
        <div className="bg-card p-6 rounded-xl shadow-lg max-w-md w-full mx-4 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Mapbox Access Token</h3>
          <p className="text-sm text-muted-foreground">
            Enter your Mapbox public token (starts with pk.). Get one at{' '}
            <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              mapbox.com/access-tokens
            </a>
          </p>
          {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
          <Input
            type="text"
            placeholder="pk.eyJ1..."
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveToken()}
          />
          <Button onClick={handleSaveToken} className="w-full" disabled={!tokenInput.trim().startsWith('pk.')}>
            Load Map
          </Button>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-muted/50 rounded-3xl">
        <div className="bg-card p-6 rounded-xl shadow-lg max-w-md w-full mx-4 space-y-4 text-center">
          <p className="text-destructive font-medium">Map Error</p>
          <p className="text-sm text-muted-foreground">{errorMsg}</p>
          <Button variant="outline" onClick={handleClearToken}>
            Enter Token Manually
          </Button>
        </div>
      </div>
    );
  }

  // Always render the map container - show loading overlay on top
  return (
    <div className="relative w-full h-full">
      <style>{`
        .location-dot {
          width: 16px; height: 16px;
          background: hsl(142, 76%, 36%);
          border: 3px solid white; border-radius: 50%;
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3); z-index: 2;
        }
        .pulse-ring {
          width: 40px; height: 40px;
          border: 3px solid hsl(142, 76%, 36%); border-radius: 50%;
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          animation: pulse 2s ease-out infinite; opacity: 0; z-index: 1;
        }
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
        .handshake-marker {
          position: relative;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
        }
        .handshake-pulse {
          position: absolute;
          top: 6px; left: 6px;
          width: 32px; height: 32px;
          border: 3px solid hsl(38, 92%, 50%);
          border-radius: 50%;
          animation: handshakePulse 1.5s ease-out infinite;
        }
        @keyframes handshakePulse {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
      
      {/* Always render the map container */}
      <div ref={mapContainer} className="absolute inset-0 rounded-3xl overflow-hidden" />
      
      {/* Loading overlay */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80 rounded-3xl z-10">
          <div className="text-center space-y-3">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
            <div className="flex gap-2 justify-center">
              <Button variant="ghost" size="sm" onClick={handleClearToken} className="text-xs">
                Enter token manually
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
