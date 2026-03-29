import { db } from '../config/database';
import { AppError } from '../middleware/errorHandler';

// Firebase Admin SDK would be imported here
// import * as admin from 'firebase-admin';

export interface PushTokenData {
  deviceToken: string;
  platform: 'ios' | 'android' | 'web';
  userType: 'company' | 'employee' | 'admin' | 'individual';
  userId: number;
  companyId?: number;
}

export interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  userType: 'company' | 'employee' | 'admin' | 'individual';
  userId?: number;
  companyId?: number;
  targetTokens?: string[];
}

export interface PushNotificationWithDetails {
  id: number;
  title: string;
  body: string;
  data: Record<string, any> | null;
  userType: string;
  userId: number | null;
  companyId: number | null;
  sentAt: Date | null;
  createdAt: Date;
  successCount: number;
  failureCount: number;
}

/**
 * Register a push token for a user
 */
export const registerPushToken = async (tokenData: PushTokenData): Promise<void> => {
  try {
    // Check if token already exists
    const existingTokenResult = await db.$queryRaw`
      SELECT * FROM push_tokens
      WHERE device_token = ${tokenData.deviceToken} AND user_id = ${tokenData.userId} AND user_type = ${tokenData.userType}
      LIMIT 1
    ` as any[];

    if (existingTokenResult.length > 0) {
      // Update existing token
      await db.$queryRaw`
        UPDATE push_tokens
        SET platform = ${tokenData.platform}, company_id = ${tokenData.companyId}, is_active = true, updated_at = NOW()
        WHERE id = ${existingTokenResult[0].id}
      `;
    } else {
      // Insert new token
      await db.$queryRaw`
        INSERT INTO push_tokens (device_token, platform, user_type, user_id, company_id, is_active, created_at, updated_at)
        VALUES (${tokenData.deviceToken}, ${tokenData.platform}, ${tokenData.userType}, ${tokenData.userId}, ${tokenData.companyId}, true, NOW(), NOW())
      `;
    }
  } catch (error) {
    throw new AppError('Failed to register push token', 500);
  }
};

/**
 * Unregister a push token
 */
export const unregisterPushToken = async (deviceToken: string, userId: number, userType: string): Promise<void> => {
  try {
    await db.$queryRaw`
      UPDATE push_tokens
      SET is_active = false, updated_at = NOW()
      WHERE device_token = ${deviceToken} AND user_id = ${userId} AND user_type = ${userType}
    `;
  } catch (error) {
    throw new AppError('Failed to unregister push token', 500);
  }
};

/**
 * Get active push tokens for a user or company
 */
export const getActivePushTokens = async (
  userType: string,
  userId?: number,
  companyId?: number
): Promise<string[]> => {
  try {
    let whereClause = 'is_active = true';
    const params: any[] = [];

    if (userType === 'company' && companyId) {
      whereClause += ' AND user_type = $1 AND company_id = $2';
      params.push('company', companyId);
    } else if (userType === 'employee' && userId) {
      whereClause += ' AND user_type = $1 AND user_id = $2';
      params.push('employee', userId);
    } else if (userType === 'admin' && userId) {
      whereClause += ' AND user_type = $1 AND user_id = $2';
      params.push('admin', userId);
    } else if (userType === 'individual' && userId) {
      whereClause += ' AND user_type = $1 AND user_id = $2';
      params.push('individual', userId);
    } else {
      return [];
    }

    const tokensResult = await db.$queryRaw`
      SELECT device_token FROM push_tokens WHERE ${whereClause}
    ` as any[];

    return tokensResult.map((row: any) => row.device_token);
  } catch (error) {
    throw new AppError('Failed to get push tokens', 500);
  }
};

/**
 * Send a push notification
 */
export const sendPushNotification = async (notificationData: PushNotificationData): Promise<PushNotificationWithDetails> => {
  try {
    let targetTokens: string[] = [];

    if (notificationData.targetTokens) {
      targetTokens = notificationData.targetTokens;
    } else {
      targetTokens = await getActivePushTokens(
        notificationData.userType,
        notificationData.userId,
        notificationData.companyId
      );
    }

    if (targetTokens.length === 0) {
      throw new AppError('No active push tokens found for the target users', 400);
    }

    // Create notification record
    const insertResult = await db.$queryRaw`
      INSERT INTO push_notifications (title, body, data, user_type, user_id, company_id, sent_at, success_count, failure_count, created_at)
      VALUES (${notificationData.title}, ${notificationData.body}, ${JSON.stringify(notificationData.data || {})}, ${notificationData.userType}, ${notificationData.userId}, ${notificationData.companyId}, NOW(), 0, 0, NOW())
      RETURNING *
    ` as any[];

    const notification = insertResult[0];

    // Send notifications via Firebase/APNs
    const results = await sendToFirebase(targetTokens, {
      title: notificationData.title,
      body: notificationData.body,
      data: notificationData.data,
    });

    // Update notification with results
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    await db.$queryRaw`
      UPDATE push_notifications
      SET success_count = ${successCount}, failure_count = ${failureCount}
      WHERE id = ${notification.id}
    `;

    return {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      userType: notification.user_type,
      userId: notification.user_id,
      companyId: notification.company_id,
      sentAt: notification.sent_at,
      createdAt: notification.created_at,
      successCount,
      failureCount,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to send push notification', 500);
  }
};

/**
 * Send notifications via Firebase Cloud Messaging
 */
const sendToFirebase = async (
  tokens: string[],
  payload: { title: string; body: string; data?: Record<string, any> }
): Promise<Array<{ success: boolean; error?: string }>> => {
  try {
    // In a real implementation, this would use Firebase Admin SDK
    // For now, we'll simulate the Firebase API calls

    const results: Array<{ success: boolean; error?: string }> = [];

    for (const token of tokens) {
      try {
        // Simulate Firebase API call
        // const message = {
        //   token,
        //   notification: {
        //     title: payload.title,
        //     body: payload.body,
        //   },
        //   data: payload.data,
        // };

        // await admin.messaging().send(message);

        // Simulate success/failure randomly for demo
        const success = Math.random() > 0.1; // 90% success rate

        results.push({ success });

        if (!success) {
          // Clean up invalid tokens
          await db.$queryRaw`
            UPDATE push_tokens
            SET is_active = false, updated_at = NOW()
            WHERE device_token = ${token}
          `;
        }
      } catch (error) {
        results.push({ success: false, error: 'Firebase API error' });
      }
    }

    return results;
  } catch (error) {
    throw new AppError('Firebase messaging error', 500);
  }
};

/**
 * Send payment success notification
 */
export const sendPaymentSuccessNotification = async (
  companyId: number,
  amount: number,
  transactionId: string
): Promise<void> => {
  await sendPushNotification({
    title: 'Payment Successful',
    body: `Your payment of ${amount} BHD has been processed successfully.`,
    data: {
      type: 'payment_success',
      transactionId,
      amount,
    },
    userType: 'company',
    companyId,
  });
};

/**
 * Send featured package expiration notification
 */
export const sendFeaturedExpirationNotification = async (
  companyId: number,
  propertyTitle: string,
  daysLeft: number
): Promise<void> => {
  const title = daysLeft === 0 ? 'Featured Package Expired' : 'Featured Package Expiring Soon';
  const body = daysLeft === 0
    ? `Your featured package for "${propertyTitle}" has expired.`
    : `Your featured package for "${propertyTitle}" will expire in ${daysLeft} day${daysLeft > 1 ? 's' : ''}.`;

  await sendPushNotification({
    title,
    body,
    data: {
      type: 'featured_expiration',
      propertyTitle,
      daysLeft,
    },
    userType: 'company',
    companyId,
  });
};

/**
 * Send boost expiration notification
 */
export const sendBoostExpirationNotification = async (
  companyId: number,
  propertyTitle: string,
  boostType: string,
  daysLeft: number
): Promise<void> => {
  const title = daysLeft === 0 ? 'Property Boost Expired' : 'Property Boost Expiring Soon';
  const body = daysLeft === 0
    ? `Your ${boostType} boost for "${propertyTitle}" has expired.`
    : `Your ${boostType} boost for "${propertyTitle}" will expire in ${daysLeft} day${daysLeft > 1 ? 's' : ''}.`;

  await sendPushNotification({
    title,
    body,
    data: {
      type: 'boost_expiration',
      propertyTitle,
      boostType,
      daysLeft,
    },
    userType: 'company',
    companyId,
  });
};

/**
 * Send new property inquiry notification
 */
export const sendPropertyInquiryNotification = async (
  companyId: number,
  propertyTitle: string,
  inquiryType: string
): Promise<void> => {
  await sendPushNotification({
    title: 'New Property Inquiry',
    body: `You have a new ${inquiryType} inquiry for "${propertyTitle}".`,
    data: {
      type: 'property_inquiry',
      propertyTitle,
      inquiryType,
    },
    userType: 'company',
    companyId,
  });
};

/**
 * Get push notification history
 */
export const getPushNotificationHistory = async (
  userType: string,
  userId?: number,
  companyId?: number,
  skip: number = 0,
  limit: number = 20
): Promise<PushNotificationWithDetails[]> => {
  try {
    let whereClause = '';
    const params: any[] = [];

    if (userType === 'company' && companyId) {
      whereClause = 'user_type = $1 AND company_id = $2';
      params.push('company', companyId);
    } else if (userType === 'employee' && userId) {
      whereClause = 'user_type = $1 AND user_id = $2';
      params.push('employee', userId);
    } else if (userType === 'admin' && userId) {
      whereClause = 'user_type = $1 AND user_id = $2';
      params.push('admin', userId);
    } else {
      return [];
    }

    const notificationsResult = await db.$queryRaw`
      SELECT * FROM push_notifications
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${skip}
    ` as any[];

    return notificationsResult.map((row: any) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      data: row.data,
      userType: row.user_type,
      userId: row.user_id,
      companyId: row.company_id,
      sentAt: row.sent_at,
      createdAt: row.created_at,
      successCount: row.success_count || 0,
      failureCount: row.failure_count || 0,
    }));
  } catch (error) {
    throw new AppError('Failed to get notification history', 500);
  }
};

/**
 * Clean up inactive tokens (called by cron job)
 */
export const cleanupInactiveTokens = async (daysInactive: number = 30): Promise<number> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    const deleteResult = await db.$queryRaw`
      DELETE FROM push_tokens
      WHERE is_active = false AND updated_at <= ${cutoffDate}
    ` as any[];

    return deleteResult.length;
  } catch (error) {
    throw new AppError('Failed to cleanup inactive tokens', 500);
  }
};