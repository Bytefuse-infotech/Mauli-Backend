const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5009/api/v1';
const TEST_USER = {
    phone: '918108053372',
    password: 'qwerty@123'
};

// Store auth token and test data
let authToken = '';
let productIds = [];
let orderId = '';
let cartData = null;

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Helper functions
const log = {
    section: (text) => console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`),
    title: (text) => console.log(`${colors.bright}${colors.blue}📋 ${text}${colors.reset}`),
    success: (text) => console.log(`${colors.green}✅ ${text}${colors.reset}`),
    error: (text) => console.log(`${colors.red}❌ ${text}${colors.reset}`),
    info: (text) => console.log(`${colors.yellow}ℹ️  ${text}${colors.reset}`),
    data: (label, data) => console.log(`${colors.cyan}   ${label}:${colors.reset}`, JSON.stringify(data, null, 2))
};

// API call wrapper with error handling
async function apiCall(method, endpoint, data = null, description = '') {
    log.section();
    log.title(description || `${method.toUpperCase()} ${endpoint}`);

    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
        };

        if (data) {
            config.data = data;
            log.info('Request Body:');
            log.data('', data);
        }

        const response = await axios(config);
        log.success(`Status: ${response.status}`);
        log.data('Response', response.data);
        return response.data;
    } catch (error) {
        log.error(`Failed: ${error.response?.status || 'Network Error'}`);
        if (error.response?.data) {
            log.data('Error Details', error.response.data);
        } else {
            log.error(error.message);
        }
        throw error;
    }
}

// Test functions
async function test1_Login() {
    const response = await apiCall('post', '/auth/login', TEST_USER, 'TEST 1: User Login');
    authToken = response.accessToken;
    log.success(`Auth token obtained: ${authToken.substring(0, 20)}...`);
}

async function test2_GetProducts() {
    const response = await apiCall('get', '/products?page=1&page_size=5', null, 'TEST 2: Get Available Products');

    if (response.products && response.products.length > 0) {
        productIds = response.products
            .filter(p => p.is_active)
            .slice(0, 3)
            .map(p => p._id);

        log.success(`Found ${productIds.length} active products for testing`);
        response.products.slice(0, 3).forEach((p, i) => {
            log.info(`Product ${i + 1}: ${p.name} (₹${p.price}, Stock: ${p.stock || 'N/A'})`);
        });
    } else {
        log.error('No products found! Please add products first.');
        throw new Error('No products available');
    }
}

async function test3_GetEmptyCart() {
    const response = await apiCall('get', '/cart', null, 'TEST 3: Get Cart (Should be empty initially)');
    cartData = response.data;
}

async function test4_AddToCart() {
    if (productIds.length === 0) {
        log.error('No products available to add to cart');
        return;
    }

    // Add first product
    await apiCall('post', '/cart/items', {
        product_id: productIds[0],
        quantity: 2,
        unit: 'box'
    }, 'TEST 4a: Add First Product to Cart (2 boxes)');

    // Add second product
    if (productIds.length > 1) {
        await apiCall('post', '/cart/items', {
            product_id: productIds[1],
            quantity: 1,
            unit: 'box'
        }, 'TEST 4b: Add Second Product to Cart (1 box)');
    }

    // Add third product with dozen unit
    if (productIds.length > 2) {
        await apiCall('post', '/cart/items', {
            product_id: productIds[2],
            quantity: 3,
            unit: 'dozen'
        }, 'TEST 4c: Add Third Product to Cart (3 dozen)');
    }
}

async function test5_GetCartWithItems() {
    const response = await apiCall('get', '/cart', null, 'TEST 5: Get Cart (With Items)');
    cartData = response.data;

    if (cartData.cart && cartData.cart.items) {
        log.info(`Cart Summary:`);
        log.info(`  Total Items: ${cartData.item_count}`);
        log.info(`  Subtotal: ₹${cartData.subtotal}`);
        cartData.cart.items.forEach((item, i) => {
            log.info(`  Item ${i + 1}: ${item.product_id?.name || 'Unknown'} - ${item.quantity} ${item.unit}(s)`);
        });
    }
}

async function test6_UpdateCartItem() {
    if (!cartData?.cart?.items || cartData.cart.items.length === 0) {
        log.error('No items in cart to update');
        return;
    }

    const firstItem = cartData.cart.items[0];
    await apiCall('put', `/cart/items/${firstItem.product_id._id}?unit=${firstItem.unit}`, {
        quantity: 5,
        unit: firstItem.unit
    }, `TEST 6: Update Cart Item Quantity (Change to 5 ${firstItem.unit}s)`);
}

async function test7_GetUpdatedCart() {
    const response = await apiCall('get', '/cart', null, 'TEST 7: Get Cart After Update');
    cartData = response.data;
}

async function test8_RemoveCartItem() {
    if (!cartData?.cart?.items || cartData.cart.items.length < 2) {
        log.info('Not enough items to test removal');
        return;
    }

    const secondItem = cartData.cart.items[1];
    await apiCall('delete', `/cart/items/${secondItem.product_id._id}?unit=${secondItem.unit}`, null,
        'TEST 8: Remove Second Item from Cart');
}

async function test9_GetCartAfterRemoval() {
    const response = await apiCall('get', '/cart', null, 'TEST 9: Get Cart After Removal');
    cartData = response.data;
}

async function test10_CreateOrder() {
    const orderData = {
        delivery_address: {
            line1: '123 Test Street',
            line2: 'Near Test Market',
            city: 'Pune',
            state: 'Maharashtra',
            postal_code: '411001',
            latitude: 18.5204,
            longitude: 73.8567
        },
        payment_method: 'cod',
        notes: 'Test order - Please handle with care',
        distance_km: 5
    };

    const response = await apiCall('post', '/orders', orderData, 'TEST 10: Create Order from Cart');

    if (response.data) {
        orderId = response.data._id;
        log.success(`Order created with number: ${response.data.order_number}`);
        log.info(`Order Details:`);
        log.info(`  Subtotal: ₹${response.data.subtotal}`);
        log.info(`  Delivery Fee: ₹${response.data.delivery_fee}`);
        log.info(`  Discount: ₹${response.data.discount_amount}`);
        log.info(`  Total Amount: ₹${response.data.total_amount}`);
        log.info(`  Status: ${response.data.status}`);
        log.info(`  Payment Status: ${response.data.payment_status}`);
    }
}

async function test11_GetCartAfterOrder() {
    const response = await apiCall('get', '/cart', null, 'TEST 11: Get Cart After Order (Should be empty)');

    if (response.data.cart && response.data.cart.items.length === 0) {
        log.success('Cart successfully cleared after order placement');
    } else {
        log.error('Cart was not cleared after order!');
    }
}

async function test12_GetUserOrders() {
    await apiCall('get', '/orders?page=1&page_size=10', null, 'TEST 12: Get User Orders (Paginated)');
}

async function test13_GetSingleOrder() {
    if (!orderId) {
        log.error('No order ID available');
        return;
    }

    await apiCall('get', `/orders/${orderId}`, null, 'TEST 13: Get Single Order Details');
}

async function test14_AddItemsForCancellation() {
    // Add items to cart for cancellation test
    if (productIds.length > 0) {
        await apiCall('post', '/cart/items', {
            product_id: productIds[0],
            quantity: 1,
            unit: 'box'
        }, 'TEST 14: Add Item to Cart for Cancellation Test');
    }
}

async function test15_CreateOrderForCancellation() {
    const orderData = {
        delivery_address: {
            line1: '456 Cancel Test Road',
            line2: 'Test Area',
            city: 'Mumbai',
            state: 'Maharashtra',
            postal_code: '400001',
            latitude: 19.0760,
            longitude: 72.8777
        },
        payment_method: 'online',
        notes: 'This order will be cancelled for testing',
        distance_km: 8
    };

    const response = await apiCall('post', '/orders', orderData, 'TEST 15: Create Order for Cancellation Test');

    if (response.data) {
        orderId = response.data._id;
        log.success(`Order created for cancellation: ${response.data.order_number}`);
    }
}

async function test16_CancelOrder() {
    if (!orderId) {
        log.error('No order ID available for cancellation');
        return;
    }

    await apiCall('patch', `/orders/${orderId}/cancel`, null, 'TEST 16: Cancel Order');
}

async function test17_GetCancelledOrder() {
    if (!orderId) {
        log.error('No order ID available');
        return;
    }

    const response = await apiCall('get', `/orders/${orderId}`, null, 'TEST 17: Verify Order Cancellation');

    if (response.data && response.data.status === 'cancelled') {
        log.success('Order successfully cancelled');
    } else {
        log.error('Order cancellation failed or status not updated');
    }
}

async function test18_FilterOrders() {
    await apiCall('get', '/orders?status=cancelled', null, 'TEST 18: Filter Orders by Status (Cancelled)');
}

async function test19_ClearCart() {
    // Add an item first
    if (productIds.length > 0) {
        await apiCall('post', '/cart/items', {
            product_id: productIds[0],
            quantity: 1,
            unit: 'box'
        }, 'TEST 19a: Add Item to Cart');
    }

    await apiCall('delete', '/cart', null, 'TEST 19b: Clear Entire Cart');
}

async function test20_VerifyEmptyCart() {
    const response = await apiCall('get', '/cart', null, 'TEST 20: Verify Cart is Empty');

    if (response.data.cart && response.data.cart.items.length === 0) {
        log.success('Cart successfully cleared');
    }
}

// Main test runner
async function runAllTests() {
    console.log(`\n${colors.bright}${colors.green}${'='.repeat(60)}`);
    console.log(`🚀 CART & ORDER API TESTING SUITE`);
    console.log(`${'='.repeat(60)}${colors.reset}\n`);

    log.info(`Base URL: ${BASE_URL}`);
    log.info(`Test User: ${TEST_USER.phone}`);
    log.info(`Starting tests at: ${new Date().toLocaleString()}`);

    const tests = [
        { name: 'Login', fn: test1_Login },
        { name: 'Get Products', fn: test2_GetProducts },
        { name: 'Get Empty Cart', fn: test3_GetEmptyCart },
        { name: 'Add Items to Cart', fn: test4_AddToCart },
        { name: 'Get Cart with Items', fn: test5_GetCartWithItems },
        { name: 'Update Cart Item', fn: test6_UpdateCartItem },
        { name: 'Get Updated Cart', fn: test7_GetUpdatedCart },
        { name: 'Remove Cart Item', fn: test8_RemoveCartItem },
        { name: 'Get Cart After Removal', fn: test9_GetCartAfterRemoval },
        { name: 'Create Order', fn: test10_CreateOrder },
        { name: 'Verify Cart Cleared', fn: test11_GetCartAfterOrder },
        { name: 'Get User Orders', fn: test12_GetUserOrders },
        { name: 'Get Single Order', fn: test13_GetSingleOrder },
        { name: 'Add Items for Cancellation', fn: test14_AddItemsForCancellation },
        { name: 'Create Order for Cancellation', fn: test15_CreateOrderForCancellation },
        { name: 'Cancel Order', fn: test16_CancelOrder },
        { name: 'Verify Cancellation', fn: test17_GetCancelledOrder },
        { name: 'Filter Orders', fn: test18_FilterOrders },
        { name: 'Clear Cart', fn: test19_ClearCart },
        { name: 'Verify Empty Cart', fn: test20_VerifyEmptyCart }
    ];

    let passed = 0;
    let failed = 0;
    const failedTests = [];

    for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        try {
            await test.fn();
            passed++;
        } catch (error) {
            failed++;
            failedTests.push(test.name);
            log.error(`Test "${test.name}" failed`);
        }

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    log.section();
    console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}`);
    console.log(`📊 TEST SUMMARY`);
    console.log(`${'='.repeat(60)}${colors.reset}\n`);

    log.info(`Total Tests: ${tests.length}`);
    log.success(`Passed: ${passed}`);
    if (failed > 0) {
        log.error(`Failed: ${failed}`);
        log.error(`Failed Tests: ${failedTests.join(', ')}`);
    }

    const successRate = ((passed / tests.length) * 100).toFixed(2);
    console.log(`\n${colors.bright}Success Rate: ${successRate}%${colors.reset}\n`);

    if (failed === 0) {
        console.log(`${colors.green}${colors.bright}🎉 All tests passed successfully! 🎉${colors.reset}\n`);
    } else {
        console.log(`${colors.yellow}${colors.bright}⚠️  Some tests failed. Please review the errors above.${colors.reset}\n`);
    }
}

// Run tests
runAllTests().catch(error => {
    log.error('Test suite failed to complete');
    console.error(error);
    process.exit(1);
});
