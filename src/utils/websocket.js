const { Server } = require('socket.io');

/**
 * WebSocket Setup for Banner Builder Real-time Updates
 * 
 * Events:
 * - banner:subscribe - Subscribe to a specific banner's updates
 * - banner:unsubscribe - Unsubscribe from a banner's updates
 * - banner:liveUpdate - Send live updates during editing (throttled)
 * 
 * Server Events:
 * - banner:created - New banner created
 * - banner:updated - Banner updated
 * - banner:deleted - Banner deleted
 * - banner:preview - Live preview update for specific banner
 * - banner:statusChanged - Banner status changed
 */

/**
 * Initialize Socket.io with the HTTP server
 * @param {Object} server - HTTP server instance
 * @param {Object} app - Express app instance
 * @returns {Object} Socket.io instance
 */
const initializeWebSocket = (server, app) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Store io instance in app for use in controllers
    app.set('io', io);

    // Connection handler
    io.on('connection', (socket) => {
        console.log(`[WebSocket] Client connected: ${socket.id}`);

        // Subscribe to specific banner room for live preview
        socket.on('banner:subscribe', (bannerId) => {
            if (bannerId) {
                socket.join(`banner:${bannerId}`);
                console.log(`[WebSocket] Client ${socket.id} subscribed to banner:${bannerId}`);
            }
        });

        // Unsubscribe from banner room
        socket.on('banner:unsubscribe', (bannerId) => {
            if (bannerId) {
                socket.leave(`banner:${bannerId}`);
                console.log(`[WebSocket] Client ${socket.id} unsubscribed from banner:${bannerId}`);
            }
        });

        // Live update during editing (broadcasts to all subscribed clients)
        socket.on('banner:liveUpdate', (data) => {
            const { bannerId, changes } = data;
            if (bannerId && changes) {
                // Broadcast to all clients in the banner room except sender
                socket.to(`banner:${bannerId}`).emit('banner:preview', {
                    bannerId,
                    changes,
                    timestamp: new Date()
                });
            }
        });

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            console.log(`[WebSocket] Client disconnected: ${socket.id}, reason: ${reason}`);
        });

        // Error handling
        socket.on('error', (error) => {
            console.error(`[WebSocket] Socket error for ${socket.id}:`, error);
        });
    });

    // Namespace for admin operations (optional, for future use)
    const adminNamespace = io.of('/admin');
    adminNamespace.on('connection', (socket) => {
        console.log(`[WebSocket] Admin client connected: ${socket.id}`);

        // You could add authentication middleware here
        // socket.use((packet, next) => { ... });
    });

    console.log('[WebSocket] Server initialized successfully');

    return io;
};

/**
 * Utility function to broadcast banner updates
 * @param {Object} io - Socket.io instance
 * @param {String} eventType - Event type (created, updated, deleted)
 * @param {Object} data - Event data
 */
const broadcastBannerUpdate = (io, eventType, data) => {
    if (io) {
        io.emit(`banner:${eventType}`, data);
    }
};

module.exports = {
    initializeWebSocket,
    broadcastBannerUpdate
};
