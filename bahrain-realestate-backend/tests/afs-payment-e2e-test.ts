// AFS Payment Gateway End-to-End Test
import request from 'supertest';
import { Express } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// Mock the AFS integration to avoid real API calls during testing
jest.mock('../src/integrations/afs', () => ({
  createAfsPaymentSession: jest.fn().mockResolvedValue({
    sessionId: 'afs_session_test_12345',
    redirectUrl: 'https://sandbox-ipg.afs.com.kw/checkout/afs_session_test_12345',
    status: 'initiated',
    message: 'Session created successfully'
  })
}));

// Import app after mocking
import app from '../src/app';

const prisma = new PrismaClient();

describe('AFS Payment Integration E2E Test', () => {
  let authToken: string;
  let companyId: number;
  let transactionId: number;
  let sessionId: string;
  let initialBalance: number;

  beforeAll(async () => {
    // Create a test company
    const testCompany = await prisma.company.create({
      data: {
        name: 'Test Company for AFS Payment',
        email: 'testcompany@example.com',
        phone: '+97312345678',
        crNumber: 'CR123456',
        status: 'ACTIVE',
        employeesLimit: 10,
        freeAdsRemaining: 5,
        featuredAdsBalance: 0, // Start with 0 balance
      },
    });

    companyId = testCompany.id;
    initialBalance = testCompany.featuredAdsBalance;

    // Generate JWT token for authentication
    authToken = jwt.sign(
      { 
        companyId,
        role: 'COMPANY',
        type: 'company' 
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    console.log('🏢 Test company created:', {
      id: companyId,
      name: testCompany.name,
      initialBalance
    });
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    if (transactionId) {
      await prisma.paymentTransaction.deleteMany({
        where: { companyId }
      });
    }
    
    await prisma.company.delete({
      where: { id: companyId }
    });

    await prisma.$disconnect();
    
    console.log('🧹 Test cleanup completed');
  });

  it('should complete a full AFS payment cycle', async () => {
    console.log('\n🚀 Starting AFS Payment E2E Test...\n');

    // Step 1: Create Payment Request
    console.log('📝 Step 1: Creating payment request...');
    
    const paymentRequest = await request(app as Express)
      .post('/api/company/payments/request')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        packageType: 'premium',
        amount: 500
      })
      .expect(200);

    expect(paymentRequest.body.success).toBe(true);
    expect(paymentRequest.body.data.status).toBe('pending');
    expect(paymentRequest.body.data.packageType).toBe('premium');
    expect(paymentRequest.body.data.amount).toBe(500);
    expect(paymentRequest.body.data.companyId).toBe(companyId);

    transactionId = paymentRequest.body.data.id;
    
    console.log('✅ Payment request created:', {
      transactionId,
      status: paymentRequest.body.data.status,
      packageType: paymentRequest.body.data.packageType,
      amount: paymentRequest.body.data.amount
    });

    // Step 2: Create Payment Session (calls real AFS API - mocked)
    console.log('\n🔗 Step 2: Creating AFS payment session...');
    
    const paymentSession = await request(app as Express)
      .post('/api/company/payments/session')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        transactionId,
        amount: 500
      })
      .expect(200);

    expect(paymentSession.body.success).toBe(true);
    expect(paymentSession.body.data.sessionId).toBeDefined();
    expect(paymentSession.body.data.redirectUrl).toBeDefined();
    expect(paymentSession.body.data.sessionId).toMatch(/^afs_session_/);

    sessionId = paymentSession.body.data.sessionId;
    
    console.log('✅ AFS session created:', {
      sessionId,
      redirectUrl: paymentSession.body.data.redirectUrl,
      transactionUpdated: !!paymentSession.body.data.transaction
    });

    // Step 3: Simulate AFS Callback (successful payment)
    console.log('\n💳 Step 3: Simulating successful AFS callback...');
    
    const callbackPayload = {
      sessionId,
      orderId: `TX-${transactionId}`,
      result: 'Successful',
      paymentId: 'PM123456789',
      authCode: 'AUTH789456',
      status: 'success',
      amount: 500,
      currency: 'BHD',
      date: '2025-01-01 12:00:00'
    };

    const callbackResponse = await request(app as Express)
      .post('/api/company/payments/afs-callback')
      .send(callbackPayload)
      .expect(200);

    expect(callbackResponse.body.success).toBe(true);
    expect(callbackResponse.body.data.processed).toBe(true);
    
    console.log('✅ AFS callback processed:', {
      transactionId: callbackResponse.body.data.transactionId,
      status: callbackResponse.body.data.status,
      processed: callbackResponse.body.data.processed
    });

    // Step 4: Verify PaymentTransaction updated correctly
    console.log('\n🔍 Step 4: Verifying payment transaction updates...');
    
    const updatedTransaction = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId }
    });

    expect(updatedTransaction).not.toBeNull();
    expect(updatedTransaction!.status).toBe('success');
    expect(updatedTransaction!.paymentRef).toBe('PM123456789');
    expect(updatedTransaction!.sessionId).toBe(sessionId);
    
    // Verify callback data is saved as JSON
    const callbackData = JSON.parse(updatedTransaction!.callbackData as string);
    expect(callbackData.result).toBe('Successful');
    expect(callbackData.paymentId).toBe('PM123456789');
    expect(callbackData.amount).toBe(500);
    expect(callbackData.currency).toBe('BHD');
    
    console.log('✅ Transaction verification passed:', {
      status: updatedTransaction!.status,
      paymentRef: updatedTransaction!.paymentRef,
      sessionId: updatedTransaction!.sessionId,
      callbackDataSaved: !!updatedTransaction!.callbackData
    });

    // Step 5: Verify Company balance increased correctly (+50 for premium)
    console.log('\n💰 Step 5: Verifying company balance increase...');
    
    const updatedCompany = await prisma.company.findUnique({
      where: { id: companyId }
    });

    expect(updatedCompany).not.toBeNull();
    expect(updatedCompany!.featuredAdsBalance).toBe(initialBalance + 50); // premium = +50 credits
    
    console.log('✅ Balance verification passed:', {
      initialBalance,
      currentBalance: updatedCompany!.featuredAdsBalance,
      creditsAdded: updatedCompany!.featuredAdsBalance - initialBalance,
      expectedForPremium: 50
    });

    // Final Summary
    console.log('\n🎉 AFS Payment E2E Test COMPLETED SUCCESSFULLY!');
    console.log('📊 Test Summary:');
    console.log(`   • Payment Request: ✅ Created (ID: ${transactionId})`);
    console.log(`   • AFS Session: ✅ Created (${sessionId})`);
    console.log(`   • Payment Callback: ✅ Processed (${callbackPayload.paymentId})`);
    console.log(`   • Transaction Status: ✅ ${updatedTransaction!.status}`);
    console.log(`   • Balance Updated: ✅ +${updatedCompany!.featuredAdsBalance - initialBalance} credits`);
    console.log(`   • Data Integrity: ✅ All fields saved correctly`);
  });

  it('should handle failed payment callback correctly', async () => {
    console.log('\n❌ Testing failed payment scenario...');
    
    // Create another payment request for failed test
    const paymentRequest = await request(app as Express)
      .post('/api/company/payments/request')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        packageType: 'basic',
        amount: 100
      })
      .expect(200);

    const failedTransactionId = paymentRequest.body.data.id;

    // Create session
    const paymentSession = await request(app as Express)
      .post('/api/company/payments/session')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        transactionId: failedTransactionId,
        amount: 100
      })
      .expect(200);

    const failedSessionId = paymentSession.body.data.sessionId;

    // Get balance before failed payment
    const companyBeforeFailed = await prisma.company.findUnique({
      where: { id: companyId }
    });

    // Simulate failed callback
    const failedCallback = {
      sessionId: failedSessionId,
      orderId: `TX-${failedTransactionId}`,
      result: 'Failed',
      paymentId: null,
      authCode: null,
      status: 'failed',
      amount: 100,
      currency: 'BHD',
      date: '2025-01-01 12:01:00',
      errorCode: 'CARD_DECLINED',
      errorMessage: 'Insufficient funds'
    };

    await request(app as Express)
      .post('/api/company/payments/afs-callback')
      .send(failedCallback)
      .expect(200);

    // Verify failed transaction
    const failedTransaction = await prisma.paymentTransaction.findUnique({
      where: { id: failedTransactionId }
    });

    expect(failedTransaction!.status).toBe('failed');
    expect(failedTransaction!.paymentRef).toBeNull();

    // Verify balance unchanged
    const companyAfterFailed = await prisma.company.findUnique({
      where: { id: companyId }
    });

    expect(companyAfterFailed!.featuredAdsBalance).toBe(companyBeforeFailed!.featuredAdsBalance);
    
    console.log('✅ Failed payment handled correctly:', {
      status: failedTransaction!.status,
      balanceUnchanged: companyAfterFailed!.featuredAdsBalance === companyBeforeFailed!.featuredAdsBalance
    });
  });
});
