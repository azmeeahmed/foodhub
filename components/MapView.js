'use client';

/**
 * MapView.js — FIXED
 * ──────────────────
 * Fixes:
 *  1. Numbered SVG markers now use proper google.maps.Size + google.maps.Point
 *  2. Markers created only after map is fully loaded (onLoad callback)
 *  3. activePlaceId changes reliably pan + swap marker icons
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

const MAP_OPTIONS = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  gestureHandling: 'greedy',
  styles: [
    { elementType: 'geometry',            stylers: [{ color: '#f5f5f0' }] },
    { elementType: 'labels.text.stroke',  stylers: [{ color: '#f5f5f0' }] },
    { elementType: 'labels.text.fill',    stylers: [{ color: '#333333' }] },
    { featureType: 'road', elementType: 'geometry',             stylers: [{ color: '#ffffff' }] },
    { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#666666' }] },
    { featureType: 'road.highway', elementType: 'geometry',     stylers: [{ color: '#e8e8e8' }] },
    { featureType: 'water', elementType: 'geometry',            stylers: [{ color: '#c9d8e8' }] },
    { featureType: 'poi.park', elementType: 'geometry',         stylers: [{ color: '#dae8d0' }] },
    { featureType: 'poi',     elementType: 'labels',            stylers: [{ visibility: 'off' }] },
    { featureType: 'transit',                                   stylers: [{ visibility: 'off' }] },
  ],
};

/**
 * Builds the SVG data-URL icon AND returns proper Google Maps Size/Point objects.
 * Must be called AFTER the Maps API is loaded so google.maps.Size exists.
 */
function makeMarkerIcon(number, isActive) {
  const w = isActive ? 38 : 30;
  const h = isActive ? 50 : 40;   // taller to include the pin tail
  const cy = isActive ? 17 : 13;  // circle centre y
  const cr = isActive ? 16 : 12;  // circle radius
  const fontSize = number > 9 ? cr * 0.9 : cr * 1.1;
  const bg = isActive ? '#e8001c' : '#222222';
  const stroke = '#ffffff';

  // Pin shape: circle on top + triangle tail pointing down
  const tailTop = cy + cr;           // where triangle starts
  const tailTip = h - 2;            // tip of the pin
  const tailHalf = isActive ? 6 : 5;

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
    // Drop shadow
    `<ellipse cx="${w / 2}" cy="${tailTip + 1}" rx="${tailHalf + 1}" ry="2" fill="rgba(0,0,0,0.25)"/>`,
    // Circle body
    `<circle cx="${w / 2}" cy="${cy}" r="${cr}" fill="${bg}" stroke="${stroke}" stroke-width="2"/>`,
    // Triangle tail
    `<polygon points="${w / 2 - tailHalf},${tailTop} ${w / 2 + tailHalf},${tailTop} ${w / 2},${tailTip}" fill="${bg}"/>`,
    // Number text
    `<text x="${w / 2}" y="${cy + fontSize * 0.37}"`,
    `  text-anchor="middle" fill="${stroke}"`,
    `  font-family="Arial,sans-serif" font-weight="900"`,
    `  font-size="${fontSize}px">${number}</text>`,
    `</svg>`,
  ].join('');

  const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

  return {
    url,
    // These MUST be google.maps.Size / google.maps.Point instances
    scaledSize: new window.google.maps.Size(w, h),
    anchor:     new window.google.maps.Point(w / 2, h),  // tip of the pin
  };
}

export default function MapView({ places, activePlaceId, center, onMarkerClick }) {
  const mapRef      = useRef(null);   // google.maps.Map instance
  const markersRef  = useRef({});     // { placeId: google.maps.Marker }
  const prevActiveRef = useRef(null); // track previous active to reset its icon

  // Track whether map is ready so marker effects can re-run
  const [mapReady, setMapReady] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    id: 'google-map-script',
  });

  // ── Called by GoogleMap once the map instance exists ────────────────────
  const handleMapLoad = useCallback((map) => {
    mapRef.current = map;
    setMapReady(true); // triggers marker creation effect below
  }, []);

  // ── Create markers once map is ready AND places are loaded ──────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || !places.length) return;

    const { Marker } = window.google.maps;

    // Remove stale markers
    Object.keys(markersRef.current).forEach((id) => {
      if (!places.find((p) => p.id === id)) {
        markersRef.current[id].setMap(null);
        delete markersRef.current[id];
      }
    });

    // Create or update each marker
    places.forEach((place, index) => {
      const position  = { lat: place.latitude, lng: place.longitude };
      const isActive  = place.id === activePlaceId;
      const number    = index + 1;

      if (markersRef.current[place.id]) {
        // Update existing
        markersRef.current[place.id].setPosition(position);
        markersRef.current[place.id].setIcon(makeMarkerIcon(number, isActive));
        markersRef.current[place.id].setZIndex(isActive ? 1000 : number);
      } else {
        // Create new
        const marker = new Marker({
          map:      mapRef.current,
          position,
          title:    place.name,
          icon:     makeMarkerIcon(number, isActive),
          zIndex:   isActive ? 1000 : number,
        });
        marker.addListener('click', () => onMarkerClick(place));
        markersRef.current[place.id] = marker;
      }
    });

    prevActiveRef.current = activePlaceId;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, places]);  // only re-run when map becomes ready or places change

  // ── Sync active marker icon + pan whenever activePlaceId changes ─────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || !places.length) return;

    const prevId = prevActiveRef.current;
    prevActiveRef.current = activePlaceId;

    // Restore previous active marker to normal
    if (prevId && prevId !== activePlaceId && markersRef.current[prevId]) {
      const prevIndex = places.findIndex((p) => p.id === prevId);
      if (prevIndex !== -1) {
        markersRef.current[prevId].setIcon(makeMarkerIcon(prevIndex + 1, false));
        markersRef.current[prevId].setZIndex(prevIndex + 1);
      }
    }

    // Highlight new active marker + pan
    if (activePlaceId && markersRef.current[activePlaceId]) {
      const index = places.findIndex((p) => p.id === activePlaceId);
      if (index !== -1) {
        markersRef.current[activePlaceId].setIcon(makeMarkerIcon(index + 1, true));
        markersRef.current[activePlaceId].setZIndex(1000);
        const pos = markersRef.current[activePlaceId].getPosition();
        if (pos) mapRef.current.panTo(pos);
      }
    }
  }, [mapReady, activePlaceId, places]);

  // ── Error / loading ──────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="state-screen">
        <h3>Map failed to load</h3>
        <p>Check <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in <code>.env.local</code>.</p>
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
      mapContainerStyle={MAP_CONTAINER_STYLE}
      center={center}
      zoom={14}
      options={MAP_OPTIONS}
      onLoad={handleMapLoad}
    />
  );
}