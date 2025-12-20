# 🔧 Fix: "Selected delivery date not available" Error

## Problem
You're getting this error because:
1. ✅ **FIXED:** Delivery slots are now configured in the database
2. ⚠️ **Issue:** Your date format needs to be ISO 8601 format

## Solution

### ✅ **Option 1: Create Order WITHOUT Delivery Slot (Recommended)**

This is the simplest approach - just don't include `delivery_slot`:

```json
POST {{base_url}}/orders

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

**Result:** Order will be created immediately without slot validation ✅

---

### ✅ **Option 2: Create Order WITH Delivery Slot (Fixed Format)**

If you want to use delivery slots, use the **correct date format**:

```json
POST {{base_url}}/orders

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

**Key Changes:**
- ❌ **Wrong:** `"date": "2025-12-25"`
- ✅ **Correct:** `"date": "2025-12-25T00:00:00.000Z"`
- ❌ **Don't include:** `end_time` (it's auto-assigned)
- ✅ **Include:** `start_time` only

---

## Available Delivery Slots

I've configured delivery slots for the next 30 days with the following time slots:

| Time Slot | Capacity |
|-----------|----------|
| 09:00 - 11:00 | 10 orders |
| 11:00 - 13:00 | 10 orders |
| 14:00 - 16:00 | 10 orders |
| 16:00 - 18:00 | 10 orders |

**Date Range:** December 20, 2025 to January 18, 2026

---

## Quick Test Examples

### Test 1: Order Without Slot (Works Immediately)
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

### Test 2: Order With Slot (Today's Date)
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
      "date": "2025-12-20T00:00:00.000Z",
      "start_time": "09:00"
    },
    "payment_method": "cod",
    "distance_km": 5
  }'
```

### Test 3: Order With Slot (Christmas Day)
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

## Common Mistakes to Avoid

| ❌ Wrong | ✅ Correct |
|---------|-----------|
| `"date": "2025-12-25"` | `"date": "2025-12-25T00:00:00.000Z"` |
| Including `end_time` | Only include `start_time` |
| Using unavailable dates | Use dates within next 30 days |
| Wrong time format | Use "09:00", "11:00", "14:00", or "16:00" |

---

## Summary

**Your Original Request Had 2 Issues:**

1. ❌ Date format: `"2025-12-25"` → ✅ Should be: `"2025-12-25T00:00:00.000Z"`
2. ❌ Including `end_time` → ✅ Remove it (auto-assigned)

**Best Practice:**
- For most cases, **don't include delivery_slot** - it's optional!
- Only include it if you specifically need slot reservation
- Use ISO 8601 date format when including delivery_slot

---

## Files Created

- ✅ `setup-delivery-slots.js` - Script to configure delivery slots
- ✅ This guide - How to fix the error

**Status:** ✅ Delivery slots are now configured for the next 30 days!
