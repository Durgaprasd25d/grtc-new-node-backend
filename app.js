const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors')

const app = express();
const PORT = process.env.PORT || 3000;

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');

const imageRoute = require('./routes/imgToBase64')


app.use(cors());

// Add a limit to the request body size
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));



// Middleware
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api', imageRoute);

// Connect to MongoDB
mongoose.connect('mongodb+srv://mark_2:mark100@hukul.cxlxfwa.mongodb.net/studentManagement', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
