'use client';

/**
 * PlaceItem.js
 * ────────────
 * Eater-style numbered place entry.
 * Left column = big number, right column = content.
 */

export default function PlaceItem({ place, index, isActive, onClick }) {
  const mapsUrl = place.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`
    : null;

  const instagramEmbed = getInstagramEmbedUrl(place.instagram_url);

  return (
    <div
      className={`place-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-pressed={isActive}
      style={{ animationDelay: `${Math.min(index * 35, 280)}ms` }}
    >
      {/* ── Number column ── */}
      <div className="place-number-col">
        <span className="place-number">{index + 1}</span>
      </div>

      {/* ── Content column ── */}
      <div className="place-content">
        {/* Name */}
        <h3 className="place-name">{place.name}</h3>

        {/* Description */}
        {place.description && (
          <p className="place-description">{place.description}</p>
        )}

        {/* Address + Map it */}
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

        {/* Phone */}
        {place.phone && (
          <a
            className="place-phone"
            href={`tel:${place.phone}`}
            onClick={(e) => e.stopPropagation()}
          >
            {place.phone}
          </a>
        )}

        {/* Website + Instagram pills */}
        {(place.website || place.instagram_url) && (
          <div className="place-links">
            {place.website && (
              <a
                className="link-pill"
                href={normalizeUrl(place.website)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Globe icon */}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                </svg>
                Website
              </a>
            )}
            {place.instagram_url && (
              <a
                className="link-pill instagram"
                href={normalizeUrl(place.instagram_url)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Instagram icon */}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
                Instagram
              </a>
            )}
          </div>
        )}

        {/* Instagram embed (post/reel URLs only) */}
        {instagramEmbed && (
          <div className="instagram-embed">
            <iframe
              src={instagramEmbed}
              width="100%"
              height="480"
              loading="lazy"
              scrolling="no"
              frameBorder="0"
              allowTransparency="true"
              allow="encrypted-media"
              title={`Instagram — ${place.name}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Helpers ── */

function normalizeUrl(url) {
  if (!url) return '#';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function getInstagramEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(/instagram\.com\/(p|reel)\/([A-Za-z0-9_-]+)/);
  if (!match) return null;
  return `https://www.instagram.com/${match[1]}/${match[2]}/embed/`;
}