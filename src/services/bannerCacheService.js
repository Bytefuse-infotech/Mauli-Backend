const redis = require('../lib/redis');

const CACHE_KEY = 'banners:v1:visible';
const TTL_SECONDS = 45;

const cacheVisibleBanners = async (data) => {
    if (redis.status === 'ready') {
        const payload = JSON.stringify({
            banners: data,
            fetched_at: new Date()
        });
        await redis.set(CACHE_KEY, payload, 'EX', TTL_SECONDS);
    }
};

const getCachedVisibleBanners = async () => {
    if (redis.status === 'ready') {
        const cached = await redis.get(CACHE_KEY);
        return cached ? JSON.parse(cached) : null;
    }
    return null;
};

const invalidateBannersCache = async () => {
    if (redis.status === 'ready') {
        await redis.del(CACHE_KEY);
    }
};

module.exports = {
    cacheVisibleBanners,
    getCachedVisibleBanners,
    invalidateBannersCache
};
