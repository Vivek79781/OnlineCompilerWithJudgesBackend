const router = require('express').Router();
const validator = require('express-validator')
const bcrypt = require('bcryptjs');
const User = require('../../models/user');
const auth = require('../../middleware/auth');
const isAdmin = require('../../middleware/isAdmin');
const isNotProduction = require('../../middleware/isNotProduction');
const jwt = require('jsonwebtoken');

// @route   GET api/admin
// @desc    Get all admins 
// @access  Private
router.get('/', auth, isAdmin, async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' });
        return res.status(200).json({
            success: true,
            count: admins.length,
            data: admins,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST api/admin
// @desc    Create an admin user
// @access  Private
router.post('/',
    [
        validator.check('name', 'Name is required').not().isEmpty(),
        validator.check('email', 'Please include a valid email').isEmail(),
        validator.check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    ],
    auth, isAdmin, async (req, res) => {
        console.log(req.body)
        const errors = validator.validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { email, name, password } = req.body
            console.log(req.body)
            let user = await User.findOne({email})

            if(user) {
                return res.status(400).json({ errors: [ {msg:"User Already Exist"} ] })
            }

            user = new User({
                name,
                password,
                email,
                role: 'admin'
            })

            const salt = await bcrypt.genSalt(10)
            user.password = await bcrypt.hash(password,salt)
            await user.save()

            const payload = {
                id: user.id,
            }

            jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: 360000}, (err, token) => {
                if(err) throw err;
                res.json({
                    success: true,
                    token,
                    email: user.email,
                })
            })
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// @route   POST api/admin/create
// @desc    Create an admin user
// @access  Public
router.post('/create',
    [
        validator.check('name', 'Name is required').not().isEmpty(),
        validator.check('email', 'Please include a valid email').isEmail(),
        validator.check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    ],
    isNotProduction,
    async (req, res) => {
        const errors = validator.validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { email, name, password } = req.body
            let admin = await User.findOne({email})
            if (admin) {
                return res.status(400).json({ errors: [ {msg:"User Already Exist"} ] })
            }
            admin = new User({
                name,
                password,
                email,
                role: 'admin'
            })
            const salt = await bcrypt.genSalt(10)
            admin.password = await bcrypt.hash(password,salt)
            await admin.save()
            const payload = {
                id: admin.id,
            }

            jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: 360000}, (err, token) => {
                if(err) throw err;
                res.json({
                    success: true,
                    token,
                    email: admin.email,
                })
            })
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);


// @route   DELETE api/admin/:id
// @desc    Delete an admin user
// @access  Private
router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        await User.findByIdAndRemove(req.params.id);
        return res.status(200).json({ 
            success: true,
            data: {
                msg: 'Admin removed',
            }, 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   PUT api/admin/:id
// @desc    Update an admin user
// @access  Private
router.put('/:id',
    [
        validator.check('name', 'Name is required').not().isEmpty(),
        validator.check('email', 'Please include a valid email').isEmail(),
        validator.check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    ],
    auth, isAdmin, async (req, res) => {
        const errors = validator.validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            let admin = await User.findById(req.params.id);
            if (!admin) {
                return res.status(404).json({ msg: 'Admin not found' });
            } else if (admin._id.toString() !== req.user.id) {
                return res.status(401).json({ msg: 'Not authorized' });
            } else {
                const { email, name, password } = req.body
                let checkAdmin = await User.findOne({email})
                
                if(checkAdmin && checkAdmin._id.toString() !== req.params.id) {
                    return res.status(400).json({ errors: [ {msg:"User Already Exist"} ] })
                }

                admin.name = name
                admin.email = email
                admin.password = password

                const salt = await bcrypt.genSalt(10)
                admin.password = await bcrypt.hash(password,salt)
                await admin.save()
                
                return res.status(200).json({ 
                    success: true,
                    data: admin,
                 });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

module.exports = router;

