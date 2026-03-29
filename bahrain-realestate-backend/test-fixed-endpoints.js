// Test Fixed API Endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testEndpoints() {
    console.log('🧪 Testing Fixed API Endpoints...\n');

    // Test 1: Health Check
    try {
        console.log('1️⃣ Testing Health Check...');
        const health = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health:', health.data);
    } catch (error) {
        console.log('❌ Health Error:', error.message);
    }

    // Test 2: Public Areas (FIXED)
    try {
        console.log('\n2️⃣ Testing Public Areas...');
        const areas = await axios.get(`${BASE_URL}/api/public/areas`);
        console.log('✅ Areas:', areas.data.success ? `Found ${areas.data.data.length} areas` : 'Failed');
    } catch (error) {
        console.log('❌ Areas Error:', error.response?.data || error.message);
    }

    // Test 3: Auth Login (FIXED)
    try {
        console.log('\n3️⃣ Testing Auth Login...');
        const login = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'test@example.com',
            password: 'wrongpassword'
        });
        console.log('✅ Login:', login.data);
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Login endpoint works (returned 401 as expected for wrong credentials)');
        } else {
            console.log('❌ Login Error:', error.response?.data || error.message);
        }
    }

    // Test 4: Public Governorates
    try {
        console.log('\n4️⃣ Testing Governorates...');
        const governorates = await axios.get(`${BASE_URL}/api/public/governorates`);
        console.log('✅ Governorates:', governorates.data.success ? `Found ${governorates.data.data.length} governorates` : 'Failed');
    } catch (error) {
        console.log('❌ Governorates Error:', error.response?.data || error.message);
    }

    // Test 5: Public Properties
    try {
        console.log('\n5️⃣ Testing Properties...');
        const properties = await axios.get(`${BASE_URL}/api/public/properties`);
        console.log('✅ Properties:', properties.data.success ? `Found ${properties.data.data.length} properties` : 'Failed');
    } catch (error) {
        console.log('❌ Properties Error:', error.response?.data || error.message);
    }

    console.log('\n🎯 API Test Complete!');
}

testEndpoints().catch(console.error);
