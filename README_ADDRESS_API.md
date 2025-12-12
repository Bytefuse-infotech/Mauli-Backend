# Customer Address Management API

## Overview
A complete RESTful API for customer address management with full CRUD operations, default address handling, and location support.

## Features ✨

- ✅ **Complete CRUD Operations** - Create, Read, Update, Delete addresses
- ✅ **Default Address Management** - Automatic handling of default addresses
- ✅ **Soft Delete** - Addresses are marked inactive instead of permanently deleted
- ✅ **Location Support** - Optional latitude/longitude for precise location
- ✅ **Address Labels** - Categorize as 'home', 'work', or 'other'
- ✅ **User Isolation** - Users can only access their own addresses
- ✅ **JWT Authentication** - Secure access with token-based authentication

## Files Created

### 1. Model
- **`src/models/Address.js`** - Mongoose schema with validation and helper methods

### 2. Controller
- **`src/controllers/addressController.js`** - Business logic for all address operations

### 3. Routes
- **`src/routes/addressRoutes.js`** - RESTful API endpoints

### 4. Documentation
- **`docs/ADDRESS_API.md`** - Complete API documentation with examples
- **`README_ADDRESS_API.md`** - This file

### 5. Testing Tools
- **`test-address-api.sh`** - Bash script for testing endpoints
- **`postman/Address_API.postman_collection.json`** - Postman collection

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/addresses` | Get all addresses |
| GET | `/api/v1/addresses/:id` | Get single address |
| GET | `/api/v1/addresses/default` | Get default address |
| POST | `/api/v1/addresses` | Create new address |
| PUT | `/api/v1/addresses/:id` | Update address |
| PATCH | `/api/v1/addresses/:id/set-default` | Set as default |
| DELETE | `/api/v1/addresses/:id` | Soft delete address |
| DELETE | `/api/v1/addresses/:id/permanent` | Permanent delete |

## Quick Start

### 1. Installation
The address API is already integrated into your existing backend. No additional installation required.

### 2. Authentication
All endpoints require a valid JWT token:
```bash
Authorization: Bearer <your_jwt_token>
```

### 3. Create Your First Address
```bash
curl -X POST http://localhost:5000/api/v1/addresses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "+919876543210",
    "address_line1": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal_code": "400001",
    "is_default": true
  }'
```

### 4. Get All Addresses
```bash
curl -X GET http://localhost:5000/api/v1/addresses \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Testing

### Option 1: Using Bash Script
```bash
# Make script executable (already done)
chmod +x test-address-api.sh

# Edit the script and replace YOUR_JWT_TOKEN_HERE with your actual token
nano test-address-api.sh

# Run the tests
./test-address-api.sh
```

### Option 2: Using Postman
1. Import the collection: `postman/Address_API.postman_collection.json`
2. Set the `jwt_token` variable with your actual token
3. Run the requests in order

### Option 3: Using cURL
See the detailed examples in `docs/ADDRESS_API.md`

## Address Schema

```javascript
{
  user_id: ObjectId,           // Auto-set from authenticated user
  label: String,               // 'home', 'work', or 'other'
  name: String,                // Contact name (required)
  phone: String,               // Phone number (required)
  address_line1: String,       // Address line 1 (required)
  address_line2: String,       // Address line 2 (optional)
  landmark: String,            // Landmark (optional)
  city: String,                // City (required)
  state: String,               // State (required)
  postal_code: String,         // Postal code (required)
  country: String,             // Country (default: 'India')
  latitude: Number,            // Latitude (optional)
  longitude: Number,           // Longitude (optional)
  is_default: Boolean,         // Default address flag
  is_active: Boolean,          // Active status (for soft delete)
  createdAt: Date,             // Auto-generated
  updatedAt: Date              // Auto-generated
}
```

## Default Address Logic

- Only **one address** can be set as default per user
- When setting a new default, the previous default is **automatically unset**
- Deleting a default address **removes the default flag**
- Use `GET /addresses/default` to quickly fetch the default address

## Security Features

1. **Authentication Required** - All endpoints require valid JWT token
2. **User Isolation** - Users can only access their own addresses
3. **Ownership Verification** - Every operation verifies address ownership
4. **Soft Delete** - Default deletion preserves data for audit trails

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found
- `500` - Internal Server Error

## Integration with Orders

The address API is designed to work seamlessly with your order system:

1. **Checkout Flow**: Fetch user addresses during checkout
2. **Default Selection**: Pre-select default address
3. **Quick Add**: Allow users to add new addresses during checkout
4. **Order Association**: Link selected address to order

Example integration:
```javascript
// Get default address for checkout
const defaultAddress = await fetch('/api/v1/addresses/default', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Use in order creation
const order = {
  shipping_address: defaultAddress.data._id,
  // ... other order fields
};
```

## Best Practices

1. **Always validate addresses** before using in orders
2. **Use soft delete** to maintain order history
3. **Set latitude/longitude** for delivery distance calculations
4. **Encourage default address** for faster checkout
5. **Limit addresses per user** (optional - can add validation)

## Future Enhancements

Potential improvements you might consider:

- [ ] Address validation using Google Maps API
- [ ] Auto-fill using postal code
- [ ] Address verification before order placement
- [ ] Delivery zone validation
- [ ] Address sharing between family members
- [ ] Address templates for quick creation

## Support

For detailed API documentation, see: `docs/ADDRESS_API.md`

For issues or questions, please contact the development team.

---

**Created:** December 2024  
**Version:** 1.0.0  
**Status:** Production Ready ✅
