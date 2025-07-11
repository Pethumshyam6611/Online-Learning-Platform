const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();


const app = express();

// Enable CORS for cross-origin requests and parse JSON bodies
app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas using the URI from .env
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Track API requests to enforce 250-request limit
let apiRequestCount = 0;
const logRequest = () => {
  apiRequestCount++;
  // Log request timestamp to file
  fs.appendFileSync('api_requests.log', `Request ${apiRequestCount} at ${new Date().toISOString()}\n`);
  // Throw error if limit reached
  if (apiRequestCount >= 250) {
    throw new Error('API request limit of 250 reached');
  }
};


app.use('/api/auth', require('./routes/auth')); // Authentication routes
app.use('/api/courses', require('./routes/courses')); // Course management routes
app.use('/api/recommend', require('./routes/recommend')(logRequest)); // Course recommendation route

// Handle 404 errors for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
});

// Start server on specified port (default 5000)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));