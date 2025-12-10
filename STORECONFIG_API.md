# StoreConfig API Documentation

## Overview
Unified Store Configuration API managing delivery settings, discounts, and slot bookings in a single schema.

## Features
- ✅ Single unified schema for all store settings
- ✅ No Redis (direct DB queries)
- ✅ Delivery fee calculation (flat or per-km)
- ✅ Cart discount rules with priority
- ✅ Delivery slot management with capacity
- ✅ Atomic slot reservation

## StoreConfig Schema

```javascript
{
  store_address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postal_code: String,
    country: String (default: 'India'),
    latitude: Number,
    longitude: Number
  },
  
  delivery_fee: {
    type: 'flat' | 'per_km',
    base_fee: Number (min 0),
    rate: Number (per km rate),
    advanced_rules: [{ condition_type, value }]
  },
  
  cart_discounts: [{
    discount_type: 'flat' | 'percentage',
    min_cart_value: Number,
    value: Number,
    max_discount_amount: Number,
    priority: Number
  }],
  
  delivery_slots: [{
    date: Date,
    slots: [{
      start_time: String ('09:00'),
      end_time: String ('11:00'),
      capacity: Number,
      booked: Number
    }]
  }],
  
  is_delivery_enabled: Boolean,
  tenant_id: ObjectId (nullable),
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### 1. Get Store Configuration

```bash
GET /api/v1/storeconfig
Query params: tenant_id (optional)

Response:
{
  "success": true,
  "data": {
    "store_address": { ... },
    "delivery_fee": { ... },
    "cart_discounts": [ ... ],
    "delivery_slots": [ ... ],
    "is_delivery_enabled": true
  }
}
```

### 2. Update Store Configuration (Admin)

```bash
PUT /api/v1/storeconfig
Headers:
  Authorization: Bearer <admin_token>

Body: (all fields optional, upserts if not exists)
{
  "store_address": {
    "line1": "12 MG Road",
    "city": "Pune",
    "state": "Maharashtra",
    "postal_code": "411001",
    "latitude": 18.5204,
    "longitude": 73.8567
  },
  "delivery_fee": {
    "type": "per_km",
    "base_fee": 30,
    "rate": 10
  },
  "cart_discounts": [
    {
      "discount_type": "percentage",
      "min_cart_value": 1000,
      "value": 10,
      "max_discount_amount": 200,
      "priority": 10
    }
  ],
  "delivery_slots": [
    {
      "date": "2025-12-15T00:00:00.000Z",
      "slots": [
        {
          "start_time": "09:00",
          "end_time": "11:00",
          "capacity": 20,
          "booked": 0
        }
      ]
    }
  ]
}
```

### 3. Compute Cart Total

```bash
POST /api/v1/storeconfig/compute

Body:
{
  "cart_value": 1500,
  "distance_km": 5,
  "tenant_id": null
}

Response:
{
  "success": true,
  "data": {
    "cart_value": 1500,
    "delivery_fee": 80,        // 30 + (10 * 5) for per_km
    "discount_amount": 150,     // 10% of 1500
    "final_amount": 1430,       // 1500 - 150 + 80
    "applied_discount_rule": {
      "discount_type": "percentage",
      "value": 10,
      "min_cart_value": 1000
    }
  }
}
```

**Delivery Fee Calculation:**
- `flat`: `fee = base_fee`
- `per_km`: `fee = base_fee + (rate × distance_km)`

**Discount Selection:**
1. Filter discounts where `cart_value >= min_cart_value`
2. Sort by `priority` (higher first)
3. If priority same, sort by `value` (higher first)
4. Apply first discount
5. Cap at `max_discount_amount` if set

### 4. Reserve Delivery Slot

```bash
POST /api/v1/storeconfig/reserve-slot

Body:
{
  "date": "2025-12-15T00:00:00.000Z",
  "start_time": "09:00",
  "tenant_id": null
}

Response (Success):
{
  "success": true,
  "message": "Slot reserved successfully",
  "data": { ... updated config ... }
}

Response (Capacity Exceeded):
{
  "success": false,
  "message": "Slot not available or capacity exceeded"
}
```

**Slot Reservation Logic:**
- Finds matching date and time slot
- Checks if `booked < capacity`
- Atomically increments `booked` count
- Returns error if capacity exceeded

## Seeding Store Config

```bash
node src/scripts/seedStoreConfig.js
```

Creates default config with:
- Store address in Pune
- Flat delivery fee of ₹50
- 2 discount rules
- Delivery slots for 2 days

## Testing

```bash
npm test tests/storeconfig.test.js
```

All 7 tests should pass:
- ✅ Get or create default config
- ✅ Update config (admin)
- ✅ Compute with flat delivery fee
- ✅ Compute with per_km delivery fee
- ✅ Apply discount by priority
- ✅ Reserve delivery slot
- ✅ Prevent booking when capacity exceeded

## Example Use Cases

### 1. Set Flat Delivery Fee
```javascript
PUT /api/v1/storeconfig
{
  "delivery_fee": {
    "type": "flat",
    "base_fee": 50
  }
}
```

### 2. Set Distance-Based Delivery
```javascript
PUT /api/v1/storeconfig
{
  "delivery_fee": {
    "type": "per_km",
    "base_fee": 30,
    "rate": 10  // ₹10 per km
  }
}
```

### 3. Add Tiered Discounts
```javascript
PUT /api/v1/storeconfig
{
  "cart_discounts": [
    {
      "discount_type": "flat",
      "min_cart_value": 500,
      "value": 50,
      "priority": 5
    },
    {
      "discount_type": "percentage",
      "min_cart_value": 1000,
      "value": 10,
      "max_discount_amount": 200,
      "priority": 10
    }
  ]
}
```
Cart of ₹1200 will get 10% discount (priority 10 > 5).

### 4. Add Delivery Slots
```javascript
PUT /api/v1/storeconfig
{
  "delivery_slots": [
    {
      "date": "2025-12-20T00:00:00.000Z",
      "slots": [
        { "start_time": "09:00", "end_time": "11:00", "capacity": 20, "booked": 0 },
        { "start_time": "14:00", "end_time": "16:00", "capacity": 15, "booked": 0 }
      ]
    }
  ]
}
```

## Notes

- **Single Source of Truth**: All store settings in one document
- **Auto-Creation**: Config auto-created on first GET if not exists
- **Upsert**: PUT creates or updates config
- **UTC Dates**: All dates normalized to UTC midnight
- **Atomic Reservations**: Slot bookings are atomic to prevent overbooking
- **No Redis**: Direct MongoDB queries for simplicity

## Error Responses

```javascript
// Validation Error
{
  "success": false,
  "message": "Date and start_time are required"
}

// Slot Full
{
  "success": false,
  "message": "Slot not available or capacity exceeded"
}

// Not Found
{
  "success": false,
  "message": "Store config not found"
}
```
