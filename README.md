# PhotoTidy site

Public, dependency-free landing, privacy, and support pages for PhotoTidy.

- Landing pages: `/` (English) and `/it/` (Italian)
- English: `/privacy/` and `/support/`
- Italian: `/it/privacy/` and `/it/support/`

The site intentionally uses no cookies, analytics, third-party scripts, build tools, or application source. Landing-page fonts and imagery are self-hosted in `assets/`.

## Screenshot assets

The `*-framed-20260906` images use real 1206×2622 simulator captures of the current app, framed with [Frames CLI](https://github.com/viticci/frames-cli) by Federico Viticci / MacStories. The device is `iPhone 17 Pro Portrait` in `Silver`; the full composite is 1350×2760 with transparency. No screenshot resizing is performed by Frames.

Use `frames -d "iPhone 17 Pro Portrait" -c Silver capture.png`, then export proportional 736px and 1104px WebP images (quality 92, alpha quality 100) and a 736px PNG fallback. Keep the transparent bezel intact; the site supplies shadows and backgrounds, not another device border. Version new filenames and update both landing pages together when replacing captures.

## Landing-page verification

With Playwright and its Chromium/WebKit browsers available to Node, serve this directory on port 4173 and run `node scripts/verify-landing.cjs`. Set `SITE_URL` (including its trailing slash) to check a different preview. This development-only check covers both languages, responsive layouts, scroll chapters, fallback behavior, keyboard focus, FAQs, and scroll restoration; Playwright is not shipped to site visitors.

The navy story enhances only at 1024px × 700px or larger, after screenshot decoding succeeds. Reduced motion and smaller windows retain the vertical figures. Scroll positions are measured at setup/resize, not on every frame. Keep real screenshots and their semantic descriptions in the ordinary figures; the sticky copies are decorative.

## App Store launch checklist

1. In `index.html` and `it/index.html`, uncomment the `apple-itunes-app` Smart App Banner meta tag in `<head>` and replace `000000000` with the numeric Apple ID (App Store Connect → App Information → General Information → Apple ID, or the digits after `id` in the App Store URL).
2. Download the official English and Italian "Download on the App Store" badge SVGs from Apple's [marketing guidelines](https://developer.apple.com/app-store/marketing/guidelines/), save them as `assets/badges/download-on-the-app-store-en.svg` and `-it.svg`, and uncomment the `.appstore-badge` link in each hero's `.cta-row` (replace `000000000` there too). Do not recolor or redraw the badge. The badge and the Smart App Banner are intentionally not shipped yet because the app has no App Store ID.
3. Update the TestFlight button and header link as needed, and bump the `?v=` query strings on `landing.css` and `landing.js`.

## Social previews and icons

- `assets/og-depth-20260906.png` is the English Open Graph/Twitter image; `assets/og-it-20261013.png` is the Italian equivalent used by `/it/` (same layout, 1200×630, headline and subtitle in Italian). The app screenshot inside both is the current English UI capture.
- `assets/apple-touch-icon.png` (180×180, opaque) is used by every page. It is resampled from the 120 px `app-icon.png`; replace it with a 180 px export from the 1024 px icon master for a sharper result.
