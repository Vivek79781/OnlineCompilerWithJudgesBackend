const router = require('express').Router();
const validator = require('express-validator')
const bcrypt = require('bcryptjs');
const User = require('../../models/user');
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');

// @route   GET api/users
// @desc    Get all users
// @access  Public
router.get('/', async (req, res) => {
    try {
        const users = await User.find();

        return res.status(200).json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST api/users
// @desc    Create a user (signup)
// @access  Public
router.post('/',
    [
        validator.check('name', 'Name is required').not().isEmpty(),
        validator.check('email', 'Please include a valid email').isEmail(),
        validator.check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    ],
    async (req, res) => {
        const errors = validator.validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { email, name, password } = req.body
            let user = await User.findOne({email})

            if(user) {
                return res.status(400).json({ errors: [ {msg:"User Already Exist"} ] })
            }

            user = new User({
                name,
                password,
                email,
                role: 'user'
            })

            const salt = await bcrypt.genSalt(10)
            user.password = await bcrypt.hash(password,salt)
            await user.save()

            const payload = {
                id: user.id
            }

            jwt.sign(
                payload, 
                process.env.JWT_SECRET,
                {expiresIn: 86400},
                (err,token) => {
                    if(err) throw err;
                    res.json({ 
                        success: true,
                        token,
                        email
                    })
                }
            )
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// @route   GET api/users/:id
// @desc    Get a user
// @access  Public

router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   PUT api/users/:id
// @desc    Update a user
// @access  Private
router.put('/:id', 
    [
        validator.check('name', 'Name is required').not().isEmpty(),
        validator.check('email', 'Please include a valid email').isEmail(),
        validator.check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    ],
    auth,
    async (req, res) => {
        const errors = validator.validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            let user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ msg: 'User not found' });
            } else if (user._id.toString() !== req.user) {
                return res.status(401).json({ msg: 'Not authorized' });
            } else {
                user.name = req.body.name || user.name;
                user.email = req.body.email || user.email;
                user.password = req.body.password || user.password;
                user.role = req.body.role || user.role;
                const salt = await bcrypt.genSalt(10)
                user.password = await bcrypt.hash(user.password,salt)
                const updatedUser = await user.save();
                return res.status(200).json({
                    success: true,
                    data: updatedUser,
                });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// @route   DELETE api/users/:id
// @desc    Delete a user
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        } else if (user._id.toString() !== req.user) {
            return res.status(401).json({ msg: 'Not authorized' });
        } else {
            await User.findByIdAndRemove(req.params.id);
            return res.status(200).json({
                success: true,
                data: { msg: 'User removed' },
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});
    

module.exports = router;