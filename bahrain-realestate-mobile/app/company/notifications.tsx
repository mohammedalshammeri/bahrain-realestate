import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/store/authStore';
import { rowDirection, textAlignStart } from '../../src/utils/rtl';

interface Notification {
  id: string;
  type: 'property_approved' | 'property_rejected' | 'featured_expired' | 'featured_activated' | 'payment_received' | 'system';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  metadata?: {
    propertyId?: string;
    packageId?: string;
    amount?: number;
  };
}

export default function Notifications() {
  const { t } = useTranslation();
  const router = useRouter();
  const { company } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const textAlign = textAlignStart();
  const flexDirection = rowDirection();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    if (!company) return;

    try {
      // In a real app, this would be an API call
      // For now, we'll use mock data
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'property_approved',
          title: t('notifications.propertyApproved') || 'Property Approved',
          message: t('notifications.propertyApprovedMsg') || 'Your property listing has been approved and is now live.',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          isRead: false,
          metadata: { propertyId: 'prop-123' },
        },
        {
          id: '2',
          type: 'featured_activated',
          title: t('notifications.featuredActivated') || 'Featured Package Activated',
          message: t('notifications.featuredActivatedMsg') || 'Your 14-day featured package has been activated.',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          isRead: true,
          metadata: { packageId: 'feat-456' },
        },
        {
          id: '3',
          type: 'featured_expired',
          title: t('notifications.featuredExpired') || 'Featured Package Expired',
          message: t('notifications.featuredExpiredMsg') || 'Your featured package has expired. Renew to maintain visibility.',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          isRead: false,
          metadata: { packageId: 'feat-789' },
        },
        {
          id: '4',
          type: 'payment_received',
          title: t('notifications.paymentReceived') || 'Payment Received',
          message: t('notifications.paymentReceivedMsg') || 'Payment of BD 8.00 has been received for your featured package.',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          isRead: true,
          metadata: { amount: 8.00 },
        },
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // In a real app, this would be an API call
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // In a real app, this would be an API call
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return t('notifications.justNow') || 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ${t('notifications.ago') || 'ago'}`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ${t('notifications.ago') || 'ago'}`;

    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'property_approved':
        return '✅';
      case 'property_rejected':
        return '❌';
      case 'featured_activated':
        return '⭐';
      case 'featured_expired':
        return '⏰';
      case 'payment_received':
        return '💰';
      default:
        return '📢';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('common.loading') || 'Loading...'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { flexDirection }]}>
        <Text style={[styles.title, { textAlign }]}>{t('notifications.title') || 'Notifications'}</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unreadCount}</Text>
          </View>
        )}
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>{t('notifications.markAllRead') || 'Mark all read'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.notificationsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { textAlign }]}>
              {t('notifications.empty') || 'No notifications yet'}
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationItem,
                !notification.isRead && styles.unreadNotification,
                { flexDirection },
              ]}
              onPress={() => !notification.isRead && markAsRead(notification.id)}
            >
              <View style={styles.notificationIcon}>
                <Text style={styles.iconText}>{getNotificationIcon(notification.type)}</Text>
              </View>

              <View style={styles.notificationContent}>
                <Text style={[styles.notificationTitle, { textAlign }]}>
                  {notification.title}
                </Text>
                <Text style={[styles.notificationMessage, { textAlign }]}>
                  {notification.message}
                </Text>
                <Text style={[styles.notificationTime, { textAlign }]}>
                  {formatDate(notification.createdAt)}
                </Text>
              </View>

              {!notification.isRead && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginStart: 10,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markAllButton: {
    marginStart: 10,
  },
  markAllText: {
    color: '#3498db',
    fontSize: 14,
  },
  notificationsList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  unreadNotification: {
    backgroundColor: '#f8f9ff',
    borderStartWidth: 4,
    borderStartColor: '#3498db',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 15,
  },
  iconText: {
    fontSize: 18,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#adb5bd',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3498db',
  },
});