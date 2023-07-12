const isAdmin = (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ msg: 'No authentication token, authorization denied' });
        }
        if (user.role !== 'admin') {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = isAdmin;