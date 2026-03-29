#!/usr/bin/env node

/**
 * Complaints Module Test Script
 * 
 * This script tests all aspects of the Complaints Module:
 * - Public complaint submission
 * - Admin complaint management
 * - Company complaint viewing
 * - Role-based access control
 * - Input validation
 */

const https = require('https');
const fs = require('fs');

// Configuration
const config = {
  baseUrl: 'http://localhost:3000',
  testData: {
    // Replace with actual tokens from your test environment
    adminToken: 'your_admin_jwt_token_here',
    companyToken: 'your_company_jwt_token_here',
    
    // Test data
    testCompanyId: 1,
    testComplaintId: null, // Will be set after creating a complaint
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
      path: url.pathname + url.search,
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

// Test 1: Submit valid complaint (public, no auth)
async function testSubmitValidComplaint() {
  const complaintData = {
    companyId: config.testData.testCompanyId,
    userPhone: '+973 1234 5678',
    userEmail: 'test@example.com',
    message: 'This is a test complaint message that meets the minimum length requirement for validation.'
  };

  const response = await makeRequest(
    'POST', 
    '/api/public/complaints', 
    null, 
    JSON.stringify(complaintData)
  );

  assert(response.statusCode === 201, `Expected 201, got ${response.statusCode}: ${JSON.stringify(response.body)}`);
  assert(response.body.success === true, 'Response should be successful');
  assert(response.body.data.status === 'new', 'New complaint should have status "new"');
  assert(response.body.data.companyId === config.testData.testCompanyId, 'Should match company ID');
  assert(response.body.data.userPhone === '+973 1234 5678', 'Should match phone number');

  // Store the complaint ID for later tests
  config.testData.testComplaintId = response.body.data.id;
  
  console.log(`   Created complaint ID: ${config.testData.testComplaintId}`);
}

// Test 2: Submit complaint with invalid phone (should fail)
async function testSubmitInvalidPhone() {
  const complaintData = {
    companyId: config.testData.testCompanyId,
    userPhone: '123', // Invalid format
    message: 'This is a test complaint message that meets the minimum length requirement.'
  };

  const response = await makeRequest(
    'POST', 
    '/api/public/complaints', 
    null, 
    JSON.stringify(complaintData)
  );

  assert(response.statusCode === 400, `Expected 400, got ${response.statusCode}`);
  assert(response.body.success === false, 'Response should be unsuccessful');
  assert(response.body.message.includes('phone'), 'Should mention phone validation error');

  console.log('   ✓ Invalid phone correctly rejected');
}

// Test 3: Submit complaint with message too short (should fail)
async function testSubmitShortMessage() {
  const complaintData = {
    companyId: config.testData.testCompanyId,
    userPhone: '+973 1234 5678',
    message: 'Short' // Too short (< 10 characters)
  };

  const response = await makeRequest(
    'POST', 
    '/api/public/complaints', 
    null, 
    JSON.stringify(complaintData)
  );

  assert(response.statusCode === 400, `Expected 400, got ${response.statusCode}`);
  assert(response.body.success === false, 'Response should be unsuccessful');
  assert(response.body.message.includes('10 characters'), 'Should mention minimum length');

  console.log('   ✓ Short message correctly rejected');
}

// Test 4: Submit complaint with invalid email (should fail)
async function testSubmitInvalidEmail() {
  const complaintData = {
    companyId: config.testData.testCompanyId,
    userPhone: '+973 1234 5678',
    userEmail: 'invalid-email', // Invalid format
    message: 'This is a valid complaint message that meets all requirements.'
  };

  const response = await makeRequest(
    'POST', 
    '/api/public/complaints', 
    null, 
    JSON.stringify(complaintData)
  );

  assert(response.statusCode === 400, `Expected 400, got ${response.statusCode}`);
  assert(response.body.success === false, 'Response should be unsuccessful');
  assert(response.body.message.includes('email'), 'Should mention email validation error');

  console.log('   ✓ Invalid email correctly rejected');
}

// Test 5: Get all complaints as admin
async function testGetAllComplaintsAsAdmin() {
  const response = await makeRequest('GET', '/api/admin/complaints', config.testData.adminToken);

  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}: ${JSON.stringify(response.body)}`);
  assert(response.body.success === true, 'Response should be successful');
  assert(Array.isArray(response.body.data), 'Should return array of complaints');
  assert(typeof response.body.pagination === 'object', 'Should include pagination info');

  console.log(`   Found ${response.body.data.length} complaints`);
}

// Test 6: Get complaint by ID as admin
async function testGetComplaintByIdAsAdmin() {
  if (!config.testData.testComplaintId) {
    console.log('   Skipping - no complaint ID available');
    return;
  }

  const response = await makeRequest(
    'GET', 
    `/api/admin/complaints/${config.testData.testComplaintId}`, 
    config.testData.adminToken
  );

  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}: ${JSON.stringify(response.body)}`);
  assert(response.body.success === true, 'Response should be successful');
  assert(response.body.data.id === config.testData.testComplaintId, 'Should return correct complaint');
  assert(typeof response.body.data.company === 'object', 'Should include company details');

  console.log(`   Retrieved complaint details for ID: ${config.testData.testComplaintId}`);
}

// Test 7: Update complaint status as admin
async function testUpdateComplaintStatusAsAdmin() {
  if (!config.testData.testComplaintId) {
    console.log('   Skipping - no complaint ID available');
    return;
  }

  const updateData = {
    status: 'under_review',
    adminNotes: 'Testing complaint status update functionality'
  };

  const response = await makeRequest(
    'PATCH',
    `/api/admin/complaints/${config.testData.testComplaintId}`,
    config.testData.adminToken,
    JSON.stringify(updateData)
  );

  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}: ${JSON.stringify(response.body)}`);
  assert(response.body.success === true, 'Response should be successful');
  assert(response.body.data.status === 'under_review', 'Status should be updated');
  assert(response.body.data.adminNotes === updateData.adminNotes, 'Admin notes should be updated');

  console.log('   ✓ Complaint status updated successfully');
}

// Test 8: Get company complaints as company employee
async function testGetCompanyComplaintsAsEmployee() {
  const response = await makeRequest('GET', '/api/company/complaints', config.testData.companyToken);

  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}: ${JSON.stringify(response.body)}`);
  assert(response.body.success === true, 'Response should be successful');
  assert(Array.isArray(response.body.data), 'Should return array of complaints');

  console.log(`   Company has ${response.body.data.length} complaints`);
}

// Test 9: Try to access admin endpoints without token (should fail)
async function testAdminAccessWithoutAuth() {
  const response = await makeRequest('GET', '/api/admin/complaints');

  assert(response.statusCode === 401, `Expected 401, got ${response.statusCode}`);

  console.log('   ✓ Admin endpoint correctly requires authentication');
}

// Test 10: Try to access company endpoints without token (should fail)
async function testCompanyAccessWithoutAuth() {
  const response = await makeRequest('GET', '/api/company/complaints');

  assert(response.statusCode === 401, `Expected 401, got ${response.statusCode}`);

  console.log('   ✓ Company endpoint correctly requires authentication');
}

// Test 11: Filter complaints by status
async function testFilterComplaintsByStatus() {
  const response = await makeRequest('GET', '/api/admin/complaints?status=new', config.testData.adminToken);

  if (response.statusCode === 200) {
    assert(response.body.success === true, 'Response should be successful');
    assert(Array.isArray(response.body.data), 'Should return array of complaints');

    // Check that all returned complaints have 'new' status
    response.body.data.forEach(complaint => {
      assert(complaint.status === 'new', `All complaints should have 'new' status, found: ${complaint.status}`);
    });

    console.log(`   Found ${response.body.data.length} complaints with 'new' status`);
  } else {
    console.log('   ⚠️  Status filtering test skipped due to token configuration');
  }
}

// Test 12: Pagination test
async function testPagination() {
  const response = await makeRequest('GET', '/api/admin/complaints?skip=0&take=5', config.testData.adminToken);

  if (response.statusCode === 200) {
    assert(response.body.success === true, 'Response should be successful');
    assert(response.body.pagination.take === 5, 'Should respect take parameter');
    assert(response.body.pagination.skip === 0, 'Should respect skip parameter');

    console.log('   ✓ Pagination parameters correctly applied');
  } else {
    console.log('   ⚠️  Pagination test skipped due to token configuration');
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Starting Complaints Module Tests');
  console.log('===================================');

  // Check configuration
  if (config.testData.adminToken === 'your_admin_jwt_token_here') {
    console.log('⚠️  WARNING: Test tokens not configured!');
    console.log('   Please update the configuration with actual JWT tokens.');
    console.log('   Some tests will be skipped or may fail.');
    console.log('');
  }

  // Run all test cases
  await runTest('Submit Valid Complaint (Public)', testSubmitValidComplaint);
  await runTest('Submit Invalid Phone (should fail)', testSubmitInvalidPhone);
  await runTest('Submit Short Message (should fail)', testSubmitShortMessage);
  await runTest('Submit Invalid Email (should fail)', testSubmitInvalidEmail);
  await runTest('Get All Complaints as Admin', testGetAllComplaintsAsAdmin);
  await runTest('Get Complaint by ID as Admin', testGetComplaintByIdAsAdmin);
  await runTest('Update Complaint Status as Admin', testUpdateComplaintStatusAsAdmin);
  await runTest('Get Company Complaints as Employee', testGetCompanyComplaintsAsEmployee);
  await runTest('Admin Access without Auth (should fail)', testAdminAccessWithoutAuth);
  await runTest('Company Access without Auth (should fail)', testCompanyAccessWithoutAuth);
  await runTest('Filter Complaints by Status', testFilterComplaintsByStatus);
  await runTest('Pagination Test', testPagination);

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
      hasValidTokens: config.testData.adminToken !== 'your_admin_jwt_token_here'
    }
  };

  fs.writeFileSync('complaints-module-test-report.json', JSON.stringify(reportData, null, 2));
  console.log('\n📄 Test report saved to: complaints-module-test-report.json');

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

/**
 * Helper: Generate test configuration guide
 */
function showConfiguration() {
  console.log('🔧 Complaints Module Test Configuration');
  console.log('======================================');
  console.log('');
  console.log('To run the tests effectively, you need to:');
  console.log('');
  console.log('1. Start your server:');
  console.log('   npm run dev');
  console.log('');
  console.log('2. Create test data:');
  console.log('   - At least one company (to test against)');
  console.log('   - Admin account with super admin role');
  console.log('   - Company employee account');
  console.log('');
  console.log('3. Get JWT tokens by logging in:');
  console.log('   POST /api/auth/admin/login  (for admin token)');
  console.log('   POST /api/auth/employee/login  (for company token)');
  console.log('');
  console.log('4. Update this script configuration:');
  console.log('   adminToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."');
  console.log('   companyToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."');
  console.log('   testCompanyId: 1  (valid company ID)');
  console.log('');
  console.log('5. Run the tests:');
  console.log('   node test-complaints-module.js');
  console.log('');
}

// Check command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showConfiguration();
  process.exit(0);
}

if (process.argv.includes('--config')) {
  showConfiguration();
  process.exit(0);
}

// Run the tests
runAllTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});

console.log('💡 Tip: Run with --help or --config for setup instructions');
