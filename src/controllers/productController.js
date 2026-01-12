const Product = require('../models/Product');

// Helper function to normalize units from legacy format or new format
function normalizeUnits(payload) {
    // If units array is provided, use it
    if (payload.units && Array.isArray(payload.units) && payload.units.length > 0) {
        return payload.units;
    }

    // If legacy unit field is provided, convert it to units array
    if (payload.unit) {
        if (payload.unit === 'both') {
            return ['box', 'dozen'];
        } else if (['box', 'dozen'].includes(payload.unit)) {
            return [payload.unit];
        }
    }

    // Default to dozen if nothing provided
    return ['dozen'];
}

// @desc    Create product
// @route   POST /api/v1/admin/products
// @access  Private/Admin
const createProduct = async (req, res) => {
    try {
        const payload = req.validatedBody;

        // Normalize units from legacy or new format
        const normalizedUnits = normalizeUnits(payload);

        // Create product with normalized units
        const product = new Product({
            ...payload,
            units: normalizedUnits,
            unit: null // Clear legacy field
        });
        await product.save();

        return res.status(201).json({
            success: true,
            data: product
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message || 'Server error'
        });
    }
};

// @desc    Get product by id
// @route   GET /api/v1/products/:id
// @access  Public
const getProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id)
            .populate('category_id', 'name slug')
            .lean();

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        return res.json({
            success: true,
            data: product
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    List products (pagination + filters)
// @route   GET /api/v1/products
// @access  Public
// @query   page, page_size, unit, is_active, category_id, q (search)
const listProducts = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const page_size = Math.min(100, Math.max(10, parseInt(req.query.page_size) || 20));
        const skip = (page - 1) * page_size;

        const filter = {};

        // Filter by unit
        if (req.query.unit) {
            filter.unit = req.query.unit;
        }

        // Filter by active status (default to active for public)
        if (req.query.is_active !== undefined) {
            filter.is_active = req.query.is_active === 'true';
        } else {
            filter.is_active = true; // Default to active products
        }

        // Filter by category
        if (req.query.category_id) {
            filter.category_id = req.query.category_id;
        }

        // Text search - use regex for short queries, text search for longer
        if (req.query.q && req.query.q.length >= 2) {
            if (req.query.q.length < 4) {
                // Regex for short queries (2-3 chars)
                filter.name = { $regex: req.query.q, $options: 'i' };
            } else {
                // Text search for longer queries (4+ chars)
                filter.$text = { $search: req.query.q };
            }
        }

        const [total, products] = await Promise.all([
            Product.countDocuments(filter),
            Product.find(filter)
                .populate('category_id', 'name slug icon_url')
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
            products
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update product
// @route   PUT /api/v1/admin/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.validatedBody;

        // Normalize units if provided
        if (updates.units || updates.unit) {
            updates.units = normalizeUnits(updates);
            updates.unit = null; // Clear legacy field
        }

        const product = await Product.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        ).lean();

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        return res.json({
            success: true,
            data: product
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message || 'Server error'
        });
    }
};

// @desc    Delete (soft-delete) product
// @route   DELETE /api/v1/admin/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndUpdate(
            id,
            { is_active: false },
            { new: true }
        ).lean();

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        return res.json({
            success: true,
            message: 'Product deactivated',
            data: product
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get products by category
// @route   GET /api/v1/products/category/:categoryId
// @access  Public
const getProductsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const page_size = Math.min(100, Math.max(10, parseInt(req.query.page_size) || 20));
        const skip = (page - 1) * page_size;

        const filter = {
            category_id: categoryId,
            is_active: true
        };

        const [total, products] = await Promise.all([
            Product.countDocuments(filter),
            Product.find(filter)
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
            products
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
    createProduct,
    getProduct,
    listProducts,
    updateProduct,
    deleteProduct,
    getProductsByCategory
};
