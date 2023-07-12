const express = require('express');
const app = express();
const upload = require('express-fileupload');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Connect to MongoDB
dotenv.config();
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected...')).catch(err => console.log(err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// File Upload
app.use(upload());

// Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/admin', require('./routes/api/admin'));
app.use('/api/questions', require('./routes/api/questions'));

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
