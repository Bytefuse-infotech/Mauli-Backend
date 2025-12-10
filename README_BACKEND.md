# Backend Setup

## Environment Variables (.env)
```env
PORT=5009
NODE_ENV=development
MONGO_URI_PROD=your_mongodb_atlas_uri
REDIS_URL=redis://localhost:6379

# JWT Secrets (Change these in production!)
JWT_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d

# Security
BCRYPT_SALT_ROUNDS=10
```

## Running the Server
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start in development mode:
   ```bash
   npm run dev
   ```

## Seeding Data
Populate the database with Admin, Manager, and Customer users:
```bash
node src/scripts/seedUsers.js
```

## Running Tests
Run unit and integration tests (Auth, Sessions, Dashboard Stats):
```bash
npm test
```
