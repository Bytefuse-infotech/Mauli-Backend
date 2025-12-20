const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/v1/admin/dashboard/stats
 * @access  Private/Admin
 */
exports.getDashboardStats = async (req, res, next) => {
    try {
        // Get current date and calculate time ranges
        const now = new Date();
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        // Calculate Total Revenue (current month)
        const currentMonthRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfCurrentMonth },
                    status: { $nin: ['cancelled'] }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$total_amount' }
                }
            }
        ]);

        // Calculate Total Revenue (last month)
        const lastMonthRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
                    status: { $nin: ['cancelled'] }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$total_amount' }
                }
            }
        ]);

        const totalRevenue = currentMonthRevenue.length > 0 ? currentMonthRevenue[0].total : 0;
        const lastMonthRevenueValue = lastMonthRevenue.length > 0 ? lastMonthRevenue[0].total : 0;
        const revenueChange = lastMonthRevenueValue > 0
            ? ((totalRevenue - lastMonthRevenueValue) / lastMonthRevenueValue) * 100
            : totalRevenue > 0 ? 100 : 0;

        // Calculate Total Orders (current month)
        const currentMonthOrdersCount = await Order.countDocuments({
            createdAt: { $gte: startOfCurrentMonth },
            status: { $nin: ['cancelled'] }
        });

        // Calculate Total Orders (last month)
        const lastMonthOrdersCount = await Order.countDocuments({
            createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
            status: { $nin: ['cancelled'] }
        });

        const ordersChange = lastMonthOrdersCount > 0
            ? ((currentMonthOrdersCount - lastMonthOrdersCount) / lastMonthOrdersCount) * 100
            : currentMonthOrdersCount > 0 ? 100 : 0;

        // Calculate Total Products (active)
        const totalProducts = await Product.countDocuments({ is_active: true });

        // Calculate Total Products (last month snapshot - we'll use all products for now)
        // Note: In a real scenario, you might want to track product count history
        const lastMonthProducts = await Product.countDocuments({
            createdAt: { $lte: endOfLastMonth },
            is_active: true
        });

        const productsChange = lastMonthProducts > 0
            ? ((totalProducts - lastMonthProducts) / lastMonthProducts) * 100
            : totalProducts > 0 ? 100 : 0;

        // Calculate Active Customers (current month active)
        const currentMonthActiveCustomers = await User.countDocuments({
            role: 'customer',
            is_active: true,
            last_login_at: { $gte: startOfCurrentMonth }
        });

        // Calculate Active Customers (last month)
        const lastMonthActiveCustomers = await User.countDocuments({
            role: 'customer',
            is_active: true,
            last_login_at: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        });

        const customersChange = lastMonthActiveCustomers > 0
            ? ((currentMonthActiveCustomers - lastMonthActiveCustomers) / lastMonthActiveCustomers) * 100
            : currentMonthActiveCustomers > 0 ? 100 : 0;

        // Prepare response
        const stats = {
            totalRevenue: {
                value: Math.round(totalRevenue * 100) / 100, // Round to 2 decimal places
                change: Math.round(revenueChange * 100) / 100,
                label: 'Total Revenue'
            },
            totalOrders: {
                value: currentMonthOrdersCount,
                change: Math.round(ordersChange * 100) / 100,
                label: 'Total Orders'
            },
            totalProducts: {
                value: totalProducts,
                change: Math.round(productsChange * 100) / 100,
                label: 'Total Products'
            },
            activeCustomers: {
                value: currentMonthActiveCustomers,
                change: Math.round(customersChange * 100) / 100,
                label: 'Active Customers'
            }
        };

        res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard statistics',
            error: error.message
        });
    }
};
