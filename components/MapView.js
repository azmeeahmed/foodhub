'use client';

/**
 * MapView.js
 * ──────────
 * Google Map with numbered markers matching the sidebar list.
 * Active marker = red filled; inactive = dark/outlined.
 */

import { useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

const MAP_STYLE = { width: '100%', height: '100%' };

// Clean, minimal map style matching the editorial aesthetic
const MAP_OPTIONS = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  gestureHandling: 'greedy',
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#f5f5f0' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f0' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#333333' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#666666' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e8e8e8' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9d8e8' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#dae8d0' }] },
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#111111' }] },
  ],
};

/**
 * Creates a circular numbered marker as a data URL.
 * Active → red background; inactive → dark grey.
 */
function makeMarkerIcon(number, isActive) {
  const size = isActive ? 36 : 30;
  const bg = isActive ? '#e8001c' : '#333333';
  const fontSize = number > 9 ? (isActive ? 13 : 11) : (isActive ? 15 : 13);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 8}" viewBox="0 0 ${size} ${size + 8}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="${bg}" stroke="white" stroke-width="2"/>
      <text x="${size / 2}" y="${size / 2 + fontSize * 0.38}" 
            text-anchor="middle" fill="white" 
            font-family="'Barlow Condensed', sans-serif" 
            font-weight="900" font-size="${fontSize}px">${number}</text>
      <polygon points="${size / 2 - 5},${size - 2} ${size / 2 + 5},${size - 2} ${size / 2},${size + 7}" fill="${bg}"/>
    </svg>`;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: { width: size, height: size + 8 },
    anchor: { x: size / 2, y: size + 8 },
  };
}

export default function MapView({ places, activePlaceId, center, onMarkerClick }) {
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const activeIdRef = useRef(activePlaceId);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    id: 'google-map-script',
  });

  const handleMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  // ── Create/update markers when places load ──────────────────────────────
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !places.length) return;

    const { Marker } = window.google.maps;

    // Clean up removed places
    Object.keys(markersRef.current).forEach((id) => {
      if (!places.find((p) => p.id === id)) {
        markersRef.current[id].setMap(null);
        delete markersRef.current[id];
      }
    });

    // Add/update markers
    places.forEach((place, index) => {
      const position = { lat: place.latitude, lng: place.longitude };
      const isActive = place.id === activeIdRef.current;
      const number = index + 1;

      if (markersRef.current[place.id]) {
        markersRef.current[place.id].setPosition(position);
        markersRef.current[place.id].setIcon(makeMarkerIcon(number, isActive));
      } else {
        const marker = new Marker({
          map: mapRef.current,
          position,
          title: place.name,
          icon: makeMarkerIcon(number, isActive),
          zIndex: isActive ? 100 : index,
        });
        marker.addListener('click', () => onMarkerClick(place));
        markersRef.current[place.id] = marker;
      }
    });
  }, [isLoaded, places, onMarkerClick]);

  // ── Sync active marker + pan when activePlaceId changes ────────────────
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const prevId = activeIdRef.current;
    activeIdRef.current = activePlaceId;

    // Reset previous marker
    if (prevId && markersRef.current[prevId]) {
      const prevIndex = places.findIndex((p) => p.id === prevId);
      markersRef.current[prevId].setIcon(makeMarkerIcon(prevIndex + 1, false));
      markersRef.current[prevId].setZIndex(prevIndex);
    }

    // Activate new marker
    if (activePlaceId && markersRef.current[activePlaceId]) {
      const index = places.findIndex((p) => p.id === activePlaceId);
      markersRef.current[activePlaceId].setIcon(makeMarkerIcon(index + 1, true));
      markersRef.current[activePlaceId].setZIndex(1000);

      const pos = markersRef.current[activePlaceId].getPosition();
      if (pos) mapRef.current.panTo(pos);
    }
  }, [isLoaded, activePlaceId, places]);

  // ── Error state ─────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="state-screen">
        <h3>Map failed to load</h3>
        <p>Check your <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in <code>.env.local</code>.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="state-screen">
        <div className="spinner" />
        <p>Loading map…</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={MAP_STYLE}
      center={center}
      zoom={13}
      options={MAP_OPTIONS}
      onLoad={handleMapLoad}
    />
  );
}