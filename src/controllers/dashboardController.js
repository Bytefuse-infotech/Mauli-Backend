const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

/**
 * Helper function to calculate date ranges based on filter type
 */
function getDateRanges(dateRange) {
    const now = new Date();
    let startDate, endDate, previousStartDate, previousEndDate;

    switch (dateRange) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = now;
            // Previous period: yesterday
            previousStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            previousEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, -1);
            break;

        case '7days':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            endDate = now;
            // Previous period: 7 days before that
            previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
            previousEndDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 - 1);
            break;

        case '30days':
        default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            endDate = now;
            // Previous period: 30 days before that
            previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
            previousEndDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000 - 1);
            break;

        case 'this_month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = now;
            // Previous period: last month
            previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            break;

        case 'last_month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            // Previous period: month before last
            previousStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            previousEndDate = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
            break;

        case 'all_time':
            startDate = new Date(0); // Beginning of time
            endDate = now;
            // No previous period for all time
            previousStartDate = null;
            previousEndDate = null;
            break;
    }

    return { startDate, endDate, previousStartDate, previousEndDate };
}

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/v1/admin/dashboard/stats
 * @access  Private/Admin
 * @query   date_range - 'today', '7days', '30days', 'this_month', 'last_month', 'all_time', 'custom' (default: '30days')
 * @query   start_date - Required when date_range is 'custom' (format: YYYY-MM-DD)
 * @query   end_date - Required when date_range is 'custom' (format: YYYY-MM-DD)
 */
exports.getDashboardStats = async (req, res, next) => {
    try {
        const { date_range = '30days', start_date, end_date } = req.query;

        let startDate, endDate, previousStartDate, previousEndDate;

        // Handle custom date range
        if (date_range === 'custom' && start_date && end_date) {
            startDate = new Date(start_date);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(end_date);
            endDate.setHours(23, 59, 59, 999);

            // Calculate previous period as same duration before start date
            const duration = endDate.getTime() - startDate.getTime();
            previousEndDate = new Date(startDate.getTime() - 1);
            previousStartDate = new Date(previousEndDate.getTime() - duration);
        } else {
            const ranges = getDateRanges(date_range);
            startDate = ranges.startDate;
            endDate = ranges.endDate;
            previousStartDate = ranges.previousStartDate;
            previousEndDate = ranges.previousEndDate;
        }

        // Calculate Total Revenue (current period)
        const currentPeriodRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
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

        // Calculate Total Revenue (previous period)
        let previousPeriodRevenue = [];
        if (previousStartDate && previousEndDate) {
            previousPeriodRevenue = await Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: previousStartDate, $lte: previousEndDate },
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
        }

        const totalRevenue = currentPeriodRevenue.length > 0 ? currentPeriodRevenue[0].total : 0;
        const previousRevenueValue = previousPeriodRevenue.length > 0 ? previousPeriodRevenue[0].total : 0;
        const revenueChange = previousRevenueValue > 0
            ? ((totalRevenue - previousRevenueValue) / previousRevenueValue) * 100
            : totalRevenue > 0 ? 100 : 0;

        // Calculate Total Orders (current period)
        const currentPeriodOrdersCount = await Order.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $nin: ['cancelled'] }
        });

        // Calculate Total Orders (previous period)
        let previousPeriodOrdersCount = 0;
        if (previousStartDate && previousEndDate) {
            previousPeriodOrdersCount = await Order.countDocuments({
                createdAt: { $gte: previousStartDate, $lte: previousEndDate },
                status: { $nin: ['cancelled'] }
            });
        }

        const ordersChange = previousPeriodOrdersCount > 0
            ? ((currentPeriodOrdersCount - previousPeriodOrdersCount) / previousPeriodOrdersCount) * 100
            : currentPeriodOrdersCount > 0 ? 100 : 0;

        // Calculate Total Products (active)
        const totalProducts = await Product.countDocuments({ is_active: true });

        // Products created in previous period
        let previousPeriodProducts = 0;
        if (previousStartDate && previousEndDate) {
            previousPeriodProducts = await Product.countDocuments({
                createdAt: { $lte: previousEndDate },
                is_active: true
            });
        }

        const productsChange = previousPeriodProducts > 0
            ? ((totalProducts - previousPeriodProducts) / previousPeriodProducts) * 100
            : totalProducts > 0 ? 100 : 0;

        // Calculate Active Customers (current period)
        const currentPeriodActiveCustomers = await User.countDocuments({
            role: 'customer',
            is_active: true,
            last_login_at: { $gte: startDate, $lte: endDate }
        });

        // Calculate Active Customers (previous period)
        let previousPeriodActiveCustomers = 0;
        if (previousStartDate && previousEndDate) {
            previousPeriodActiveCustomers = await User.countDocuments({
                role: 'customer',
                is_active: true,
                last_login_at: { $gte: previousStartDate, $lte: previousEndDate }
            });
        }

        const customersChange = previousPeriodActiveCustomers > 0
            ? ((currentPeriodActiveCustomers - previousPeriodActiveCustomers) / previousPeriodActiveCustomers) * 100
            : currentPeriodActiveCustomers > 0 ? 100 : 0;

        // Prepare response
        const stats = {
            totalRevenue: {
                value: Math.round(totalRevenue * 100) / 100,
                change: Math.round(revenueChange * 100) / 100,
                label: 'Total Revenue'
            },
            totalOrders: {
                value: currentPeriodOrdersCount,
                change: Math.round(ordersChange * 100) / 100,
                label: 'Total Orders'
            },
            totalProducts: {
                value: totalProducts,
                change: Math.round(productsChange * 100) / 100,
                label: 'Total Products'
            },
            activeCustomers: {
                value: currentPeriodActiveCustomers,
                change: Math.round(customersChange * 100) / 100,
                label: 'Active Customers'
            },
            dateRange: date_range,
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString()
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


/**
 * @desc    Get recent orders for dashboard
 * @route   GET /api/v1/admin/dashboard/recent-orders
 * @access  Private/Admin
 */
exports.getRecentOrders = async (req, res, next) => {
    try {
        const { limit = 5 } = req.query;

        // Fetch recent orders with user details populated
        const recentOrders = await Order.find()
            .populate('user_id', 'name email phone')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .select('order_number user_id total_amount status createdAt items');

        res.status(200).json({
            success: true,
            data: recentOrders
        });

    } catch (error) {
        console.error('Error fetching recent orders:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recent orders',
            error: error.message
        });
    }
};
