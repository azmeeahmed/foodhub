'use client';

/**
 * page.js
 * ───────
 * Root page — manages all state and renders the Eater-style layout.
 * Map API key + Sheet URL come from .env.local (unchanged).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import PlacesList from '../components/PlacesList';
import { fetchPlaces, computeCenter } from '../lib/fetchPlaces';

// Client-only — Google Maps needs the browser
const MapView = dynamic(() => import('../components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="state-screen">
      <div className="spinner" />
      <p>Loading map…</p>
    </div>
  ),
});

export default function HomePage() {
  const [places, setPlaces]               = useState([]);
  const [activePlaceId, setActivePlaceId] = useState(null);
  const [mapCenter, setMapCenter]         = useState({ lat: 0, lng: 0 });
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  const itemRefs = useRef({});
  const suppressObserver = useRef(false);

  // ── Fetch places from Google Sheet ──────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const data = await fetchPlaces();
        setPlaces(data);
        setMapCenter(computeCenter(data));
        if (data.length) setActivePlaceId(data[0].id);
      } catch (err) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Marker clicked → scroll list to card ───────────────────────────────
  const handleMarkerClick = useCallback((place) => {
    setActivePlaceId(place.id);
    suppressObserver.current = true;
    const el = itemRefs.current[place.id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setTimeout(() => { suppressObserver.current = false; }, 700);
    } else {
      suppressObserver.current = false;
    }
  }, []);

  // ── List card clicked → pan map ─────────────────────────────────────────
  const handlePlaceClick = useCallback((place) => {
    setActivePlaceId(place.id);
  }, []);

  // ── Card scrolled into view → highlight marker ──────────────────────────
  const handlePlaceVisible = useCallback((placeId) => {
    if (suppressObserver.current) return;
    setActivePlaceId(placeId);
  }, []);

  const activePlace = places.find((p) => p.id === activePlaceId);

  return (
    <div className="app-shell">

      {/* ── Top nav bar ── */}
      <header className="app-header">
        <div className="header-logo">
          Food<span>Hub</span>
        </div>
        <div className="header-divider" />
        <span className="header-section">Maps</span>
        <span className="header-badge">Live Guide</span>
      </header>

      {/* ── Body ── */}
      <main className="app-body">

        {/* LEFT: Numbered list */}
        <aside className="places-sidebar">
          {loading && (
            <div className="state-screen">
              <div className="spinner" />
              <h3>Loading…</h3>
              <p>Fetching from your Google Sheet</p>
            </div>
          )}

          {error && !loading && (
            <div className="state-screen">
              <h3>Failed to Load</h3>
              <p>{error}</p>
              <p style={{ marginTop: 8, fontSize: '0.72rem', opacity: 0.6 }}>
                Check <code>NEXT_PUBLIC_SHEET_CSV_URL</code> in <code>.env.local</code>
              </p>
            </div>
          )}

          {!loading && !error && (
            <PlacesList
              places={places}
              activePlaceId={activePlaceId}
              onPlaceClick={handlePlaceClick}
              onPlaceVisible={handlePlaceVisible}
              itemRefs={itemRefs}
            />
          )}
        </aside>

        {/* RIGHT: Map */}
        <section className="map-panel">
          {!loading && !error && (
            <>
              <MapView
                places={places}
                activePlaceId={activePlaceId}
                center={mapCenter}
                onMarkerClick={handleMarkerClick}
              />
              {/* Floating name label */}
              <div className={`map-tooltip ${activePlace ? 'visible' : ''}`}>
                {activePlace ? `${places.indexOf(activePlace) + 1}. ${activePlace.name}` : ''}
              </div>
            </>
          )}

          {loading && (
            <div className="state-screen">
              <div className="spinner" />
              <p>Loading map…</p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}