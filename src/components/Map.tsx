import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface ParkingSpot {
  id: string;
  coordinates: [number, number];
  available: boolean;
}

interface MapProps {
  onMapReady?: (map: mapboxgl.Map) => void;
  parkingSpots: ParkingSpot[];
}

const Map = ({ onMapReady, parkingSpots }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [mapboxToken, setMapboxToken] = useState<string>('');

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [11.5820, 48.1351], // Munich coordinates
      zoom: 13,
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
      if (onMapReady && map.current) {
        onMapReady(map.current);
      }
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, onMapReady]);

  // Update markers when parking spots change
  useEffect(() => {
    if (!map.current) return;

    // Remove old markers
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    // Add new markers
    parkingSpots.forEach(spot => {
      if (!map.current) return;

      const el = document.createElement('div');
      el.className = 'parking-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = spot.available ? 'hsl(var(--ios-blue))' : 'hsl(var(--muted))';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      el.style.cursor = 'pointer';
      el.style.transition = 'all 0.3s ease';

      const marker = new mapboxgl.Marker(el)
        .setLngLat(spot.coordinates)
        .addTo(map.current);

      markers.current[spot.id] = marker;
    });
  }, [parkingSpots]);

  return (
    <div className="relative w-full h-full">
      {!mapboxToken && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/95 backdrop-blur-sm p-6">
          <div className="w-full max-w-md space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold">Enter Mapbox Token</h2>
              <p className="text-sm text-muted-foreground">
                Get your free token at{' '}
                <a
                  href="https://mapbox.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  mapbox.com
                </a>
              </p>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="pk.eyJ1..."
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={() => mapboxToken && window.location.reload()}
                disabled={!mapboxToken}
                className="w-full px-4 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 transition-all active:scale-95"
              >
                Load Map
              </button>
            </div>
          </div>
        </div>
      )}
      <div ref={mapContainer} className="absolute inset-0 rounded-3xl overflow-hidden" />
    </div>
  );
};

export default Map;
