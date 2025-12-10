const getHealth = (req, res) => {
    res.status(200).json({ message: 'Server is running', status: 'OK' });
};

module.exports = {
    getHealth,
};
