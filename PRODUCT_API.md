# Product API Documentation

## Overview
Complete Product management system with CRUD operations, category integration, and Joi validation.

## Features
- ✅ No Redis caching (direct DB queries)
- ✅ Joi validation for all inputs
- ✅ Category integration
- ✅ Image management with ordering
- ✅ Soft delete functionality
- ✅ Text search capability
- ✅ Pagination support
- ✅ Unit types: box, dozen, both

## Product Schema

```javascript
{
  name: String (required, max 256 chars),
  price: Number (required, min 0),
  discount: Number (default 0, min 0),
  unit: Enum ['box', 'dozen', 'both'] (required),
  description: String (max 2000 chars),
  images: [{
    url: String (required),
    order_index: Number (default 0)
  }],
  is_active: Boolean (default true),
  category_id: ObjectId (ref: Category),
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Public Endpoints

#### Get All Products
```bash
GET /api/v1/products
Query params:
  - page: number (default 1)
  - page_size: number (default 20, max 100)
  - unit: 'box' | 'dozen' | 'both'
  - is_active: 'true' | 'false' (default true)
  - category_id: ObjectId
  - q: search text

Response:
{
  "success": true,
  "page": 1,
  "page_size": 20,
  "total": 5,
  "total_pages": 1,
  "products": [...]
}
```

#### Get Single Product
```bash
GET /api/v1/products/:id

Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Asian Paints Royale - 1L",
    "price": 599,
    "discount": 50,
    "unit": "box",
    "description": "Premium interior emulsion paint",
    "category_id": {
      "name": "Paints",
      "slug": "paints"
    },
    "images": [...],
    "is_active": true
  }
}
```

#### Get Products by Category
```bash
GET /api/v1/products/category/:categoryId
Query params: page, page_size
```

### Admin Endpoints (Requires Authentication)

#### Create Product
```bash
POST /api/v1/admin/products
Headers:
  Authorization: Bearer <admin_token>

Body:
{
  "name": "Paint A - 1L",
  "price": 599,
  "discount": 50,
  "unit": "box",
  "description": "Interior paint",
  "category_id": "64fa1b...",
  "images": [
    {
      "url": "https://cdn.example.com/p1.jpg",
      "order_index": 0
    }
  ]
}

Response:
{
  "success": true,
  "data": { ... }
}
```

#### Update Product
```bash
PUT /api/v1/admin/products/:id
Headers:
  Authorization: Bearer <admin_token>

Body: (all fields optional)
{
  "price": 650,
  "discount": 25,
  "is_active": false
}
```

#### Delete Product (Soft Delete)
```bash
DELETE /api/v1/admin/products/:id
Headers:
  Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "message": "Product deactivated",
  "data": { ... }
}
```

## Seeding Products

```bash
node src/scripts/seedProducts.js
```

This will create 5 sample products linked to existing categories.

## Testing

```bash
npm test tests/product.test.js
```

All 6 tests should pass:
- ✅ Create product (admin)
- ✅ Get all products (public)
- ✅ Get single product by id
- ✅ Update product (admin)
- ✅ Filter products by category
- ✅ Soft delete product (admin)

## Validation Rules

- **name**: 1-256 characters, required
- **price**: >= 0, required
- **discount**: >= 0, optional
- **unit**: must be 'box', 'dozen', or 'both'
- **description**: max 2000 characters
- **images**: array of objects with valid URLs
- **category_id**: valid MongoDB ObjectId or null

## Error Responses

```javascript
// Validation Error
{
  "success": false,
  "message": "Validation error",
  "errors": ["Price must be greater than or equal to 0"]
}

// Not Found
{
  "success": false,
  "message": "Product not found"
}

// Server Error
{
  "success": false,
  "message": "Server error"
}
```

## Notes

- All prices are in base currency units (e.g., paise/cents)
- Images are sorted by `order_index` for display
- Soft delete sets `is_active: false` instead of removing from DB
- Text search uses MongoDB text index on name and description
- Category population happens automatically on GET requests
