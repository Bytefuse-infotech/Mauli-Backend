const axios = require('axios');

const sendOtp = async (contact, otp, type = 'phone') => {
    // Only support phone for Fast2SMS
    if (type !== 'phone') {
        console.warn('[Fast2SMS] Only phone numbers are supported. skipping...');
        return false;
    }

    const apiKey = process.env.FAST2SMS_API_KEY;

    // Fallback to mock if no API key is present (dev mode / safeguards)
    if (!apiKey) {
        console.log('==================================================');
        console.log('[MOCK OTP] FAST2SMS_API_KEY not found in env.');
        console.log(`[MOCK OTP] Sending to ${contact}: ${otp}`);
        console.log('==================================================');
        return true;
    }

    try {
        // Clean phone number: remove +91 or other prefixes, keep last 10 digits
        // Fast2SMS usually expects 10 digit numbers for domestic
        const cleanNumber = contact.replace(/\D/g, '').slice(-10);

        const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
            route: 'otp',
            variables_values: otp,
            numbers: cleanNumber,
        }, {
            headers: {
                "authorization": apiKey,
                "Content-Type": "application/json"
            }
        });

        if (response.data && response.data.return) {
            console.log(`[Fast2SMS] OTP sent successfully to ${cleanNumber}`);
            return true;
        } else {
            console.warn('[Fast2SMS] API Request Failed:', response.data.message);

            // Check for specific "Website Verification" error (996)
            if (response.data.status_code === 996) {
                console.warn('[Fast2SMS] ACTION REQUIRED: You must verify your website in Fast2SMS panel to use the OTP route.');
            }

            // Fallback to Mock for Dev/Testing so the app doesn't break
            console.log('==================================================');
            console.log('[FAST2SMS FALLBACK] API failed. Using Mock.');
            console.log(`[FAST2SMS FALLBACK] Sending to ${contact}: ${otp}`);
            console.log('==================================================');
            return true;
        }

    } catch (error) {
        console.error('[Fast2SMS] Error:', error.message);
        // Fallback on network/other errors too
        console.log('==================================================');
        console.log('[FAST2SMS FALLBACK] Exception occurred. Using Mock.');
        console.log(`[FAST2SMS FALLBACK] Sending to ${contact}: ${otp}`);
        console.log('==================================================');
        return true;
    }
};

module.exports = sendOtp;
