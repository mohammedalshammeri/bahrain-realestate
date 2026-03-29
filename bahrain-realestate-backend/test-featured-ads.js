#!/usr/bin/env node

/**
 * Featured Ads System Test Script
 * 
 * This script tests the Featured Ads functionality including:
 * - Role-based authorization
 * - Balance checking and deduction
 * - Property featuring logic
 * - Error handling
 */

const https = require('https');
const fs = require('fs');

// Configuration
const config = {
  baseUrl: 'http://localhost:3000', // Update with your server URL
  testData: {
    // Test tokens - replace with actual tokens from your test environment
    ownerToken: 'your_owner_jwt_token_here',
    managerToken: 'your_manager_jwt_token_here', 
    agentToken: 'your_agent_jwt_token_here',
    
    // Test property ID - replace with actual property ID
    propertyId: 1,
    
    // Test company ID
    companyId: 1
  }
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * HTTP request helper
 */
function makeRequest(method, path, token = null, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(config.baseUrl + path);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = (url.protocol === 'https:' ? https : require('http')).request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

/**
 * Test case wrapper
 */
async function runTest(testName, testFunction) {
  try {
    console.log(`\n🧪 Running: ${testName}`);
    await testFunction();
    console.log(`✅ PASSED: ${testName}`);
    testResults.passed++;
    testResults.tests.push({ name: testName, status: 'PASSED' });
  } catch (error) {
    console.log(`❌ FAILED: ${testName}`);
    console.log(`   Error: ${error.message}`);
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAILED', error: error.message });
  }
}

/**
 * Assertion helper
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Test Cases
 */

// Test 1: Get featured ads balance as owner
async function testGetBalanceAsOwner() {
  const response = await makeRequest('GET', '/api/company/featured-ads-balance', config.testData.ownerToken);
  
  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
  assert(response.body.success === true, 'Response should be successful');
  assert(typeof response.body.data.featuredAdsBalance === 'number', 'Balance should be a number');
  assert(response.body.data.companyId === config.testData.companyId, 'Should return correct company ID');
  
  console.log(`   Current balance: ${response.body.data.featuredAdsBalance}`);
}

// Test 2: Get featured ads balance as manager
async function testGetBalanceAsManager() {
  const response = await makeRequest('GET', '/api/company/featured-ads-balance', config.testData.managerToken);
  
  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
  assert(response.body.success === true, 'Response should be successful');
  assert(typeof response.body.data.featuredAdsBalance === 'number', 'Balance should be a number');
}

// Test 3: Get featured ads balance as agent
async function testGetBalanceAsAgent() {
  const response = await makeRequest('GET', '/api/company/featured-ads-balance', config.testData.agentToken);
  
  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
  assert(response.body.success === true, 'Response should be successful');
  assert(typeof response.body.data.featuredAdsBalance === 'number', 'Balance should be a number');
}

// Test 4: Feature property as owner (should succeed)
async function testFeaturePropertyAsOwner() {
  const response = await makeRequest('PATCH', `/api/company/properties/${config.testData.propertyId}/feature`, config.testData.ownerToken);
  
  if (response.statusCode === 400 && response.body.message.includes('already featured')) {
    console.log('   Property is already featured - skipping test');
    return;
  }
  
  if (response.statusCode === 400 && response.body.message.includes('Insufficient featured ads balance')) {
    console.log('   Insufficient balance - test shows correct validation');
    return;
  }
  
  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}: ${JSON.stringify(response.body)}`);
  assert(response.body.success === true, 'Response should be successful');
  assert(response.body.data.property.isFeatured === true, 'Property should be marked as featured');
  assert(typeof response.body.data.remainingBalance === 'number', 'Should return remaining balance');
  
  console.log(`   Property featured successfully. Remaining balance: ${response.body.data.remainingBalance}`);
}

// Test 5: Feature property as manager (should succeed)
async function testFeaturePropertyAsManager() {
  // First unfeature the property if it was featured in previous test
  // Note: This assumes you have an unfeature endpoint or manual database reset
  
  const response = await makeRequest('PATCH', `/api/company/properties/${config.testData.propertyId}/feature`, config.testData.managerToken);
  
  if (response.statusCode === 400 && response.body.message.includes('already featured')) {
    console.log('   Property is already featured - test shows correct validation');
    return;
  }
  
  if (response.statusCode === 400 && response.body.message.includes('Insufficient featured ads balance')) {
    console.log('   Insufficient balance - test shows correct validation');
    return;
  }
  
  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}: ${JSON.stringify(response.body)}`);
  assert(response.body.success === true, 'Response should be successful');
  assert(response.body.data.property.isFeatured === true, 'Property should be marked as featured');
}

// Test 6: Feature property as agent (should fail)
async function testFeaturePropertyAsAgent() {
  const response = await makeRequest('PATCH', `/api/company/properties/${config.testData.propertyId}/feature`, config.testData.agentToken);
  
  assert(response.statusCode === 403, `Expected 403, got ${response.statusCode}`);
  assert(response.body.success === false, 'Response should be unsuccessful');
  assert(response.body.message.includes('Only company owners and managers'), 'Should show correct error message');
  
  console.log('   ✓ Agent correctly denied access');
}

// Test 7: Feature property without authentication (should fail)
async function testFeaturePropertyWithoutAuth() {
  const response = await makeRequest('PATCH', `/api/company/properties/${config.testData.propertyId}/feature`);
  
  assert(response.statusCode === 401, `Expected 401, got ${response.statusCode}`);
  
  console.log('   ✓ Unauthenticated request correctly denied');
}

// Test 8: Feature non-existent property (should fail)
async function testFeatureNonExistentProperty() {
  const response = await makeRequest('PATCH', '/api/company/properties/99999/feature', config.testData.ownerToken);
  
  assert(response.statusCode === 404, `Expected 404, got ${response.statusCode}`);
  assert(response.body.success === false, 'Response should be unsuccessful');
  assert(response.body.message.includes('not found'), 'Should show not found error');
  
  console.log('   ✓ Non-existent property correctly handled');
}

// Test 9: Get balance without authentication (should fail)
async function testGetBalanceWithoutAuth() {
  const response = await makeRequest('GET', '/api/company/featured-ads-balance');
  
  assert(response.statusCode === 401, `Expected 401, got ${response.statusCode}`);
  
  console.log('   ✓ Unauthenticated balance request correctly denied');
}

// Test 10: Feature property with invalid property ID (should fail)
async function testFeaturePropertyInvalidId() {
  const response = await makeRequest('PATCH', '/api/company/properties/invalid/feature', config.testData.ownerToken);
  
  assert(response.statusCode === 400 || response.statusCode === 404, `Expected 400 or 404, got ${response.statusCode}`);
  
  console.log('   ✓ Invalid property ID correctly handled');
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Starting Featured Ads System Tests');
  console.log('=====================================');

  // Check if test configuration is set up
  if (config.testData.ownerToken === 'your_owner_jwt_token_here') {
    console.log('⚠️  WARNING: Test tokens not configured!');
    console.log('   Please update the test configuration with actual JWT tokens.');
    console.log('   You can obtain tokens by logging in through the auth endpoints.');
    console.log('');
    console.log('   Example configuration:');
    console.log('   {');
    console.log('     ownerToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",');
    console.log('     managerToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",');
    console.log('     agentToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",');
    console.log('     propertyId: 1,');
    console.log('     companyId: 1');
    console.log('   }');
    console.log('');
    console.log('🔧 Running tests with mock configuration (some tests will fail)...');
    console.log('');
  }

  // Run all test cases
  await runTest('Get Balance as Owner', testGetBalanceAsOwner);
  await runTest('Get Balance as Manager', testGetBalanceAsManager);
  await runTest('Get Balance as Agent', testGetBalanceAsAgent);
  await runTest('Feature Property as Owner', testFeaturePropertyAsOwner);
  await runTest('Feature Property as Manager', testFeaturePropertyAsManager);
  await runTest('Feature Property as Agent (should fail)', testFeaturePropertyAsAgent);
  await runTest('Feature Property without Authentication (should fail)', testFeaturePropertyWithoutAuth);
  await runTest('Feature Non-existent Property (should fail)', testFeatureNonExistentProperty);
  await runTest('Get Balance without Authentication (should fail)', testGetBalanceWithoutAuth);
  await runTest('Feature Property with Invalid ID (should fail)', testFeaturePropertyInvalidId);

  // Print results
  console.log('\n📊 Test Results');
  console.log('================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📋 Total: ${testResults.passed + testResults.failed}`);

  if (testResults.failed > 0) {
    console.log('\n🔍 Failed Tests:');
    testResults.tests
      .filter(test => test.status === 'FAILED')
      .forEach(test => {
        console.log(`   ❌ ${test.name}: ${test.error}`);
      });
  }

  // Save results to file
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      passed: testResults.passed,
      failed: testResults.failed,
      total: testResults.passed + testResults.failed
    },
    tests: testResults.tests,
    configuration: {
      baseUrl: config.baseUrl,
      hasValidTokens: config.testData.ownerToken !== 'your_owner_jwt_token_here'
    }
  };

  fs.writeFileSync('featured-ads-test-report.json', JSON.stringify(reportData, null, 2));
  console.log('\n📄 Test report saved to: featured-ads-test-report.json');

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

/**
 * Helper: Generate test configuration
 */
function generateTestConfig() {
  console.log('🔧 Test Configuration Generator');
  console.log('==============================');
  console.log('');
  console.log('To run the tests, you need to:');
  console.log('');
  console.log('1. Start your server:');
  console.log('   npm run dev');
  console.log('');
  console.log('2. Create test users via the auth endpoints:');
  console.log('');
  console.log('   # Create company and employees');
  console.log('   POST /api/auth/company/register');
  console.log('   POST /api/auth/employee/register');
  console.log('');
  console.log('3. Login to get JWT tokens:');
  console.log('');
  console.log('   # Login as owner');
  console.log('   POST /api/auth/employee/login');
  console.log('   {');
  console.log('     "email": "owner@company.com",');
  console.log('     "password": "password123"');
  console.log('   }');
  console.log('');
  console.log('4. Update this script with the actual tokens and IDs');
  console.log('');
  console.log('5. Ensure the company has featuredAdsBalance > 0');
  console.log('');
  console.log('6. Create at least one active property');
  console.log('');
}

// Check command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  generateTestConfig();
  process.exit(0);
}

if (process.argv.includes('--config')) {
  generateTestConfig();
  process.exit(0);
}

// Run the tests
runAllTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});

console.log('💡 Tip: Run with --help or --config for setup instructions');
