# AceWears — Technical Blueprint Deliverables

This document maps each requested deliverable to its source files in the project.

## 1. Production SQL Database Schema (Tables, Foreign Keys, Indexes)

- **Raw PostgreSQL DDL**: `download/schema.sql` — full production DDL with ENUMs, FKs, composite indexes, GIN trigram indexes for search, materialized view for aggregate ratings, and a DB-level trigger (`enforce_verified_buyer`) that hard-blocks review creation unless the linked order is in `DELIVERED` status and owned by the reviewer.
- **Prisma Schema (runtime)**: `prisma/schema.prisma` — mirrors the PostgreSQL DDL for the running sandbox. Models: `User`, `Address`, `Category`, `Product`, `ProductImage` (3-angle), `ProductVariant`, `SizeChartEntry`, `CartItem`, `Order`, `OrderItem`, `Review`, `ReviewPhoto`, `ReelItem`, `RecentView`, `Notification`, `TradeInItem`, `PromoTag`.

## 2. SVG Logo Code + Tailwind CSS Configuration

- **SVG Logo (wordmark)**: `public/acewears-logo.svg` — interlocking loop weave forming the "A" monogram, with amber + teal gradients over a deep navy hex shield.
- **SVG Icon (square)**: `public/acewears-icon.svg` — same monogram in a 64×64 rounded square for PWA manifest / favicon.
- **Tailwind config**: `tailwind.config.ts` — extended `navy`/`amber`/`teal` color ramps, custom keyframes (`slide-up-sheet`, `pulse-amber`, `shimmer`), `display` font family token, and AceWears semantic token overrides.

## 3. PWA Install Banner (15-second trigger + 7-day localStorage suppression)

- **Component**: `src/components/acewears/pwa-install-banner.tsx`
  - Captures `beforeinstallprompt`, prevents default browser infobar.
  - 15-second interval trigger — re-checks every 15s; only fires when the app is uninstalled AND not within a 7-day suppression window.
  - Dismissal state persisted via Zustand store (`usePwaSuppressionStore`) in `localStorage` key `acewears-pwa-suppression`.
  - Non-intrusive bottom slide-up sheet (Framer Motion spring animation), respects iOS safe area.
- **Service Worker**: `public/sw.js` — network-first for HTML, cache-first for static assets ONLY (never caches `/api/*` to preserve data freshness), push notification handler.
- **Manifest**: `public/manifest.json`
- **SW Registrar**: `src/components/acewears/service-worker-registrar.tsx`

## 4. Admin Product Upload Form (3-Angle Dropzones)

- **Component**: `src/components/acewears/admin-product-upload-form.tsx`
  - 3 dedicated drag-and-drop slots: `FRONT`, `BACK`, `SIDE_DETAIL`.
  - Client-side image compression via Canvas API — downscales to max 1600px on longest side, JPEG quality 0.82. Shows original vs compressed size diff per slot.
  - Interactive thumbnail previews with dimension readouts.
  - Variants manager (SKU, size, color, stock).
  - Posts to `/api/products` (admin-only) after `/api/admin/upload` returns uploaded URLs.
- **Upload Endpoint**: `src/app/api/admin/upload/route.ts` — admin-gated multipart handler.
- **Admin role guard**: enforced via `x-acewears-role` header check at every admin endpoint.

## 5. API Handlers — Product CRUD + Verified Review Authorization Guard

### Product CRUD
- `src/app/api/products/route.ts` — `GET` (paginated, filtered) + `POST` (admin create with 3-angle images, variants, size chart).
- `src/app/api/products/[id]/route.ts` — `GET` (full PDP incl. rating summary), `PUT` (admin update + variant stock overrides + promo tag replacement), `DELETE` (admin soft-delete via `isActive=false`).
- `src/app/api/categories/route.ts`, `src/app/api/reels/route.ts`, `src/app/api/trade-in/route.ts`, `src/app/api/admin/upload/route.ts`, `src/app/api/fit-recommendation/route.ts`, `src/app/api/complete-the-look/route.ts`, `src/app/api/me/reviewable-items/route.ts`.

### Verified Review Authorization Guard
- `src/app/api/products/[id]/reviews/route.ts`
  - `GET` returns visible (non-hidden) reviews + aggregate rating breakdown + tag counts.
  - `POST` performs 5-step verification:
    1. Authentication required (user ID via header or body).
    2. Order item must exist and belong to the requesting user.
    3. Order item's product must match the reviewed product.
    4. Parent order status must be `DELIVERED`.
    5. No existing review for the same order item (one review per line).
  - All checks fail-closed with HTTP 403 + specific error message.

## 6. Shoppable Video Feed (AceReels) Carousel

- **Component**: `src/components/acewears/ace-reels.tsx`
  - Vertical snap-scrolling carousel (TikTok/Reels-style).
  - Auto-play active video, pause off-screen videos.
  - Right-side action rail: like (with fill state), comment, share, brand chip.
  - Bottom-left product overlay with image, title, price, size chips, and 1-tap **Add to Cart** button (calls `useCartStore.addItem`).
  - Mute/unmute toggle, pause indicator overlay.
  - Mobile-first height (70vh mobile / 80vh desktop).
- **API**: `src/app/api/reels/route.ts` — returns active reels with attached product + FRONT image + variants.

## Bonus Features (implemented)

- **AI Virtual Try-On (Premium)** — NEW. End-to-end pipeline:
  - **BodyProfileCapture** (`src/components/acewears/body-profile-capture.tsx`) — upload face + body photos, pick skin tone / hair style / hair color / eye color / body type, enter measurements (chest, waist, hip, inseam, shoulder). Includes a "Render consent" checkbox.
  - **VLM attribute extraction** (`src/app/api/me/extract-attrs/route.ts`) — calls the z-ai-web-dev-sdk VLM to analyze the uploaded face photo and extract structured attributes: faceShape, jawLine, cheekbones, skinUndertone, hairTexture, eyeShape, build, posture, genderPresentation. Returns strict JSON.
  - **Try-On generation** (`src/app/api/try-on/route.ts`) — orchestrates a 3-step pipeline:
    1. Loads the user's BodyProfile + the product's FRONT image.
    2. Calls VLM to analyze the garment (silhouette, fit, fabric weight, drape, color, details).
    3. Composes a detailed image-gen prompt blending the user's physical description + garment analysis + lighting/pose/framing direction, then calls `zai.images.generations.create({ size: '768x1344' })` to render a photorealistic portrait.
    4. Persists the result to `/public/uploads/try-on/` and caches in DB keyed by `(userId, productId)` — subsequent views are instant.
  - **VirtualTryOn viewer** (`src/components/acewears/virtual-try-on.tsx`) — premium-gated modal with side-by-side Compare view (Garment vs On-You-AI), Result-only view toggle, AI prompt transcript (collapsible), Download button, and Regenerate option.
  - **PDP integration** — every ProductDetailModal now has a Try On button next to Add to Cart. Non-premium users see a "Premium" badge; clicking opens the VirtualTryOn modal which surfaces an Upgrade CTA.
  - **Premium upgrade** (`src/app/api/me/upgrade-premium/route.ts`) — demo one-click upgrade that flips `user.isPremium = true` and stamps `premiumSince`.
  - **AI Studio section** — accessible from the home hero CTA + header mega-menu. Shows the 3-step "how it works", the body profile form, and the user's prior try-on history grid.

- **AI Size & Fit Assistant**: `src/components/acewears/ai-size-assistant.tsx` + `src/app/api/fit-recommendation/route.ts` — BMI-based anthropometric estimate + size-chart deviation scoring.
- **AI "Complete the Look"**: `src/components/acewears/complete-the-look.tsx` + `src/app/api/complete-the-look/route.ts` — cross-sell engine that picks complementary category products.
- **Scarcity & Countdown Triggers**: `src/components/acewears/scarcity-badges.tsx` — real-time inventory badges + live countdown timer.
- **Slide-out Quick Cart Drawer**: `src/components/acewears/quick-cart-drawer.tsx` — free-shipping progress threshold, quantity controls.
- **Re-Commerce Trade-In Portal**: `src/components/acewears/trade-in-portal.tsx` + `src/app/api/trade-in/route.ts` — live credit estimate, condition tiers.
- **PWA**: manifest, service worker, install banner with 15s/7-day logic.
- **Mobile Bottom-Docked Nav**: `src/components/acewears/bottom-nav.tsx` — Home / Categories / Reels / Cart / Account.
- **Persistent State via Zustand**: cart, auth, recent views — all `localStorage`-persisted.

## Database Seed

Run `bun run scripts/seed.ts` to populate:
- 6 products across 5 categories (tops, bottoms, outerwear, shoes, accessories)
- 3-angle images per product
- Size charts + variants
- Scarcity promo tags on low-stock items
- 3 shoppable reels
- A DELIVERED blazer order + an existing verified review (so PDP shows aggregate rating)
- A DELIVERED sneaker order with NO review yet (so the verified-buyer review submission flow can be demonstrated end-to-end)

## Demo Accounts (one-click sign-in via Account section)

- **Admin**: `admin@acewears.com` — unlocks the Admin Dashboard with product upload form.
- **Verified Buyer**: `buyer@acewears.com` — owns the seeded DELIVERED orders, can submit verified reviews.
