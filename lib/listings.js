/**
 * lib/listings.js
 * ───────────────
 * THE single source of truth for all listings.
 *
 * To add a new listing:
 *  1. Create a new Google Sheet with the correct columns
 *  2. Publish it to web as CSV
 *  3. Add ONE object to the LISTINGS array below
 *  4. Done — the new route /[slug] is live automatically
 *
 * Required Google Sheet columns:
 *   id | name | address | phone | website | instagram_embed_code | description | latitude | longitude
 *
 * Instagram embed:
 *   Paste a full <iframe> or <script> snippet from Behold.so, Elfsight,
 *   SnapWidget, or any embed service. Individual post iframes also work.
 *   Leave blank if no embed needed.
 */

export const LISTINGS = [
  {
    // URL: localhost:3000/listing_slug
    slug:        'best-seafood-restaurants-phoenix',
    title:       "The Best Seafood Restaurants in Phoenix, Arizona",
    subtitle:    'The Sonoran desert is probably the last place travelers might think to look for good seafood, but the scene in Phoenix is more prolific than outsiders might assume. Restaurants like Mariscos Playa Hermosa have been serving up seafood for more than 20 years, tapping into the local love for beachy Mexican fare. Over the last few years, the city has benefited from a push for fresher fish; places like Chula Seafood and Nelson’s Meat + Fish ushered in a new era of sourcing seasonal catches, sometimes within a matter of hours. In this seasonal update, we’ve filtered in four new restaurants, including the newly renovated Mariscos El Dorado Sinaloa and the upscale Pescada',
    eyebrow:     'The Essential Guide',
    city:        'Arizona',
    sheetCsvUrl: process.env.NEXT_PUBLIC_SHEET_CSV_URL,
    mapZoom:     11,
  },

  // ── ADD MORE LISTINGS HERE ──────────────────────────────────────────────
  {
    slug:        'the-most-iconic-dishes-in-phoenix',
    title:       "The Most Iconic Dishes in Phoenix",
    subtitle:    'Fill up on Valley legends like a Sonoran dog, elote pasta, sashimi, and more',
    eyebrow:     'Outdoor Guide',
    city:        'Arizona',
    sheetCsvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRl0TKrgGidzsgPS_5y_1yCt6Q0leu1LFeOlBooIsAMA67flHtfPhsBQHN9FbQFXeNh1881gjPbV0nR/pub?gid=214738093&output=csv',
    mapZoom:     10,
  },
  // {
  //   slug:        'phoenix-best-hotels',
  //   title:       'Best Hotels in Phoenix',
  //   subtitle:    'Where to stay in the Valley',
  //   eyebrow:     'Stay Guide',
  //   city:        'Phoenix',
  //   sheetCsvUrl: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/pub?output=csv',
  //   mapZoom:     12,
  // },
];

/**
 * Look up a listing config by its slug.
 * Returns null if not found (triggers 404).
 */
export function getListingBySlug(slug) {
  return LISTINGS.find((l) => l.slug === slug) || null;
}