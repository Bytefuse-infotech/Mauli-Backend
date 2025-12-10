const Category = require('../models/Category');
const categoryCacheService = require('../services/categoryCacheService');

// @desc    Get Active Categories (Public)
// @route   GET /api/v1/categories
// @access  Public
const getActiveCategories = async (req, res) => {
    try {
        // 1. Try Cache
        const cachedData = await categoryCacheService.getCachedActiveCategories();
        if (cachedData) {
            return res.json(cachedData);
        }

        // 2. Fetch from DB
        const categories = await Category.findActive().lean();

        // 3. Cache Result
        await categoryCacheService.cacheActiveCategories(categories);

        res.json({
            categories,
            fetched_at: new Date(),
            cached: false
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create Category (Admin)
// @route   POST /api/v1/admin/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
    try {
        const { name, priority, is_active, icon_url, meta } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        const category = await Category.create({
            name,
            priority: priority || 0,
            is_active: is_active !== undefined ? is_active : true,
            icon_url,
            meta
        });

        // Invalidate Cache
        await categoryCacheService.invalidateCategoriesCache();

        res.status(201).json(category);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update Category (Admin)
// @route   PUT /api/v1/admin/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (category) {
            category.name = req.body.name || category.name;
            if (req.body.priority !== undefined) category.priority = req.body.priority;
            if (req.body.is_active !== undefined) category.is_active = req.body.is_active;
            if (req.body.icon_url !== undefined) category.icon_url = req.body.icon_url;
            if (req.body.meta !== undefined) category.meta = req.body.meta;

            // Slug regeneration handled by pre-save hook if name changed
            // If explicit slug passed?? Requirements imply auto-gen, but let's allow explicit if needed?
            // "re-generates slug only if slug is empty and name changed" - usually model hook handles name change.
            // If user explicitly sends slug:
            if (req.body.slug) category.slug = req.body.slug;

            const updatedCategory = await category.save();

            // Invalidate Cache
            await categoryCacheService.invalidateCategoriesCache();

            res.json(updatedCategory);
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    List Categories (Admin)
// @route   GET /api/v1/admin/categories (or List All)
// @access  Private/Admin
const listCategories = async (req, res) => {
    try {
        const pageSize = 20;
        const page = Number(req.query.pageNumber) || 1;
        const query = {};

        if (req.query.is_active !== undefined) {
            query.is_active = req.query.is_active === 'true';
        }

        const count = await Category.countDocuments(query);
        const categories = await Category.find(query)
            .limit(pageSize)
            .skip(pageSize * (page - 1))
            .sort({ priority: -1, updatedAt: -1 })
            .lean();

        res.json({ categories, page, pages: Math.ceil(count / pageSize), total: count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Toggle Category Active Status
// @route   PATCH /api/v1/admin/categories/:id/toggle
// @access  Private/Admin
const toggleCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (category) {
            category.is_active = !category.is_active;
            await category.save();

            // Invalidate Cache
            await categoryCacheService.invalidateCategoriesCache();

            res.json({ message: `Category ${category.is_active ? 'activated' : 'deactivated'}`, is_active: category.is_active });
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete Category (Hard Delete for now based on prompt saying hard or optional)
// @route   DELETE /api/v1/admin/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (category) {
            await Category.deleteOne({ _id: category._id });

            // Invalidate Cache
            await categoryCacheService.invalidateCategoriesCache();

            res.json({ message: 'Category removed' });
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getActiveCategories,
    createCategory,
    updateCategory,
    listCategories,
    toggleCategory,
    deleteCategory
};
