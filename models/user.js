const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: {
        type: String,
        enum: ['admin', 'user'],
    }
});

const User = mongoose.model('user', UserSchema);

module.exports = User;