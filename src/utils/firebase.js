/**
 * Firebase Admin SDK Initialization
 * Used for sending push notifications via Firebase Cloud Messaging (FCM)
 */
const admin = require('firebase-admin');

let firebaseApp = null;

/**
 * Parse service account from environment variable
 * Supports:
 * - Base64 encoded JSON (recommended - set FIREBASE_SERVICE_ACCOUNT_BASE64)
 * - Raw JSON with quotes
 */
const parseServiceAccount = () => {
    // Option 1: Base64 encoded (RECOMMENDED - avoids all escaping issues)
    const base64Input = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (base64Input && base64Input.trim()) {
        try {
            const jsonString = Buffer.from(base64Input.trim(), 'base64').toString('utf8');
            console.log('🔍 Parsing Base64 encoded service account...');
            return JSON.parse(jsonString);
        } catch (e) {
            console.error('❌ Failed to parse Base64 service account:', e.message);
        }
    }

    // Option 2: Raw JSON (FIREBASE_SERVICE_ACCOUNT_JSON)
    const jsonInput = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!jsonInput || jsonInput.trim() === '') {
        return null;
    }

    let jsonString = jsonInput.trim();

    console.log('🔍 DEBUG - JSON length:', jsonString.length);

    // Remove surrounding quotes if present
    if (jsonString.startsWith('"') && jsonString.endsWith('"')) {
        jsonString = jsonString.slice(1, -1);
        jsonString = jsonString.replace(/\\"/g, '"');
    } else if (jsonString.startsWith("'") && jsonString.endsWith("'")) {
        jsonString = jsonString.slice(1, -1);
    }

    // Replace literal \n with actual newlines
    jsonString = jsonString.replace(/\\n/g, '\n');

    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.log('🔍 DEBUG - Parse error:', e.message);
        throw new Error(`Invalid JSON format: ${e.message}`);
    }
};

/**
 * Initialize Firebase Admin SDK
 * Uses service account credentials from environment variable
 */
const initializeFirebase = () => {
    try {
        // Skip if already initialized
        if (firebaseApp || admin.apps.length > 0) {
            return admin;
        }

        // Parse service account (checks FIREBASE_SERVICE_ACCOUNT_BASE64 first, then FIREBASE_SERVICE_ACCOUNT_JSON)
        const serviceAccount = parseServiceAccount();

        if (!serviceAccount) {
            console.warn('⚠️  Firebase service account not configured. FCM push notifications will be disabled.');
            console.warn('   Set FIREBASE_SERVICE_ACCOUNT_BASE64 (recommended) or FIREBASE_SERVICE_ACCOUNT_JSON');
            return null;
        }

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
        console.error('   Hint: Ensure FIREBASE_SERVICE_ACCOUNT_JSON contains valid JSON (no quotes around the value)');
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
        const message = {
            notification: {
                title,
                body
            },
            data: stringData,
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

module.exports = {
    initializeFirebase,
    getFirebaseAdmin,
    sendPushNotification,
    sendPushToDevice
};
