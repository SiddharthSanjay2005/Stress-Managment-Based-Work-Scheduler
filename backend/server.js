const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:8000', 'http://127.0.0.1:8000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Database connection with retry logic
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetable_db', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        console.log('✅ Connected to MongoDB database');
        
        // Connection event handlers
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected. Attempting to reconnect...');
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });
        
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.log('💡 Make sure MongoDB is running:');
        console.log('   npm run start-mongo');
        console.log('   OR');
        console.log('   mongod --dbpath ./data/db');
        process.exit(1);
    }
};

// Connect to database
connectDB();

// Import routes
const timetableRoutes = require('./routes/timetable');
app.use('/api/timetable', timetableRoutes);

// Default route
app.get('/', (req, res) => {
    res.json({
        message: 'AI Timetable Generator API - MVGR College',
        version: '2.0.0',
        status: 'active',
        endpoints: {
            health: 'GET /api/timetable/health',
            generateAI: 'POST /api/timetable/generate-ai',
            generateSimple: 'POST /api/timetable/generate-simple',
            initData: 'POST /api/timetable/init-college-data',
            stats: 'GET /api/timetable/stats/summary',
            departments: 'GET /api/timetable/departments/all',
            faculty: 'GET /api/timetable/faculty/all',
            getTimetable: 'GET /api/timetable/:department/:semester',
            getAllTimetables: 'GET /api/timetable'
        },
        documentation: 'See frontend for usage instructions'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.url} not found`
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}`);
    console.log(`🌐 Frontend should be at http://localhost:8000`);
    console.log(`🔗 MongoDB: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/timetable_db'}`);
    console.log(`📚 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down server...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});