// Crawler Detection Middleware
// Detects social media crawlers and bots for serving static meta tags

const isCrawler = (userAgent) => {
    if (!userAgent) return false;

    const crawlerPatterns = [
        /WhatsApp/i,
        /facebookexternalhit/i,
        /Facebot/i,
        /Twitterbot/i,
        /LinkedInBot/i,
        /Slackbot/i,
        /TelegramBot/i,
        /Pinterest/i,
        /SkypeUriPreview/i,
        /Discordbot/i,
        /Google-InspectionTool/i,
        /bot/i,
        /crawler/i,
        /spider/i
    ];

    return crawlerPatterns.some(pattern => pattern.test(userAgent));
};

const crawlerDetection = (req, res, next) => {
    const userAgent = req.get('user-agent') || '';
    req.isCrawler = isCrawler(userAgent);
    next();
};

module.exports = crawlerDetection;
