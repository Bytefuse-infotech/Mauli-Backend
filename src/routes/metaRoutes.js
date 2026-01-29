const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Generate static HTML with Open Graph meta tags for a product
const generateProductHTML = (product, baseUrl) => {
    const productUrl = `${baseUrl}/product/${product._id}`;
    const imageUrl = product.images && product.images.length > 0
        ? product.images[0].url
        : `${baseUrl}/icon.png`;

    const description = product.description
        ? `${product.description.substring(0, 150)}...`
        : `Buy ${product.name} - Best quality products at Grahak Peth`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${product.name} | Grahak Peth</title>
  
  <!-- Primary Meta Tags -->
  <meta name="title" content="${product.name}">
  <meta name="description" content="${description}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="product">
  <meta property="og:url" content="${productUrl}">
  <meta property="og:title" content="${product.name}">
  <meta property="og:description" content="Price: ₹${product.price} - ${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${productUrl}">
  <meta property="twitter:title" content="${product.name}">
  <meta property="twitter:description" content="Price: ₹${product.price} - ${description}">
  <meta property="twitter:image" content="${imageUrl}">
  
  <!-- WhatsApp -->
  <meta property="og:site_name" content="Grahak Peth">
  <meta property="og:locale" content="en_US">
  
  <!-- Redirect to React app after meta tags are read -->
  <meta http-equiv="refresh" content="0;url=${productUrl}">
  <script>
    window.location.href = "${productUrl}";
  </script>
</head>
<body>
  <h1>${product.name}</h1>
  <p>${description}</p>
  <p>Price: ₹${product.price}</p>
  <a href="${productUrl}">View Product</a>
</body>
</html>`;
};

// Route to serve product meta tags for crawlers
router.get('/product/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch product from database
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Get base URL from request
        const protocol = req.protocol;
        const host = req.get('host');
        const baseUrl = `${protocol}://${host}`;

        // Generate and send HTML
        const html = generateProductHTML(product, baseUrl);
        res.set('Content-Type', 'text/html');
        res.send(html);

    } catch (error) {
        console.error('Error generating product meta tags:', error);
        res.status(500).send('Error loading product');
    }
});

module.exports = router;
