# PAWHAUS — Complete Build Plan

**Brand:** PAWHAUS  
**Tagline:** Stay. Play. Belong.  
**Product:** Premium Dog Hotel, Daycare, Grooming & Booking Platform  
**Primary Stack:** Next.js + React + TypeScript + Tailwind CSS + Motion/GSAP + PostgreSQL/Supabase

---

## 1. Product Vision

PAWHAUS is a premium digital experience for a dog hotel and pet-care business.

The platform has four major surfaces:

1. Public Website — cinematic, premium, highly animated marketing experience.
2. Booking Engine — real-time availability, pricing, reservation and payment.
3. Customer Portal — customers manage their dogs, bookings, payments and stay information.
4. Admin/Staff Portal — operations, calendar, customers, pets, services, payments, reports and content.

The website should feel like a **boutique hotel website designed exclusively for dogs**, not a generic pet-shop website.

### Core principle

Recreate the quality, interaction patterns and premium feel of the reference site, but use original PAWHAUS branding, copy, imagery, assets and implementation.

Do not directly copy proprietary assets, logos, text or source code.

---

# 2. Brand System

## Brand Name

**PAWHAUS**

## Primary Tagline

**Stay. Play. Belong.**

## Supporting Messages

- A place they'll love to stay.
- More than a stay. It's their second home.
- Because they're family.
- Their next stay starts here.

## Brand Personality

- Premium
- Warm
- Modern
- Playful
- Trustworthy
- Calm
- Sophisticated
- Hospitality-driven

## Visual Direction

Avoid the typical pet-business aesthetic.

Prefer:

- Editorial photography
- Large typography
- Architectural layouts
- Warm neutral colors
- Large rounded image containers
- Generous whitespace
- Smooth cinematic motion
- Subtle playful interactions

---

# 3. Color System

Use CSS variables/tokens.

```css
--haus-black: #171717;
--warm-ivory: #F7F4EE;
--sand: #DED6C8;
--taupe: #A89D8E;
--paw-brown: #6B5140;
--accent-gold: #D9A441;
--white: #FFFFFF;
```

Recommended ratio:

- 80% neutral
- 15% earthy
- 5% accent

Create semantic tokens:

- background
- foreground
- muted
- surface
- border
- accent
- success
- warning
- danger

Do not hard-code colors throughout components.

---

# 4. Typography

Recommended initial setup:

### Display
Manrope

### Body/UI
Inter

Use typography tokens:

- display-xl
- display-lg
- display-md
- heading-xl
- heading-lg
- heading-md
- body-lg
- body-md
- body-sm
- label
- caption

Hero typography should be oversized and responsive.

Example:

```text
A PLACE
THEY'LL LOVE
TO STAY.
```

---

# 5. Recommended Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Motion
- GSAP where timeline/scroll control requires it
- Lenis or equivalent smooth-scroll implementation

## Backend

- Next.js Route Handlers / Server Actions
- PostgreSQL
- Supabase recommended for initial implementation
- Supabase Auth
- Supabase Storage

## Payments

Abstract payment provider behind a service interface.

Initial candidate:

- PayMongo for Philippines
- Stripe if international expansion is required

Do not hard-code payment-provider logic directly into booking components.

## Email

Resend or equivalent transactional email provider.

## SMS

Semaphore or Twilio abstraction.

## Hosting

- Vercel for application
- Supabase for database/storage/auth

---

# 6. Repository Structure

```text
pawhaus/
├── app/
│   ├── (website)/
│   │   ├── page.tsx
│   │   ├── services/
│   │   ├── experience/
│   │   ├── about/
│   │   ├── contact/
│   │   └── booking/
│   │
│   ├── account/
│   │   ├── page.tsx
│   │   ├── bookings/
│   │   ├── dogs/
│   │   ├── payments/
│   │   └── profile/
│   │
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── bookings/
│   │   ├── calendar/
│   │   ├── customers/
│   │   ├── pets/
│   │   ├── services/
│   │   ├── rooms/
│   │   ├── payments/
│   │   ├── reports/
│   │   ├── content/
│   │   ├── staff/
│   │   └── settings/
│   │
│   └── api/
│       ├── bookings/
│       ├── availability/
│       ├── payments/
│       ├── notifications/
│       └── webhooks/
│
├── components/
│   ├── ui/
│   ├── animations/
│   ├── website/
│   ├── booking/
│   ├── account/
│   └── admin/
│
├── lib/
│   ├── db/
│   ├── auth/
│   ├── booking/
│   ├── pricing/
│   ├── payments/
│   ├── notifications/
│   └── validation/
│
├── hooks/
├── types/
├── config/
├── public/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── supabase/
│   ├── migrations/
│   └── seed/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── docs/
```

---

# 7. Public Website

## Global Navigation

Desktop:

```text
PAWHAUS

Stay
Services
Experience
Our Haus
FAQ

                    Book a Stay →
```

Mobile:

```text
PAWHAUS                         ☰
```

Navigation should animate in as a full-screen/mobile panel.

---

# 8. Homepage Sections

## Section 01 — Hero

Objective: immediate emotional impact.

```text
PAWHAUS

DOG HOTEL • DAYCARE • GROOMING

A PLACE
THEY'LL LOVE
TO STAY.

[ BOOK A STAY ]

Large editorial dog image
```

Animations:

- Page-load logo reveal
- Text line-by-line reveal
- Image clip-path reveal
- Subtle image scale
- CTA fade/slide
- Floating decorative elements
- Scroll indicator

Do not make every element bounce.

---

## Section 02 — Brand Statement

```text
MORE THAN A STAY.
IT'S THEIR SECOND HOME.
```

Animation:

- Text word reveal
- Image parallax
- Scroll-linked opacity

---

## Section 03 — Services

Cards:

1. Boarding
2. Daycare
3. Grooming
4. Add-ons

Card behavior:

- Image zoom on hover
- Arrow translation
- Text movement
- Border/background transition
- Mobile tap state

---

## Section 04 — The Haus

Introduce:

- Hotel
- Suites
- Play areas
- Rest areas
- Grooming
- Outdoor area

Use large horizontal image compositions.

---

## Section 05 — Suites

Show:

- Cozy Suite
- Garden Suite
- Premium Suite
- VIP Suite

Each room should have:

- Capacity
- Size
- Features
- Price
- Availability CTA

---

## Section 06 — Experience

Create a scroll-driven story:

```text
ARRIVE
    ↓
SETTLE IN
    ↓
PLAY
    ↓
REST
    ↓
GO HOME HAPPY
```

Each stage gets its own visual transition.

---

## Section 07 — Trust

Show:

- Safety procedures
- Staff
- Cleanliness
- Security
- Care standards
- Reviews

Avoid unsupported claims. Content must be configurable through admin/CMS.

---

## Section 08 — Testimonials

Animated testimonial cards.

Fields:

```text
customer_name
pet_name
review
rating
photo
featured
published
```

---

## Section 09 — FAQ

Animated accordion.

Questions managed from admin CMS.

---

## Section 10 — CTA

```text
READY FOR THEIR
NEXT ADVENTURE?

[ BOOK A STAY → ]
```

Use a large image and strong transition into footer.

---

# 9. Animation System

Create reusable components:

```text
components/animations/
├── Reveal.tsx
├── RevealText.tsx
├── Stagger.tsx
├── Parallax.tsx
├── ImageReveal.tsx
├── ScaleOnScroll.tsx
├── MagneticButton.tsx
├── PageTransition.tsx
├── HorizontalScroll.tsx
├── Marquee.tsx
└── Floating.tsx
```

## Animation Principles

### Page Load

Suggested sequence:

```text
background
→ logo
→ navigation
→ hero label
→ hero title
→ hero image
→ CTA
```

Tune actual durations through testing rather than blindly following fixed timings.

### Scroll Reveal

Default starting point:

```text
opacity: 0 → 1
y: 30px → 0
duration: 0.6–0.9s
```

### Image Reveal

Use clip-path/mask where appropriate.

### Parallax

Keep movement subtle.

### Reduced Motion

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

Disable or significantly reduce non-essential motion.

---

# 10. Booking Engine

The booking engine is the most important functional feature.

## Booking Flow

```text
SELECT SERVICE
       ↓
SELECT DOG
       ↓
SELECT DATE
       ↓
CHECK AVAILABILITY
       ↓
SELECT ROOM / SLOT
       ↓
ADD-ONS
       ↓
CUSTOMER DETAILS
       ↓
PRICE SUMMARY
       ↓
PAYMENT
       ↓
CONFIRMATION
```

---

# 11. Booking Rules

The server must be the source of truth.

Before confirming:

1. Validate customer.
2. Validate dog.
3. Validate service.
4. Validate date range.
5. Validate capacity.
6. Validate room/slot.
7. Recalculate price server-side.
8. Check overlapping bookings.
9. Create reservation transactionally.
10. Create payment intent/order.
11. Confirm only after successful payment or an explicitly allowed payment state.

---

# 12. Booking Status

```text
DRAFT
PENDING
PAYMENT_PENDING
CONFIRMED
CHECKED_IN
IN_SERVICE
CHECKED_OUT
COMPLETED
CANCELLED
NO_SHOW
REFUNDED
```

Keep status transitions controlled by backend rules.

---

# 13. Pet Management

Customer pet profile:

```text
Name
Breed
Date of Birth
Age
Sex
Weight
Photo
Temperament
Medical Notes
Allergies
Special Instructions
Vaccination Records
Emergency Notes
```

Sensitive health/medical data must have restricted access.

---

# 14. Database Schema

## users

```text
id
email
role
status
created_at
updated_at
```

## customers

```text
id
user_id
first_name
last_name
phone
email
address
emergency_contact_name
emergency_contact_phone
created_at
updated_at
```

## pets

```text
id
customer_id
name
breed
birth_date
sex
weight
photo_url
temperament
medical_notes
allergies
special_instructions
created_at
updated_at
```

## services

```text
id
category_id
name
slug
description
duration
base_price
pricing_type
capacity
is_active
sort_order
created_at
updated_at
```

## rooms

```text
id
name
room_type
description
capacity
price_per_night
status
features
image_url
```

## bookings

```text
id
booking_number
customer_id
pet_id
service_id
room_id
check_in
check_out
status
subtotal
discount
tax
total
notes
created_at
updated_at
```

## booking_items

```text
id
booking_id
item_type
name
quantity
unit_price
total
```

## payments

```text
id
booking_id
provider
provider_reference
amount
currency
status
paid_at
refunded_at
metadata
created_at
```

## reviews

```text
id
booking_id
customer_id
pet_id
rating
review
photo_url
status
created_at
```

## notifications

```text
id
user_id
booking_id
type
channel
subject
content
status
sent_at
created_at
```

## audit_logs

```text
id
user_id
action
entity_type
entity_id
old_values
new_values
ip_address
created_at
```

---

# 15. Availability Engine

Availability must support:

- Room capacity
- Service capacity
- Blocked dates
- Maintenance
- Holidays
- Staff capacity
- Existing reservations
- Check-in/check-out rules
- Same-day booking cutoff
- Maximum dogs per room
- Multi-dog reservations

Flow:

```text
request
  ↓
validate dates
  ↓
load active inventory
  ↓
load conflicting reservations
  ↓
remove unavailable inventory
  ↓
apply capacity rules
  ↓
return available options
```

Use database transactions/constraints to prevent race conditions.

---

# 16. Pricing Engine

Never calculate final prices only on the frontend.

```text
base service
+ room
+ number of nights
+ pet-specific adjustments
+ add-ons
+ seasonal pricing
+ promotion
+ tax
- discounts
= total
```

Make pricing configurable.

Do not hard-code PHP values into UI components.

---

# 17. Admin Portal

Navigation:

```text
Dashboard

Operations
  ├── Bookings
  ├── Calendar
  ├── Check-in
  └── Check-out

Customers
  ├── Customers
  └── Dogs

Services
  ├── Services
  ├── Rooms
  └── Add-ons

Finance
  ├── Payments
  ├── Invoices
  └── Revenue

Marketing
  ├── Promotions
  ├── Reviews
  └── Website Content

Reports

Staff & Roles

Settings
```

---

# 18. Admin Dashboard

Top KPIs:

```text
Today's Bookings
Upcoming Check-ins
Upcoming Check-outs
Today's Revenue
Pending Payments
Occupancy
```

Charts:

- Revenue by day
- Bookings by service
- Occupancy
- New customers
- Repeat customers
- Cancellation rate
- Service performance

---

# 19. Booking Calendar

Views:

- Day
- Week
- Month

Filters:

- Service
- Room
- Booking status
- Staff
- Pet

Booking card:

```text
🐶 Max
Premium Suite
Oct 12 → Oct 15
CONFIRMED
```

Allow:

- Open booking
- Reschedule
- Cancel
- Check-in
- Check-out

Drag/drop requires server validation before persistence.

---

# 20. Customer Portal

Dashboard:

```text
MY PAWHAUS

Upcoming Stay

Max
Premium Suite
Oct 12 → Oct 15

[ View Booking ]
```

Modules:

- My Dogs
- Bookings
- Payments
- Invoices
- Reviews
- Notifications
- Profile

---

# 21. Live Stay Feature

When a pet is checked in:

```text
MAX'S STAY

● Checked In

TODAY

✓ Breakfast
✓ Morning Play
✓ Rest
● Afternoon Walk
○ Dinner
○ Evening Rest
```

Staff can update activities.

Future enhancement:

- Photos
- Videos
- Care notes
- Activity timeline

Customers see only authorized information.

---

# 22. Staff Roles

Use RBAC:

```text
SUPER_ADMIN
ADMIN
MANAGER
FRONT_DESK
GROOMER
CARE_STAFF
```

Example permissions:

```text
booking.view
booking.create
booking.edit
booking.cancel
booking.checkin
booking.checkout

customer.view
customer.edit

pet.view
pet.edit

payment.view
payment.refund

content.view
content.edit

report.view

user.manage
settings.manage
```

Do not rely on hiding UI buttons for security. Enforce permissions server-side.

---

# 23. CMS

Admin-editable website content:

- Hero
- Headlines
- Services
- Suites
- Gallery
- Testimonials
- FAQ
- Promotions
- Contact details
- Social links

Use structured content rather than arbitrary HTML wherever possible.

---

# 24. API Design

Suggested endpoints:

```text
GET    /api/services
GET    /api/services/:id

GET    /api/availability

POST   /api/bookings
GET    /api/bookings/:id
PATCH  /api/bookings/:id
POST   /api/bookings/:id/cancel

POST   /api/bookings/:id/check-in
POST   /api/bookings/:id/check-out

GET    /api/customers/me
GET    /api/pets
POST   /api/pets
PATCH  /api/pets/:id

POST   /api/payments/create
POST   /api/payments/webhook

GET    /api/admin/dashboard
GET    /api/admin/bookings
GET    /api/admin/calendar

GET    /api/admin/reports
```

Validate all inputs with Zod or an equivalent schema-validation library.

---

# 25. Authentication

Customer:

- Email/password
- Magic link optional
- Social login optional

Admin:

- Email/password
- MFA recommended
- Role-based access
- Session protection

Protect:

```text
/account/*
/admin/*
```

Admin permissions must also be checked server-side.

---

# 26. Payment Architecture

Create a provider interface:

```text
PaymentProvider
├── createPayment()
├── verifyPayment()
├── refundPayment()
└── getPaymentStatus()
```

Providers can then be swapped.

Payment webhooks are authoritative for payment confirmation.

Never mark a booking paid simply because the browser reports success.

---

# 27. Notifications

Events:

```text
BOOKING_CREATED
PAYMENT_RECEIVED
BOOKING_CONFIRMED
BOOKING_CANCELLED
CHECK_IN
CHECK_OUT
REMINDER
REVIEW_REQUEST
```

Channels:

```text
Email
SMS
In-app
```

Notifications should be retryable in production.

---

# 28. Security

Required:

- Server-side authorization
- Input validation
- Rate limiting
- Secure cookies
- Environment variables for secrets
- Webhook signature validation
- Audit logs
- Database row-level security if using Supabase
- Least-privilege access
- No secret keys in client bundles
- No sensitive information in logs

---

# 29. Accessibility

Target WCAG 2.2 AA where practical.

Include:

- Keyboard navigation
- Visible focus states
- Semantic HTML
- Proper labels
- Alt text
- Accessible modals
- Accessible calendar
- Reduced-motion support
- Sufficient contrast

Animations must never prevent task completion.

---

# 30. Responsive Design

Test:

- Small mobile
- Large mobile
- Tablet
- Laptop
- Desktop
- Large desktop

Booking experience must be especially optimized for mobile.

---

# 31. Performance

Targets:

- Fast first load
- Optimized images
- Responsive images
- Lazy loading
- Avoid huge JavaScript bundles
- Code splitting
- Font optimization
- Server-side rendering where useful
- Static generation for marketing pages
- Dynamic rendering for account/admin pages

Prefer transform/opacity for most motion.

Avoid excessive scroll listeners.

---

# 32. SEO

Public pages:

```text
/
/services
/services/boarding
/services/daycare
/services/grooming
/experience
/about
/contact
/faq
```

Implement:

- Metadata
- Open Graph
- Sitemap
- Robots
- Canonical URLs
- Structured data where appropriate
- Local business schema if applicable

---

# 33. Analytics

Track:

```text
page_view
service_view
booking_started
dog_added
date_selected
availability_checked
room_selected
addon_selected
checkout_started
payment_started
payment_completed
booking_completed
booking_cancelled
```

Conversion funnel:

```text
Visitors
  ↓
Booking Started
  ↓
Availability Checked
  ↓
Checkout
  ↓
Payment
  ↓
Completed
```

---

# 34. Testing Strategy

## Unit Tests

Test:

- Pricing
- Availability
- Booking status transitions
- Permissions
- Date calculations

## Integration Tests

Test:

- Booking creation
- Payment confirmation
- Webhooks
- Cancellation
- Check-in/out

## E2E Tests

Customer:

```text
Website
→ Booking
→ Select Dog
→ Select Dates
→ Select Service
→ Payment
→ Confirmation
```

Admin:

```text
Admin login
→ Booking
→ Confirm
→ Check-in
→ Update stay
→ Check-out
```

---

# 35. Development Phases

## PHASE 1 — Foundation

- Next.js setup
- TypeScript
- Tailwind
- Design tokens
- Font setup
- Supabase
- Authentication
- Project structure
- Environment configuration

## PHASE 2 — Brand & Website

- Logo integration
- Navigation
- Hero
- Services
- Experience
- Suites
- Testimonials
- FAQ
- CTA
- Footer

## PHASE 3 — Animation

- Page transitions
- Hero timeline
- Scroll reveals
- Parallax
- Image masks
- Hover effects
- Mobile navigation
- Reduced motion

## PHASE 4 — Database

- Schema
- Migrations
- RLS
- Seed data
- Database services

## PHASE 5 — Booking Engine

- Services
- Rooms
- Availability
- Pricing
- Booking creation
- Booking statuses
- Confirmation

## PHASE 6 — Customer Portal

- Profile
- Dogs
- Bookings
- Payments
- Invoices
- Notifications

## PHASE 7 — Admin Portal

- Dashboard
- Calendar
- Booking management
- Customers
- Dogs
- Services
- Rooms
- Payments
- Reports

## PHASE 8 — Payments & Notifications

- Payment provider
- Webhooks
- Email
- SMS
- Booking reminders

## PHASE 9 — CMS

- Website content
- Testimonials
- FAQ
- Promotions
- Gallery

## PHASE 10 — QA & Launch

- Security
- Accessibility
- Performance
- SEO
- E2E testing
- Mobile testing
- Production deployment

---

# 36. MVP Scope

For the first production release:

### Public

- Homepage
- Services
- About/Experience
- Contact
- Booking

### Booking

- Customer
- Pet
- Service
- Dates
- Availability
- Room
- Add-ons
- Pricing
- Payment
- Confirmation

### Customer

- Login
- Dogs
- Bookings
- Payments

### Admin

- Dashboard
- Bookings
- Calendar
- Customers
- Pets
- Services
- Rooms
- Payments

Do not build every advanced feature before the core booking workflow is stable.

---

# 37. Phase 2 Features

After MVP:

- Live Stay
- Photos/videos
- Loyalty program
- Memberships
- Packages
- Promotions
- Referral system
- Automated review requests
- Advanced analytics
- Multi-location
- Staff scheduling
- Mobile app
- Push notifications

---

# 38. UI Component System

Create reusable components:

```text
Button
MagneticButton
Container
Section
Heading
Badge
Card
ImageCard
ServiceCard
SuiteCard
TestimonialCard
Accordion
Modal
Drawer
Calendar
DatePicker
BookingStepper
PriceSummary
StatusBadge
DataTable
StatCard
Chart
Sidebar
Topbar
Toast
Dialog
FormField
EmptyState
LoadingState
```

Do not duplicate components across pages.

---

# 39. UX Rules

1. Every important action must have a clear visual state.
2. Never lose customer-entered booking information.
3. Show loading states.
4. Show errors clearly.
5. Show useful empty states.
6. Prevent accidental destructive actions.
7. Confirm cancellations.
8. Make booking progress visible.
9. Keep mobile booking simple.
10. Use animations to guide attention, not delay users.
11. Always provide a way back.

---

# 40. AI Coding Instructions

When using Claude Code/Cursor:

### Rule 1
Do not generate the entire application in one step. Build vertically by feature.

### Rule 2
Before modifying architecture, inspect existing code.

### Rule 3
Do not overwrite working features without validating dependencies.

### Rule 4
Use TypeScript strictly. Avoid `any` unless explicitly justified.

### Rule 5
All database changes require migrations.

### Rule 6
All API inputs require validation.

### Rule 7
All protected operations require server-side authorization.

### Rule 8
Do not hard-code business rules into visual components.

### Rule 9
Separate UI, business logic, database and external services.

### Rule 10
After each feature:

```text
Implement
→ Typecheck
→ Lint
→ Test
→ Review
→ Commit
```

---

# 41. Suggested Build Order

```text
01 Project Foundation
        ↓
02 Design System
        ↓
03 Homepage
        ↓
04 Animation System
        ↓
05 Services
        ↓
06 Authentication
        ↓
07 Database
        ↓
08 Booking Engine
        ↓
09 Customer Portal
        ↓
10 Admin Dashboard
        ↓
11 Admin Calendar
        ↓
12 Payments
        ↓
13 Notifications
        ↓
14 CMS
        ↓
15 Reports
        ↓
16 Security
        ↓
17 Testing
        ↓
18 Performance
        ↓
19 SEO
        ↓
20 Production Launch
```

---

# 42. Definition of Done

A feature is not complete until:

- UI is responsive
- Loading state exists
- Error state exists
- Empty state exists where applicable
- Accessibility is considered
- Server validation exists
- Authorization exists
- Tests exist for important logic
- TypeScript passes
- Lint passes
- No console errors
- Mobile behavior is verified
- Production behavior is verified

---

# 43. Final Product Goal

The finished PAWHAUS platform should feel like:

> **Awwwards-style boutique hotel website + modern booking platform + professional pet operations system.**

The public site creates emotion.

The booking engine creates conversion.

The customer portal creates trust.

The admin portal creates operational efficiency.

The backend creates reliability.

**PAWHAUS — Stay. Play. Belong.**

---

# 44. Immediate Task for Claude Code

Start with **Phase 1 — Project Foundation**.

Do not build the booking engine yet.

First create:

1. Next.js + TypeScript application
2. Tailwind design system
3. PAWHAUS typography
4. PAWHAUS color tokens
5. Global layout
6. Responsive navigation
7. Button/component primitives
8. Animation foundation
9. Folder architecture
10. Environment configuration
11. Basic Supabase connection
12. README with local development instructions

After Phase 1 passes typecheck/lint/build, proceed to the homepage.

---

## Important Implementation Rule

The reference website is inspiration for interaction quality and visual direction. Build an original PAWHAUS implementation rather than copying proprietary source code, text, logos, photography, or other protected assets.

The goal is to achieve a comparable premium experience while making PAWHAUS its own brand and product.
