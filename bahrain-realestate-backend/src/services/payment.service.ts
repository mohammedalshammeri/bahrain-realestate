// Payment Service - Real payment operations with multiple gateways
import { db } from '../config/database';
import { createAfsPaymentSession } from '../integrations/afs';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../middleware/errorHandler';

export interface PaymentIntent {
  amount: number;
  currency: string;
  items: PaymentItem[];
  companyId: number;
  gateway: 'afs' | 'stripe' | 'apple_pay' | 'google_pay';
}

export interface PaymentItem {
  type: 'featured_package' | 'boost';
  itemId: number;
  amount: number;
}

// Create payment intent
export const createPaymentIntent = async (intent: PaymentIntent) => {
  const transactionId = `TX-${Date.now()}-${uuidv4().substring(0, 8)}`;

  try {
    // Create payment record
    const paymentResult = await db.$queryRaw`
      INSERT INTO enhanced_payments (transaction_id, company_id, amount, currency, status, payment_method, gateway, created_at, updated_at)
      VALUES (${transactionId}, ${intent.companyId}, ${intent.amount.toString()}, ${intent.currency}, 'pending', ${intent.gateway}, ${intent.gateway}, NOW(), NOW())
      RETURNING *
    ` as any[];

    const payment = paymentResult[0];

    // Create payment items
    for (const item of intent.items) {
      await db.$queryRaw`
        INSERT INTO payment_items (payment_id, item_type, item_id, amount, created_at)
        VALUES (${payment.id}, ${item.type}, ${item.itemId}, ${item.amount.toString()}, NOW())
      `;
    }

    // Create gateway session based on payment method
    let gatewayResponse;
    if (intent.gateway === 'afs') {
      gatewayResponse = await createAfsPaymentSession(intent.amount, payment.id);
    } else {
      // For other gateways, implement their integration
      throw new AppError(`Gateway ${intent.gateway} not implemented yet`, 400);
    }

    // Update payment with gateway response
    await db.$queryRaw`
      UPDATE enhanced_payments
      SET gateway_transaction_id = ${gatewayResponse.sessionId}, gateway_response = ${JSON.stringify(gatewayResponse)}, status = 'processing', updated_at = NOW()
      WHERE id = ${payment.id}
    `;

    return {
      paymentId: payment.id,
      transactionId,
      redirectUrl: gatewayResponse.redirectUrl,
      sessionId: gatewayResponse.sessionId,
    };

  } catch (error) {
    console.error('Payment intent creation failed:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create payment intent', 500);
  }
};

// Handle payment success callback
export const handlePaymentSuccess = async (transactionId: string, gatewayResponse: any) => {
  try {
    // Find payment by transaction ID
    const paymentResult = await db.$queryRaw`
      SELECT * FROM enhanced_payments WHERE transaction_id = ${transactionId} LIMIT 1
    ` as any[];

    const payment = paymentResult[0];

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    if (payment.status === 'completed') {
      return { success: true, message: 'Payment already processed' };
    }

    // Update payment status
    await db.$queryRaw`
      UPDATE enhanced_payments
      SET status = 'completed', gateway_response = ${JSON.stringify(gatewayResponse)}, updated_at = NOW()
      WHERE id = ${payment.id}
    `;

    // Process payment items
    const itemsResult = await db.$queryRaw`
      SELECT * FROM payment_items WHERE payment_id = ${payment.id}
    ` as any[];

    for (const item of itemsResult) {
      if (item.item_type === 'featured_package') {
        await activateFeaturedPackage(item.item_id, payment.id);
      } else if (item.item_type === 'boost') {
        await activateBoost(item.item_id, payment.id);
      }
    }

    // Create success notification
    await db.$queryRaw`
      INSERT INTO notifications (company_id, type, title, message, data, created_at)
      VALUES (${payment.company_id}, 'payment_received', 'Payment Successful', 'Your payment of ${payment.currency} ${payment.amount} has been processed successfully.', ${JSON.stringify({ paymentId: payment.id, transactionId })}, NOW())
    `;

    return { success: true, paymentId: payment.id };

  } catch (error) {
    console.error('Payment success handling failed:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to process payment success', 500);
  }
};

// Handle payment failure callback
export const handlePaymentFailure = async (transactionId: string, gatewayResponse: any) => {
  try {
    const paymentResult = await db.$queryRaw`
      SELECT * FROM enhanced_payments WHERE transaction_id = ${transactionId} LIMIT 1
    ` as any[];

    const payment = paymentResult[0];

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    // Update payment status to failed
    await db.$queryRaw`
      UPDATE enhanced_payments
      SET status = 'failed', gateway_response = ${JSON.stringify(gatewayResponse)}, updated_at = NOW()
      WHERE id = ${payment.id}
    `;

    // Create failure notification
    await db.$queryRaw`
      INSERT INTO notifications (company_id, type, title, message, data, created_at)
      VALUES (${payment.company_id}, 'system', 'Payment Failed', 'Your payment of ${payment.currency} ${payment.amount} could not be processed. Please try again.', ${JSON.stringify({ paymentId: payment.id, transactionId })}, NOW())
    `;

    return { success: true, paymentId: payment.id };

  } catch (error) {
    console.error('Payment failure handling failed:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to process payment failure', 500);
  }
};

// Activate featured package after successful payment
const activateFeaturedPackage = async (packageId: number, paymentId: number) => {
  const featuredPackageResult = await db.$queryRaw`
    SELECT * FROM featured_packages WHERE id = ${packageId} LIMIT 1
  ` as any[];

  const featuredPackage = featuredPackageResult[0];

  if (!featuredPackage) {
    throw new AppError('Featured package not found', 404);
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + featuredPackage.duration);

  // Update featured package
  await db.$queryRaw`
    UPDATE featured_packages
    SET start_date = ${startDate}, end_date = ${endDate}, status = 'active', payment_id = ${paymentId}, updated_at = NOW()
    WHERE id = ${packageId}
  `;

  // Update property to featured
  await db.$queryRaw`
    UPDATE properties
    SET is_featured = true
    WHERE id = ${featuredPackage.property_id}
  `;

  // Create activation notification
  await db.$queryRaw`
    INSERT INTO notifications (company_id, type, title, message, data, created_at)
    VALUES (${featuredPackage.company_id}, 'featured_activated', 'Featured Package Activated', 'Your property is now featured for ${featuredPackage.duration} days.', ${JSON.stringify({ packageId, propertyId: featuredPackage.property_id })}, NOW())
  `;
};

// Activate boost after successful payment
const activateBoost = async (boostId: number, paymentId: number) => {
  const boostResult = await db.$queryRaw`
    SELECT * FROM boosts WHERE id = ${boostId} LIMIT 1
  ` as any[];

  const boost = boostResult[0];

  if (!boost) {
    throw new AppError('Boost not found', 404);
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setHours(startDate.getHours() + boost.duration_hours);

  // Update boost
  await db.$queryRaw`
    UPDATE boosts
    SET start_date = ${startDate}, end_date = ${endDate}, status = 'active', payment_id = ${paymentId}, updated_at = NOW()
    WHERE id = ${boostId}
  `;

  // Create activation notification
  await db.$queryRaw`
    INSERT INTO notifications (company_id, type, title, message, data, created_at)
    VALUES (${boost.company_id}, 'system', 'Boost Activated', 'Your property boost is now active for ${boost.duration_hours} hours.', ${JSON.stringify({ boostId, propertyId: boost.property_id })}, NOW())
  `;
};

// Legacy service methods for backward compatibility
export const getPaymentService = async (paymentId: number) => {
  try {
    const payment = await getPaymentWithItems(paymentId);
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }
    return payment;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to get payment', 500);
  }
};

export const createPaymentService = async (data: any) => {
  try {
    // This is a legacy method - use createPaymentIntent instead
    throw new AppError('Use createPaymentIntent for new payments', 400);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create payment', 500);
  }
};

export const updatePaymentStatusService = async (paymentId: number, status: string) => {
  try {
    await db.$queryRaw`
      UPDATE enhanced_payments
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${paymentId}
    `;

    return { message: 'Payment status updated successfully' };
  } catch (error) {
    throw new AppError('Failed to update payment status', 500);
  }
};

export const getCompanyPaymentsService = async (companyId: number) => {
  try {
    return await getCompanyPayments(companyId);
  } catch (error) {
    throw new AppError('Failed to get company payments', 500);
  }
};

// Get payment by transaction ID
export const getPaymentByTransactionId = async (transactionId: string) => {
  const paymentResult = await db.$queryRaw`
    SELECT * FROM enhanced_payments WHERE transaction_id = ${transactionId} LIMIT 1
  ` as any[];

  return paymentResult[0];
};

// Get payments for company
export const getCompanyPayments = async (companyId: number, skip = 0, take = 20) => {
  const paymentsResult = await db.$queryRaw`
    SELECT * FROM enhanced_payments
    WHERE company_id = ${companyId}
    ORDER BY created_at DESC
    LIMIT ${take} OFFSET ${skip}
  ` as any[];

  return paymentsResult;
};

// Get payment with items
export const getPaymentWithItems = async (paymentId: number) => {
  const paymentResult = await db.$queryRaw`
    SELECT * FROM enhanced_payments WHERE id = ${paymentId} LIMIT 1
  ` as any[];

  const payment = paymentResult[0];

  if (!payment) return null;

  const itemsResult = await db.$queryRaw`
    SELECT * FROM payment_items WHERE payment_id = ${paymentId}
  ` as any[];

  return { ...payment, items: itemsResult };
};
