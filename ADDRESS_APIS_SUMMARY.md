# ✅ Address APIs - Added to Postman Collection

## Summary

**Good News!** The Address Management APIs were **already fully implemented** in your backend. I've now added all 8 endpoints to your main Postman collection.

---

## 📋 What Was Added

### **New Folder in Postman:** `Addresses (Customer)`

Located after the "Cart" section, includes:

1. ✅ **Get All Addresses** - `GET /api/v1/addresses`
2. ✅ **Get Single Address** - `GET /api/v1/addresses/:id`
3. ✅ **Get Default Address** - `GET /api/v1/addresses/default`
4. ✅ **Create Address** - `POST /api/v1/addresses`
5. ✅ **Update Address** - `PUT /api/v1/addresses/:id`
6. ✅ **Set Default Address** - `PATCH /api/v1/addresses/:id/set-default`
7. ✅ **Delete Address (Soft)** - `DELETE /api/v1/addresses/:id`
8. ✅ **Delete Address (Permanent)** - `DELETE /api/v1/addresses/:id/permanent`

---

## 🎯 Quick Reference

### Create Address (Example)
```json
POST /api/v1/addresses

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
- `name`, `phone`, `address_line1`, `city`, `state`, `postal_code`

**Optional Fields:**
- `label` (home/work/other), `address_line2`, `landmark`, `country`, `latitude`, `longitude`, `is_default`

---

### Update Address (Example)
```json
PUT /api/v1/addresses/:id

{
  "label": "work",
  "phone": "+919876543211",
  "landmark": "Near New Mall"
}
```

All fields are optional when updating.

---

### Get All Addresses
```
GET /api/v1/addresses
```

Returns all active addresses for the logged-in user.

---

### Delete Address
```
DELETE /api/v1/addresses/:id
```

Soft delete (marks as inactive, preserves data).

---

## 🔑 Key Features

1. **Default Address Management**
   - Only one default per user
   - Auto-unsets previous default when setting new one

2. **Soft Delete**
   - Default deletion preserves data
   - Permanent delete option available

3. **Location Support**
   - Optional lat/long for precise location
   - Useful for maps and distance calculations

4. **Address Labels**
   - Categorize as home, work, or other
   - Better organization

5. **Security**
   - All endpoints require authentication
   - Users can only manage their own addresses

---

## 📦 Files

- ✅ **Postman Collection:** Updated `Mauli_Marketing_API.postman_collection.json`
- ✅ **API Documentation:** `docs/ADDRESS_API.md` (complete reference)
- ✅ **Quick Guide:** `ADDRESS_APIS_GUIDE.md` (this file)
- ✅ **Backend Implementation:**
  - Model: `src/models/Address.js`
  - Controller: `src/controllers/addressController.js`
  - Routes: `src/routes/addressRoutes.js`

---

## 🚀 How to Use

### In Postman:
1. Import the updated `Mauli_Marketing_API.postman_collection.json`
2. Navigate to "Addresses (Customer)" folder
3. Use the requests with your auth token

### In Your Code:
```javascript
// Get all addresses
const addresses = await fetch('/api/v1/addresses', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Create address
const newAddress = await fetch('/api/v1/addresses', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "John Doe",
    phone: "+919876543210",
    address_line1: "123 Main St",
    city: "Pune",
    state: "Maharashtra",
    postal_code: "411001",
    is_default: true
  })
});

// Update address
const updated = await fetch(`/api/v1/addresses/${addressId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone: "+919876543211"
  })
});

// Delete address
await fetch(`/api/v1/addresses/${addressId}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## ✅ Status

| Component | Status |
|-----------|--------|
| Backend APIs | ✅ Implemented |
| Documentation | ✅ Complete |
| Postman Collection | ✅ Updated |
| Ready to Use | ✅ Yes |

---

## 📖 For More Details

See the complete API documentation:
- **[docs/ADDRESS_API.md](./docs/ADDRESS_API.md)** - Full API reference
- **[ADDRESS_APIS_GUIDE.md](./ADDRESS_APIS_GUIDE.md)** - Comprehensive guide

---

**Status:** ✅ **COMPLETE**  
**Last Updated:** December 20, 2025, 4:56 PM IST

All Address Management APIs are ready to use! 🎉
