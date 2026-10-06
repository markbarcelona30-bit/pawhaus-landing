# Pawhaus landing page

A responsive dog hotel landing page with the original reference-inspired hero, rooms, daily routine, care team, booking demo, FAQs, and footer. Powder blue, warm ivory, and butter yellow carry through the page.

## Preview

Run `npm install` once, then `npm run dev` and visit http://localhost:3000. Set `PORT` to use a different port.

## Files

- `index.html` — hero and all landing-page sections, booking form, and review dialog.
- `sections.css` — responsive styles for the rooms, routine, care, booking, FAQ, and footer sections.
- `booking.js` — local date validation, room selection, dog details, pricing, review, and demo confirmation.
- `styles.css` — responsive layout and layered artwork.
- `app.js` — smooth cursor tracking, independent idle motion, blinking, pause control, and reduced-motion support.
- `dog-model.js` — unused experimental model code, retained for reference.
- `assets/dogs.png` — generated transparent artwork based on the two supplied references.

The hero uses the original fluffy artwork in `assets/dogs.png`, generated from the supplied dog references. The experimental sculpted models and directional portrait atlas are not loaded. Gentle head translation and tilt, eye tracking, and blinking preserve the original appearance without texture warping or frame changes. This is layered artwork animation, not full 3D head rotation. Bodies and paws stay anchored. On touch devices, the dogs use gentle idle movement. Reduced-motion preferences pause animation by default.

Navigation links scroll to relevant sections. Room buttons preselect the matching booking option. The booking demo accepts future dates for 1–30 nights, calculates sample PHP totals, validates room suitability, and supports a second family dog in Garden Hangout. Visitors can review and edit before confirming a demo stay. No booking backend, live availability, reservation submission, payment integration, or persistent storage is included.

`assets/hotel-photography.png` contains six photoreal AI-generated concept images used throughout the page. They do not document a real property or its staff. Prices and service descriptions are concept content to verify before a real launch.

Fonts use Google Fonts with system fallbacks. The original reference images, logo, and build plan are preserved.

## Verification

Browser checks passed at 390, 760, 1024, and 1440 pixels with no horizontal overflow or JavaScript errors. Verified room preselection, three-night totals, second-dog details, review/edit/confirm, invalid dates, room-size validation, and FAQ expansion. The earlier hero cursor, pause, and reduced-motion checks also passed. `check-booking.cjs` uses the bundled local Playwright runtime for the booking smoke test. Full-page previews are saved as `landing-desktop.png` and `landing-mobile.png`.

## Full landing page extension

The page now includes rooms, a typical day, team care, a booking demo, FAQs, and a footer. Navigation and room buttons link to the relevant sections. `sections.css` styles these sections and `booking.js` handles local booking interactions.

The booking demo accepts stays of 1–30 nights, calculates sample PHP prices, checks room suitability, and supports two family dogs in Garden Hangout. Visitors review, edit, and confirm a demo stay. No real availability, payment, reservation submission, or persistent storage is used. This replaces the earlier coming-soon booking behavior.

`assets/hotel-photography.png` contains six AI-generated illustrative property, dog, and care images. Service copy and prices are concept content to verify before a real launch.

Browser verification passed for room preselection, three-night total, sibling details, review/edit/confirm, invalid dates, room-size validation, FAQs, and four viewport widths (390, 760, 1024, 1440). No horizontal overflow or JavaScript errors. Full-page previews: `landing-desktop.png` and `landing-mobile.png`. The local Playwright check is `check-booking.cjs`.

## Calendar booking redesign

The booking section now matches the supplied visual references: powder-blue backdrop, rounded white card, yellow actions, dual-month desktop calendar and single-month mobile calendar. Steps are dates/guests, sample stay with room selection, dog/contact details, review, and demo confirmation. Data remains only in page memory. Dates use the Asia/Manila current day. Calendar buttons support arrow-key navigation, manual date inputs, range selection, month navigation, and clearing. Two dogs require Garden Hangout. The updated check-booking.cjs verifies range selection, month navigation, capacity constraint, total, details/edit/confirm/reset, and responsive widths.

The booking review step follows the supplied reference: change-dates link, dog summary, check-in/check-out/guest/length rows, contact block, confirmation acknowledgment, disabled-until-checked yellow request button, and edit dog details link. The review smoke test verifies the new consent behavior and change-dates navigation.
