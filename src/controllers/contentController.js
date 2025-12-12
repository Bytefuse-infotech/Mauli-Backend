const AppContent = require('../models/AppContent');

// @desc    Get content by key (Public)
// @route   GET /api/v1/content/:key
// @access  Public
const getContent = async (req, res) => {
    try {
        const { key } = req.params;
        const content = await AppContent.findOne({ key, is_visible: true });

        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        res.json(content);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all content keys (Admin)
// @route   GET /api/v1/admin/content
// @access  Private/Admin
const getAllContent = async (req, res) => {
    try {
        const contents = await AppContent.find({});
        res.json(contents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create or Update content (Admin)
// @route   PUT /api/v1/admin/content/:key
// @access  Private/Admin
const updateContent = async (req, res) => {
    try {
        const { key } = req.params;
        const { title, content, is_visible } = req.body;

        let appContent = await AppContent.findOne({ key });

        if (appContent) {
            // Update
            appContent.title = title || appContent.title;
            appContent.content = content || appContent.content;
            if (is_visible !== undefined) appContent.is_visible = is_visible;

            await appContent.save();
        } else {
            // Create
            if (!title || !content) {
                return res.status(400).json({ message: 'Title and content required for new entry' });
            }
            appContent = await AppContent.create({
                key,
                title,
                content,
                is_visible: is_visible !== undefined ? is_visible : true
            });
        }

        res.json(appContent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getContent,
    getAllContent,
    updateContent
};
