const User = require('../models/User');
const authService = require('../services/authService');
const redis = require('../lib/redis');

// @desc    Create User (Admin)
// @route   POST /api/v1/admin/users
// @access  Private/Admin
const createUser = async (req, res) => {
    try {
        const { name, email, phone, password, role } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const password_hash = await authService.hashPassword(password);

        const user = await User.create({
            name,
            email,
            phone,
            password_hash,
            role: role || 'customer'
        });

        // Invalidate Stats Cache
        if (redis.status === 'ready') {
            await redis.del('dashboard:stats');
        }

        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Get Users (Admin)
// @route   GET /api/v1/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const pageSize = 10;
        const page = Number(req.query.pageNumber) || 1;

        const keyword = req.query.keyword ? {
            name: {
                $regex: req.query.keyword,
                $options: 'i'
            }
        } : {};

        const filter = { ...keyword };
        if (req.query.role) filter.role = req.query.role;
        if (req.query.is_active) filter.is_active = req.query.is_active === 'true';

        const count = await User.countDocuments(filter);
        const users = await User.find(filter)
            .select('-password_hash')
            .limit(pageSize)
            .skip(pageSize * (page - 1))
            .sort({ createdAt: -1 })
            .lean();

        res.json({ users, page, pages: Math.ceil(count / pageSize), total: count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get User by ID (Admin)
// @route   GET /api/v1/admin/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password_hash').lean();
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update User (Admin)
// @route   PUT /api/v1/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.phone = req.body.phone || user.phone;
            user.role = req.body.role || user.role;
            if (req.body.is_active !== undefined) {
                user.is_active = req.body.is_active;
            }

            // Only hash password if it's being updated
            // if (req.body.password) {
            //     user.password_hash = await authService.hashPassword(req.body.password);
            // }

            const updatedUser = await user.save();

            // Invalidate Stats Cache
            if (redis.status === 'ready') {
                await redis.del('dashboard:stats');
            }

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                is_active: updatedUser.is_active
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete User (Admin) - Soft delete
// @route   DELETE /api/v1/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            user.is_active = false;
            await user.save();

            // Invalidate Stats Cache
            if (redis.status === 'ready') {
                await redis.del('dashboard:stats');
            }

            res.json({ message: 'User deactivated' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Dashboard Stats
// @route   GET /api/v1/admin/users/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        // Check Redis Cache
        if (redis.status === 'ready') {
            const cachedStats = await redis.get('dashboard:stats');
            if (cachedStats) {
                return res.json(JSON.parse(cachedStats));
            }
        }

        const tenant_id = req.query.tenant_id;
        const stats = await User.dashboardStats({ tenant_id });

        // Save to Redis (TTL 60 seconds)
        if (redis.status === 'ready') {
            await redis.set('dashboard:stats', JSON.stringify(stats), 'EX', 60);
        }

        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getDashboardStats
};
