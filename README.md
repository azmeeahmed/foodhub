# 🗺️ Places Explorer — Next.js + Google Maps + Google Sheets

A live, interactive map app that reads **all data from a Google Sheet** — no hardcoded places. Markers and list cards are fully synchronized: clicking a marker scrolls the list, and scrolling the list pans the map.

---

## 📁 Project Structure

```
/app
  layout.js        ← Root layout (imports CSS)
  page.js          ← Main page: state management + layout

/components
  MapView.js       ← Google Map with dynamic markers
  PlacesList.js    ← Sidebar list with IntersectionObserver
  PlaceItem.js     ← Individual place card

/lib
  fetchPlaces.js   ← Fetches + parses the Google Sheet CSV

/styles
  globals.css      ← Full design system

.env.local.example ← Rename to .env.local and fill in your keys
```

---

## 🔧 Step 1 — Create Your Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new sheet.
2. Add these **exact column headers** in row 1:

| id | name | address | phone | website | instagram_url | description | latitude | longitude |
|----|------|---------|-------|---------|---------------|-------------|----------|-----------|

3. Fill in your places. Example row:

| 1 | Central Park | New York, NY 10024 | +1-212-310-6600 | https://centralparknyc.org | https://instagram.com/centralparknyc | An 843-acre green oasis in Manhattan | 40.785091 | -73.968285 |

> **Tip:** Use [latlong.net](https://www.latlong.net) to get coordinates for any address.

---

## 🌐 Step 2 — Publish the Sheet to Web

1. In Google Sheets, click **File → Share → Publish to web**
2. Under *Link*, choose:
   - **"Entire Document"**
   - Format: **"Comma-separated values (.csv)"**
3. Click **Publish** and confirm.
4. **Copy the URL** — it will look like:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID/pub?gid=0&single=true&output=csv
   ```

---

## 🔑 Step 3 — Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Go to **APIs & Services → Library**
4. Search for and enable: **"Maps JavaScript API"**
5. Go to **APIs & Services → Credentials → Create Credentials → API Key**
6. Copy the key

> **Recommended:** Restrict the key to your domain in production.

---

## ⚙️ Step 4 — Configure Environment Variables

1. Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and fill in both values:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...your_key_here
   NEXT_PUBLIC_SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/YOUR_ID/pub?output=csv
   ```

---

## 🚀 Step 5 — Run the App

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎯 Features

| Feature | Implementation |
|---------|---------------|
| Live data | Google Sheet CSV fetched on every page load |
| Marker → List sync | Marker click scrolls + highlights the list card |
| List → Marker sync | IntersectionObserver detects visible card, pans map |
| Active highlighting | Copper-colored marker + highlighted card border |
| Clickable address | Opens Google Maps in new tab |
| Clickable phone | `tel:` link |
| Website + Instagram | Link pills on each card |
| Instagram embeds | Lazy-loaded iframe for post URLs |
| Responsive | Stacks vertically on mobile |

---

## 🐛 Troubleshooting

**Map not loading?**
- Check `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set in `.env.local`
- Make sure the **Maps JavaScript API** is enabled in your Google Cloud project
- Check the browser console for any errors

**No places showing?**
- Verify your sheet is published (File → Share → Publish to web)
- Confirm the CSV URL in `.env.local` is correct
- Check that `latitude` and `longitude` columns have valid numbers
- Open the CSV URL directly in your browser to check the output

**Instagram not embedding?**
- Only **post URLs** (`/p/SHORTCODE`) and **reel URLs** (`/reel/SHORTCODE`) embed
- Profile URLs (`instagram.com/username`) cannot be embedded and will show a link pill instead
