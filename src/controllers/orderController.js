const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const StoreConfig = require('../models/StoreConfig');

// @desc    Create order from cart
// @route   POST /api/v1/orders
// @access  Private
const createOrder = async (req, res) => {
    try {
        const {
            delivery_address,
            delivery_slot,
            payment_method = 'cod',
            notes = '',
            distance_km = 0
        } = req.body;

        // Validate required fields
        if (!delivery_address) {
            return res.status(400).json({
                success: false,
                message: 'delivery_address is required'
            });
        }

        // Get user's cart
        const cart = await Cart.findOne({ user_id: req.user._id })
            .populate('items.product_id');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // Verify all products are still active
        const inactiveProducts = cart.items.filter(item => !item.product_id.is_active);
        if (inactiveProducts.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Some products in cart are no longer available'
            });
        }

        // Calculate subtotal
        let subtotal = 0;
        const orderItems = cart.items.map(item => {
            const itemPrice = item.price_at_add - item.discount_at_add;
            const itemTotal = itemPrice * item.quantity;
            subtotal += itemTotal;

            return {
                product_id: item.product_id._id,
                product_name: item.product_id.name,
                quantity: item.quantity,
                unit: item.unit,
                price: item.price_at_add,
                discount: item.discount_at_add,
                total: itemTotal
            };
        });

        // Get store config and compute totals
        const storeConfig = await StoreConfig.getConfig();

        // Calculate delivery fee
        let delivery_fee = 0;
        if (storeConfig.delivery_fee.type === 'flat') {
            delivery_fee = storeConfig.delivery_fee.base_fee;
        } else if (storeConfig.delivery_fee.type === 'per_km') {
            delivery_fee = storeConfig.delivery_fee.base_fee +
                (storeConfig.delivery_fee.rate * distance_km);
        }

        // Calculate discount
        let discount_amount = 0;
        const applicable_discounts = storeConfig.cart_discounts
            .filter(d => subtotal >= d.min_cart_value)
            .sort((a, b) => {
                if (b.priority !== a.priority) {
                    return b.priority - a.priority;
                }
                return b.value - a.value;
            });

        if (applicable_discounts.length > 0) {
            const discount = applicable_discounts[0];
            if (discount.discount_type === 'flat') {
                discount_amount = discount.value;
            } else if (discount.discount_type === 'percentage') {
                discount_amount = (subtotal * discount.value) / 100;
            }
            if (discount.max_discount_amount) {
                discount_amount = Math.min(discount_amount, discount.max_discount_amount);
            }
        }

        const total_amount = Math.max(0, subtotal - discount_amount + delivery_fee);

        // Handle delivery slot if provided
        let orderDeliverySlot = null;
        let config = null;
        let timeSlot = null;

        if (delivery_slot) {
            // Reserve delivery slot
            const slotDate = new Date(delivery_slot.date);
            slotDate.setUTCHours(0, 0, 0, 0);

            config = await StoreConfig.findOne({});
            if (!config) {
                return res.status(500).json({
                    success: false,
                    message: 'Store configuration not found'
                });
            }

            const dateSlot = config.delivery_slots.find(ds => {
                const storedDate = new Date(ds.date);
                storedDate.setUTCHours(0, 0, 0, 0);
                return storedDate.getTime() === slotDate.getTime();
            });

            if (!dateSlot) {
                return res.status(400).json({
                    success: false,
                    message: 'Selected delivery date not available'
                });
            }

            timeSlot = dateSlot.slots.find(s => s.start_time === delivery_slot.start_time);

            if (!timeSlot) {
                return res.status(400).json({
                    success: false,
                    message: 'Selected time slot not found'
                });
            }

            if (timeSlot.booked >= timeSlot.capacity) {
                return res.status(400).json({
                    success: false,
                    message: 'Selected time slot is full'
                });
            }

            orderDeliverySlot = {
                date: slotDate,
                start_time: delivery_slot.start_time,
                end_time: timeSlot.end_time
            };
        }

        // Create order
        const orderData = {
            user_id: req.user._id,
            items: orderItems,
            subtotal,
            delivery_fee,
            discount_amount,
            total_amount,
            delivery_address,
            payment_method,
            notes
        };

        if (orderDeliverySlot) {
            orderData.delivery_slot = orderDeliverySlot;
        }

        const order = await Order.create(orderData);

        // Reserve the slot if it was provided
        if (timeSlot && config) {
            timeSlot.booked += 1;
            await config.save();
        }

        // Clear cart
        cart.items = [];
        await cart.save();

        return res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            data: order
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message || 'Server error'
        });
    }
};

// @desc    Get user's orders
// @route   GET /api/v1/orders
// @access  Private
const getOrders = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const page_size = Math.min(50, Math.max(10, parseInt(req.query.page_size) || 10));
        const skip = (page - 1) * page_size;

        const filter = { user_id: req.user._id };

        if (req.query.status) {
            filter.status = req.query.status;
        }

        const [total, orders] = await Promise.all([
            Order.countDocuments(filter),
            Order.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(page_size)
                .lean()
        ]);

        return res.json({
            success: true,
            page,
            page_size,
            total,
            total_pages: Math.ceil(total / page_size),
            data: orders
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get single order
// @route   GET /api/v1/orders/:id
// @access  Private
const getOrder = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user_id: req.user._id
        }).lean();

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        return res.json({
            success: true,
            data: order
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Cancel order
// @route   PATCH /api/v1/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user_id: req.user._id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.status !== 'pending' && order.status !== 'confirmed') {
            return res.status(400).json({
                success: false,
                message: 'Order cannot be cancelled at this stage'
            });
        }

        order.status = 'cancelled';
        await order.save();

        // Release delivery slot if order had one
        if (order.delivery_slot) {
            const config = await StoreConfig.findOne({});
            if (config) {
                const slotDate = new Date(order.delivery_slot.date);
                slotDate.setUTCHours(0, 0, 0, 0);

                const dateSlot = config.delivery_slots.find(ds => {
                    const storedDate = new Date(ds.date);
                    storedDate.setUTCHours(0, 0, 0, 0);
                    return storedDate.getTime() === slotDate.getTime();
                });

                if (dateSlot) {
                    const timeSlot = dateSlot.slots.find(s => s.start_time === order.delivery_slot.start_time);
                    if (timeSlot && timeSlot.booked > 0) {
                        timeSlot.booked -= 1;
                        await config.save();
                    }
                }
            }
        }

        return res.json({
            success: true,
            message: 'Order cancelled successfully',
            data: order
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get all orders (Admin)
// @route   GET /api/v1/admin/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const page_size = Math.min(100, Math.max(10, parseInt(req.query.page_size) || 20));
        const skip = (page - 1) * page_size;

        const filter = {};

        if (req.query.status) {
            filter.status = req.query.status;
        }

        if (req.query.payment_status) {
            filter.payment_status = req.query.payment_status;
        }

        const [total, orders] = await Promise.all([
            Order.countDocuments(filter),
            Order.find(filter)
                .populate('user_id', 'name email phone')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(page_size)
                .lean()
        ]);

        return res.json({
            success: true,
            page,
            page_size,
            total,
            total_pages: Math.ceil(total / page_size),
            data: orders
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update order status (Admin)
// @route   PATCH /api/v1/admin/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.status = status;
        await order.save();

        return res.json({
            success: true,
            message: 'Order status updated',
            data: order
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message || 'Server error'
        });
    }
};

module.exports = {
    createOrder,
    getOrders,
    getOrder,
    cancelOrder,
    getAllOrders,
    updateOrderStatus
};
