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
      if (onMapReady && map.current) {
        onMapReady(map.current);
      }
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [onMapReady]);

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

      const marker = new mapboxgl.Marker(el)
        .setLngLat(spot.coordinates)
        .addTo(map.current);

      markers.current[spot.id] = marker;
    });
  }, [parkingSpots]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-3xl overflow-hidden" />
    </div>
  );
};

export default Map;
