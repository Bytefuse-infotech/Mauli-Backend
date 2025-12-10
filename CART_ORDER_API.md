# Cart & Order APIs Documentation

## Overview
Complete e-commerce cart and order management system with delivery slot integration.

## Features
- ✅ Shopping cart with product validation
- ✅ Order placement with delivery slot reservation
- ✅ Automatic discount and delivery fee calculation
- ✅ Order tracking and cancellation
- ✅ Admin order management
- ✅ No Redis (direct DB queries)

---

## Cart API

### Cart Schema
```javascript
{
  user_id: ObjectId (unique),
  items: [{
    product_id: ObjectId (ref: Product),
    quantity: Number (min 1),
    unit: 'box' | 'dozen',
    price_at_add: Number,
    discount_at_add: Number
  }],
  tenant_id: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### 1. Get Cart
```bash
GET /api/v1/cart
Headers:
  Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "cart": {
      "_id": "...",
      "user_id": "...",
      "items": [
        {
          "product_id": {
            "_id": "...",
            "name": "Asian Paints - 1L",
            "price": 599,
            "discount": 50,
            "images": [...]
          },
          "quantity": 2,
          "unit": "box",
          "price_at_add": 599,
          "discount_at_add": 50
        }
      ]
    },
    "subtotal": 1098,
    "item_count": 2
  }
}
```

### 2. Add to Cart
```bash
POST /api/v1/cart/items
Headers:
  Authorization: Bearer <token>

Body:
{
  "product_id": "64fa1b...",
  "quantity": 2,
  "unit": "box"
}

Response:
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "cart": {...},
    "subtotal": 1098,
    "item_count": 2
  }
}
```

**Validation:**
- Product must exist and be active
- Unit must be valid for product
- If item exists, quantity is incremented

### 3. Update Cart Item
```bash
PUT /api/v1/cart/items/:product_id?unit=box
Headers:
  Authorization: Bearer <token>

Body:
{
  "quantity": 3,
  "unit": "box"
}
```

### 4. Remove from Cart
```bash
DELETE /api/v1/cart/items/:product_id?unit=box
Headers:
  Authorization: Bearer <token>
```

### 5. Clear Cart
```bash
DELETE /api/v1/cart
Headers:
  Authorization: Bearer <token>
```

---

## Order API

### Order Schema
```javascript
{
  order_number: String (auto-generated, unique),
  user_id: ObjectId (ref: User),
  items: [{
    product_id: ObjectId,
    product_name: String,
    quantity: Number,
    unit: 'box' | 'dozen',
    price: Number,
    discount: Number,
    total: Number
  }],
  subtotal: Number,
  delivery_fee: Number,
  discount_amount: Number,
  total_amount: Number,
  delivery_address: {
    line1, line2, city, state, postal_code,
    latitude, longitude
  },
  delivery_slot: {
    date: Date,
    start_time: String,
    end_time: String
  },
  status: 'pending' | 'confirmed' | 'processing' | 
          'out_for_delivery' | 'delivered' | 'cancelled',
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded',
  payment_method: 'cod' | 'online' | 'upi',
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 1. Create Order
```bash
POST /api/v1/orders
Headers:
  Authorization: Bearer <token>

Body:
{
  "delivery_address": {
    "line1": "123 Main St",
    "line2": "Apt 4B",
    "city": "Pune",
    "state": "Maharashtra",
    "postal_code": "411001",
    "latitude": 18.5204,
    "longitude": 73.8567
  },
  "delivery_slot": {
    "date": "2025-12-15T00:00:00.000Z",
    "start_time": "09:00"
  },
  "payment_method": "cod",
  "notes": "Please call before delivery",
  "distance_km": 5
}

Response:
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "order_number": "ORD1733824567123",
    "user_id": "...",
    "items": [...],
    "subtotal": 1098,
    "delivery_fee": 80,
    "discount_amount": 100,
    "total_amount": 1078,
    "delivery_address": {...},
    "delivery_slot": {...},
    "status": "pending",
    "payment_status": "pending",
    "payment_method": "cod"
  }
}
```

**Order Placement Flow:**
1. Validates cart is not empty
2. Verifies all products are still active
3. Calculates subtotal from cart items
4. Fetches store config
5. Calculates delivery fee (flat or per-km)
6. Applies best discount rule
7. Validates and reserves delivery slot
8. Creates order
9. Clears cart

### 2. Get User's Orders
```bash
GET /api/v1/orders?page=1&page_size=10&status=pending
Headers:
  Authorization: Bearer <token>

Response:
{
  "success": true,
  "page": 1,
  "page_size": 10,
  "total": 25,
  "total_pages": 3,
  "data": [...]
}
```

### 3. Get Single Order
```bash
GET /api/v1/orders/:id
Headers:
  Authorization: Bearer <token>
```

### 4. Cancel Order
```bash
PATCH /api/v1/orders/:id/cancel
Headers:
  Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {...}
}
```

**Cancellation Rules:**
- Only `pending` or `confirmed` orders can be cancelled
- Delivery slot is released (booked count decremented)

---

## Admin Order Management

### 1. Get All Orders
```bash
GET /api/v1/admin/orders?page=1&status=pending&payment_status=paid
Headers:
  Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "page": 1,
  "page_size": 20,
  "total": 150,
  "total_pages": 8,
  "data": [
    {
      "order_number": "ORD...",
      "user_id": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "9876543210"
      },
      "total_amount": 1078,
      "status": "pending",
      ...
    }
  ]
}
```

### 2. Update Order Status
```bash
PATCH /api/v1/admin/orders/:id/status
Headers:
  Authorization: Bearer <admin_token>

Body:
{
  "status": "confirmed"
}

Allowed statuses:
- pending
- confirmed
- processing
- out_for_delivery
- delivered
- cancelled
```

---

## Example Workflows

### Complete Purchase Flow

**1. Add items to cart**
```bash
POST /api/v1/cart/items
{
  "product_id": "prod1",
  "quantity": 2,
  "unit": "box"
}

POST /api/v1/cart/items
{
  "product_id": "prod2",
  "quantity": 1,
  "unit": "dozen"
}
```

**2. View cart**
```bash
GET /api/v1/cart
# Returns: subtotal: 1500, item_count: 3
```

**3. Get delivery calculation**
```bash
POST /api/v1/storeconfig/compute
{
  "cart_value": 1500,
  "distance_km": 5
}
# Returns: delivery_fee: 80, discount: 150, final: 1430
```

**4. Place order**
```bash
POST /api/v1/orders
{
  "delivery_address": {...},
  "delivery_slot": {
    "date": "2025-12-15",
    "start_time": "09:00"
  },
  "distance_km": 5
}
# Cart is cleared, slot is reserved
```

**5. Track order**
```bash
GET /api/v1/orders/:id
# Check status updates
```

---

## Error Responses

```javascript
// Empty Cart
{
  "success": false,
  "message": "Cart is empty"
}

// Product Inactive
{
  "success": false,
  "message": "Some products in cart are no longer available"
}

// Slot Full
{
  "success": false,
  "message": "Selected time slot is full"
}

// Invalid Cancellation
{
  "success": false,
  "message": "Order cannot be cancelled at this stage"
}
```

---

## Order Number Format
`ORD{timestamp}{random3digits}`

Example: `ORD1733824567123`

---

## Notes

- **Cart Persistence**: Cart is user-specific and persists across sessions
- **Price Locking**: Prices are locked at time of adding to cart
- **Slot Reservation**: Atomic operation to prevent overbooking
- **Auto-Clear**: Cart is cleared after successful order placement
- **Slot Release**: Cancelled orders release their delivery slot
- **Admin Access**: Admins can view all orders and update statuses
- **Pagination**: All list endpoints support pagination

---

## Testing

Create test orders:
```bash
# 1. Login as user
# 2. Add products to cart
# 3. Place order with valid delivery slot
# 4. Verify cart is cleared
# 5. Verify slot is reserved
# 6. Cancel order
# 7. Verify slot is released
```
