# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Node.js/Express backend for the Mauli Marketing e-commerce PWA. It provides REST APIs for user authentication, product catalog, shopping cart, order management, and store configuration.

**Tech Stack:**
- Node.js with Express
- MongoDB with Mongoose ODM
- JWT authentication with bcryptjs
- Joi for validation
- Jest for testing

**Database:** MongoDB database named `mauliMarketing` connected via `MONGO_URI_PROD` environment variable.

## Development Commands

**Start server:**
```bash
npm run dev          # Development mode with nodemon
npm start            # Production mode
```

**Testing:**
```bash
npm test            # Run all tests with Jest
```

**Seeding data:**
```bash
node src/scripts/seedUsers.js         # Create admin/manager/customer users
node src/scripts/seedCategories.js    # Populate categories
node src/scripts/seedProducts.js      # Populate products
node src/scripts/seedStoreConfig.js   # Initialize store configuration
```

## Architecture

**Entry point:** `src/server.js` loads environment variables, connects to MongoDB, and starts the Express app defined in `src/app.js`.

**Request flow:**
1. Request → Express middleware (helmet, cors, morgan, body parsers)
2. Routes in `src/routes/index.js` dispatch to domain-specific route files
3. Optional authentication/authorization via `src/middleware/authMiddleware.js`
4. Controllers in `src/controllers/` handle business logic
5. Mongoose models in `src/models/` interact with MongoDB
6. Errors caught by `src/middleware/errorHandler.js`

**API versioning:** All routes are prefixed with `/api/v1`.

**Authentication:**
- JWT tokens (access + refresh) managed by `src/services/authService.js`
- Protected routes use `protect` middleware
- Role-based access control via `authorize(...roles)` middleware
- Roles: `admin`, `manager`, `customer`

## Key Models

**User** (`src/models/User.js`):
- Supports multi-tenancy via `tenant_id`
- Tracks login/logout, session duration, order counts
- Instance methods: `matchPassword()`, `recordLogin()`, `recordLogout()`
- Static method: `dashboardStats()` for aggregated metrics

**Product** (`src/models/Product.js`):
- Fields: name, price, discount, unit (box/dozen/both), images, category_id
- Text search index on name and description
- Validation via Joi in `src/validators/productValidator.js`

**Cart** (`src/models/Cart.js`):
- One cart per user (unique `user_id`)
- Items store price/discount snapshots at time of adding
- Instance method: `calculateTotals()`
- Static method: `getOrCreateCart(user_id)`

**Order** (`src/models/Order.js`):
- Auto-generated `order_number` via pre-save hook
- Embedded delivery address and delivery slot
- Status tracking: pending → confirmed → processing → out_for_delivery → delivered/cancelled
- Payment methods: cod, online, upi

**StoreConfig** (`src/models/StoreConfig.js`):
- Singleton per tenant (or global if tenant_id is null)
- Manages: store address, delivery fees, cart discounts, delivery slots
- Static method: `getConfig(tenant_id)` returns or creates default config

## Route Organization

Routes are mounted in `src/routes/index.js`:
- `/api/v1/auth` - Login, register, refresh tokens
- `/api/v1/admin/users` - User management (admin only)
- `/api/v1/banners`, `/api/v1/admin/banners` - Banner CRUD
- `/api/v1/categories`, `/api/v1/admin/categories` - Category CRUD
- `/api/v1/products`, `/api/v1/admin/products` - Product CRUD with validation
- `/api/v1/storeconfig` - Store config (GET public, PUT/POST admin)
- `/api/v1/cart` - Cart operations (add, update, remove, clear)
- `/api/v1/orders`, `/api/v1/admin/orders` - Order placement and management

**Pattern:** Public read routes at `/api/v1/<resource>`, admin write routes at `/api/v1/admin/<resource>`.

## Important Notes

**No Redis:** Redis was previously used but has been removed. All functionality now uses MongoDB directly.

**Session tracking:** User login/logout is recorded in the User model with session duration and order success tracking.

**Delivery slots:** Managed in StoreConfig with capacity and booking tracking per time slot.

**Multi-tenancy:** `tenant_id` field exists on User, Cart, Order, and StoreConfig models for future multi-tenant support, but is currently nullable/optional.

**Environment variables:** Stored in `.env` at project root. Key variables:
- `PORT`, `NODE_ENV`
- `MONGO_URI_PROD` (MongoDB connection string)
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES`, `JWT_REFRESH_EXPIRES`
- `BCRYPT_SALT_ROUNDS`
- Cloudinary credentials for image uploads

## Testing

Tests located in `tests/` directory:
- `api.test.js` - Basic auth and session tests
- `banner.test.js`, `category.test.js`, `product.test.js` - CRUD operation tests
- `storeconfig.test.js` - Store configuration API tests

Tests use Jest and Supertest for HTTP assertions against the Express app.
