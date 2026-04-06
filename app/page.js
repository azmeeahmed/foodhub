/**
 * app/page.js — Homepage
 * ──────────────────────
 * Shows a directory of all available map listings.
 * Clicking any card goes to /[slug].
 */

import Link from 'next/link';
import { LISTINGS } from '../lib/listings';

export default function HomePage() {
  return (
    <div className="index-shell">
      {/* Header */}
      <header className="index-header">
        <div className="header-logo">Food<span>Hub</span></div>
      </header>

      {/* Hero */}
      <section className="index-hero">
        <p className="index-eyebrow">Interactive Map Guides</p>
        <h1 className="index-title">Curated Local Guides</h1>
        <p className="index-sub">
          Explore the best places — restaurants, parks, hotels and more —
          with live synchronized maps.
        </p>
      </section>

      {/* Listing cards grid */}
      <section className="index-grid">
        {LISTINGS.map((listing) => (
          <Link
            key={listing.slug}
            href={`/${listing.slug}`}
            className="index-card"
          >
            <p className="index-card-eyebrow">{listing.eyebrow}</p>
            <h2 className="index-card-title">{listing.title}</h2>
            <p className="index-card-sub">{listing.subtitle}</p>
            <span className="index-card-cta">View Guide →</span>
          </Link>
        ))}
      </section>
    </div>
  );
}