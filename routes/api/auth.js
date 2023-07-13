const router = require('express').Router();
const User = require('../../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../../middleware/auth');

// @route   POST api/auth
// @desc    Authenticate user (login)
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ msg: 'Please enter all fields' });
        }

        // Check for existing user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'User does not exist' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: 86400 });

        return res.status(200).json({
            success: true,
            token,
            email: user.email,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private

router.get('/user', auth, async (req, res) => {
    try {
        const user = req.user;
        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;