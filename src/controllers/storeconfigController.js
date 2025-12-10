const StoreConfig = require('../models/StoreConfig');

// @desc    Get store configuration
// @route   GET /api/v1/storeconfig
// @access  Public
const getStoreConfig = async (req, res) => {
    try {
        const tenant_id = req.query.tenant_id || null;
        const config = await StoreConfig.getConfig(tenant_id);

        return res.json({
            success: true,
            data: config
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update store configuration
// @route   PUT /api/v1/storeconfig
// @access  Private/Admin
const updateStoreConfig = async (req, res) => {
    try {
        const tenant_id = req.body.tenant_id || null;
        const updateData = { ...req.body };
        delete updateData.tenant_id; // Don't allow changing tenant_id

        const config = await StoreConfig.findOneAndUpdate(
            { tenant_id },
            updateData,
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        return res.json({
            success: true,
            data: config
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message || 'Server error'
        });
    }
};

// @desc    Compute delivery fee and discount
// @route   POST /api/v1/storeconfig/compute
// @access  Public
const computeCartTotal = async (req, res) => {
    try {
        const { cart_value, distance_km = 0, tenant_id = null } = req.body;

        if (!cart_value || cart_value < 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid cart_value is required'
            });
        }

        const config = await StoreConfig.getConfig(tenant_id);

        // Calculate delivery fee
        let delivery_fee = 0;
        if (config.delivery_fee.type === 'flat') {
            delivery_fee = config.delivery_fee.base_fee;
        } else if (config.delivery_fee.type === 'per_km') {
            delivery_fee = config.delivery_fee.base_fee + (config.delivery_fee.rate * distance_km);
        }

        // Find applicable discount (highest priority, then best value)
        let applied_discount_rule = null;
        let discount_amount = 0;

        const applicable_discounts = config.cart_discounts
            .filter(d => cart_value >= d.min_cart_value)
            .sort((a, b) => {
                // Sort by priority (higher first), then by value
                if (b.priority !== a.priority) {
                    return b.priority - a.priority;
                }
                return b.value - a.value;
            });

        if (applicable_discounts.length > 0) {
            applied_discount_rule = applicable_discounts[0];

            if (applied_discount_rule.discount_type === 'flat') {
                discount_amount = applied_discount_rule.value;
            } else if (applied_discount_rule.discount_type === 'percentage') {
                discount_amount = (cart_value * applied_discount_rule.value) / 100;
            }

            // Apply max discount cap if set
            if (applied_discount_rule.max_discount_amount) {
                discount_amount = Math.min(discount_amount, applied_discount_rule.max_discount_amount);
            }
        }

        const final_amount = Math.max(0, cart_value - discount_amount + delivery_fee);

        return res.json({
            success: true,
            data: {
                cart_value,
                delivery_fee,
                discount_amount,
                final_amount,
                applied_discount_rule: applied_discount_rule ? {
                    discount_type: applied_discount_rule.discount_type,
                    value: applied_discount_rule.value,
                    min_cart_value: applied_discount_rule.min_cart_value
                } : null
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Reserve a delivery slot
// @route   POST /api/v1/storeconfig/reserve-slot
// @access  Public
const reserveSlot = async (req, res) => {
    try {
        const { date, start_time, tenant_id = null } = req.body;

        if (!date || !start_time) {
            return res.status(400).json({
                success: false,
                message: 'Date and start_time are required'
            });
        }

        // Parse date to ensure consistency
        const targetDate = new Date(date);
        targetDate.setUTCHours(0, 0, 0, 0);

        // Get current config
        const config = await StoreConfig.findOne({ tenant_id });

        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'Store config not found'
            });
        }

        // Find the date slot (normalize stored dates too)
        const dateSlot = config.delivery_slots.find(ds => {
            const storedDate = new Date(ds.date);
            storedDate.setUTCHours(0, 0, 0, 0);
            return storedDate.getTime() === targetDate.getTime();
        });

        if (!dateSlot) {
            return res.status(400).json({
                success: false,
                message: 'No slots available for this date'
            });
        }

        // Find the time slot
        const timeSlot = dateSlot.slots.find(s => s.start_time === start_time);

        if (!timeSlot) {
            return res.status(400).json({
                success: false,
                message: 'Time slot not found'
            });
        }

        // Check capacity
        if (timeSlot.booked >= timeSlot.capacity) {
            return res.status(400).json({
                success: false,
                message: 'Slot not available or capacity exceeded'
            });
        }

        // Increment booked count
        timeSlot.booked += 1;

        // Save the updated config
        await config.save();

        return res.json({
            success: true,
            message: 'Slot reserved successfully',
            data: config
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
    getStoreConfig,
    updateStoreConfig,
    computeCartTotal,
    reserveSlot
};
