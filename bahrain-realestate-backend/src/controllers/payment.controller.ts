import { Request, Response } from 'express';
import { db } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import {
  createPaymentIntent,
  handlePaymentSuccess,
  handlePaymentFailure,
  getPaymentService,
  getCompanyPayments,
  getPaymentWithItems
} from '../services/payment.service';
import { AppError } from '../middleware/errorHandler';

// Create payment intent
export const createPaymentIntentController = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, currency = 'BHD', items, gateway = 'afs' } = req.body;
    const companyId = req.user?.companyId;

    if (!companyId) {
      throw new AppError('Company not authenticated', 401);
    }

    if (!amount || !items || !Array.isArray(items)) {
      throw new AppError('Invalid payment data', 400);
    }

    const intent = {
      amount: parseFloat(amount),
      currency,
      items,
      companyId,
      gateway,
    };

    const result = await createPaymentIntent(intent);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.status).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

// Handle payment success callback (webhook)
export const handlePaymentSuccessController = async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      throw new AppError('Transaction ID is required', 400);
    }

    const result = await handlePaymentSuccess(transactionId, req.body);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.status).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

// Handle payment failure callback (webhook)
export const handlePaymentFailureController = async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      throw new AppError('Transaction ID is required', 400);
    }

    const result = await handlePaymentFailure(transactionId, req.body);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.status).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

// Get payment details
export const getPaymentController = async (req: AuthRequest, res: Response) => {
  try {
    const paymentId = parseInt(req.params.id);
    const companyId = req.user?.companyId;

    if (!companyId) {
      throw new AppError('Company not authenticated', 401);
    }

    const payment = await getPaymentWithItems(paymentId);

    if (!payment || payment.companyId !== companyId) {
      throw new AppError('Payment not found', 404);
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.status).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

// Get company payments
export const getCompanyPaymentsController = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (!companyId) {
      throw new AppError('Company not authenticated', 401);
    }

    const payments = await getCompanyPayments(companyId, skip, limit);
    const totalResult = await db.$queryRaw`SELECT COUNT(*)::int as count FROM enhanced_payments WHERE company_id = ${companyId}` as any[];
    const total = totalResult?.[0]?.count || payments.length;

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page,
          limit,
          total,
        },
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.status).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

// AFS success redirect (for web payment flow)
export const afsPaymentSuccessRedirect = async (req: Request, res: Response) => {
  try {
    const { transactionId, sessionId } = req.query;

    if (!transactionId) {
      return res.status(400).send('Transaction ID is required');
    }

    // In a real implementation, you'd verify the payment status with AFS
    // For now, we'll redirect to a success page
    const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?transactionId=${transactionId}`;

    res.redirect(successUrl);
  } catch (error) {
    console.error('AFS success redirect error:', error);
    res.status(500).send('Internal server error');
  }
};

// AFS failure redirect (for web payment flow)
export const afsPaymentFailureRedirect = async (req: Request, res: Response) => {
  try {
    const { transactionId, error } = req.query;

    const failureUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failure?transactionId=${transactionId}&error=${error || 'unknown'}`;

    res.redirect(failureUrl);
  } catch (err) {
    console.error('AFS failure redirect error:', err);
    res.status(500).send('Internal server error');
  }
};
