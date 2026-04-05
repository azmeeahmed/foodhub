'use client';

/**
 * components/MapView.js
 * ─────────────────────
 * Google Map with pill-shaped NAME markers (not numbers).
 * Active marker = red pill; inactive = dark grey pill.
 *
 * Uses proper google.maps.Size + google.maps.Point so icons render correctly.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

const MAP_OPTIONS = {
  disableDefaultUI:  false,
  zoomControl:       true,
  mapTypeControl:    false,
  streetViewControl: false,
  fullscreenControl: true,
  gestureHandling:   'greedy',
  styles: [
    { elementType: 'geometry',           stylers: [{ color: '#f5f5f0' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f0' }] },
    { elementType: 'labels.text.fill',   stylers: [{ color: '#333333' }] },
    { featureType: 'road', elementType: 'geometry',              stylers: [{ color: '#ffffff' }] },
    { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#666666' }] },
    { featureType: 'road.highway', elementType: 'geometry',      stylers: [{ color: '#e8e8e8' }] },
    { featureType: 'water', elementType: 'geometry',             stylers: [{ color: '#c9d8e8' }] },
    { featureType: 'poi.park', elementType: 'geometry',          stylers: [{ color: '#dae8d0' }] },
    { featureType: 'poi',     elementType: 'labels',             stylers: [{ visibility: 'off' }] },
    { featureType: 'transit',                                    stylers: [{ visibility: 'off' }] },
  ],
};

/**
 * Truncates a name to fit in the marker pill.
 * e.g. "Humble Oysters and Bubbles" → "Humble Oysters…"
 */
function truncateName(name, maxLen = 16) {
  if (name.length <= maxLen) return name;
  return name.slice(0, maxLen).trimEnd() + '…';
}

/**
 * Builds a pill-shaped SVG marker with the place name.
 * Must be called after Maps API is loaded (uses google.maps.Size/Point).
 *
 * @param {string}  name     - Place name
 * @param {boolean} isActive - Whether this is the highlighted marker
 */
function makeNameMarker(name, isActive) {
  const label    = truncateName(name);
  const bg       = isActive ? '#e8001c' : '#222222';
  const fontSize = 11;
  const padX     = 10;
  const padY     = 6;
  const height   = fontSize + padY * 2;            // ~23px
  const charW    = fontSize * 0.6;                 // approx char width
  const textW    = label.length * charW;
  const width    = Math.max(textW + padX * 2, 60); // min 60px wide
  const tailH    = 6;                              // pin tail height
  const totalH   = height + tailH;
  const cx       = width / 2;
  const rx       = height / 2;                     // pill corner radius

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${totalH}">`,
    // Pill body
    `<rect x="1" y="1" width="${width - 2}" height="${height - 2}"`,
    `  rx="${rx}" ry="${rx}" fill="${bg}" stroke="white" stroke-width="1.5"/>`,
    // Tail (small triangle pointing down)
    `<polygon points="${cx - 5},${height - 1} ${cx + 5},${height - 1} ${cx},${totalH - 1}"`,
    `  fill="${bg}"/>`,
    // Name text
    `<text x="${cx}" y="${height / 2 + fontSize * 0.37}"`,
    `  text-anchor="middle" fill="white"`,
    `  font-family="Arial,sans-serif" font-weight="700"`,
    `  font-size="${fontSize}px" letter-spacing="0.3">${label}</text>`,
    `</svg>`,
  ].join('');

  return {
    url:        `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(width, totalH),
    anchor:     new window.google.maps.Point(cx, totalH), // pin tip
  };
}

export default function MapView({ places, activePlaceId, center, zoom = 13, onMarkerClick }) {
  const mapRef        = useRef(null);
  const markersRef    = useRef({});
  const prevActiveRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    id: 'google-map-script',
  });

  const handleMapLoad = useCallback((map) => {
    mapRef.current = map;
    setMapReady(true);
  }, []);

  // ── Create / refresh all markers when places load ────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || !places.length) return;

    const { Marker } = window.google.maps;

    // Remove markers no longer in the list
    Object.keys(markersRef.current).forEach((id) => {
      if (!places.find((p) => p.id === id)) {
        markersRef.current[id].setMap(null);
        delete markersRef.current[id];
      }
    });

    // Add or update
    places.forEach((place) => {
      const position = { lat: place.latitude, lng: place.longitude };
      const isActive = place.id === activePlaceId;

      if (markersRef.current[place.id]) {
        markersRef.current[place.id].setPosition(position);
        markersRef.current[place.id].setIcon(makeNameMarker(place.name, isActive));
        markersRef.current[place.id].setZIndex(isActive ? 1000 : 1);
      } else {
        const marker = new Marker({
          map:    mapRef.current,
          position,
          title:  place.name,
          icon:   makeNameMarker(place.name, isActive),
          zIndex: isActive ? 1000 : 1,
        });
        marker.addListener('click', () => onMarkerClick(place));
        markersRef.current[place.id] = marker;
      }
    });

    prevActiveRef.current = activePlaceId;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, places]);

  // ── Update active marker + pan map ──────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || !places.length) return;

    const prevId = prevActiveRef.current;
    prevActiveRef.current = activePlaceId;

    // De-highlight previous
    if (prevId && prevId !== activePlaceId && markersRef.current[prevId]) {
      const prev = places.find((p) => p.id === prevId);
      if (prev) {
        markersRef.current[prevId].setIcon(makeNameMarker(prev.name, false));
        markersRef.current[prevId].setZIndex(1);
      }
    }

    // Highlight new active
    if (activePlaceId && markersRef.current[activePlaceId]) {
      const active = places.find((p) => p.id === activePlaceId);
      if (active) {
        markersRef.current[activePlaceId].setIcon(makeNameMarker(active.name, true));
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
      zoom={zoom}
      options={MAP_OPTIONS}
      onLoad={handleMapLoad}
    />
  );
}