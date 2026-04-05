'use client';

/**
 * components/PlacesList.js
 * ────────────────────────
 * Scrollable sidebar list.
 *
 * Key changes from v1:
 *  - Hero section (title, eyebrow, count) now scrolls WITH the list
 *    instead of being pinned at the top
 *  - No numbered column — clean editorial look
 *  - Passes listing metadata (title, eyebrow etc.) into the hero block
 *  - Shows "no results" state when search filters everything out
 */

import { useEffect, useRef } from 'react';
import PlaceItem from './PlaceItem';

export default function PlacesList({
  listing,
  places,
  allPlaces,
  activePlaceId,
  onPlaceClick,
  onPlaceVisible,
  itemRefs,
  searchQuery,
}) {
  const scrollRef = useRef(null);

  // ── IntersectionObserver: which card is currently in view ───────────────
  useEffect(() => {
    if (!places.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.dataset.id;
            if (id) onPlaceVisible(id);
          }
        });
      },
      {
        root:       scrollRef.current,
        rootMargin: '-10% 0px -65% 0px',
        threshold:  0,
      }
    );

    Object.values(itemRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [places, onPlaceVisible, itemRefs]);

  const isFiltered = searchQuery && searchQuery.trim().length > 0;

  return (
    <div className="places-scroll" ref={scrollRef}>

      {/* ══ Hero — scrolls naturally with the list ══
          This is the "listing info" block for the whole guide,
          not a fixed header. It scrolls away as you read down. */}
      <div className="list-hero">
        <p className="list-hero-eyebrow">{listing.eyebrow}</p>
        <h1 className="list-hero-title">{listing.title}</h1>
        {listing.subtitle && (
          <p className="list-hero-subtitle">{listing.subtitle}</p>
        )}
        <div className="list-hero-bottom">
          <p className="list-hero-meta">Updated {getCurrentSeason()}</p>
          <span className="list-count-badge">
            {isFiltered
              ? `${places.length} of ${allPlaces.length}`
              : `${allPlaces.length} Locations`}
          </span>
        </div>
      </div>

      {/* ══ No results state ══ */}
      {places.length === 0 && isFiltered && (
        <div className="no-results">
          <p>No places match "<strong>{searchQuery}</strong>"</p>
          <p>Try a different name or address.</p>
        </div>
      )}

      {/* ══ Place cards ══ */}
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
  );
}

function getCurrentSeason() {
  const month = new Date().getMonth();
  const year  = new Date().getFullYear();
  const s = month < 3 ? 'Winter' : month < 6 ? 'Spring' : month < 9 ? 'Summer' : 'Fall';
  return `${s} ${year}`;
}