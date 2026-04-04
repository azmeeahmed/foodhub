'use client';

/**
 * PlacesList.js
 * ─────────────
 * Sidebar with an editorial hero header (Eater-style)
 * and a numbered, scrollable list of place cards.
 * Uses IntersectionObserver to sync with the map.
 */

import { useEffect, useRef } from 'react';
import PlaceItem from './PlaceItem';

export default function PlacesList({
  places,
  activePlaceId,
  onPlaceClick,
  onPlaceVisible,
  itemRefs,
}) {
  const scrollRef = useRef(null);

  // ── IntersectionObserver: detect which card is in view ─────────────────
  useEffect(() => {
    if (!places.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const placeId = entry.target.dataset.id;
            if (placeId) onPlaceVisible(placeId);
          }
        });
      },
      {
        root: scrollRef.current,
        rootMargin: '-10% 0px -65% 0px',
        threshold: 0,
      }
    );

    Object.values(itemRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [places, onPlaceVisible, itemRefs]);

  if (!places.length) {
    return (
      <div className="state-screen">
        <p>No places found. Check your Google Sheet URL.</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Editorial hero header ── */}
      <div className="list-hero">
        <p className="list-hero-eyebrow">The Essential Guide</p>
        <h1 className="list-hero-title">Best Places<br />on the Map</h1>
        <div className="list-hero-bottom">
          <p className="list-hero-meta">Updated {getCurrentSeason()}</p>
          <span className="list-count-badge">{places.length} Locations</span>
        </div>
      </div>

      {/* ── Scrollable numbered list ── */}
      <div className="places-scroll" ref={scrollRef}>
        {places.map((place, index) => (
          <div
            key={place.id}
            data-id={place.id}
            ref={(el) => { itemRefs.current[place.id] = el; }}
          >
            <PlaceItem
              place={place}
              index={index}
              isActive={place.id === activePlaceId}
              onClick={() => onPlaceClick(place)}
            />
          </div>
        ))}
      </div>
    </>
  );
}

// Returns a human-friendly date like "Spring 2026"
function getCurrentSeason() {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();
  const season =
    month < 3 ? 'Winter' :
    month < 6 ? 'Spring' :
    month < 9 ? 'Summer' : 'Fall';
  return `${season} ${year}`;
}