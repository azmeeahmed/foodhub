'use client';

/**
 * components/InstagramEmbed.js
 * ────────────────────────────
 * Renders an official Instagram post embed using Instagram's embed.js.
 *
 * How it works:
 *  1. Client pastes a post URL in the Google Sheet column `instagram_url`
 *     e.g. https://www.instagram.com/p/DUTp1j5kr0r/
 *  2. We render a <blockquote> with that URL (Instagram's standard embed format)
 *  3. Instagram's embed.js script processes it into a full embed widget
 *
 * Google Sheet column name: instagram_url
 * Example value: https://www.instagram.com/p/DUTp1j5kr0r/
 */

import { useEffect } from 'react';
import Script from 'next/script';

export default function InstagramEmbed({ url }) {
  // If Instagram's script is already loaded, re-process embeds
  // (needed when navigating between places without full page reload)
  useEffect(() => {
    if (window?.instgrm) {
      window.instgrm.Embeds.process();
    }
  }, [url]); // re-run whenever the URL changes

  if (!url) return null;

  // Normalise URL — ensure it ends with /
  const postUrl = url.endsWith('/') ? url : `${url}/`;

  return (
    <div
      className="instagram-embed"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Official Instagram blockquote embed format */}
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={postUrl}
        data-instgrm-version="14"
        style={{
          background: '#FFF',
          border: '0',
          borderRadius: '3px',
          boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
          margin: '0',
          padding: '0',
          width: '100%',
          minWidth: '0',
        }}
      />

      {/* Load Instagram's embed script — lazyOnload so it doesn't block page */}
      <Script
        src="https://www.instagram.com/embed.js"
        strategy="lazyOnload"
        onLoad={() => {
          window.instgrm?.Embeds.process();
        }}
      />
    </div>
  );
}