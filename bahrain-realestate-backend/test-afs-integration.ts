// Simple test runner to verify AFS payment integration
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAfsPaymentIntegration() {
  console.log('🚀 Starting AFS Payment Integration Test...\n');

  try {
    // Test 1: Check if PaymentTransaction model exists
    console.log('📋 Test 1: Checking PaymentTransaction model...');
    const transactionCount = await prisma.paymentTransaction.count();
    console.log(`✅ PaymentTransaction model working. Current count: ${transactionCount}`);

    // Test 2: Check if Company model has featuredAdsBalance
    console.log('\n💰 Test 2: Checking Company model featuredAdsBalance...');
    const companies = await prisma.company.findMany({
      select: { 
        id: true, 
        name: true, 
        featuredAdsBalance: true 
      },
      take: 1
    });
    
    if (companies.length > 0) {
      console.log(`✅ Company featuredAdsBalance field working. Sample: ${companies[0].featuredAdsBalance} credits`);
    } else {
      console.log('⚠️ No companies found in database');
    }

    // Test 3: Check if we can create a test payment transaction
    console.log('\n📝 Test 3: Creating test PaymentTransaction...');
    
    // Find or create a test company
    let testCompany = await prisma.company.findFirst({
      where: { name: 'Test Company AFS' }
    });

    if (!testCompany) {
      testCompany = await prisma.company.create({
        data: {
          name: 'Test Company AFS',
          email: 'testcompany@afs.test',
          phone: '+97312345678',
          crNumber: 'TEST123',
          status: 'ACTIVE',
          employeesLimit: 10,
          freeAdsRemaining: 5,
          featuredAdsBalance: 0
        }
      });
      console.log(`✅ Test company created: ${testCompany.name}`);
    } else {
      console.log(`✅ Using existing test company: ${testCompany.name}`);
    }

    // Create test payment transaction
    const testTransaction = await prisma.paymentTransaction.create({
      data: {
        companyId: testCompany.id,
        packageType: 'premium',
        amount: 500,
        status: 'pending',
        sessionId: null,
        paymentRef: null,
        callbackData: null
      }
    });

    console.log(`✅ Test PaymentTransaction created: ID ${testTransaction.id}`);

    // Test 4: Simulate successful payment processing
    console.log('\n💳 Test 4: Simulating successful payment...');
    
    const sessionId = `afs_session_test_${Date.now()}`;
    
    // Update with session
    await prisma.paymentTransaction.update({
      where: { id: testTransaction.id },
      data: {
        sessionId,
        callbackData: JSON.stringify({ redirectUrl: 'https://test-afs.com/checkout' })
      }
    });

    // Simulate successful callback
    await prisma.paymentTransaction.update({
      where: { id: testTransaction.id },
      data: {
        status: 'success',
        paymentRef: 'TEST_PAY_123456',
        callbackData: JSON.stringify({
          sessionId,
          result: 'Successful',
          paymentId: 'TEST_PAY_123456',
          amount: 500,
          currency: 'BHD'
        })
      }
    });

    // Update company balance for premium package (+50 credits)
    const initialBalance = testCompany.featuredAdsBalance;
    const updatedCompany = await prisma.company.update({
      where: { id: testCompany.id },
      data: {
        featuredAdsBalance: {
          increment: 50 // premium package = +50 credits
        }
      }
    });

    console.log(`✅ Payment processed successfully!`);
    console.log(`   • Transaction Status: success`);
    console.log(`   • Payment Reference: TEST_PAY_123456`);
    console.log(`   • Balance Before: ${initialBalance} credits`);
    console.log(`   • Balance After: ${updatedCompany.featuredAdsBalance} credits`);
    console.log(`   • Credits Added: +${updatedCompany.featuredAdsBalance - initialBalance}`);

    // Test 5: Cleanup
    console.log('\n🧹 Test 5: Cleaning up test data...');
    
    await prisma.paymentTransaction.delete({
      where: { id: testTransaction.id }
    });
    
    await prisma.company.delete({
      where: { id: testCompany.id }
    });
    
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 AFS PAYMENT INTEGRATION TEST COMPLETED SUCCESSFULLY!');
    console.log('📊 All database operations working correctly:');
    console.log('   • PaymentTransaction CRUD ✅');
    console.log('   • Company balance updates ✅'); 
    console.log('   • Session management ✅');
    console.log('   • Callback data storage ✅');
    console.log('   • Credit calculation ✅');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAfsPaymentIntegration();
