const Razorpay = require('razorpay');
const crypto = require('crypto');
const { createNotification } = require('./notificationController');

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * @desc    Create Razorpay order
 * @route   POST /api/v1/razorpay/order
 * @access  Private (requires authentication)
 */
const createOrder = async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt, notes } = req.body;

        // Validate amount
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount provided',
            });
        }

        const options = {
            amount: Math.round(Number(amount) * 100), // Convert to paise (multiply by 100)
            currency,
            receipt: receipt || `rcpt_${Date.now()}`,
            notes: notes || {},
        };

        const order = await razorpayInstance.orders.create(options);

        res.status(200).json({
            success: true,
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
        });
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Unable to create order',
            error: error.message,
        });
    }
};

/**
 * @desc    Verify Razorpay payment signature
 * @route   POST /api/v1/razorpay/verify
 * @access  Private (requires authentication)
 */
const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                status: 'failure',
                message: 'Missing required payment verification fields',
            });
        }

        // Create HMAC signature for validation
        const body = razorpay_order_id + '|' + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            return res.status(400).json({
                success: false,
                status: 'failure',
                message: 'Payment verification failed - Invalid signature',
            });
        }

        // Fetch payment details from Razorpay to confirm status
        try {
            const payment = await razorpayInstance.payments.fetch(razorpay_payment_id);

            // Create notification for payment success
            await createNotification(
                req.user._id,
                'Payment Successful',
                `Payment of ₹${payment.amount / 100} was successful for your order.`,
                'payment',
                {
                    paymentId: payment.id,
                    orderId: payment.order_id
                }
            );

            return res.status(200).json({
                success: true,
                status: 'success',
                message: 'Payment verified successfully',
                paymentDetails: {
                    paymentId: payment.id,
                    orderId: payment.order_id,
                    amount: payment.amount,
                    currency: payment.currency,
                    status: payment.status,
                    method: payment.method,
                    captured: payment.captured,
                },
            });
        } catch (fetchError) {
            console.error('Error fetching payment details:', fetchError);

            // Still create notification even if fetch details failed partially, since signature matched
            await createNotification(
                req.user._id,
                'Payment Verified',
                `Payment verification successful.`,
                'payment',
                {
                    paymentId: razorpay_payment_id
                }
            );

            // Even if fetch fails, signature was valid
            return res.status(200).json({
                success: true,
                status: 'success',
                message: 'Payment verified successfully',
                paymentDetails: {
                    paymentId: razorpay_payment_id,
                    orderId: razorpay_order_id,
                },
            });
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({
            success: false,
            status: 'failure',
            message: 'Payment verification failed',
            error: error.message,
        });
    }
};

/**
 * @desc    Get Razorpay key (public key only)
 * @route   GET /api/v1/razorpay/key
 * @access  Public
 */
const getKey = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            key: process.env.RAZORPAY_KEY_ID,
        });
    } catch (error) {
        console.error('Error fetching Razorpay key:', error);
        res.status(500).json({
            success: false,
            message: 'Unable to fetch payment key',
        });
    }
};

module.exports = {
    createOrder,
    verifyPayment,
    getKey,
};
