# 🔐 Centralized Login System - Admin & Customer

## Overview

Your system **already has a centralized login** that works for both **Admin** and **Customer** users through a single endpoint: `/api/v1/auth/login`

The system automatically identifies the user type based on their `role` field in the database and returns the appropriate access level.

---

## 🎯 How It Works

### Single Login Endpoint
```
POST /api/v1/auth/login
```

### Supports Two Login Methods

#### Method 1: Login with Email
```json
{
  "email": "admin@example.com",
  "password": "your_password"
}
```

#### Method 2: Login with Phone
```json
{
  "phone": "918108053372",
  "password": "your_password"
}
```

---

## 👥 User Roles

The system supports multiple roles stored in the `role` field:

| Role | Description | Access Level |
|------|-------------|--------------|
| `admin` | Full system access | All admin endpoints + customer endpoints |
| `manager` | Limited admin access | Some admin endpoints + customer endpoints |
| `customer` | Regular user | Customer endpoints only |

---

## 🔄 Login Flow

```
1. User submits credentials (email/phone + password)
   ↓
2. System finds user in database
   ↓
3. Validates password
   ↓
4. Checks if user is active
   ↓
5. Generates JWT tokens with user role embedded
   ↓
6. Returns tokens + user info (including role)
   ↓
7. Frontend routes user based on role:
   - admin/manager → Admin Panel
   - customer → Customer App
```

---

## 📝 Login Response

### Success Response (200 OK)
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64abc123def456789",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin"  // or "customer" or "manager"
  },
  "sessionId": "64abc123def456790"
}
```

### Error Responses

**Invalid Credentials (401)**
```json
{
  "message": "Invalid credentials"
}
```

**User Inactive (401)**
```json
{
  "message": "User is inactive"
}
```

**Missing Password (400)**
```json
{
  "message": "Please provide password"
}
```

**Missing Email/Phone (400)**
```json
{
  "message": "Please provide email or phone"
}
```

---

## 🎨 Frontend Implementation

### Admin Login (Your Current UI)

```typescript
// Admin Login Component
const handleAdminLogin = async (email: string, password: string) => {
  try {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      // Check if user is admin or manager
      if (data.user.role === 'admin' || data.user.role === 'manager') {
        // Store tokens
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect to admin dashboard
        navigate('/admin/dashboard');
      } else {
        // Not an admin
        alert('Access denied. Admin credentials required.');
      }
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Customer Login (Mobile/Web App)

```typescript
// Customer Login Component
const handleCustomerLogin = async (phone: string, password: string) => {
  try {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });

    const data = await response.json();

    if (data.success) {
      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect based on role
      if (data.user.role === 'admin' || data.user.role === 'manager') {
        navigate('/admin/dashboard');
      } else {
        navigate('/home');
      }
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

---

## 🔒 JWT Token Structure

The JWT token includes the user's role, which is used for authorization:

```javascript
// Token Payload
{
  "id": "64abc123def456789",
  "role": "admin",  // or "customer" or "manager"
  "iat": 1766226339,
  "exp": 1766227239
}
```

### Token Usage

```javascript
// Making authenticated requests
const response = await fetch('/api/v1/admin/users', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

The backend middleware checks:
1. ✅ Token is valid
2. ✅ User exists and is active
3. ✅ User has required role for the endpoint

---

## 🛡️ Authorization Middleware

### Protect Middleware
Verifies the user is authenticated:

```javascript
// Used on all protected routes
router.get('/profile', protect, getProfile);
```

### Authorize Middleware
Verifies the user has the required role:

```javascript
// Used on admin-only routes
router.get('/admin/users', protect, authorize('admin'), getAllUsers);

// Used on admin or manager routes
router.get('/admin/orders', protect, authorize('admin', 'manager'), getAllOrders);
```

---

## 📋 Example Use Cases

### Use Case 1: Admin Login via Email
```bash
curl -X POST http://localhost:5009/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "success": true,
  "accessToken": "...",
  "user": {
    "role": "admin",
    "name": "Admin User",
    "email": "admin@example.com"
  }
}
```

### Use Case 2: Customer Login via Phone
```bash
curl -X POST http://localhost:5009/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "918108053372",
    "password": "qwerty@123"
  }'
```

**Response:**
```json
{
  "success": true,
  "accessToken": "...",
  "user": {
    "role": "customer",
    "name": "Test Customer",
    "phone": "918108053372"
  }
}
```

---

## 🎯 Best Practices

### 1. **Frontend Routing Based on Role**

```typescript
// After successful login
const redirectUser = (user) => {
  switch(user.role) {
    case 'admin':
    case 'manager':
      navigate('/admin/dashboard');
      break;
    case 'customer':
      navigate('/home');
      break;
    default:
      navigate('/login');
  }
};
```

### 2. **Protect Admin Routes**

```typescript
// Admin Route Guard
const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Usage
<Route path="/admin/*" element={
  <AdminRoute>
    <AdminDashboard />
  </AdminRoute>
} />
```

### 3. **Store User Info Securely**

```typescript
// Store in localStorage (or secure storage)
const storeAuthData = (data) => {
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('user', JSON.stringify(data.user));
  localStorage.setItem('sessionId', data.sessionId);
};

// Retrieve
const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Clear on logout
const clearAuthData = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('sessionId');
};
```

---

## 🔄 Token Refresh

When the access token expires, use the refresh token:

```typescript
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('accessToken', data.accessToken);
    return data.accessToken;
  }
  
  // Refresh failed, logout user
  clearAuthData();
  navigate('/login');
};
```

---

## 📊 Database User Schema

```javascript
{
  "_id": ObjectId,
  "name": String,
  "email": String,
  "phone": String,
  "password_hash": String,
  "role": String,  // "admin", "manager", or "customer"
  "is_active": Boolean,
  "is_phone_verified": Boolean,
  "createdAt": Date,
  "updatedAt": Date
}
```

---

## ✅ Summary

Your system **already has a centralized login** that:

- ✅ Uses a **single endpoint** for all users
- ✅ Supports **email or phone** login
- ✅ Returns **role information** in the response
- ✅ Embeds **role in JWT token** for authorization
- ✅ Works for **admin, manager, and customer** users
- ✅ Provides **secure authentication** with JWT
- ✅ Includes **session tracking**

### What You Need to Do:

1. **Frontend:** Route users based on `role` after login
2. **Admin Panel:** Check role is `admin` or `manager`
3. **Customer App:** Allow any authenticated user
4. **Protect Routes:** Use role-based guards

---

## 🎨 Your Admin Login UI

Based on your screenshot, your admin login already uses the centralized endpoint. Just ensure:

```typescript
// In your admin login component
const handleLogin = async (email: string, password: string) => {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  // Verify user is admin/manager
  if (data.user.role === 'admin' || data.user.role === 'manager') {
    // Success - store tokens and redirect
  } else {
    // Show error - not an admin
  }
};
```

---

**Status:** ✅ **Already Centralized!**  
**Last Updated:** December 20, 2025, 5:23 PM IST

Your login system is already centralized and working perfectly! 🎉
