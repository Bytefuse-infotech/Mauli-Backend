# 🔐 Centralized Login - Quick Reference

## ✅ Your Login is Already Centralized!

**Single Endpoint:** `POST /api/v1/auth/login`  
**Works For:** Admin, Manager, Customer

---

## 📋 Login Methods

### Admin Login (Email)
```json
POST /api/v1/auth/login
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

### Customer Login (Phone)
```json
POST /api/v1/auth/login
{
  "phone": "918108053372",
  "password": "qwerty@123"
}
```

---

## 📤 Response

```json
{
  "success": true,
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "_id": "...",
    "name": "User Name",
    "email": "user@example.com",
    "role": "admin"  // or "customer" or "manager"
  },
  "sessionId": "..."
}
```

---

## 🎯 Frontend Implementation

### Admin Login Component
```typescript
const handleAdminLogin = async (email, password) => {
  const res = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await res.json();
  
  if (data.success && (data.user.role === 'admin' || data.user.role === 'manager')) {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    navigate('/admin/dashboard');
  } else {
    alert('Admin access required');
  }
};
```

### Customer Login Component
```typescript
const handleCustomerLogin = async (phone, password) => {
  const res = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password })
  });
  
  const data = await res.json();
  
  if (data.success) {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Route based on role
    if (data.user.role === 'admin' || data.user.role === 'manager') {
      navigate('/admin/dashboard');
    } else {
      navigate('/home');
    }
  }
};
```

---

## 🛡️ Route Protection

### Admin Route Guard
```typescript
const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!user.role || (user.role !== 'admin' && user.role !== 'manager')) {
    return <Navigate to="/admin/login" />;
  }
  
  return children;
};
```

### Usage
```typescript
<Route path="/admin/*" element={
  <AdminRoute>
    <AdminDashboard />
  </AdminRoute>
} />
```

---

## 🔑 Using Tokens

### Make Authenticated Requests
```typescript
const fetchData = async () => {
  const token = localStorage.getItem('accessToken');
  
  const res = await fetch('/api/v1/admin/users', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return res.json();
};
```

---

## 📊 User Roles

| Role | Access |
|------|--------|
| `admin` | Full access (all endpoints) |
| `manager` | Limited admin access |
| `customer` | Customer endpoints only |

---

## ✨ Key Points

1. ✅ **Same endpoint** for all users
2. ✅ **Role returned** in login response
3. ✅ **Frontend routes** based on role
4. ✅ **JWT includes** role for authorization
5. ✅ **Secure** and scalable

---

## 🎨 Your Admin UI

Your admin login UI already uses this system!

Just ensure you:
1. Call `/api/v1/auth/login` with email + password
2. Check `data.user.role` is `admin` or `manager`
3. Store tokens in localStorage
4. Redirect to admin dashboard

---

**Status:** ✅ Working  
**Documentation:** [CENTRALIZED_LOGIN_GUIDE.md](./CENTRALIZED_LOGIN_GUIDE.md)
