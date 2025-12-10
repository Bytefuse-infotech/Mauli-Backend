const UserSession = require('../models/UserSession');

// @desc    Get All Sessions (Admin)
// @route   GET /api/v1/admin/sessions
// @access  Private/Admin
const getSessions = async (req, res) => {
    try {
        const pageSize = 20;
        const page = Number(req.query.pageNumber) || 1;
        const query = {};

        // Filter by user
        if (req.query.userId) {
            query.user_id = req.query.userId;
        }

        // Filter by date (sessions started after date)
        if (req.query.startDate) {
            query.start_at = { $gte: new Date(req.query.startDate) };
        }

        // Filter by had_order
        if (req.query.had_order) {
            query.had_order = req.query.had_order === 'true';
        }

        const count = await UserSession.countDocuments(query);
        const sessions = await UserSession.find(query)
            .populate('user_id', 'name email role')
            .limit(pageSize)
            .skip(pageSize * (page - 1))
            .sort({ start_at: -1 })
            .lean();

        res.json({ sessions, page, pages: Math.ceil(count / pageSize), total: count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get My Sessions
// @route   GET /api/v1/me/sessions
// @access  Private
const getMySessions = async (req, res) => {
    try {
        const pageSize = 20;
        const page = Number(req.query.pageNumber) || 1;

        const sessions = await UserSession.find({ user_id: req.user._id })
            .limit(pageSize)
            .skip(pageSize * (page - 1))
            .sort({ start_at: -1 })
            .lean();

        res.json({ sessions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getSessions,
    getMySessions
};
