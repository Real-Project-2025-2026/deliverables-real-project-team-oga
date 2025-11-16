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
  currentLocation?: [number, number];
  onSpotClick?: (spotId: string) => void;
}

const Map = ({ onMapReady, parkingSpots, currentLocation, onSpotClick }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const currentLocationMarker = useRef<mapboxgl.Marker | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    mapboxgl.accessToken = 'pk.eyJ1IjoiZmVsaXhrbGluZ2UiLCJhIjoiY21oeGJhbzdoMDByeDJscXdjbnowa3Z1bSJ9.l2qql7XrdECiyVr-aqgfSQ';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [11.5800, 48.1550], // Hohenzollernstr. 48, Munich
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
      if (onMapReady && map.current) {
        onMapReady(map.current);
      }
    });

    // Add current location marker if provided
    if (currentLocation) {
      const el = document.createElement('div');
      el.className = 'current-location-marker';
      el.innerHTML = `
        <div class="pulse-ring"></div>
        <div class="location-dot"></div>
      `;
      
      currentLocationMarker.current = new mapboxgl.Marker(el)
        .setLngLat(currentLocation)
        .addTo(map.current);
    }

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [onMapReady, currentLocation]);

  // Update markers when parking spots change
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    console.log('Updating markers, parkingSpots:', parkingSpots);

    // Remove old markers
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    // Add new markers
    parkingSpots.forEach(spot => {
      if (!map.current) return;

      console.log('Adding marker for spot:', spot.id, spot.coordinates);

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

      // Add click handler for available spots
      if (spot.available && onSpotClick) {
        el.addEventListener('click', () => {
          onSpotClick(spot.id);
        });
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat(spot.coordinates)
        .addTo(map.current);

      markers.current[spot.id] = marker;
      console.log('Marker added successfully for spot:', spot.id);
    });
  }, [parkingSpots, isMapLoaded]);

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
