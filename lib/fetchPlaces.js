/**
 * lib/fetchPlaces.js
 * ──────────────────
 * Fetches and parses a Google Sheet CSV into place objects.
 *
 * Expected sheet columns (order doesn't matter, headers are normalised):
 *   id | name | address | phone | website | instagram_embed_code | description | latitude | longitude
 *
 * Instagram column:
 *   Paste the full <iframe> embed code from Behold.so, Elfsight, SnapWidget,
 *   or any embed service. Individual Instagram post iframes also work.
 *   Example value in the cell:
 *     <iframe src="https://behold.so/widget/ABC123" ...></iframe>
 */

import Papa from 'papaparse';

/**
 * Fetch places from a given CSV URL.
 * @param {string} csvUrl - Published Google Sheet CSV URL
 * @returns {Promise<Array>} Parsed place objects
 */
export async function fetchPlaces(csvUrl) {
  if (!csvUrl) throw new Error('No sheet CSV URL provided.');

  const url = `${csvUrl}&cachebust=${Date.now()}`;
  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Sheet fetch failed: ${response.status} ${response.statusText}`);
  }

  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      // Normalise headers: trim whitespace, lowercase, underscores for spaces
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: (results) => {
        const places = results.data
          .map((row, index) => ({
            id:                   row.id?.trim()                   || String(index + 1),
            name:                 row.name?.trim()                 || 'Unnamed Place',
            address:              row.address?.trim()              || '',
            phone:                row.phone?.trim()                || '',
            website:              row.website?.trim()              || '',
            // NEW: full embed code pasted from any embed service
            instagram_embed_code: row.instagram_embed_code?.trim() || '',
            description:          row.description?.trim()          || '',
            latitude:             parseFloat(row.latitude),
            longitude:            parseFloat(row.longitude),
          }))
          .filter((p) => !isNaN(p.latitude) && !isNaN(p.longitude));

        resolve(places);
      },
      error: reject,
    });
  });
}

/**
 * Compute the average lat/lng centre of an array of places.
 */
export function computeCenter(places) {
  if (!places.length) return { lat: 0, lng: 0 };
  const sum = places.reduce(
    (acc, p) => ({ lat: acc.lat + p.latitude, lng: acc.lng + p.longitude }),
    { lat: 0, lng: 0 }
  );
  return { lat: sum.lat / places.length, lng: sum.lng / places.length };
}