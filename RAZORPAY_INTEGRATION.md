# Razorpay Payment Integration Documentation

This document describes how Razorpay payment gateway is integrated in the Mauli Marketing application.

---

## 📋 Overview

Razorpay has been integrated to enable online payments for orders. When users choose "PAY NOW (ONLINE)" on the checkout page, the Razorpay payment modal opens, allowing secure payment processing.

---

## 🏗️ Architecture

```
┌───────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Frontend        │────▶│   Backend    │────▶│   Razorpay API  │
│   (React + TS)    │     │   (Node.js)  │     │                 │
└───────────────────┘     └──────────────┘     └─────────────────┘
```

### Payment Flow:

1. User clicks "PAY NOW (ONLINE)" on checkout
2. Frontend fetches Razorpay public key from backend
3. Frontend creates order via backend API
4. Backend creates Razorpay order with amount
5. Frontend opens Razorpay checkout modal
6. User completes payment in modal
7. Frontend receives payment response with signature
8. Frontend sends payment details to backend for verification
9. Backend verifies signature using HMAC-SHA256
10. On success, order is created and user is redirected

---

## 📁 File Locations

### Backend Files

| File | Path | Purpose |
|------|------|---------|
| Controller | `src/controllers/razorpayController.js` | Payment logic |
| Routes | `src/routes/razorpayRoutes.js` | API endpoints |
| Index | `src/routes/index.js` | Route registration |

### Frontend Files

| File | Path | Purpose |
|------|------|---------|
| Script Loader | `src/utils/loadRazorpay.ts` | Load Razorpay SDK |
| Service | `src/services/razorpayService.ts` | API calls |
| Hook | `src/hooks/useRazorpay.ts` | Payment processing hook |
| Checkout | `src/pages/Checkout/index.tsx` | Integration point |

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/razorpay/key` | Get Razorpay public key | No |
| POST | `/api/v1/razorpay/order` | Create payment order | Yes |
| POST | `/api/v1/razorpay/verify` | Verify payment signature | Yes |

### Create Order Request

```json
POST /api/v1/razorpay/order
{
    "amount": 500,        // Amount in INR (not paise)
    "currency": "INR",    // Optional, defaults to INR
    "receipt": "rcpt_123", // Optional
    "notes": {            // Optional metadata
        "orderId": "ORDER_123",
        "userId": "user_123"
    }
}
```

### Create Order Response

```json
{
    "success": true,
    "id": "order_MxyzABC123",
    "amount": 50000,       // Amount in paise
    "currency": "INR",
    "receipt": "rcpt_123"
}
```

### Verify Payment Request

```json
POST /api/v1/razorpay/verify
{
    "razorpay_order_id": "order_MxyzABC123",
    "razorpay_payment_id": "pay_XyzABC456",
    "razorpay_signature": "abc123signature..."
}
```

### Verify Payment Response

```json
{
    "success": true,
    "status": "success",
    "message": "Payment verified successfully",
    "paymentDetails": {
        "paymentId": "pay_XyzABC456",
        "orderId": "order_MxyzABC123",
        "amount": 50000,
        "currency": "INR",
        "status": "captured",
        "method": "upi",
        "captured": true
    }
}
```

---

## ⚙️ Configuration

### Backend Environment Variables

Add these to your `.env` file:

```env
# Razorpay Credentials
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET_HERE
```

### Getting Razorpay Credentials

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Sign up or log in
3. Navigate to Settings → API Keys
4. Generate test/live keys

---

## 🧪 Testing

### Test Card Details

| Card Type | Card Number | CVV | Expiry |
|-----------|-------------|-----|--------|
| Success | 4111 1111 1111 1111 | Any 3 digits | Any future date |
| Failure | 4000 0000 0000 0002 | Any 3 digits | Any future date |

### Test UPI

- Use any UPI ID: `success@razorpay` for success
- Use `failure@razorpay` for failure

### Test Flow

1. Add items to cart
2. Go to checkout
3. Select delivery/pickup mode
4. Add/select address
5. Click "PAY NOW (ONLINE)"
6. Complete payment in Razorpay modal
7. Verify order confirmation page

---

## 🔒 Security

### Implemented Measures

1. **Server-side Signature Verification** - Uses HMAC-SHA256
2. **Protected Routes** - Order and verify endpoints require authentication
3. **Key Secret Protection** - Never exposed to frontend
4. **Amount Validation** - Server validates amount before order creation

### Best Practices

- Never expose `RAZORPAY_KEY_SECRET` in frontend
- Always verify payment on backend before order confirmation
- Use HTTPS in production
- Log all payment transactions for audit

---

## 🐛 Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Modal not opening | Razorpay script blocked | Disable ad blockers |
| "SDK failed to load" | Network error | Check internet, retry |
| Verification failed | Wrong secret key | Check RAZORPAY_KEY_SECRET |
| 401 Unauthorized | Token expired | Re-login |

---

## 📚 References

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Node.js SDK](https://github.com/razorpay/razorpay-node)
- [Web Integration Guide](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/)
