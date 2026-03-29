import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  registerPushToken,
  unregisterPushToken,
  sendPushNotification,
  getPushNotificationHistory,
} from '../services/push.service';
import { AppError } from '../middleware/errorHandler';

// Register push token
export const registerPushTokenController = async (req: AuthRequest, res: Response) => {
  try {
    const { token, deviceType } = req.body;
    const role = req.user?.role;
    const userType = role === 'individual' ? 'individual' : role === 'employee' ? 'company' : 'employee';
    const userId = role === 'individual' ? req.user?.individualId : req.user?.employeeId || req.user?.id;
    const companyId = req.user?.companyId;

    if (!token || !deviceType) {
      throw new AppError('Token and device type are required', 400);
    }

    if (!['ios', 'android', 'web'].includes(deviceType)) {
      throw new AppError('Invalid device type', 400);
    }

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    await registerPushToken({
      deviceToken: token,
      platform: deviceType,
      userType,
      userId,
      companyId,
    });

    res.json({
      success: true,
      message: 'Push token registered successfully',
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

// Unregister push token
export const unregisterPushTokenController = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;
    const role = req.user?.role;
    const userType = role === 'individual' ? 'individual' : role === 'employee' ? 'company' : 'employee';
    const userId = role === 'individual' ? req.user?.individualId : req.user?.employeeId || req.user?.id;

    if (!token) {
      throw new AppError('Token is required', 400);
    }

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    await unregisterPushToken(token, userId, userType);

    res.json({
      success: true,
      message: 'Push token unregistered successfully',
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

// Send push notification (admin/company use)
export const sendPushNotificationController = async (req: AuthRequest, res: Response) => {
  try {
    const { title, body, data, targetUserType, targetUserId, targetCompanyId } = req.body;
    const senderType = req.user?.role === 'employee' ? 'company' : 'employee';
    const senderId = req.user?.employeeId || req.user?.id;

    if (!title || !body) {
      throw new AppError('Title and body are required', 400);
    }

    if (!targetUserType || !['company', 'employee', 'admin'].includes(targetUserType)) {
      throw new AppError('Valid target user type is required', 400);
    }

    // Only allow companies to send to themselves, admins can send to anyone
    if (senderType === 'company' && targetUserType !== 'company') {
      throw new AppError('Companies can only send notifications to themselves', 403);
    }

    const notification = await sendPushNotification({
      title,
      body,
      data,
      userType: targetUserType,
      userId: targetUserId,
      companyId: targetCompanyId,
    });

    res.json({
      success: true,
      data: notification,
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

// Get push notification history
export const getPushNotificationHistoryController = async (req: AuthRequest, res: Response) => {
  try {
    const userType = req.user?.role === 'employee' ? 'company' : 'employee';
    const userId = req.user?.employeeId || req.user?.id;
    const companyId = req.user?.companyId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const notifications = await getPushNotificationHistory(
      userType,
      userId,
      companyId,
      skip,
      limit
    );

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total: notifications.length, // In production, you'd want a separate count query
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
