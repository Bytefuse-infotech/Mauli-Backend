const axios = require('axios');

const BASE_URL = 'http://localhost:5009/api/v1';
const TEST_USER = {
    phone: '918108053372',
    password: 'qwerty@123'
};

async function testProfileUpdate() {
    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
        const { accessToken, user } = loginRes.data;
        console.log('Login successful. Token:', accessToken.substring(0, 20) + '...');
        console.log('Current User:', user);

        console.log('\n2. Updating Profile...');
        const newName = `Updated Name ${Date.now()}`;
        const newEmail = `updated${Date.now()}@example.com`;

        const updateRes = await axios.put(`${BASE_URL}/auth/profile`, {
            name: newName,
            email: newEmail,
            phone: user.phone // Phone is usually required or read-only, passing it just in case logic needs it
        }, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        console.log('Update Response:', updateRes.data);

        if (updateRes.data.success && updateRes.data.user.name === newName && updateRes.data.user.email === newEmail) {
            console.log('\n✅ Profile Update SUCCESS!');
        } else {
            console.log('\n❌ Profile Update FAILED to persist values or return success flag!');
        }

    } catch (error) {
        console.error('\n❌ Test Failed:', error.response ? error.response.data : error.message);
    }
}

testProfileUpdate();
