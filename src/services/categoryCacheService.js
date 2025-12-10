const redis = require('../lib/redis');

const CACHE_KEY = 'categories:active:v1';
const TTL = process.env.CATEGORIES_CACHE_TTL ? parseInt(process.env.CATEGORIES_CACHE_TTL) : 300;

const cacheActiveCategories = async (data) => {
    if (redis.status === 'ready') {
        const payload = JSON.stringify({
            categories: data,
            fetched_at: new Date(),
            cached: true
        });
        await redis.set(CACHE_KEY, payload, 'EX', TTL);
    }
};

const getCachedActiveCategories = async () => {
    if (redis.status === 'ready') {
        const cached = await redis.get(CACHE_KEY);
        return cached ? JSON.parse(cached) : null;
    }
    return null;
};

const invalidateCategoriesCache = async () => {
    if (redis.status === 'ready') {
        await redis.del(CACHE_KEY);
    }
};

module.exports = {
    cacheActiveCategories,
    getCachedActiveCategories,
    invalidateCategoriesCache
};
