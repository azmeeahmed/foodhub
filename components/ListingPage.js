'use client';

/**
 * components/ListingPage.js
 * ─────────────────────────
 * The full interactive map + list page for a single listing.
 * Receives a `listing` config object (slug, title, sheetCsvUrl, etc.)
 * and handles all data fetching + state management.
 *
 * This is a Client Component because it uses:
 *  - useState / useEffect / useRef / useCallback
 *  - IntersectionObserver
 *  - Google Maps (browser-only)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import PlacesList from './PlacesList';
import { fetchPlaces, computeCenter } from '../lib/fetchPlaces';

// Google Maps must only render on the client
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="state-screen">
      <div className="spinner" />
      <p>Loading map…</p>
    </div>
  ),
});

export default function ListingPage({ listing }) {
  // ── State ────────────────────────────────────────────────────────────────
  const [places, setPlaces]               = useState([]);
  const [activePlaceId, setActivePlaceId] = useState(null);
  const [mapCenter, setMapCenter]         = useState({ lat: 0, lng: 0 });
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchOpen, setSearchOpen]       = useState(false);

  // Shared refs: placeId → the wrapper DOM element for each card
  const itemRefs        = useRef({});
  // Prevents IntersectionObserver from firing during programmatic scroll
  const suppressObserver = useRef(false);
  const searchInputRef   = useRef(null);

  // ── Fetch places when listing changes ───────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);
    setPlaces([]);
    setActivePlaceId(null);

    async function load() {
      try {
        const data = await fetchPlaces(listing.sheetCsvUrl);
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
  }, [listing.sheetCsvUrl]);

  // ── Focus search input when opened ──────────────────────────────────────
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // ── Filter places by search query ────────────────────────────────────────
  const filteredPlaces = places.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  });

  // ── Marker clicked → scroll list card into view ──────────────────────────
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

  // ── List card clicked → pan map ──────────────────────────────────────────
  const handlePlaceClick = useCallback((place) => {
    setActivePlaceId(place.id);
  }, []);

  // ── IntersectionObserver callback: card scrolled into view ───────────────
  const handlePlaceVisible = useCallback((placeId) => {
    if (suppressObserver.current) return;
    setActivePlaceId(placeId);
  }, []);

  const activePlace = places.find((p) => p.id === activePlaceId);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">

      {/* ══════════ HEADER ══════════ */}
      <header className="app-header">

        {/* Left: back to home */}
        <Link href="/" className="header-back" title="All guides">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>All Guides</span>
        </Link>

        {/* Centre: logo */}
        <div className="header-center">
          <Link href="/" className="header-logo">
            Food<span>Hub</span>
          </Link>
        </div>

        {/* Right: search */}
        <div className="header-right">
          <div className={`search-box ${searchOpen ? 'open' : ''}`}>
            {searchOpen && (
              <input
                ref={searchInputRef}
                className="search-input"
                type="text"
                placeholder="Search places…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
              />
            )}
            <button
              className="search-btn"
              onClick={() => {
                setSearchOpen((o) => !o);
                if (searchOpen) setSearchQuery('');
              }}
              aria-label="Toggle search"
            >
              {searchOpen ? (
                // X icon
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              ) : (
                // Search icon
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              )}
            </button>
          </div>
        </div>

      </header>

      {/* ══════════ BODY ══════════ */}
      <main className="app-body">

        {/* LEFT: scrollable list */}
        <aside className="places-sidebar">
          {loading && (
            <div className="state-screen">
              <div className="spinner" />
              <h3>Loading…</h3>
              <p>Fetching from Google Sheet</p>
            </div>
          )}

          {error && !loading && (
            <div className="state-screen">
              <h3>Failed to Load</h3>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <PlacesList
              listing={listing}
              places={filteredPlaces}
              allPlaces={places}
              activePlaceId={activePlaceId}
              onPlaceClick={handlePlaceClick}
              onPlaceVisible={handlePlaceVisible}
              itemRefs={itemRefs}
              searchQuery={searchQuery}
            />
          )}
        </aside>

        {/* RIGHT: map */}
        <section className="map-panel">
          {loading && (
            <div className="state-screen">
              <div className="spinner" />
              <p>Loading map…</p>
            </div>
          )}

          {!loading && !error && (
            <>
              <MapView
                places={filteredPlaces}
                activePlaceId={activePlaceId}
                center={mapCenter}
                zoom={listing.mapZoom || 13}
                onMarkerClick={handleMarkerClick}
              />
              {/* Floating active-place tooltip */}
              <div className={`map-tooltip ${activePlace ? 'visible' : ''}`}>
                {activePlace?.name}
              </div>
            </>
          )}
        </section>

      </main>
    </div>
  );
}