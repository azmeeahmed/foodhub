'use client';

/**
 * components/PlaceItem.js
 * ───────────────────────
 * Individual place card — clean, no number column.
 *
 * Instagram:
 *   Client pastes a post URL in the `instagram_url` sheet column.
 *   e.g. https://www.instagram.com/p/DUTp1j5kr0r/
 *   InstagramEmbed handles the official embed.js rendering.
 */

import InstagramEmbed from './InstagramEmbed';

export default function PlaceItem({ place, index, isActive, onClick }) {
  const mapsUrl = place.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`
    : null;

  return (
    <div
      className={`place-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-pressed={isActive}
      style={{ animationDelay: `${Math.min(index * 35, 300)}ms` }}
    >
      {/* ── Name ── */}
      <h3 className="place-name">{place.name}</h3>

      {/* ── Description ── */}
      {place.description && (
        <p className="place-description">{place.description}</p>
      )}

      {/* ── Address + Map it ── */}
      {place.address && (
        <div className="place-address-row">
          <span className="place-address">{place.address}</span>
          {mapsUrl && (
            <a
              className="map-it-link"
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              Map it
            </a>
          )}
        </div>
      )}

      {/* ── Phone ── */}
      {place.phone && (
        <a
          className="place-phone"
          href={`tel:${place.phone}`}
          onClick={(e) => e.stopPropagation()}
        >
          {place.phone}
        </a>
      )}

      {/* ── Website pill ── */}
      {place.website && (
        <div className="place-links">
          <a
            className="link-pill"
            href={normalizeUrl(place.website)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10
                       15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
            </svg>
            Website
          </a>
        </div>
      )}

      {/* ── Instagram embed ──
           Client pastes a post URL in the sheet, e.g:
           https://www.instagram.com/p/DUTp1j5kr0r/
           InstagramEmbed uses the official embed.js to render it. ── */}
      {place.instagram_url && (
        <InstagramEmbed url={place.instagram_url} />
      )}
    </div>
  );
}

function normalizeUrl(url) {
  if (!url) return '#';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}