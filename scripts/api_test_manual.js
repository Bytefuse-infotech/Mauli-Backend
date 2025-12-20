const http = require('http');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5M2JjMjljMjk4OTRkOGUxY2FlOWFiYyIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc2NjIyMjc5NiwiZXhwIjoxNzY2MjIzNjk2fQ.BzZ-UApBrF-QN2Kb1usXr1P0PECaXAbURVUOZwRAgV4";
const productId = "6939281ee2573f7b559ac074";

function request(method, path, body = null, useAuth = true) {
    return new Promise((resolve, reject) => {
        const headers = {
            'Accept': 'application/json'
        };
        if (body) {
            headers['Content-Type'] = 'application/json';
        }
        if (useAuth) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path.startsWith('/') ? path : '/api/v1' + path, // Handle absolute or relative
            method: method,
            headers: headers
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    if (!data) return resolve({ statusCode: res.statusCode, body: null });
                    const json = JSON.parse(data);
                    resolve({ statusCode: res.statusCode, body: json });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body: data });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function run() {
    console.log("0. Testing public GET /api/v1/products (No Auth) ...");
    // Access api/v1/products directly
    const prodRes = await request('GET', '/api/v1/products', null, false);
    console.log('Status:', prodRes.statusCode);
    if (prodRes.statusCode !== 200) console.log('Body:', prodRes.body);

    console.log("\n1. Testing GET /api/v1/cart (With Auth) ...");
    const cartRes = await request('GET', '/api/v1/cart', null, true);
    console.log('Status:', cartRes.statusCode);
    if (cartRes.statusCode === 200) {
        // Create empty items array safely
        const items = cartRes.body.data && cartRes.body.data.cart ? cartRes.body.data.cart.items : [];
        console.log('Cart Items:', items.length);
    } else {
        console.log('Body:', cartRes.body);
    }

    console.log("\n2. Testing POST /api/v1/cart/items ...");
    const addRes = await request('POST', '/api/v1/cart/items', {
        product_id: productId,
        quantity: 4,
        unit: "box"
    }, true);
    console.log('Status:', addRes.statusCode);
    console.log('Body:', JSON.stringify(addRes.body, null, 2));
}

run().catch(console.error);
