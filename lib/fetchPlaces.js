/**
 * fetchPlaces.js
 * ---------------
 * Fetches place data from a publicly published Google Sheet (CSV format).
 * Uses PapaParse to parse the CSV into structured JavaScript objects.
 *
 * HOW TO GET YOUR GOOGLE SHEET CSV URL:
 * 1. Open your Google Sheet
 * 2. File → Share → Publish to web
 * 3. Choose "Entire Document" and format "Comma-separated values (.csv)"
 * 4. Click "Publish" and copy the URL
 * 5. Paste it below as SHEET_CSV_URL (or use env var NEXT_PUBLIC_SHEET_CSV_URL)
 *
 * Expected columns (in any order):
 *   id, name, address, phone, website, instagram_url, description, latitude, longitude
 */

import Papa from 'papaparse';

// ── ⚠️  REPLACE THIS with your own published Google Sheet CSV URL ──────────
// Example format:
// https://docs.google.com/spreadsheets/d/SHEET_ID/pub?output=csv
const SHEET_CSV_URL =
  process.env.NEXT_PUBLIC_SHEET_CSV_URL;
// ───────────────────────────────────────────────────────────────────────────

/**
 * Fetches and parses places from the Google Sheet.
 * @returns {Promise<Array>} Array of place objects
 */
export async function fetchPlaces() {
  // Add a cache-busting param so we always get fresh data
  const url = `${SHEET_CSV_URL}&cachebust=${Date.now()}`;

  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Failed to fetch sheet data: ${response.status} ${response.statusText}`);
  }

  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,          // Use first row as column names
      skipEmptyLines: true,  // Skip blank rows
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'), // normalise headers
      complete: (results) => {
        const places = results.data
          .map((row, index) => ({
            // Fallback id if the sheet doesn't have one
            id: row.id?.trim() || String(index + 1),
            name: row.name?.trim() || 'Unnamed Place',
            address: row.address?.trim() || '',
            phone: row.phone?.trim() || '',
            website: row.website?.trim() || '',
            instagram_url: row.instagram_url?.trim() || '',
            description: row.description?.trim() || '',
            // Convert lat/lng strings → numbers; filter out rows with invalid coords
            latitude: parseFloat(row.latitude),
            longitude: parseFloat(row.longitude),
          }))
          // Only keep rows where we have valid coordinates
          .filter((p) => !isNaN(p.latitude) && !isNaN(p.longitude));

        resolve(places);
      },
      error: (err) => reject(err),
    });
  });
}

/**
 * Computes the geographic center of a set of places.
 * Falls back to (0, 0) if the array is empty.
 * @param {Array} places
 * @returns {{ lat: number, lng: number }}
 */
export function computeCenter(places) {
  if (!places.length) return { lat: 0, lng: 0 };

  const sum = places.reduce(
    (acc, p) => ({ lat: acc.lat + p.latitude, lng: acc.lng + p.longitude }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / places.length,
    lng: sum.lng / places.length,
  };
}
