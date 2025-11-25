import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/store/context/AuthContext';
import { Colors } from '@/src/constants/colors';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationCount,
} from '@/src/services/api/userNotificationApi';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      console.log('📱 Loading notifications screen...');
      console.log('👤 User object:', user);

      if (!user?.mongoId && !user?._id && !user?.id) {
        console.warn('⚠️ No userId found in user object');
        return;
      }

      const userId = user?.mongoId || user?._id || user?.id;
      console.log('🆔 Using userId:', userId);

      // Load notifications and count in parallel
      console.log('📡 Fetching notifications and count...');
      const [notifResponse, countResponse] = await Promise.all([
        getUserNotifications(userId),
        getNotificationCount(userId),
      ]);

      console.log('📥 Notifications response:', notifResponse);
      console.log('📥 Count response:', countResponse);

      if (notifResponse.success) {
        const notifs = Array.isArray(notifResponse.notifications) ? notifResponse.notifications : [];
        console.log(`✅ Loaded ${notifs.length} notifications`);
        setNotifications(notifs);
      }

      if (countResponse.success) {
        const count = countResponse.unreadCount || 0;
        console.log(`✅ Unread count: ${count}`);
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notification: any) => {
    console.log('👆 Tapped notification:', notification);

    if (notification.read) {
      console.log('ℹ️ Notification already read, skipping');
      return;
    }

    const notificationId = notification._id || notification.id;
    if (!notificationId) {
      console.warn('⚠️ No notification ID found');
      return;
    }

    console.log('📝 Marking notification as read:', notificationId);

    // Optimistic update
    const previous = [...notifications];
    setNotifications(prev =>
      prev.map(n => (n._id === notificationId || n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => {
      const newCount = Math.max(0, prev - 1);
      console.log('📉 Unread count updated:', prev, '->', newCount);
      return newCount;
    });

    try {
      console.log('📡 Calling markAsRead API...');
      const response = await markAsRead(notificationId);
      console.log('✅ Mark as read response:', response);
    } catch (error) {
      console.error('❌ Error marking as read:', error);
      // Revert on error
      setNotifications(previous);
      loadNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      Alert.alert('Info', 'No unread notifications');
      return;
    }

    try {
      const userId = user?.mongoId || user?._id || user?.id;
      const response = await markAllAsRead(userId);

      if (response.success) {
        Alert.alert('Success', 'All notifications marked as read');
        await loadNotifications();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };


  const formatNotifTime = (notif: any) => {
    const ts = notif.time || notif.sentAt || notif.createdAt || notif.timestamp;
    if (!ts) return '';
    const date = new Date(ts);
    if (isNaN(date.getTime())) return String(ts);

    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins} min${diffInMins > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'warning':
        return 'time';
      case 'error':
        return 'alert-circle';
      case 'info':
      default:
        return 'notifications';
    }
  };

  const getNotificationIconColor = (type?: string) => {
    switch (type) {
      case 'success':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      case 'info':
      default:
        return Colors.primary;
    }
  };

  const getPriorityBadgeStyle = (priority?: string) => {
    switch (priority) {
      case 'high':
        return { backgroundColor: '#fee2e2', color: '#991b1b' };
      case 'medium':
        return { backgroundColor: '#fef3c7', color: '#92400e' };
      case 'low':
      default:
        return { backgroundColor: '#dbeafe', color: '#1e40af' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <Pressable style={styles.moreButton} onPress={handleMarkAllAsRead}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>You're all caught up! Check back later for updates.</Text>
          </View>
        ) : (
          <>
            {notifications.map((notif, index) => {
              const notifId = notif._id || notif.id;
              const iconColor = getNotificationIconColor(notif.type);
              const priorityStyle = getPriorityBadgeStyle(notif.priority);

              return (
                <Pressable
                  key={notifId || index}
                  style={[styles.notificationCard, !notif.read && styles.unreadCard]}
                  onPress={() => handleMarkAsRead(notif)}
                >
                  <View style={[styles.notifIconWrapper, { backgroundColor: `${iconColor}15` }]}>
                    <Ionicons
                      name={getNotificationIcon(notif.type)}
                      size={24}
                      color={iconColor}
                    />
                  </View>

                  <View style={styles.notifContent}>
                    <View style={styles.notifHeader}>
                      <Text style={[styles.notifMessage, !notif.read && styles.unreadMessage]}>
                        {notif.message}
                      </Text>
                      {notif.priority && (
                        <View
                          style={[
                            styles.priorityBadge,
                            { backgroundColor: priorityStyle.backgroundColor },
                          ]}
                        >
                          <Text style={[styles.priorityText, { color: priorityStyle.color }]}>
                            {notif.priority.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.notifFooter}>
                      <Text style={styles.notifTime}>{formatNotifTime(notif)}</Text>
                      {!notif.read && <View style={styles.unreadDot} />}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  headerBadge: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  moreButton: {
    padding: 4,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  notifIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notifMessage: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginRight: 8,
  },
  unreadMessage: {
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  notifFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifTime: {
    fontSize: 12,
    color: Colors.textLight,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});
