// Manual API Test - AFS Payment Endpoints
import axios from 'axios';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:3001/api/company';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function testAfsEndpoints() {
  console.log('🔌 Testing AFS Payment API Endpoints...\n');
  
  try {
    // Create a test JWT token
    const testCompanyId = 1; // Assuming company ID 1 exists
    const token = jwt.sign(
      { 
        companyId: testCompanyId, 
        role: 'COMPANY',
        type: 'company'
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('🔑 Generated test JWT token');
    console.log('🏢 Testing with Company ID:', testCompanyId);

    // Test 1: Create Payment Request
    console.log('\n📝 Test 1: POST /payments/request');
    try {
      const paymentRequest = await axios.post(`${BASE_URL}/payments/request`, {
        packageType: 'premium',
        amount: 500
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Payment request successful:', {
        transactionId: paymentRequest.data.data.id,
        status: paymentRequest.data.data.status,
        packageType: paymentRequest.data.data.packageType,
        amount: paymentRequest.data.data.amount
      });

      const transactionId = paymentRequest.data.data.id;

      // Test 2: Create Payment Session  
      console.log('\n🔗 Test 2: POST /payments/session');
      try {
        const paymentSession = await axios.post(`${BASE_URL}/payments/session`, {
          transactionId,
          amount: 500
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Payment session successful:', {
          sessionId: paymentSession.data.data.sessionId,
          hasRedirectUrl: !!paymentSession.data.data.redirectUrl
        });

        const sessionId = paymentSession.data.data.sessionId;

        // Test 3: Simulate AFS Callback
        console.log('\n💳 Test 3: POST /payments/afs-callback');
        try {
          const callbackResponse = await axios.post(`${BASE_URL}/payments/afs-callback`, {
            sessionId,
            orderId: `TX-${transactionId}`,
            result: 'Successful',
            paymentId: 'TEST_PAY_987654321',
            authCode: 'AUTH123456',
            status: 'success',
            amount: 500,
            currency: 'BHD',
            date: new Date().toISOString()
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });

          console.log('✅ AFS callback successful:', {
            processed: callbackResponse.data.data.processed,
            transactionId: callbackResponse.data.data.transactionId,
            status: callbackResponse.data.data.status
          });

          console.log('\n🎉 ALL AFS API ENDPOINTS WORKING CORRECTLY!');
          console.log('📊 Test Results Summary:');
          console.log('   • Payment Request Endpoint ✅');
          console.log('   • Payment Session Endpoint ✅');
          console.log('   • AFS Callback Endpoint ✅');
          console.log('   • End-to-End Flow ✅');

        } catch (error: any) {
          console.log('❌ AFS callback failed:', error.response?.data || error.message);
        }

      } catch (error: any) {
        console.log('❌ Payment session failed:', error.response?.data || error.message);
      }

    } catch (error: any) {
      console.log('❌ Payment request failed:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        console.log('💡 Note: Make sure the server is running and the company exists');
      }
    }

  } catch (error) {
    console.error('❌ Test setup failed:', error);
  }
}

// Instructions for manual testing
console.log('🚀 AFS Payment API Manual Test');
console.log('📋 Prerequisites:');
console.log('   1. Server must be running on http://localhost:3001');
console.log('   2. Database must be connected');
console.log('   3. Company with ID 1 must exist');
console.log('   4. Update JWT_SECRET if different\n');

console.log('⚡ To run this test:');
console.log('   1. Start the server: pnpm dev');
console.log('   2. In another terminal: npx tsx manual-afs-test.ts\n');

// Uncomment the line below to run the test
// testAfsEndpoints();
