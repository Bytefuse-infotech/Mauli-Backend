# Firebase Push Notification Implementation

This document describes the Firebase Cloud Messaging (FCM) implementation for push notifications in the Mauli Marketing PWA.

## Overview

The push notification system consists of three parts:
1. **Backend (Node.js)** - Uses `firebase-admin` to send notifications
2. **Frontend PWA** - Receives notifications and manages FCM tokens
3. **Admin Panel** - Allows administrators to send notifications

---

## Backend Setup

### 1. Environment Variables

Add the following to your `.env` file:

```bash
# Firebase Admin SDK - Service Account JSON (NO QUOTES around the JSON)
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

**Important Notes:**
- Do NOT wrap the JSON in quotes (`'` or `"`)
- Keep the JSON on a single line
- The `\n` in the private_key should stay as literal `\n`

To get the service account JSON:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → Project Settings → Service Accounts
3. Click "Generate New Private Key"
4. Copy the entire JSON content and paste directly into `.env`

### 2. Files Created

- `src/utils/firebase.js` - Firebase Admin SDK initialization and notification utilities
- `src/controllers/fcmController.js` - FCM-related API endpoints
- `src/routes/fcmRoutes.js` - Route definitions for FCM endpoints

### 3. API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/users/fcm-token` | Save FCM token | User |
| DELETE | `/api/v1/users/fcm-token` | Remove FCM token | User |
| POST | `/api/v1/users/admin/push-notifications/send-to-user` | Send to specific user | Admin |
| POST | `/api/v1/users/admin/push-notifications/send-to-all` | Send to all users | Admin |
| GET | `/api/v1/users/admin/push-notifications/users` | Get users with FCM tokens | Admin |
| GET | `/api/v1/users/admin/push-notifications/status` | Check FCM configuration status | Admin |

### 4. User Model Changes

Added `fcm_tokens` field to the User model:
```javascript
fcm_tokens: [{
    token: String,      // The FCM token
    device_info: String, // Browser/device information
    created_at: Date
}]
```

---

## Frontend Setup

### 1. Environment Variables

Add to your `.env` file:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXX

# VAPID Key for Web Push
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

To get these values:
1. Firebase Console → Project Settings → General → Your apps → Web app
2. For VAPID Key: Project Settings → Cloud Messaging → Web Push certificates

### 2. Service Worker Configuration

The `public/firebase-messaging-sw.js` file needs to be updated with your Firebase config.

**Important:** Service workers can't access environment variables. You'll need to either:

Option A: **Hardcode values** (less secure for public repos)
```javascript
const firebaseConfig = {
    apiKey: "your_actual_api_key",
    authDomain: "your_project.firebaseapp.com",
    // ... etc
};
```

Option B: **Build-time injection** (recommended)
Create a build script that replaces placeholders with actual values.

### 3. Files Created

- `src/lib/firebase/config.ts` - Firebase app initialization
- `src/lib/firebase/messaging.ts` - FCM token and message handling
- `src/lib/firebase/index.ts` - Export file
- `src/hooks/useFCM.ts` - React hook for FCM management
- `src/context/FCMContext.tsx` - Context provider for FCM state
- `public/firebase-messaging-sw.js` - Service worker for background notifications

### 4. Usage

The FCM provider is automatically included in `App.tsx`. Notifications are automatically initialized when a user logs in.

To manually request permission:
```typescript
import { useFCMContext } from '../context/FCMContext';

function MyComponent() {
    const { requestPermission, isSupported, permissionStatus } = useFCMContext();
    
    return (
        <button onClick={requestPermission} disabled={!isSupported}>
            Enable Notifications
        </button>
    );
}
```

---

## Admin Panel

### Navigation
Push Notifications is available in the admin sidebar at `/admin/push-notifications`

### Features
- **Send to All Users** - Broadcasts to all users with FCM tokens
- **Send to Specific User** - Select a user from dropdown
- **FCM Status** - Shows if Firebase is configured correctly
- **User Count** - Shows how many users can receive notifications
- **Preview** - Live preview of the notification

---

## Flow Diagram

```
┌─────────────────┐
│   User Login    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Request Permission│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Get FCM Token  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│ Save to Backend │─────▶│  MongoDB User   │
└─────────────────┘      │   fcm_tokens[]  │
                         └─────────────────┘
                                  │
                                  ▼
┌─────────────────┐      ┌─────────────────┐
│  Admin Sends    │─────▶│ firebase-admin  │
│  Notification   │      │    SDK          │
└─────────────────┘      └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  FCM Server     │
                         └────────┬────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
           ┌─────────────────┐         ┌─────────────────┐
           │  App Foreground │         │  App Background │
           │   onMessage()   │         │ Service Worker  │
           └─────────────────┘         └─────────────────┘
```

---

## Troubleshooting

### FCM Not Configured
- Ensure `FIREBASE_SERVICE_ACCOUNT_JSON` is set in backend `.env`
- Verify the JSON is valid (single-line, no line breaks)

### Token Not Saving
- Check browser console for errors
- Verify user is authenticated before FCM init

### Notifications Not Appearing
- Check browser notification permissions
- Ensure service worker is registered (`/firebase-messaging-sw.js`)
- Verify VAPID key is correct

### Background Notifications Not Working
- Service worker must be at root path (`/firebase-messaging-sw.js`)
- Firebase config must be hardcoded in service worker
- Check if service worker is installed: DevTools → Application → Service Workers

---

## Security Notes

1. **Never commit** service account JSON to version control
2. **VAPID keys** are safe to expose (public key)
3. **API keys** for client-side Firebase are safe to expose (restricted by domain)
4. **Validate FCM tokens** on the backend before sending notifications
5. **Rate limit** notification endpoints to prevent abuse
