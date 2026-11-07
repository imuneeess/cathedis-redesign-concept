# Cathedis — 3D website redesign concept

An **unofficial** redesign concept for Cathedis, a Moroccan delivery company, made as a proposal to show their team.
Not affiliated with or endorsed by Cathedis. All figures, prices, delivery times and tracking numbers are **sample data**.

Plain HTML, CSS and JavaScript with [Three.js](https://threejs.org) from a CDN. No build step.

## Pages

| Page | What's animated |
| --- | --- |
| `index.html` | 3D hex-tile delivery network with live parcel routes from Casablanca · scroll-driven **parcel journey**: pack → scan → ship by van → doorstep delivery with confetti |
| `tracking.html` | Enter a demo number (`CTH-2026-0007`, `CTH-2026-0042`, `CTH-2026-1234`) to get an animated timeline and a van driving the route on a 3D map |
| `sellers.html` | Price calculator (city, weight, volume, cash-on-delivery, insurance) with a parcel stack that grows with your volume |
| `coverage.html` | Clickable 3D coverage map: pick a city to fly the camera there and see delivery time, relay points and distance from the hub |
| `contact.html` | Business / driver form tabs; click the scene to drop parcels that bounce and stack |

## Run locally

```bash
python3 -m http.server 5174
```

Then open http://localhost:5174.

## Before showing it to Cathedis

- Put your name in the top ribbon and footer (search for "Imuneeess").
- Swap the placeholder colors at the top of `css/style.css` for the official brand colors.
- Replace sample figures (stats on the home page, `CITIES` in `js/scenes/common.js`, pricing in `js/scenes/sellers.js`) with real numbers if they share them.
- Keep the "unofficial concept" labels until they approve the design. Pages include `noindex` so search engines skip them if you share a link.
