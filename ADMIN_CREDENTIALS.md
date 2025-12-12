# ✅ Admin User Created Successfully

## 🔐 Admin Login Credentials

```
Email:    admin@gmail.com
Phone:    8108053382
Password: qwerty@123
Role:     admin
Status:   Active ✅
```

---

## 📋 Admin Details

| Field | Value |
|-------|-------|
| **Name** | Admin User |
| **Email** | admin@gmail.com |
| **Phone** | 8108053382 |
| **Password** | qwerty@123 |
| **Role** | admin |
| **Status** | Active ✅ |
| **Email Verified** | Yes ✅ |
| **Phone Verified** | Yes ✅ |
| **User ID** | 693936b5e969215e058e0a43 |

---

## 🚀 How to Login

### Option 1: Using cURL
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gmail.com",
    "password": "qwerty@123"
  }'
```

### Option 2: Using Postman
1. **Method**: POST
2. **URL**: `http://localhost:5000/api/v1/auth/login`
3. **Headers**: 
   - Content-Type: application/json
4. **Body** (raw JSON):
```json
{
  "email": "admin@gmail.com",
  "password": "qwerty@123"
}
```

### Option 3: Using Frontend
```javascript
const response = await fetch('http://localhost:5000/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@gmail.com',
    password: 'qwerty@123'
  })
});

const data = await response.json();
console.log('Access Token:', data.accessToken);
console.log('Refresh Token:', data.refreshToken);
```

---

## 🔑 Expected Login Response

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "693936b5e969215e058e0a43",
    "name": "Admin User",
    "email": "admin@gmail.com",
    "phone": "8108053382",
    "role": "admin",
    "is_active": true,
    "is_email_verified": true,
    "is_phone_verified": true
  }
}
```

---

## 🛠️ Admin Capabilities

As an admin user, you have access to:

### User Management
- ✅ View all users
- ✅ Create new users
- ✅ Update user details
- ✅ Deactivate/activate users
- ✅ View user statistics

### Product Management
- ✅ Create products
- ✅ Update products
- ✅ Delete products
- ✅ Manage product inventory

### Category Management
- ✅ Create categories
- ✅ Update categories
- ✅ Delete categories

### Banner Management
- ✅ Create banners
- ✅ Update banners
- ✅ Delete banners

### Order Management
- ✅ View all orders
- ✅ Update order status
- ✅ Cancel orders
- ✅ View order statistics

### Store Configuration
- ✅ Update store settings
- ✅ Manage delivery slots
- ✅ Configure store hours

### Content Management
- ✅ Update app content
- ✅ Manage static pages

---

## 📝 Management Scripts

### Update Admin Credentials
If you need to update the admin credentials again:
```bash
node src/scripts/updateAdmin.js
```

### Create New Admin
To create a new admin user (different email):
```bash
node src/scripts/createAdmin.js
```

---

## 🔒 Security Notes

1. **Change Password**: It's recommended to change the password after first login
2. **Secure Storage**: Never commit credentials to version control
3. **Token Management**: Access tokens expire after a certain time
4. **Refresh Tokens**: Use refresh tokens to get new access tokens

---

## 🌐 Admin Endpoints

All admin endpoints require authentication with the admin role.

### User Management
- `GET /api/v1/admin/users` - Get all users
- `GET /api/v1/admin/users/:id` - Get user by ID
- `PUT /api/v1/admin/users/:id` - Update user
- `DELETE /api/v1/admin/users/:id` - Delete user

### Product Management
- `POST /api/v1/admin/products` - Create product
- `PUT /api/v1/admin/products/:id` - Update product
- `DELETE /api/v1/admin/products/:id` - Delete product

### Category Management
- `POST /api/v1/admin/categories` - Create category
- `PUT /api/v1/admin/categories/:id` - Update category
- `DELETE /api/v1/admin/categories/:id` - Delete category

### Banner Management
- `POST /api/v1/admin/banners` - Create banner
- `PUT /api/v1/admin/banners/:id` - Update banner
- `DELETE /api/v1/admin/banners/:id` - Delete banner

### Order Management
- `GET /api/v1/admin/orders` - Get all orders
- `PUT /api/v1/admin/orders/:id/status` - Update order status

---

## 📊 Quick Stats Access

After logging in, you can access various statistics:

```bash
# Get user statistics
curl -X GET http://localhost:5000/api/v1/admin/users/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get order statistics
curl -X GET http://localhost:5000/api/v1/admin/orders/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## ✅ Verification Checklist

- [x] Admin user created
- [x] Email: admin@gmail.com
- [x] Phone: 8108053382
- [x] Password: qwerty@123
- [x] Role: admin
- [x] Status: Active
- [x] Email verified
- [x] Phone verified

---

## 🎯 Next Steps

1. **Login** using the credentials above
2. **Test admin endpoints** to verify access
3. **Change password** if needed for security
4. **Start managing** your application

---

**Created**: December 12, 2024  
**Status**: ✅ Active and Ready to Use  
**Script Used**: `src/scripts/updateAdmin.js`
