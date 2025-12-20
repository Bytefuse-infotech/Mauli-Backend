# Postman Collection Update - Cart & Order APIs

## Changes Made (December 20, 2025)

### Updated: Create Order Endpoint

**Endpoint:** `POST /api/v1/orders`

#### What Changed:
- **`delivery_slot` is now OPTIONAL** - Orders can be created without specifying a delivery slot
- Added `distance_km` parameter for delivery fee calculation
- Simplified the request body

#### Request Body (Without Delivery Slot):
```json
{
  "delivery_address": {
    "line1": "123 Main Street",
    "line2": "Apartment 4B",
    "city": "Pune",
    "state": "Maharashtra",
    "postal_code": "411001",
    "latitude": 18.5204,
    "longitude": 73.8567
  },
  "payment_method": "cod",
  "notes": "Please call before delivery",
  "distance_km": 5
}
```

#### Request Body (With Delivery Slot - Optional):
```json
{
  "delivery_address": {
    "line1": "123 Main Street",
    "line2": "Apartment 4B",
    "city": "Pune",
    "state": "Maharashtra",
    "postal_code": "411001",
    "latitude": 18.5204,
    "longitude": 73.8567
  },
  "delivery_slot": {
    "date": "2025-12-25T00:00:00.000Z",
    "start_time": "09:00"
  },
  "payment_method": "cod",
  "notes": "Please call before delivery",
  "distance_km": 5
}
```

### Key Points:

1. **delivery_slot** - Optional object
   - If provided, the system will validate and reserve the delivery slot
   - If not provided, order will be created without slot reservation
   - Only `date` and `start_time` are required when providing delivery_slot
   - `end_time` is automatically assigned by the system

2. **delivery_address** - Required object
   - Must include: line1, city, state, postal_code
   - Optional: line2, latitude, longitude

3. **payment_method** - Optional string (default: "cod")
   - Allowed values: "cod", "online", "upi"

4. **notes** - Optional string
   - Customer notes for the order

5. **distance_km** - Optional number (default: 0)
   - Used for delivery fee calculation
   - If delivery fee type is "per_km", this value is used

### Response:
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "order_number": "ORD1766228227737829",
    "user_id": "...",
    "items": [...],
    "subtotal": 12392,
    "delivery_fee": 50,
    "discount_amount": 500,
    "total_amount": 11942,
    "delivery_address": {...},
    "delivery_slot": {...},  // Only if provided in request
    "status": "pending",
    "payment_status": "pending",
    "payment_method": "cod",
    "notes": "...",
    "_id": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## How to Update Your Postman Collection

### Option 1: Manual Update
1. Open Postman
2. Find the "Create Order" request under "Orders" folder
3. Update the request body to remove `delivery_slot` or make it optional
4. Add `distance_km` parameter
5. Save the changes

### Option 2: Import Updated Collection
1. Download the latest collection from the repository
2. In Postman, click "Import"
3. Select the updated collection file
4. Choose "Replace" when prompted

---

## Testing the Changes

### Test 1: Create Order Without Delivery Slot
```bash
curl -X POST http://localhost:5009/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "delivery_address": {
      "line1": "123 Test Street",
      "city": "Pune",
      "state": "Maharashtra",
      "postal_code": "411001"
    },
    "payment_method": "cod",
    "distance_km": 5
  }'
```

### Test 2: Create Order With Delivery Slot
```bash
curl -X POST http://localhost:5009/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "delivery_address": {
      "line1": "123 Test Street",
      "city": "Pune",
      "state": "Maharashtra",
      "postal_code": "411001"
    },
    "delivery_slot": {
      "date": "2025-12-25T00:00:00.000Z",
      "start_time": "09:00"
    },
    "payment_method": "cod",
    "distance_km": 5
  }'
```

---

## Migration Guide

If you have existing code that creates orders, you can now simplify it:

### Before (Required delivery_slot):
```javascript
const orderData = {
  delivery_address: {...},
  delivery_slot: {
    date: "2025-12-25",
    start_time: "09:00",
    end_time: "11:00"  // This was required
  },
  payment_method: "cod"
};
```

### After (Optional delivery_slot):
```javascript
// Without delivery slot
const orderData = {
  delivery_address: {...},
  payment_method: "cod",
  distance_km: 5
};

// Or with delivery slot (end_time auto-assigned)
const orderData = {
  delivery_address: {...},
  delivery_slot: {
    date: "2025-12-25T00:00:00.000Z",
    start_time: "09:00"  // end_time is auto-assigned
  },
  payment_method: "cod",
  distance_km: 5
};
```

---

## Additional Notes

- The backend automatically generates order numbers in format: `ORD{timestamp}{random3digits}`
- Cart is automatically cleared after successful order creation
- If delivery_slot is provided, the system validates slot availability
- Delivery fee is calculated based on store configuration and distance_km
- Discounts are automatically applied based on cart value

---

## Related Documentation

- [Cart & Order API Documentation](./CART_ORDER_API.md)
- [Test Results](./TEST_RESULTS_FINAL.md)
- [Store Configuration API](./STORECONFIG_API.md)

---

**Last Updated:** December 20, 2025  
**Version:** 2.0  
**Breaking Changes:** None (backward compatible - delivery_slot is optional)
