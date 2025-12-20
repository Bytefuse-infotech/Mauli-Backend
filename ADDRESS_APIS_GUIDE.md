# ✅ Address APIs - Complete Guide

## Summary

The **Address Management APIs** are **already fully implemented** and have now been added to the main Postman collection!

---

## 📋 Available Endpoints

### 1. **Get All Addresses** ✅
- **Method:** `GET`
- **Endpoint:** `/api/v1/addresses`
- **Auth:** Required
- **Description:** Get all active addresses for the logged-in customer

### 2. **Get Single Address** ✅
- **Method:** `GET`
- **Endpoint:** `/api/v1/addresses/:id`
- **Auth:** Required
- **Description:** Get a specific address by ID

### 3. **Get Default Address** ✅
- **Method:** `GET`
- **Endpoint:** `/api/v1/addresses/default`
- **Auth:** Required
- **Description:** Get the default address for the logged-in customer

### 4. **Create Address** ✅
- **Method:** `POST`
- **Endpoint:** `/api/v1/addresses`
- **Auth:** Required
- **Description:** Create a new address

**Request Body:**
```json
{
  "label": "home",
  "name": "John Doe",
  "phone": "+919876543210",
  "address_line1": "123 Main Street",
  "address_line2": "Apartment 4B",
  "landmark": "Near City Mall",
  "city": "Pune",
  "state": "Maharashtra",
  "postal_code": "411001",
  "country": "India",
  "latitude": 18.5204,
  "longitude": 73.8567,
  "is_default": true
}
```

**Required Fields:**
- `name`
- `phone`
- `address_line1`
- `city`
- `state`
- `postal_code`

**Optional Fields:**
- `label` (home/work/other)
- `address_line2`
- `landmark`
- `country` (default: "India")
- `latitude`
- `longitude`
- `is_default` (default: false)

### 5. **Update Address** ✅
- **Method:** `PUT`
- **Endpoint:** `/api/v1/addresses/:id`
- **Auth:** Required
- **Description:** Update an existing address (all fields optional)

**Request Body Example:**
```json
{
  "label": "work",
  "phone": "+919876543211",
  "landmark": "Near New Mall"
}
```

### 6. **Set Default Address** ✅
- **Method:** `PATCH`
- **Endpoint:** `/api/v1/addresses/:id/set-default`
- **Auth:** Required
- **Description:** Set a specific address as default (auto-unsets previous default)

### 7. **Delete Address (Soft)** ✅
- **Method:** `DELETE`
- **Endpoint:** `/api/v1/addresses/:id`
- **Auth:** Required
- **Description:** Soft delete (marks as inactive, preserves data)

### 8. **Delete Address (Permanent)** ✅
- **Method:** `DELETE`
- **Endpoint:** `/api/v1/addresses/:id/permanent`
- **Auth:** Required
- **Description:** Permanently delete from database (use with caution!)

---

## 🎯 Key Features

### ✅ **Default Address Management**
- Only one address can be default per user
- Setting new default auto-unsets previous default
- Deleting default address auto-unsets the flag

### ✅ **Soft Delete**
- Addresses are soft-deleted by default (marked inactive)
- Soft-deleted addresses not returned in queries
- Permanent delete option available

### ✅ **Location Support**
- Optional latitude/longitude for precise location
- Useful for distance calculations and maps

### ✅ **Address Labels**
- Categorize as 'home', 'work', or 'other'
- Helps organize multiple addresses

### ✅ **Security**
- All endpoints require authentication
- Users can only access their own addresses
- Ownership verification on all operations

---

## 📦 Postman Collection

The Address APIs have been added to the main Postman collection under:

**Location:** `Mauli Marketing API > Addresses (Customer)`

**Includes:**
- ✅ 8 complete endpoints
- ✅ Example request bodies
- ✅ Proper authentication headers
- ✅ Detailed descriptions

---

## 🚀 Quick Start Examples

### Example 1: Create Your First Address
```bash
curl -X POST http://localhost:5009/api/v1/addresses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "home",
    "name": "John Doe",
    "phone": "+919876543210",
    "address_line1": "123 Main Street",
    "city": "Pune",
    "state": "Maharashtra",
    "postal_code": "411001",
    "is_default": true
  }'
```

### Example 2: Get All Your Addresses
```bash
curl -X GET http://localhost:5009/api/v1/addresses \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 3: Update an Address
```bash
curl -X PUT http://localhost:5009/api/v1/addresses/ADDRESS_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543211",
    "landmark": "Near New Mall"
  }'
```

### Example 4: Set as Default
```bash
curl -X PATCH http://localhost:5009/api/v1/addresses/ADDRESS_ID/set-default \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 5: Delete Address
```bash
curl -X DELETE http://localhost:5009/api/v1/addresses/ADDRESS_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📖 Complete Documentation

For detailed API documentation, see:
- **[docs/ADDRESS_API.md](./docs/ADDRESS_API.md)** - Complete API reference with all details

---

## ✅ Implementation Status

| Component | Status |
|-----------|--------|
| **Model** | ✅ Implemented (`src/models/Address.js`) |
| **Controller** | ✅ Implemented (`src/controllers/addressController.js`) |
| **Routes** | ✅ Implemented (`src/routes/addressRoutes.js`) |
| **Documentation** | ✅ Complete (`docs/ADDRESS_API.md`) |
| **Postman Collection** | ✅ Added to main collection |
| **Testing** | ⚠️ Ready for testing |

---

## 🧪 Testing Checklist

Use these steps to test all address functionality:

- [ ] **Create Address** - Add a new address
- [ ] **Get All Addresses** - Verify it appears in the list
- [ ] **Get Single Address** - Retrieve by ID
- [ ] **Update Address** - Modify some fields
- [ ] **Set as Default** - Mark as default address
- [ ] **Get Default Address** - Verify it's returned
- [ ] **Create Second Address** - Add another address
- [ ] **Set Second as Default** - Verify first is no longer default
- [ ] **Delete Address** - Soft delete
- [ ] **Verify Deletion** - Confirm it's not in the list

---

## 🎨 Frontend Integration

When integrating with your frontend:

1. **List Addresses:** Use `GET /addresses` to show all addresses
2. **Add New:** Use `POST /addresses` with a form
3. **Edit:** Use `PUT /addresses/:id` for updates
4. **Set Default:** Use `PATCH /addresses/:id/set-default` with a toggle
5. **Delete:** Use `DELETE /addresses/:id` with confirmation

**Tip:** Always show the default address first in your UI!

---

## 🔐 Authentication

All endpoints require a valid JWT token:

```javascript
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

Get the token from the login response:
```javascript
const { accessToken } = await login(phone, password);
```

---

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Address created successfully",
  "data": {
    "_id": "...",
    "user_id": "...",
    "label": "home",
    "name": "John Doe",
    ...
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Address not found"
}
```

---

## 🎯 Best Practices

1. **Always validate** required fields before sending
2. **Use labels** to help users organize addresses
3. **Set default** for the primary address
4. **Soft delete** by default (preserve data)
5. **Include coordinates** for better location accuracy
6. **Handle errors** gracefully in your UI

---

## 📦 Files Updated

- ✅ `Mauli_Marketing_API.postman_collection.json` - Added Address endpoints
- ✅ `ADDRESS_APIS_GUIDE.md` - This guide

---

## 🎉 Summary

**Status:** ✅ **COMPLETE**

The Address Management APIs are:
- ✅ Fully implemented in the backend
- ✅ Documented in `docs/ADDRESS_API.md`
- ✅ Added to Postman collection
- ✅ Ready for testing and use

**Next Steps:**
1. Import the updated Postman collection
2. Test all 8 endpoints
3. Integrate with your frontend
4. Enjoy seamless address management! 🚀

---

**Last Updated:** December 20, 2025, 4:55 PM IST  
**Version:** 1.0
