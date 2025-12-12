const express = require('express');
const router = express.Router();
const {
    getAddresses,
    getAddress,
    getDefaultAddress,
    createAddress,
    updateAddress,
    setDefaultAddress,
    deleteAddress,
    permanentDeleteAddress
} = require('../controllers/addressController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Get default address (must be before /:id route)
router.get('/default', getDefaultAddress);

// CRUD operations
router.route('/')
    .get(getAddresses)      // GET /api/v1/addresses - Get all addresses
    .post(createAddress);   // POST /api/v1/addresses - Create new address

router.route('/:id')
    .get(getAddress)        // GET /api/v1/addresses/:id - Get single address
    .put(updateAddress)     // PUT /api/v1/addresses/:id - Update address
    .delete(deleteAddress); // DELETE /api/v1/addresses/:id - Soft delete address

// Set default address
router.patch('/:id/set-default', setDefaultAddress);

// Permanent delete (optional - use with caution)
router.delete('/:id/permanent', permanentDeleteAddress);

module.exports = router;
