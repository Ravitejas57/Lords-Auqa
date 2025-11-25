import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUserNotifications } from '../services/notificationService';
import io from 'socket.io-client';

const NotificationsContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

export const NotificationsProvider = ({ children, mongoId }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!mongoId) {
      console.error('❌ CRITICAL: No userMongoId found in localStorage!');
      console.log('📋 Available localStorage keys:', Object.keys(localStorage));
      console.log('📋 localStorage values:', {
        userId: localStorage.getItem('userId'),
        userMongoId: localStorage.getItem('userMongoId'),
        authToken: localStorage.getItem('authToken') ? 'exists' : 'missing'
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('📥 Fetching notifications for MongoDB _id:', mongoId);

      const response = await getUserNotifications(mongoId);

      if (response.success && response.notifications) {
        setNotifications(response.notifications);
        const userSpecific = response.notifications.filter(n => n.userId === mongoId);
        const globalNotifs = response.notifications.filter(n => n.isGlobal);
        console.log('✅ Loaded', response.notifications.length, 'notifications:');
        console.log(`   - ${userSpecific.length} user-specific (userId matches)`);
        console.log(`   - ${globalNotifs.length} global notifications`);
        console.log('notifications from context', response.notifications);
      } else {
        console.warn('⚠️ Unexpected response format:', response);
        setNotifications([]);
      }
    } catch (err) {
      console.error('❌ Error loading notifications:', err);
      setError(err.message || 'Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [mongoId]);

  // Setup Socket.io for real-time notifications
  useEffect(() => {
    if (!mongoId) {
      return;
    }

    // Initial fetch
    fetchNotifications();

    // Setup Socket.io connection
    const socket = io('http://localhost:3000');

    socket.on('connect', () => {
      console.log('✅ Socket.IO connected with ID:', socket.id);
      socket.emit('joinUser', mongoId);
      console.log('🔌 Joined Socket.io room with MongoDB _id:', mongoId);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
    });

    socket.on('newNotification', (notification) => {
      console.log('🔔 New notification received via Socket.io:', notification);
      setNotifications(prev => [notification, ...prev]);
    });

    // Cleanup
    return () => {
      console.log('🔌 Disconnecting Socket.io');
      socket.disconnect();
    };
  }, [mongoId, fetchNotifications]);

  // Compute unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  const value = {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    setNotifications  // Expose for manual updates (e.g., mark as read)
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
