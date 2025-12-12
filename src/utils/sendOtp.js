const sendOtp = async (contact, otp, type = 'email') => {
    // In a real application, you would use a service like Nodemailer, Twilio, AWS SES/SNS, etc.
    // For this boilerplate, we'll confirm via console logs.

    console.log('==================================================');
    console.log(`[MOCK OTP SERVICE] Sending OTP to ${type}: ${contact}`);
    console.log(`OTP CODE: ${otp}`);
    console.log('==================================================');

    return true;
};

module.exports = sendOtp;
