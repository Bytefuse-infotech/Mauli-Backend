require('dotenv').config();
const http = require('http');
const app = require('./app');

const connectDB = require('./config/db');
const { initializeWebSocket } = require('./utils/websocket');

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Initialize Firebase Admin SDK for push notifications
const { initializeFirebase } = require('./utils/firebase');
initializeFirebase();

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket for real-time banner builder updates
initializeWebSocket(server, app);

server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`WebSocket server ready for real-time connections`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});
