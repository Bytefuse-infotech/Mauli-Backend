const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get user's cart
// @route   GET /api/v1/cart
// @access  Private
const getCart = async (req, res) => {
    try {
        let cart = await Cart.getOrCreateCart(req.user._id);
        cart = await cart.populate('items.product_id', 'name price discount images is_active');

        const totals = cart.calculateTotals();

        return res.json({
            success: true,
            data: {
                cart,
                ...totals
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

// @desc    Add item to cart
// @route   POST /api/v1/cart/items
// @access  Private
const addToCart = async (req, res) => {
    try {
        const { product_id, quantity, unit } = req.body;

        if (!product_id || !quantity || !unit) {
            return res.status(400).json({
                success: false,
                message: 'product_id, quantity, and unit are required'
            });
        }

        // Verify product exists and is active
        const product = await Product.findById(product_id);

        if (!product || !product.is_active) {
            return res.status(404).json({
                success: false,
                message: 'Product not found or inactive'
            });
        }

        // Verify unit is valid for this product
        // Support both new units array and legacy unit field for backward compatibility
        const availableUnits = product.units && Array.isArray(product.units) && product.units.length > 0
            ? product.units
            : (product.unit === 'both' ? ['box', 'dozen'] : [product.unit]);

        if (!availableUnits.includes(unit)) {
            return res.status(400).json({
                success: false,
                message: `Product only available in: ${availableUnits.join(', ')}`
            });
        }

        const cart = await Cart.getOrCreateCart(req.user._id);

        // Check if item already exists
        const existingItemIndex = cart.items.findIndex(
            item => item.product_id.toString() === product_id && item.unit === unit
        );

        if (existingItemIndex > -1) {
            // Update quantity
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            cart.items.push({
                product_id,
                quantity,
                unit,
                price_at_add: product.price,
                discount_at_add: product.discount
            });
        }

        await cart.save();
        await cart.populate('items.product_id', 'name price discount images');

        const totals = cart.calculateTotals();

        return res.json({
            success: true,
            message: 'Item added to cart',
            data: {
                cart,
                ...totals
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message || 'Server error'
        });
    }
};

// @desc    Update cart item quantity
// @route   PUT /api/v1/cart/items/:product_id
// @access  Private
const updateCartItem = async (req, res) => {
    try {
        const { product_id } = req.params;
        const { quantity, unit } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Valid quantity is required'
            });
        }

        const cart = await Cart.findOne({ user_id: req.user._id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const itemIndex = cart.items.findIndex(
            item => item.product_id.toString() === product_id && item.unit === unit
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        cart.items[itemIndex].quantity = quantity;
        await cart.save();
        await cart.populate('items.product_id', 'name price discount images');

        const totals = cart.calculateTotals();

        return res.json({
            success: true,
            message: 'Cart updated',
            data: {
                cart,
                ...totals
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

// @desc    Remove item from cart
// @route   DELETE /api/v1/cart/items/:product_id
// @access  Private
const removeFromCart = async (req, res) => {
    try {
        const { product_id } = req.params;
        const { unit } = req.query;

        const cart = await Cart.findOne({ user_id: req.user._id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.items = cart.items.filter(
            item => !(item.product_id.toString() === product_id && item.unit === unit)
        );

        await cart.save();
        await cart.populate('items.product_id', 'name price discount images');

        const totals = cart.calculateTotals();

        return res.json({
            success: true,
            message: 'Item removed from cart',
            data: {
                cart,
                ...totals
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

// @desc    Clear cart
// @route   DELETE /api/v1/cart
// @access  Private
const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user_id: req.user._id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.items = [];
        await cart.save();

        return res.json({
            success: true,
            message: 'Cart cleared',
            data: {
                cart,
                subtotal: 0,
                item_count: 0
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

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
};
