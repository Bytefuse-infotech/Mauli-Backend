const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    lazyConnect: true, // Don't connect immediately on instantiation
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

redis.on('error', (err) => {
    // Only log actual connection errors if we're not in test mode or if it's critical
    if (process.env.NODE_ENV !== 'test') {
        console.warn('Redis connection issue:', err.message);
    }
});

redis.on('connect', () => {
    if (process.env.NODE_ENV !== 'test') {
        console.log('Redis connected');
    }
});

module.exports = redis;
