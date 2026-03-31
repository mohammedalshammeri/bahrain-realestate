import { db } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import axios from 'axios';

// Expo Push API endpoint
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

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
    let tokensResult: any[] = [];

    if (userType === 'company' && companyId) {
      tokensResult = await db.$queryRaw`
        SELECT device_token FROM push_tokens WHERE is_active = true AND company_id = ${companyId}
      ` as any[];
    } else if (userType === 'individual' && userId) {
      tokensResult = await db.$queryRaw`
        SELECT device_token FROM push_tokens WHERE is_active = true AND user_id = ${userId}
      ` as any[];
    } else if (userId) {
      tokensResult = await db.$queryRaw`
        SELECT device_token FROM push_tokens WHERE is_active = true AND user_id = ${userId}
      ` as any[];
    }

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

    // Send notifications via Expo Push API
    const results = await sendToExpoPush(targetTokens, {
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
 * Send notifications via Expo Push API
 */
const sendToExpoPush = async (
  tokens: string[],
  payload: { title: string; body: string; data?: Record<string, any> }
): Promise<Array<{ success: boolean; error?: string }>> => {
  try {
    // Filter to only Expo push tokens (ExponentPushToken[...])
    const expoPushTokens = tokens.filter(t => t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['));

    if (expoPushTokens.length === 0) {
      return tokens.map(() => ({ success: false, error: 'No valid Expo push tokens' }));
    }

    // Build messages for Expo Push API
    const messages = expoPushTokens.map(token => ({
      to: token,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
    }));

    // Send in batches of 100 (Expo limit)
    const results: Array<{ success: boolean; error?: string }> = [];
    const BATCH_SIZE = 100;

    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      const batch = messages.slice(i, i + BATCH_SIZE);

      try {
        const response = await axios.post(EXPO_PUSH_URL, batch, {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        });

        const tickets = response.data?.data || [];
        for (let j = 0; j < tickets.length; j++) {
          const ticket = tickets[j];
          if (ticket.status === 'ok') {
            results.push({ success: true });
          } else {
            results.push({ success: false, error: ticket.message || 'Push failed' });
            // Deactivate invalid tokens
            if (ticket.details?.error === 'DeviceNotRegistered') {
              await db.$queryRaw`
                UPDATE push_tokens SET is_active = false, updated_at = NOW()
                WHERE device_token = ${expoPushTokens[i + j]}
              `;
            }
          }
        }
      } catch (batchError) {
        // Mark all tokens in this batch as failed
        for (let j = 0; j < batch.length; j++) {
          results.push({ success: false, error: 'Expo Push API error' });
        }
        console.error('[PUSH] Expo Push API batch error:', batchError);
      }
    }

    return results;
  } catch (error) {
    throw new AppError('Expo Push API error', 500);
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
    let notificationsResult: any[] = [];

    if (userType === 'company' && companyId) {
      notificationsResult = await db.$queryRaw`
        SELECT * FROM push_notifications
        WHERE company_id = ${companyId}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${skip}
      ` as any[];
    } else if (userId) {
      notificationsResult = await db.$queryRaw`
        SELECT * FROM push_notifications
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${skip}
      ` as any[];
    } else {
      return [];
    }

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