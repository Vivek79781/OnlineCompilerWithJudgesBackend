const isNotProduction = (req, res, next) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(401).json({ msg: 'Production Phase' });
        } else {
            next();
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = isNotProduction;