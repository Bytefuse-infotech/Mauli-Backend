# Address Management API Documentation

## Overview
This API provides complete CRUD operations for customer address management. All endpoints require authentication via JWT token.

## Base URL
```
/api/v1/addresses
```

## Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Get All Addresses
Retrieve all active addresses for the logged-in customer.

**Endpoint:** `GET /api/v1/addresses`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "64abc123def456789",
      "user_id": "64abc123def456788",
      "label": "home",
      "name": "John Doe",
      "phone": "+919876543210",
      "address_line1": "123 Main Street",
      "address_line2": "Apartment 4B",
      "landmark": "Near City Mall",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postal_code": "400001",
      "country": "India",
      "latitude": 19.0760,
      "longitude": 72.8777,
      "is_default": true,
      "is_active": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "64abc123def456790",
      "user_id": "64abc123def456788",
      "label": "work",
      "name": "John Doe",
      "phone": "+919876543210",
      "address_line1": "456 Business Park",
      "address_line2": "Floor 5",
      "landmark": "Opposite Metro Station",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postal_code": "400002",
      "country": "India",
      "latitude": 19.0896,
      "longitude": 72.8656,
      "is_default": false,
      "is_active": true,
      "createdAt": "2024-01-16T14:20:00.000Z",
      "updatedAt": "2024-01-16T14:20:00.000Z"
    }
  ]
}
```

---

### 2. Get Single Address
Retrieve a specific address by ID.

**Endpoint:** `GET /api/v1/addresses/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "64abc123def456789",
    "user_id": "64abc123def456788",
    "label": "home",
    "name": "John Doe",
    "phone": "+919876543210",
    "address_line1": "123 Main Street",
    "address_line2": "Apartment 4B",
    "landmark": "Near City Mall",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal_code": "400001",
    "country": "India",
    "latitude": 19.0760,
    "longitude": 72.8777,
    "is_default": true,
    "is_active": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Address not found"
}
```

---

### 3. Get Default Address
Retrieve the default address for the logged-in customer.

**Endpoint:** `GET /api/v1/addresses/default`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "64abc123def456789",
    "user_id": "64abc123def456788",
    "label": "home",
    "name": "John Doe",
    "phone": "+919876543210",
    "address_line1": "123 Main Street",
    "address_line2": "Apartment 4B",
    "landmark": "Near City Mall",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal_code": "400001",
    "country": "India",
    "latitude": 19.0760,
    "longitude": 72.8777,
    "is_default": true,
    "is_active": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "No default address found"
}
```

---

### 4. Create New Address
Create a new address for the logged-in customer.

**Endpoint:** `POST /api/v1/addresses`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "label": "home",
  "name": "John Doe",
  "phone": "+919876543210",
  "address_line1": "123 Main Street",
  "address_line2": "Apartment 4B",
  "landmark": "Near City Mall",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postal_code": "400001",
  "country": "India",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "is_default": true
}
```

**Required Fields:**
- `name` (string)
- `phone` (string)
- `address_line1` (string)
- `city` (string)
- `state` (string)
- `postal_code` (string)

**Optional Fields:**
- `label` (enum: 'home', 'work', 'other') - defaults to 'home'
- `address_line2` (string)
- `landmark` (string)
- `country` (string) - defaults to 'India'
- `latitude` (number)
- `longitude` (number)
- `is_default` (boolean) - defaults to false

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Address created successfully",
  "data": {
    "_id": "64abc123def456789",
    "user_id": "64abc123def456788",
    "label": "home",
    "name": "John Doe",
    "phone": "+919876543210",
    "address_line1": "123 Main Street",
    "address_line2": "Apartment 4B",
    "landmark": "Near City Mall",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal_code": "400001",
    "country": "India",
    "latitude": 19.0760,
    "longitude": 72.8777,
    "is_default": true,
    "is_active": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Please provide all required fields: name, phone, address_line1, city, state, postal_code"
}
```

---

### 5. Update Address
Update an existing address.

**Endpoint:** `PUT /api/v1/addresses/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:** (All fields are optional, only send fields you want to update)
```json
{
  "label": "work",
  "name": "John Doe",
  "phone": "+919876543211",
  "address_line1": "456 Business Park",
  "address_line2": "Floor 5",
  "landmark": "Opposite Metro Station",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postal_code": "400002",
  "country": "India",
  "latitude": 19.0896,
  "longitude": 72.8656,
  "is_default": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Address updated successfully",
  "data": {
    "_id": "64abc123def456789",
    "user_id": "64abc123def456788",
    "label": "work",
    "name": "John Doe",
    "phone": "+919876543211",
    "address_line1": "456 Business Park",
    "address_line2": "Floor 5",
    "landmark": "Opposite Metro Station",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal_code": "400002",
    "country": "India",
    "latitude": 19.0896,
    "longitude": 72.8656,
    "is_default": false,
    "is_active": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-16T15:45:00.000Z"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Address not found"
}
```

---

### 6. Set Default Address
Set a specific address as the default address. This will automatically unset any other default address.

**Endpoint:** `PATCH /api/v1/addresses/:id/set-default`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Address set as default successfully",
  "data": {
    "_id": "64abc123def456789",
    "user_id": "64abc123def456788",
    "label": "home",
    "name": "John Doe",
    "phone": "+919876543210",
    "address_line1": "123 Main Street",
    "address_line2": "Apartment 4B",
    "landmark": "Near City Mall",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal_code": "400001",
    "country": "India",
    "latitude": 19.0760,
    "longitude": 72.8777,
    "is_default": true,
    "is_active": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-16T16:00:00.000Z"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Address not found"
}
```

---

### 7. Delete Address (Soft Delete)
Soft delete an address (marks as inactive but doesn't remove from database).

**Endpoint:** `DELETE /api/v1/addresses/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Address not found"
}
```

---

### 8. Permanent Delete Address
Permanently delete an address from the database. **Use with caution!**

**Endpoint:** `DELETE /api/v1/addresses/:id/permanent`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Address permanently deleted"
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Address not found"
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "message": "Not authorized, no token"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error creating address",
  "error": "Detailed error message"
}
```

---

## Features

### 1. **Default Address Management**
- Only one address can be set as default per user
- Setting a new default automatically unsets the previous default
- Deleting a default address automatically unsets the default flag

### 2. **Soft Delete**
- Addresses are soft-deleted by default (marked as inactive)
- Soft-deleted addresses are not returned in list queries
- Permanent delete option available for complete removal

### 3. **Location Support**
- Optional latitude and longitude fields for precise location
- Can be used for distance calculations and map integration

### 4. **Address Labels**
- Categorize addresses as 'home', 'work', or 'other'
- Helps users organize multiple addresses

### 5. **Security**
- All endpoints require authentication
- Users can only access their own addresses
- Ownership verification on all operations

---

## Usage Examples

### Example 1: Create First Address (Set as Default)
```bash
curl -X POST http://localhost:5000/api/v1/addresses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "home",
    "name": "John Doe",
    "phone": "+919876543210",
    "address_line1": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal_code": "400001",
    "is_default": true
  }'
```

### Example 2: Get All Addresses
```bash
curl -X GET http://localhost:5000/api/v1/addresses \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 3: Update Address
```bash
curl -X PUT http://localhost:5000/api/v1/addresses/64abc123def456789 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543211",
    "landmark": "Near New Mall"
  }'
```

### Example 4: Set Default Address
```bash
curl -X PATCH http://localhost:5000/api/v1/addresses/64abc123def456789/set-default \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 5: Delete Address
```bash
curl -X DELETE http://localhost:5000/api/v1/addresses/64abc123def456789 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Notes

1. **Authentication Required:** All endpoints require a valid JWT token
2. **User Isolation:** Users can only manage their own addresses
3. **Default Address:** Automatically managed - only one default per user
4. **Soft Delete:** Default deletion method preserves data
5. **Validation:** Required fields are validated on creation
6. **Timestamps:** All addresses have `createdAt` and `updatedAt` fields
