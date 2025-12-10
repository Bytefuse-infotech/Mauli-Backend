const express = require('express');
const router = express.Router();
const {
    getUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    getDashboardStats
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin', 'manager')); // Managers can view too, usually

router.route('/')
    .get(getUsers)
    .post(authorize('admin'), createUser); // Only admin can create via this route

router.get('/stats', authorize('admin'), getDashboardStats);

router.route('/:id')
    .get(getUserById)
    .put(authorize('admin'), updateUser)
    .delete(authorize('admin'), deleteUser);

module.exports = router;
