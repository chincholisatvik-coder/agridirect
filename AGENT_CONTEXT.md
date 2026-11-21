# Agridirect Project Context

Use this document as the primary context when asking another AI to work on this repository.

## 1. Project Summary

Agridirect is a frontend demo for a direct farmer-to-consumer dry agricultural goods marketplace. It is designed around:

- Direct farmer-to-buyer sales with no middlemen.
- Verified farmer listings and admin KYC/RTC review.
- Normal purchases and neighborhood group bulk-buying pools.
- 24-hour escrow protection after delivery.
- Farmer delivery approval for home-delivery orders.
- Long-shelf-life commodities only.
- English, Hindi, and Kannada UI support.

The application is a Vite + React 18 + TypeScript project styled with Tailwind CSS. It currently has no backend, database, real authentication provider, payment gateway, upload service, or external API integration. All business actions are simulated in the browser and persisted in `localStorage`.

## 2. Technology and Commands

### Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- `lucide-react` icons
- Browser `localStorage` for persistence
- Browser `window` URL, hash, and storage events
- External Unsplash image URLs for demo product photos
- Plus Jakarta Sans loaded from Google Fonts in `index.html`

### Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

On Windows PowerShell, if the `npm` PowerShell wrapper is blocked by execution policy, use:

```powershell
npm.cmd run build
```

The build command runs TypeScript checking followed by the Vite production build:

```json
"build": "tsc && vite build"
```

## 3. Application Entry and Routing

The entry point is [`src/main.tsx`](./src/main.tsx). It renders the app inside `AgridirectProvider` and imports the global stylesheet from [`src/index.css`](./src/index.css).

[`src/App.tsx`](./src/App.tsx) is the top-level route and shell component:

1. It reads `window.location.pathname` and `window.location.hash`.
2. Any URL containing `/admin` is treated as the admin route.
3. `/admin` requires a logged-in user with role `ADMIN`.
4. Unauthenticated public routes show [`AuthPage.tsx`](./src/apps/auth/AuthPage.tsx).
5. Authenticated farmers see [`SellerApp.tsx`](./src/apps/seller/SellerApp.tsx).
6. Authenticated buyers see [`BuyerApp.tsx`](./src/apps/buyer/BuyerApp.tsx).
7. Admin users on the admin route see [`AdminApp.tsx`](./src/apps/admin/AdminApp.tsx).

The public shell includes the current user, location, language selector, logout action, role badge, and footer. The admin shell has a darker authority-oriented theme.

## 4. Roles and Demo Accounts

Roles are defined in [`src/types/agridirect.ts`](./src/types/agridirect.ts):

- `FARMER`
- `BUYER`
- `ADMIN`

Seed users are in [`src/data/seedData.ts`](./src/data/seedData.ts). Demo passwords are intentionally simple (`123`) because this is a local demo.

Known seeded accounts include:

- Farmer: `rameshappa` / `123`
- Farmer: `mallikarjun` / `123`
- Farmer: `basavaraj` / `123`
- Farmer: `ningappa` / `123`
- Buyer: `anita` / `123`
- Buyer: `rajesh` / `123`
- Admin: `admin` / `123`

Login supports username, phone, or name. Admin login has a special `admin` credential path.

## 5. Global State and Persistence

[`src/context/AgridirectContext.tsx`](./src/context/AgridirectContext.tsx) owns the application state and exposes the `useAgridirect()` hook.

### State

- Active language
- Current user
- Users
- Products
- Group-buy pools
- Orders
- Active role tab
- Notification badge counts

### Persistence

The storage prefix is:

```text
agridirect_store_v1
```

The following values are saved:

- `agridirect_store_v1_lang`
- `agridirect_store_v1_currUser`
- `agridirect_store_v1_users`
- `agridirect_store_v1_products`
- `agridirect_store_v1_pools`
- `agridirect_store_v1_orders`

The provider also listens for browser `storage` events so product, pool, order, and user changes can synchronize across open tabs.

The admin portal has a reset action that removes persisted user/product/pool/order data and restores the seed arrays.

## 6. Domain Model

The canonical TypeScript types are in [`src/types/agridirect.ts`](./src/types/agridirect.ts).

### User

Contains identity, role, phone, optional username/password, language, location, pincode, coordinates, optional KYC document ID, verification status, and optional UPI ID.

### Product

Contains:

- Farmer identity and verification state
- Commodity category
- Localized title and description (`en`, `hi`, `kn`)
- `photoUrl`
- Harvest month/year
- Quality grade
- Shelf-life months
- Available stock
- Wholesale and retail benchmark prices
- Normal direct price
- Bulk pool price and minimum pool quantity
- Pickup location and coordinates
- Home-delivery configuration and fee rates
- Admin approval flag

Supported categories:

- `PEANUTS_OILSEEDS`
- `PULSES_DALS`
- `GRAINS_MILLETS`
- `DRY_SPICES`

Supported grades:

- `GRADE_A_BOLD`
- `STANDARD`
- `ORGANIC_UNPOLISHED`

### GroupBuyPool

Contains the product, host buyer, locality, drop-off address, target/current quantity, bulk unit price, fulfillment type, estimated delivery fees, expiry timestamp, status, and participants.

Pool statuses:

- `OPEN`
- `LOCKED_CONFIRMED`
- `EXPIRED_REFUNDED`

### Order

Contains buyer/farmer/product references, order type, optional pool ID, quantity, applied unit price, subtotal, fulfillment type, delivery approval state, address, distance, delivery fee, total amount, status, timestamps, and optional dispute data.

Order types:

- `NORMAL`
- `GROUP_BULK`

Order statuses:

- `ESCROW_HELD`
- `AWAITING_POOL_COMPLETION`
- `CONFIRMED_PREPARING`
- `READY_FOR_PICKUP`
- `OUT_FOR_DELIVERY`
- `DELIVERED_INSPECTION_WINDOW`
- `COMPLETED_RELEASED_TO_FARMER`
- `DISPUTED_FROZEN`
- `REFUNDED_TO_BUYER`

## 7. Buyer Experience

The buyer application is [`src/apps/buyer/BuyerApp.tsx`](./src/apps/buyer/BuyerApp.tsx).

It has three tabs:

1. Fresh Harvest Catalog
2. Live Group Bulk-Buying Pools
3. My Orders and 24-hour inspection

### Catalog

The catalog supports:

- Text search across English, Hindi, and Kannada product titles.
- Search by farmer name.
- Search by pickup location.
- Category filtering.
- Responsive product-card grid.

[`ProductCard.tsx`](./src/apps/buyer/ProductCard.tsx) displays:

- Farmer crop photo from the product's `photoUrl`
- Shelf-life and quality badges
- Harvest month
- Farmer uplift badge
- Farmer name and verification status
- Distance from buyer
- Localized product title and description
- Market retail benchmark
- Normal direct price
- Group bulk price
- Buy Now and Join/Start Bulk Pool actions

### Product Details Feature

[`ProductDetailsModal.tsx`](./src/apps/buyer/ProductDetailsModal.tsx) was added so buyers can interact with listings like an e-commerce catalog:

- Clicking the crop image opens the details modal.
- Clicking the product title also opens the modal.
- The modal displays the same farmer listing photo at a larger size.
- It displays the full localized description.
- It displays category, farmer, verification, harvest date, shelf life, available stock, home-delivery availability, pickup location, and quality grade.
- It displays normal and group-buy prices.
- The existing checkout actions are preserved.
- Clicking a purchase action closes the details modal and opens the existing checkout modal.
- Escape closes the modal.
- Clicking the backdrop closes the modal.

The photo shown is exactly the product's existing `photoUrl`. Current seed/demo listings use Unsplash URLs. Farmer-created listings can choose one of the preset URLs, enter a URL, or use the simulated camera URL in [`VoiceProductModal.tsx`](./src/apps/seller/VoiceProductModal.tsx). There is not yet a real local file upload or cloud image-storage flow.

### Checkout

[`CheckoutModal.tsx`](./src/apps/buyer/CheckoutModal.tsx) supports:

- Normal direct purchase
- Group bulk purchase or pool creation
- Quantity
- Self-pickup or home delivery
- Buyer address/locality
- Delivery distance and calculated fees
- Escrow payment simulation

## 8. Group Buying

[`GroupPoolsBoard.tsx`](./src/apps/buyer/GroupPoolsBoard.tsx) shows active pools and their progress.

Buyers can:

- Join an existing pool.
- Create a new pool.
- Choose fulfillment type.
- Contribute quantity toward the target.
- Share pool information through WhatsApp.

When a pool reaches its target:

- The pool becomes `LOCKED_CONFIRMED`.
- Linked orders move toward preparation.
- Product stock is deducted.

If an admin expires a pool:

- The pool becomes `EXPIRED_REFUNDED`.
- Linked orders become `REFUNDED_TO_BUYER`.

## 9. Farmer Experience

The farmer dashboard is [`src/apps/seller/SellerApp.tsx`](./src/apps/seller/SellerApp.tsx).

It includes:

- Farmer identity and location.
- KYC/RTC verification state.
- Middleman benchmark vs Agridirect direct payout comparison.
- Total inventory.
- Active product count.
- Completed earnings.
- Product listings.
- Delivery request tab.
- Active group pools tab.

### Adding Products

[`VoiceProductModal.tsx`](./src/apps/seller/VoiceProductModal.tsx) supports:

- Form-based listing creation.
- Simulated voice input.
- Browser Web Speech API when available.
- English, Hindi, and Kannada speech language selection.
- Category, title, description, harvest date, grade, stock, shelf life, and pricing.
- Product photo preset selection.
- Product photo URL entry.
- Simulated camera photo action.
- Pickup location and delivery settings.

Validation includes:

- Shelf life must be at least 3 months.
- Pricing must follow the middle-ground rule:
  `wholesale < group price < normal direct price < retail`.

New products are inserted into the shared product list and saved to localStorage.

[`DeliveryRequests.tsx`](./src/apps/seller/DeliveryRequests.tsx) lets farmers approve or reject home-delivery requests.

[`FarmerPoolsView.tsx`](./src/apps/seller/FarmerPoolsView.tsx) shows farmer-related pool activity.

## 10. Admin Experience

The admin dashboard is [`src/apps/admin/AdminApp.tsx`](./src/apps/admin/AdminApp.tsx).

It displays:

- Total traded volume.
- Farmer uplift KPI.
- Buyer savings.
- Active escrow amount.
- Pending KYC count.
- Disputed order count.

Admin tabs:

### KYC

[`KycVerification.tsx`](./src/apps/admin/KycVerification.tsx) allows admin verification toggling for farmers. Toggling a farmer also updates the `farmerVerified` state on that farmer's products.

### Escrow

[`EscrowLedger.tsx`](./src/apps/admin/EscrowLedger.tsx) shows escrow-related orders and allows dispute resolution:

- Release escrow to farmer.
- Refund buyer.

### Compliance

[`ShelfLifeAudit.tsx`](./src/apps/admin/ShelfLifeAudit.tsx) reviews product shelf life, approval, photos, and pricing/compliance information.

## 11. Business Logic

Business calculations are in [`src/utils/pricing.ts`](./src/utils/pricing.ts).

Important behavior:

- Buyer distance uses the Haversine calculation between buyer and pickup coordinates.
- Delivery fees use product delivery configuration.
- Normal order subtotal is quantity multiplied by normal price.
- Group order subtotal is quantity multiplied by bulk price.
- Home delivery may require farmer approval.
- Rejecting delivery changes the order to self-pickup and removes the delivery fee.
- Buyer confirmation changes the order to completed and releases escrow conceptually.
- Buyer disputes freeze escrow conceptually.
- Admin resolves disputes by releasing or refunding.

## 12. Internationalization

Translations are stored in [`src/i18n/translations.ts`](./src/i18n/translations.ts).

Supported language codes:

- `en`
- `hi`
- `kn`

Use `const { t } = useAgridirect()` and `t('translationKey')` for UI labels. The translation helper falls back to English, then to the key itself if a translation is missing.

Product titles and descriptions are stored directly on each product in all three languages.

## 13. Styling and UI Conventions

- Tailwind utility classes are used throughout components.
- The visual language uses emerald green for farmer/direct-market actions, amber for group-buy actions, blue for buyer-related indicators, and stone/dark backgrounds for shared shells and admin surfaces.
- Cards use rounded corners, borders, shadows, and responsive grids.
- Icons come from `lucide-react`.
- The app is mobile-responsive using Tailwind breakpoints.
- Global styles are minimal and are in [`src/index.css`](./src/index.css).

## 14. Important Files

### Application

- [`index.html`](./index.html)
- [`src/main.tsx`](./src/main.tsx)
- [`src/App.tsx`](./src/App.tsx)

### Shared state and data

- [`src/context/AgridirectContext.tsx`](./src/context/AgridirectContext.tsx)
- [`src/data/seedData.ts`](./src/data/seedData.ts)
- [`src/types/agridirect.ts`](./src/types/agridirect.ts)
- [`src/i18n/translations.ts`](./src/i18n/translations.ts)

### Buyer

- [`src/apps/buyer/BuyerApp.tsx`](./src/apps/buyer/BuyerApp.tsx)
- [`src/apps/buyer/ProductCard.tsx`](./src/apps/buyer/ProductCard.tsx)
- [`src/apps/buyer/ProductDetailsModal.tsx`](./src/apps/buyer/ProductDetailsModal.tsx)
- [`src/apps/buyer/CheckoutModal.tsx`](./src/apps/buyer/CheckoutModal.tsx)
- [`src/apps/buyer/GroupPoolsBoard.tsx`](./src/apps/buyer/GroupPoolsBoard.tsx)
- [`src/apps/buyer/BuyerOrdersView.tsx`](./src/apps/buyer/BuyerOrdersView.tsx)

### Farmer

- [`src/apps/seller/SellerApp.tsx`](./src/apps/seller/SellerApp.tsx)
- [`src/apps/seller/VoiceProductModal.tsx`](./src/apps/seller/VoiceProductModal.tsx)
- [`src/apps/seller/DeliveryRequests.tsx`](./src/apps/seller/DeliveryRequests.tsx)
- [`src/apps/seller/FarmerPoolsView.tsx`](./src/apps/seller/FarmerPoolsView.tsx)

### Admin

- [`src/apps/admin/AdminApp.tsx`](./src/apps/admin/AdminApp.tsx)
- [`src/apps/admin/AdminLoginPage.tsx`](./src/apps/admin/AdminLoginPage.tsx)
- [`src/apps/admin/KycVerification.tsx`](./src/apps/admin/KycVerification.tsx)
- [`src/apps/admin/EscrowLedger.tsx`](./src/apps/admin/EscrowLedger.tsx)
- [`src/apps/admin/ShelfLifeAudit.tsx`](./src/apps/admin/ShelfLifeAudit.tsx)

### Utilities

- [`src/utils/pricing.ts`](./src/utils/pricing.ts)
- [`src/utils/voiceParser.ts`](./src/utils/voiceParser.ts)

## 15. Current Limitations and Future Work

Do not assume these are implemented:

- No real backend or server API.
- No real user authentication or secure password handling.
- No real payment processing or escrow account.
- No real farmer KYC verification service.
- No real delivery provider integration.
- No real inventory concurrency control.
- No database transactions.
- No persistent cloud image upload.
- Product photo input is currently a URL/preset/simulated camera flow.
- Seed prices and KPI values are demo data.
- Browser localStorage is not suitable for production data or sensitive information.

Likely future work:

1. Add a backend API and database.
2. Replace localStorage auth with secure server sessions or an identity provider.
3. Add object storage and signed image uploads for real farmer crop photos.
4. Add payment and escrow provider integration.
5. Add server-side stock reservation and pool locking.
6. Add robust validation, error notifications, and automated tests.
7. Move all remaining hardcoded UI strings into the translation files.
8. Add route handling with a proper router if the application grows.

## 16. Instructions for Future AI Changes

When modifying this project:

- Inspect existing component patterns before adding new logic.
- Reuse `useAgridirect()` and existing context actions instead of creating parallel state.
- Preserve the three roles and their current route behavior.
- Keep buyer checkout, group pools, farmer delivery approval, and admin escrow actions consistent.
- Use the `Product`, `Order`, `GroupBuyPool`, and `User` types rather than duplicating shapes.
- Add translation keys for user-facing text in English, Hindi, and Kannada.
- Preserve localStorage persistence unless the task explicitly changes storage architecture.
- Keep image behavior aligned with `Product.photoUrl`.
- Run `npm run build` after TypeScript or JSX changes.
- Avoid changing unrelated pre-existing behavior.
