const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');
const crawlerDetection = require('./middleware/crawlerDetection');
const metaRoutes = require('./routes/metaRoutes');
const routes = require('./routes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Crawler detection middleware
app.use(crawlerDetection);

// Meta tag routes for social media crawlers (must be before API routes)
app.use((req, res, next) => {
    // Only serve meta HTML to crawlers on product routes
    if (req.isCrawler && req.path.startsWith('/product/')) {
        // Use the metaRoutes router
        metaRoutes.handle(req, res, next);
    } else {
        next();
    }
});


// API Routes
app.use('/api/v1', routes);

// Base route for testing
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error Handler
app.use(errorHandler);

module.exports = app;
