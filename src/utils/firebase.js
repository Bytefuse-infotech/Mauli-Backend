/**
 * Firebase Admin SDK Initialization
 * Used for sending push notifications via Firebase Cloud Messaging (FCM)
 */
const admin = require('firebase-admin');

let firebaseApp = null;

/**
 * Initialize Firebase Admin SDK
 * Reads service account from FIREBASE_SERVICE_ACCOUNT_JSON environment variable
 * The JSON should be minified (single line) with literal \n in private_key
 */
const initializeFirebase = () => {
    try {
        // Skip if already initialized
        if (firebaseApp || admin.apps.length > 0) {
            return admin;
        }

        // Read the JSON string from the environment variable
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

        if (!serviceAccountJson) {
            console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT_JSON not configured. FCM push notifications will be disabled.');
            return null;
        }

        // Parse the JSON string back into an object
        const serviceAccount = JSON.parse(serviceAccountJson);

        // Validate required fields
        if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
            console.error('❌ Firebase service account missing required fields (project_id, private_key, client_email)');
            return null;
        }

        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        console.log('✅ Firebase Admin SDK initialized successfully');
        return admin;
    } catch (error) {
        console.error('❌ Firebase Admin SDK initialization failed:', error.message);
        return null;
    }
};

/**
 * Get Firebase Admin instance
 */
const getFirebaseAdmin = () => {
    if (!firebaseApp && admin.apps.length === 0) {
        return initializeFirebase();
    }
    return admin;
};

/**
 * Send push notification to single or multiple tokens
 * @param {string|string[]} tokens - FCM token(s) to send to
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload (must be string values)
 * @returns {Promise<object>} - Send result with success and failure counts
 */
const sendPushNotification = async (tokens, title, body, data = {}) => {
    const firebaseAdmin = getFirebaseAdmin();

    if (!firebaseAdmin) {
        console.warn('Firebase not initialized. Skipping push notification.');
        return { success: false, message: 'Firebase not configured' };
    }

    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];

    // Filter out empty tokens
    const validTokens = tokenArray.filter(token => token && token.trim());

    if (validTokens.length === 0) {
        return { success: false, message: 'No valid FCM tokens provided' };
    }

    // Convert all data values to strings (FCM requirement)
    const stringData = {};
    Object.keys(data).forEach(key => {
        stringData[key] = String(data[key]);
    });

    try {
        // Generate unique message ID for deduplication
        const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Include messageId in data for service worker deduplication
        const enrichedData = {
            ...stringData,
            messageId,
            title, // Include title/body in data too for service worker fallback
            body
        };

        const message = {
            notification: {
                title,
                body
            },
            data: enrichedData,
            // Web push specific configuration for PWA
            webpush: {
                headers: {
                    'Urgency': 'high',  // Critical for background delivery
                    'TTL': '86400'      // 24 hour time-to-live
                },
                notification: {
                    title,
                    body,
                    icon: '/assets/icons/icon-192x192.png',
                    badge: '/assets/icons/icon-72x72.png',
                    vibrate: [200, 100, 200],
                    requireInteraction: false,
                    tag: `mauli-${messageId}`, // Unique tag for deduplication
                    renotify: true
                },
                fcm_options: {
                    link: stringData.url || stringData.path || '/'
                }
            },
            // Android specific (for future mobile app)
            android: {
                notification: {
                    icon: 'notification_icon',
                    color: '#38a169',
                    clickAction: 'FLUTTER_NOTIFICATION_CLICK'
                },
                priority: 'high'
            },
            tokens: validTokens
        };

        const response = await firebaseAdmin.messaging().sendEachForMulticast(message);

        console.log(`📱 FCM: ${response.successCount} sent, ${response.failureCount} failed`);

        // Collect failed tokens for cleanup
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                console.error(`FCM Error for token ${validTokens[idx]}:`, resp.error?.message);
                // Check if token is invalid or unregistered
                if (resp.error?.code === 'messaging/invalid-registration-token' ||
                    resp.error?.code === 'messaging/registration-token-not-registered') {
                    failedTokens.push(validTokens[idx]);
                }
            }
        });

        return {
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount,
            failedTokens
        };
    } catch (error) {
        console.error('FCM Send Error:', error);
        return { success: false, message: error.message };
    }
};

/**
 * Send notification to a single token (convenience method)
 */
const sendPushToDevice = async (token, title, body, data = {}) => {
    return sendPushNotification([token], title, body, data);
};

/**
 * Verify Firebase ID Token from client
 * Used for phone OTP authentication
 * @param {string} idToken - Firebase ID token from client
 * @returns {Promise<object|null>} - Decoded token with phone number and uid
 */
const verifyIdToken = async (idToken) => {
    const firebaseAdmin = getFirebaseAdmin();

    if (!firebaseAdmin) {
        console.error('Firebase Admin not initialized. Cannot verify ID token.');
        return null;
    }

    try {
        const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
        return {
            uid: decodedToken.uid,
            phone: decodedToken.phone_number,
            email: decodedToken.email || null
        };
    } catch (error) {
        console.error('Firebase ID token verification failed:', error.message);
        return null;
    }
};

module.exports = {
    initializeFirebase,
    getFirebaseAdmin,
    sendPushNotification,
    sendPushToDevice,
    verifyIdToken
};
