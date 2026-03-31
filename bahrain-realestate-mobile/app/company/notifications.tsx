import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/store/authStore';
import { rowDirection, textAlignStart } from '../../src/utils/rtl';
import api from '../../src/api/api';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  data?: any;
}

export default function Notifications() {
  const { t } = useTranslation();
  const router = useRouter();
  const { company } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const textAlign = textAlignStart();
  const flexDirection = rowDirection();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = useCallback(async (reset = true) => {
    if (!company) return;

    try {
      const skip = reset ? 0 : page * PAGE_SIZE;
      const response = await api.get('/company/notifications', {
        params: { skip, take: PAGE_SIZE },
      });

      if (response.data?.success) {
        const { notifications: fetched, pagination } = response.data.data;
        if (reset) {
          setNotifications(fetched);
          setPage(1);
        } else {
          setNotifications(prev => [...prev, ...fetched]);
          setPage(prev => prev + 1);
        }
        setHasMore(pagination?.hasMore ?? false);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [company, page]);

  const markAsRead = async (notificationId: number) => {
    try {
      await api.patch(`/company/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/company/notifications/mark-all-read');
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications(true);
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
      case 'payment_success':
        return '💰';
      case 'boost_activated':
        return '🚀';
      case 'boost_expired':
        return '⏳';
      default:
        return '📢';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
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
                !notification.is_read && styles.unreadNotification,
                { flexDirection },
              ]}
              onPress={() => !notification.is_read && markAsRead(notification.id)}
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
                  {formatDate(notification.created_at)}
                </Text>
              </View>

              {!notification.is_read && <View style={styles.unreadDot} />}
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