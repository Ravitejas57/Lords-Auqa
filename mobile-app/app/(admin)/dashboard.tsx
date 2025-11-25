import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/src/constants/colors';
import ProfileMenu from '@/src/components/ProfileMenu';
import NotificationsScreen from './notifications';
import InvoiceCard from '@/src/components/InvoiceCard';
import Stories from '@/src/components/Stories';
import StoryViewerModal from '@/src/components/StoryViewerModal';
import {
  getPendingUsers,
  getApprovedUsers,
  getRejectedUsers,
  addUser,
  approvePendingUser,
  rejectPendingUser,
} from '@/src/services/api/adminApi';
import { getAdminTransactionHistory, approveHatchery, getUserHatcheries } from '@/src/services/api/imageApi';
import {
  getUserConversations,
  getConversationById,
  sendAdminReply,
  closeConversation,
  cleanupOldConversations,
  getAdminUnreadCount,
} from '@/src/services/api/helpApi';
import { cleanupOldNotifications, getAdminStories, deleteAdminStory } from '@/src/services/api/notificationApi';
import { formatNumber, formatNumberInput, parseFormattedNumber } from '@/src/utils/formatNumber';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('home');
  
  // Transaction history states
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // User data
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<any[]>([]);
  const [rejectedUsers, setRejectedUsers] = useState<any[]>([]);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Help states
  const [userConversations, setUserConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showAllConversations, setShowAllConversations] = useState(false);
  const [helpUnreadCount, setHelpUnreadCount] = useState(0);

  // Add Seller states
  const [showAddUserScreen, setShowAddUserScreen] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    country: '',
    state: '',
    district: '',
    fullAddress: '',
    pincode: '',
    seedsCount: '',
    bonus: '',
    price: '',
    seedType: 'Hardyline',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState<any>({});

  // Sellers filter states
  const [sellersFilter, setSellersFilter] = useState<'approved' | 'pending' | 'rejected'>('approved');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingUser, setRejectingUser] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);


  // Transaction history image viewer (simple viewer without feedback)
  const [showTransactionImageViewer, setShowTransactionImageViewer] = useState(false);
  const [selectedTransactionImageUrl, setSelectedTransactionImageUrl] = useState<string>('');

  // Stories states
  const [adminStories, setAdminStories] = useState<any[]>([]);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [loadingStories, setLoadingStories] = useState(false);

  // Memoize logo source to prevent re-rendering
  const logoSource = useMemo(() => require('@/assets/images/logo.png'), []);

  // Stats
  const stats = {
    totalUsers: approvedUsers.length,
    pendingCount: pendingUsers.length,
    approvedCount: approvedUsers.length,
    rejectedCount: rejectedUsers.length,
  };

  // Filtered sellers
  const filteredSellers = approvedUsers.filter(
    (seller) =>
      seller.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.phoneNumber?.includes(searchQuery) ||
      seller.region?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    if (activeTab === 'help') {
      loadUserConversations();
    } else if (activeTab === 'history') {
      loadTransactionHistory();
    } else if (activeTab === 'home' && adminData) {
      loadAdminStories();
    }
  }, [activeTab, adminData]);

  // Reset states when switching tabs
  useEffect(() => {
    // Reset search query
    setSearchQuery('');

    // Reset help-related states
    if (activeTab !== 'help') {
      setSelectedConversation(null);
      setReplyText('');
      setShowConversationModal(false);
      setExpandedFaq(null);
    }

    // Reset sellers-related states
    if (activeTab !== 'sellers') {
      setSellersFilter('approved');
      setShowRejectModal(false);
      setRejectingUser(null);
      setRejectionReason('');
    }

    // Reset add user screen
    if (activeTab !== 'home') {
      setShowAddUserScreen(false);
    }

    // Reset transaction history viewer
    if (activeTab !== 'history') {
      setShowTransactionImageViewer(false);
      setSelectedTransactionImageUrl('');
    }
  }, [activeTab]);

  const loadTransactionHistory = async () => {
    if (!adminData) return;
    setLoadingHistory(true);
    try {
      const adminId = adminData?.profile?._id || adminData?._id || adminData?.id;
      if (adminId) {
        const response = await getAdminTransactionHistory(adminId);
        if (response.success) {
          setTransactionHistory(response.transactions || []);
        }
      }
    } catch (error) {
      console.error('Error loading transaction history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadAdminStories = async () => {
    setLoadingStories(true);
    try {
      const response = await getAdminStories();
      if (response.success) {
        setAdminStories(response.stories || []);
      }
    } catch (error: any) {
      console.error('Error loading admin stories:', error);
      // Don't show error to user if it's just no stories or auth issue
      // Stories are optional feature, so fail silently
      setAdminStories([]);
    } finally {
      setLoadingStories(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      const response = await deleteAdminStory(storyId);
      if (response.success) {
        // Remove the story from the local state
        setAdminStories(prev => prev.filter(story => story._id !== storyId));
        Alert.alert('Success', 'Story deleted successfully');
      }
    } catch (error: any) {
      console.error('Error deleting story:', error);
      Alert.alert('Error', 'Failed to delete story. Please try again.');
    }
  };

  const loadAdminData = async () => {
    try {
      const storedAdminData = await AsyncStorage.getItem('adminData');
      if (storedAdminData) {
        const admin = JSON.parse(storedAdminData);
        setAdminData(admin);

        // Get admin ID from stored data
        const adminId = admin.profile?._id || admin._id || admin.id;

        // Fetch user data
        await fetchAllUserData(adminId);

        // Run cleanup for old notifications and conversations (auto-delete after 3 days)
        try {
          await Promise.all([
            cleanupOldNotifications(),
            cleanupOldConversations(),
          ]);
          console.log('✅ Cleanup completed for old notifications and conversations');
        } catch (cleanupError) {
          console.error('⚠️ Cleanup failed (non-critical):', cleanupError);
          // Don't show error to user as this is a background task
        }

        // Load help unread count (uses string adminId, not MongoDB ObjectId)
        try {
          console.log('📊 Admin data for unread count:', {
            adminId: admin.adminId,
            profileAdminId: admin.profile?.adminId,
            id: admin.id,
            _id: admin._id,
          });
          const adminIdString = admin.profile?.adminId || admin.adminId;
          console.log('📊 Using adminIdString:', adminIdString);
          if (adminIdString) {
            const unreadResponse = await getAdminUnreadCount(adminIdString);
            if (unreadResponse.success) {
              setHelpUnreadCount(unreadResponse.unreadCount || 0);
            }
          } else {
            console.warn('⚠️ No adminId string found in admin data');
          }
        } catch (unreadError) {
          console.error('Error loading help unread count:', unreadError);
        }
      } else {
        // Not logged in as admin
        Alert.alert('Error', 'Admin session not found. Please login again.', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') },
        ]);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      Alert.alert('Error', 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUserData = async (adminId: string) => {
    try {
      // Fetch pending users
      const pendingResponse = await getPendingUsers(adminId);
      if (pendingResponse.success) {
        setPendingUsers(pendingResponse.pendingUsers || []);
      }

      // Fetch approved users
      const approvedResponse = await getApprovedUsers(adminId);
      if (approvedResponse.success) {
        setApprovedUsers(approvedResponse.approvedUsers || []);
      }

      // Fetch rejected users
      const rejectedResponse = await getRejectedUsers(adminId);
      if (rejectedResponse.success) {
        setRejectedUsers(rejectedResponse.rejectedUsers || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to fetch user statistics');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (adminData) {
      const adminId = adminData.profile?._id || adminData._id || adminData.id;
      await fetchAllUserData(adminId);
      if (activeTab === 'home') {
        await loadAdminStories();
      }
    }
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('adminData');
          await AsyncStorage.removeItem('adminToken');
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleViewSellerProfile = (seller: any) => {
    router.push({
      pathname: '/(admin)/seller-profile' as any,
      params: { seller: JSON.stringify(seller) },
    });
  };

  const handleViewImage = (seller: any, imageUrl: string) => {
    router.push({
      pathname: '/(admin)/image-viewer',
      params: {
        imageUrl: imageUrl,
        sellerData: JSON.stringify(seller),
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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

  const loadUserConversations = async () => {
    setLoadingConversations(true);
    try {
      // Use MongoDB ObjectId for fetching conversations
      const adminMongoId = adminData?.profile?._id || adminData?._id || adminData?.id;
      const response = await getUserConversations(adminMongoId);
      if (response.success) {
        setUserConversations(response.conversations || []);
      }

      // Refresh unread count after loading conversations (uses string adminId)
      try {
        const adminIdString = adminData?.profile?.adminId || adminData?.adminId;
        if (adminIdString) {
          const unreadResponse = await getAdminUnreadCount(adminIdString);
          if (unreadResponse.success) {
            setHelpUnreadCount(unreadResponse.unreadCount || 0);
          }
        } else {
          console.warn('⚠️ No adminId string found in admin data');
        }
      } catch (unreadError) {
        console.error('Error refreshing help unread count:', unreadError);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const handleViewConversation = async (conversation: any) => {
    try {
      const response = await getConversationById(conversation._id);
      if (response.success) {
        setSelectedConversation(response.conversation);
        setShowConversationModal(true);
      }
    } catch (error: any) {
      console.error('Error loading conversation:', error);
      Alert.alert('Error', 'Failed to load conversation');
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      Alert.alert('Error', 'Please enter a reply');
      return;
    }

    setSendingReply(true);
    try {
      const adminId = adminData?.profile?._id || adminData?._id || adminData?.id;

      const response = await sendAdminReply({
        adminId,
        conversationId: selectedConversation._id,
        message: replyText,
      });

      if (response.success) {
        Alert.alert('Success', 'Reply sent successfully!');
        setReplyText('');
        // Reload conversation to show new message
        const updatedConversation = await getConversationById(selectedConversation._id);
        if (updatedConversation.success) {
          setSelectedConversation(updatedConversation.conversation);
        }
        loadUserConversations(); // Refresh list
      }
    } catch (error: any) {
      console.error('Error sending reply:', error);
      Alert.alert('Error', error.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleCloseConversation = () => {
    Alert.alert(
      'Close Conversation',
      'Are you sure you want to close this conversation? The user will no longer be able to reply.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close',
          style: 'destructive',
          onPress: async () => {
            try {
              const adminId = adminData?.profile?._id || adminData?._id || adminData?.id;

              const response = await closeConversation({
                adminId,
                conversationId: selectedConversation._id,
              });

              if (response.success) {
                Alert.alert('Success', 'Conversation closed successfully');
                setShowConversationModal(false);
                setSelectedConversation(null);
                loadUserConversations();
              }
            } catch (error: any) {
              console.error('Error closing conversation:', error);
              Alert.alert('Error', error.message || 'Failed to close conversation');
            }
          },
        },
      ]
    );
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  const validateAddUserForm = () => {
    const errors: any = {};

    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!formData.mobileNumber || formData.mobileNumber.length < 10)
      errors.mobileNumber = 'Please enter a valid phone number';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = 'Invalid email format';
    if (!formData.country.trim()) errors.country = 'Country is required';
    if (!formData.state.trim()) errors.state = 'State is required';
    if (!formData.district.trim()) errors.district = 'District is required';
    if (!formData.fullAddress.trim()) errors.fullAddress = 'Full address is required';
    if (!formData.pincode.trim()) errors.pincode = 'Pincode is required';

    if (!formData.seedsCount && formData.seedsCount !== '0') {
      errors.seedsCount = 'Seeds count is required';
    } else if (isNaN(parseFormattedNumber(formData.seedsCount))) {
      errors.seedsCount = 'Seeds count must be a number';
    }

    if (formData.bonus && isNaN(parseFormattedNumber(formData.bonus))) {
      errors.bonus = 'Bonus must be a number';
    }

    if (!formData.price) {
      errors.price = 'Price is required';
    } else if (isNaN(parseFormattedNumber(formData.price))) {
      errors.price = 'Price must be a number';
    }

    if (!formData.seedType.trim()) {
      errors.seedType = 'Seed type is required';
    }

    if (!formData.password || formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUser = async () => {
    if (!validateAddUserForm()) return;

    setAddingUser(true);
    try {
      const adminId = adminData?.profile?._id || adminData?._id || adminData?.id;

      if (!adminId) {
        Alert.alert('Error', 'Admin ID not found. Please log in again.');
        return;
      }

      // Clean phone number to get last 10 digits
      const cleanPhoneNumber = formData.mobileNumber.replace(/\D/g, '');
      const last10Digits = cleanPhoneNumber.slice(-10);

      const payload = {
        name: formData.fullName,
        phoneNumber: last10Digits,
        email: formData.email || undefined,
        password: formData.password,
        country: formData.country,
        state: formData.state,
        district: formData.district,
        fullAddress: formData.fullAddress,
        pincode: formData.pincode,
        seedsCount: formData.seedsCount ? parseFormattedNumber(formData.seedsCount) : 0,
        bonus: formData.bonus ? parseFormattedNumber(formData.bonus) : 0,
        price: formData.price ? parseFormattedNumber(formData.price) : 0,
        seedType: formData.seedType || 'None',
        assignedAdmin: adminId,
      };

      const response = await addUser(payload);

      if (response.success) {
        Alert.alert('Success', 'User created successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setShowAddUserScreen(false);
              setFormData({
                fullName: '',
                mobileNumber: '',
                email: '',
                country: '',
                state: '',
                district: '',
                fullAddress: '',
                pincode: '',
                seedsCount: '',
                bonus: '',
                price: '',
                seedType: 'Hardyline',
                password: '',
                confirmPassword: '',
              });
              // Refresh user data
              if (adminData) {
                const adminId = adminData.profile?._id || adminData._id || adminData.id;
                fetchAllUserData(adminId);
              }
            },
          },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to create user');
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      Alert.alert('Error', error.message || 'Failed to create user');
    } finally {
      setAddingUser(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const response = await approvePendingUser(userId);
      if (response.success) {
        Alert.alert('Success', 'User approved successfully!');
        // Refresh user data
        if (adminData) {
          const adminId = adminData.profile?._id || adminData._id || adminData.id;
          fetchAllUserData(adminId);
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to approve user');
      }
    } catch (error: any) {
      console.error('Error approving user:', error);
      Alert.alert('Error', error.message || 'Failed to approve user');
    }
  };

  const openRejectModal = (user: any) => {
    setRejectingUser(user);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectingUser(null);
    setRejectionReason('');
  };

  const handleRejectUser = async () => {
    if (!rejectingUser) return;

    setIsRejecting(true);
    try {
      const response = await rejectPendingUser(
        rejectingUser._id,
        rejectionReason.trim() || 'No reason provided'
      );

      if (response.success) {
        Alert.alert('Success', 'User rejected successfully!');
        closeRejectModal();
        // Refresh user data
        if (adminData) {
          const adminId = adminData.profile?._id || adminData._id || adminData.id;
          fetchAllUserData(adminId);
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to reject user');
      }
    } catch (error: any) {
      console.error('Error rejecting user:', error);
      Alert.alert('Error', error.message || 'Failed to reject user');
    } finally {
      setIsRejecting(false);
    }
  };

  const faqData = [
    {
      question: 'How do I manage seller approvals?',
      answer:
        'Navigate to the Sellers tab to view all approved sellers. You can view their profiles, upload information, and manage their accounts from there.',
    },
    {
      question: 'How do I send notifications to sellers?',
      answer:
        'Go to the Notifications tab and use the broadcast notification form. You can send messages to all sellers or select specific sellers, set priority levels, and track your notification history.',
    },
    {
      question: 'How do I view seller uploaded images?',
      answer:
        'In the Sellers tab, click on any seller card to view their profile. Scroll down to see all uploaded images with location data if available.',
    },
    {
      question: 'How do I respond to seller help requests?',
      answer:
        'In the Help tab under "Seller Help Requests", you can view all conversations. Click "View Chat" to see the full conversation thread and send replies to sellers.',
    },
    {
      question: 'How do I reset a seller password?',
      answer:
        'Open the seller profile from the Sellers tab, scroll to the "Reset Password" section, enter a new password, confirm it, and click "Reset Password".',
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }


  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.adminName}>{adminData?.name || 'Administrator'}</Text>
              </View>
            </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <Pressable
            style={[styles.statCard, { backgroundColor: '#dbeafe' }]}
            onPress={() => {
              setActiveTab('sellers');
              setSellersFilter('approved'); // Total Sellers shows approved users
            }}
            android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
          >
            <View style={[styles.statIconContainer, { backgroundColor: '#3b82f6' }]}>
              <Ionicons name="people" size={24} color={Colors.white} />
            </View>
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Sellers</Text>
          </Pressable>

          <Pressable
            style={[styles.statCard, { backgroundColor: '#fef3c7' }]}
            onPress={() => {
              setActiveTab('sellers');
              setSellersFilter('pending'); // Pending shows pending users
            }}
            android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
          >
            <View style={[styles.statIconContainer, { backgroundColor: '#f59e0b' }]}>
              <Ionicons name="time" size={24} color={Colors.white} />
            </View>
            <Text style={styles.statValue}>{stats.pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </Pressable>

          <Pressable
            style={[styles.statCard, { backgroundColor: '#d1fae5' }]}
            onPress={() => {
              setActiveTab('sellers');
              setSellersFilter('approved'); // Approved shows approved users
            }}
            android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
          >
            <View style={[styles.statIconContainer, { backgroundColor: '#10b981' }]}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.white} />
            </View>
            <Text style={styles.statValue}>{stats.approvedCount}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </Pressable>

          <Pressable
            style={[styles.statCard, { backgroundColor: '#fee2e2' }]}
            onPress={() => {
              setActiveTab('sellers');
              setSellersFilter('rejected'); // Rejected shows rejected users
            }}
            android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
          >
            <View style={[styles.statIconContainer, { backgroundColor: '#ef4444' }]}>
              <Ionicons name="close-circle" size={24} color={Colors.white} />
            </View>
            <Text style={styles.statValue}>{stats.rejectedCount}</Text>
            <Text style={styles.statLabel}>Rejected</Text>
          </Pressable>
        </View>

        {/* Admin Stories */}
        {adminStories.length > 0 && (
          <Stories
            stories={adminStories}
            onStoryPress={(index) => {
              setSelectedStoryIndex(index);
              setShowStoryViewer(true);
            }}
            isAdmin={true}
            onDeleteStory={handleDeleteStory}
            sectionTitle="Check My Status"
          />
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <Pressable
            style={styles.actionCard}
            onPress={() => {
              setActiveTab('sellers');
            }}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="people-outline" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Manage Sellers</Text>
                <Text style={styles.actionDescription}>View and approve pending sellers</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
          </Pressable>

          <Pressable
            style={styles.actionCard}
            onPress={() => {
              setActiveTab('notifications');
            }}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#e0e7ff' }]}>
                <Ionicons name="sparkles-outline" size={20} color="#6366f1" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.actionTitle}>My Status</Text>
                  {adminStories.length > 0 && (
                    <View style={styles.storyBadge}>
                      <Text style={styles.storyBadgeText}>{adminStories.length}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.actionDescription}>
                  View and upload stories (24h updates)
                </Text>
              </View>
            </View>
            <Pressable
              style={styles.addStoryButton}
              onPress={() => setActiveTab('notifications')}
            >
              <Ionicons name="add-circle" size={28} color={Colors.primary} />
            </Pressable>
          </Pressable>
        </View>
          </>
        );
      case 'sellers':
        // Get the appropriate user list based on filter
        const currentUserList =
          sellersFilter === 'approved'
            ? approvedUsers
            : sellersFilter === 'pending'
            ? pendingUsers
            : rejectedUsers;

        const filteredUserList = currentUserList.filter(
          (user) =>
            user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.phoneNumber?.includes(searchQuery) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
          <>
            {/* Filter Tabs */}
            <View style={styles.filterTabs}>
              <Pressable
                style={[
                  styles.filterTab,
                  sellersFilter === 'approved' && styles.filterTabActive,
                ]}
                onPress={() => setSellersFilter('approved')}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={sellersFilter === 'approved' ? Colors.white : Colors.primary}
                />
                <Text
                  style={[
                    styles.filterTabText,
                    sellersFilter === 'approved' && styles.filterTabTextActive,
                  ]}
                >
                  Approved ({approvedUsers.length})
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.filterTab,
                  sellersFilter === 'pending' && styles.filterTabActive,
                ]}
                onPress={() => setSellersFilter('pending')}
              >
                <Ionicons
                  name="time"
                  size={18}
                  color={sellersFilter === 'pending' ? Colors.white : '#f59e0b'}
                />
                <Text
                  style={[
                    styles.filterTabText,
                    sellersFilter === 'pending' && styles.filterTabTextActive,
                  ]}
                >
                  Pending ({pendingUsers.length})
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.filterTab,
                  sellersFilter === 'rejected' && styles.filterTabActive,
                ]}
                onPress={() => setSellersFilter('rejected')}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={sellersFilter === 'rejected' ? Colors.white : Colors.error}
                />
                <Text
                  style={[
                    styles.filterTabText,
                    sellersFilter === 'rejected' && styles.filterTabTextActive,
                  ]}
                >
                  Rejected ({rejectedUsers.length})
                </Text>
              </Pressable>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={Colors.textLight} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                placeholderTextColor={Colors.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Add Seller Button */}
            <Pressable
              style={styles.addSellerButtonInTab}
              onPress={() => setShowAddUserScreen(true)}
            >
              <Ionicons name="person-add" size={20} color={Colors.white} />
              <Text style={styles.addSellerButtonText}>Add Seller</Text>
            </Pressable>

            {/* User List */}
            {filteredUserList.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color={Colors.textLight} />
                <Text style={styles.emptyTitle}>
                  No {sellersFilter.charAt(0).toUpperCase() + sellersFilter.slice(1)} Users
                </Text>
                <Text style={styles.emptyDescription}>
                  {searchQuery ? 'Try adjusting your search' : `No ${sellersFilter} users yet`}
                </Text>
              </View>
            ) : (
              filteredUserList.map((user, index) => (
                <View key={user._id || index} style={styles.userCard}>
                  {/* User Header */}
                  <View style={styles.userCardHeader}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.name || 'N/A'}</Text>
                      <View style={styles.userMeta}>
                        <Ionicons name="call" size={12} color={Colors.textLight} />
                        <Text style={styles.userMetaText}>{user.phoneNumber || 'N/A'}</Text>
                      </View>
                      {user.email && (
                        <View style={styles.userMeta}>
                          <Ionicons name="mail" size={12} color={Colors.textLight} />
                          <Text style={styles.userMetaText}>{user.email}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* User Details */}
                  <View style={styles.userDetails}>
                    {sellersFilter === 'pending' && (
                      <>
                        <View style={styles.userDetailRow}>
                          <Ionicons name="calendar" size={14} color={Colors.textLight} />
                          <Text style={styles.userDetailText}>
                            Requested: {new Date(user.requestedAt || user.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                        {user.previousRejection && user.previousRejection.rejectedAt && (
                          <View style={styles.warningBadge}>
                            <Ionicons name="alert-circle" size={14} color="#f59e0b" />
                            <Text style={styles.warningText}>Previously Rejected</Text>
                          </View>
                        )}
                      </>
                    )}

                    {sellersFilter === 'approved' && (
                      <>
                        <View style={styles.userDetailRow}>
                          <Ionicons name="cube" size={14} color={Colors.textLight} />
                          <Text style={styles.userDetailText}>
                            Seeds: {formatNumber(user.seedsCount || 0)}
                          </Text>
                        </View>
                        <View style={styles.userDetailRow}>
                          <Ionicons name="gift" size={14} color={Colors.textLight} />
                          <Text style={styles.userDetailText}>Bonus: {formatNumber(user.bonus || 0)}</Text>
                        </View>
                        <View style={styles.userDetailRow}>
                          <Ionicons name="cash" size={14} color={Colors.textLight} />
                          <Text style={styles.userDetailText}>Price: ₹{formatNumber(user.price || 0)}</Text>
                        </View>
                        <View style={styles.userDetailRow}>
                          <Ionicons name="fish" size={14} color={Colors.textLight} />
                          <Text style={styles.userDetailText}>Type: {user.seedType || 'N/A'}</Text>
                        </View>
                      </>
                    )}

                    {sellersFilter === 'rejected' && (
                      <>
                        <View style={styles.userDetailRow}>
                          <Ionicons name="calendar" size={14} color={Colors.textLight} />
                          <Text style={styles.userDetailText}>
                            Rejected: {new Date(user.rejectedAt || user.updatedAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={styles.rejectionReason}>
                          <Text style={styles.rejectionReasonLabel}>Reason:</Text>
                          <Text style={styles.rejectionReasonText}>
                            {user.reason || user.rejectionReason || 'No reason provided'}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>

                  {/* Image Thumbnails */}
                  {user.images && user.images.length > 0 && (
                    <View style={styles.imagePreviewSection}>
                      <Text style={styles.imagePreviewLabel}>
                        <Ionicons name="images" size={14} color={Colors.textLight} /> Images ({user.images.length})
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScrollView}>
                        {user.images.slice(0, 4).map((image: any, index: number) => (
                          <Pressable
                            key={index}
                            style={styles.imageThumbnail}
                            onPress={() => handleViewImage(user, image.url)}
                          >
                            <Image
                              source={{ uri: image.url }}
                              style={styles.thumbnailImage}
                              resizeMode="cover"
                            />
                          </Pressable>
                        ))}
                        {user.images.length > 4 && (
                          <View style={styles.moreImagesIndicator}>
                            <Text style={styles.moreImagesText}>+{user.images.length - 4}</Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>
                  )}

                  {/* Action Buttons */}
                  {sellersFilter === 'pending' && (
                    <View style={styles.userActions}>
                      <Pressable
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleApproveUser(user._id)}
                      >
                        <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
                        <Text style={styles.actionButtonText}>Approve</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => openRejectModal(user)}
                      >
                        <Ionicons name="close-circle" size={18} color={Colors.white} />
                        <Text style={styles.actionButtonText}>Reject</Text>
                      </Pressable>
                    </View>
                  )}

                  {sellersFilter === 'approved' && (
                    <Pressable
                      style={styles.viewProfileButton}
                      onPress={() => handleViewSellerProfile(user)}
                    >
                      <Ionicons name="eye" size={18} color={Colors.primary} />
                      <Text style={styles.viewProfileButtonText}>View Profile</Text>
                    </Pressable>
                  )}
                </View>
              ))
            )}
          </>
        );
      case 'notifications':
        return <NotificationsScreen adminData={adminData} approvedUsers={approvedUsers} />;
      case 'history':
        return (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Purchase History</Text>
              <Text style={styles.sectionSubtitle}>
                View all completed hatchery purchases
              </Text>
            </View>

            {loadingHistory ? (
              <View style={styles.historyLoading}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.historyLoadingText}>Loading history...</Text>
              </View>
            ) : transactionHistory.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Ionicons name="time-outline" size={64} color={Colors.textLight} />
                <Text style={styles.emptyHistoryText}>No transactions yet</Text>
                <Text style={styles.emptyHistorySubtext}>
                  Completed hatchery approvals will appear here
                </Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {transactionHistory.map((transaction: any) => (
                  <InvoiceCard
                    key={transaction._id}
                    transaction={transaction}
                    onImagePress={(imageUrl: string) => {
                      setSelectedTransactionImageUrl(imageUrl);
                      setShowTransactionImageViewer(true);
                    }}
                  />
                ))}
              </View>
            )}
          </>
        );
      case 'help':
        return (
          <>
            {/* Seller Help Requests */}
            <View style={styles.helpSection}>
              <View style={styles.helpSectionHeader}>
                <View style={styles.helpHeaderLeft}>
                  <Ionicons name="chatbubbles" size={20} color={Colors.primary} />
                  <Text style={styles.helpSectionTitle}>Seller Help Requests</Text>
                </View>
                <Pressable onPress={loadUserConversations} disabled={loadingConversations}>
                  <Ionicons
                    name="refresh"
                    size={20}
                    color={loadingConversations ? Colors.textLight : Colors.primary}
                  />
                </Pressable>
              </View>

              {loadingConversations ? (
                <View style={styles.conversationsLoading}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.conversationsLoadingText}>Loading conversations...</Text>
                </View>
              ) : userConversations.length === 0 ? (
                <View style={styles.emptyConversations}>
                  <Ionicons name="chatbubbles-outline" size={48} color={Colors.textLight} />
                  <Text style={styles.emptyConversationsTitle}>No user help requests yet</Text>
                  <Text style={styles.emptyConversationsText}>
                    Conversations will appear here when users send help messages
                  </Text>
                </View>
              ) : (
                <>
                  {(() => {
                    // Group conversations by userId to get latest per user
                    const userMap = new Map();
                    userConversations.forEach((conv) => {
                      const userId = conv.userId?._id || conv.userId;
                      const existing = userMap.get(userId);
                      if (!existing || new Date(conv.updatedAt) > new Date(existing.updatedAt)) {
                        userMap.set(userId, conv);
                      }
                    });
                    const latestConversations = Array.from(userMap.values());
                    const displayConversations = showAllConversations
                      ? userConversations
                      : latestConversations.slice(0, 1);

                    return displayConversations.map((conversation, index) => (
                      <View key={conversation._id || index} style={styles.conversationCard}>
                        <View style={styles.conversationHeader}>
                          <Text style={styles.conversationSubject}>{conversation.subject}</Text>
                          <Text style={styles.conversationStatus}>
                            {conversation.status === 'open' ? '🟢' : '🔴'}{' '}
                            {conversation.status === 'open' ? 'Open' : 'Closed'}
                          </Text>
                        </View>

                        <View style={styles.conversationUserInfo}>
                          <View style={styles.conversationUserDetail}>
                            <Ionicons name="person" size={14} color={Colors.textLight} />
                            <Text style={styles.conversationUserText}>{conversation.userName}</Text>
                          </View>
                          <View style={styles.conversationUserDetail}>
                            <Ionicons name="call" size={14} color={Colors.textLight} />
                            <Text style={styles.conversationUserText}>{conversation.userPhone}</Text>
                          </View>
                        </View>

                        <View style={styles.conversationFooter}>
                          <Text style={styles.conversationMessageCount}>
                            {conversation.messages?.length || 0} message(s)
                          </Text>
                          <Pressable
                            style={styles.viewChatButton}
                            onPress={() => handleViewConversation(conversation)}
                          >
                            <Ionicons name="chatbubble-ellipses" size={16} color={Colors.white} />
                            <Text style={styles.viewChatButtonText}>View Chat</Text>
                          </Pressable>
                        </View>
                      </View>
                    ));
                  })()}
                  {(() => {
                    // Calculate unique users
                    const userMap = new Map();
                    userConversations.forEach((conv) => {
                      const userId = conv.userId?._id || conv.userId;
                      userMap.set(userId, true);
                    });
                    const uniqueUserCount = userMap.size;

                    return userConversations.length > 1 && (
                      <Pressable
                        style={styles.viewAllButton}
                        onPress={() => setShowAllConversations(!showAllConversations)}
                      >
                        <Text style={styles.viewAllButtonText}>
                          {showAllConversations
                            ? 'Show Latest Only'
                            : `View All Conversations (${userConversations.length} from ${uniqueUserCount} ${uniqueUserCount === 1 ? 'user' : 'users'})`}
                        </Text>
                        <Ionicons
                          name={showAllConversations ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color={Colors.primary}
                        />
                      </Pressable>
                    );
                  })()}
                </>
              )}
            </View>

            {/* FAQ Section */}
            <View style={styles.faqSection}>
              <View style={styles.faqSectionHeader}>
                <Ionicons name="help-circle" size={20} color={Colors.primary} />
                <Text style={styles.faqSectionTitle}>Frequently Asked Questions</Text>
              </View>

              {faqData.map((faq, index) => (
                <View key={index} style={styles.faqItem}>
                  <Pressable
                    style={[styles.faqQuestion, expandedFaq === index && styles.faqQuestionActive]}
                    onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  >
                    <Text style={styles.faqQuestionText}>{faq.question}</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={Colors.primary}
                      style={[
                        styles.faqChevron,
                        expandedFaq === index && styles.faqChevronExpanded,
                      ]}
                    />
                  </Pressable>

                  {expandedFaq === index && (
                    <View style={styles.faqAnswer}>
                      <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </>
        );
      default:
        return null;
    }
  };

  // Render Add Seller Screen
  if (showAddUserScreen) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Header with Back Button */}
          <View style={styles.addUserHeader}>
            <Pressable
              style={styles.backButton}
              onPress={() => {
                setShowAddUserScreen(false);
                setFormData({
                  fullName: '',
                  mobileNumber: '',
                  email: '',
                  country: '',
                  state: '',
                  district: '',
                  fullAddress: '',
                  pincode: '',
                  seedsCount: '',
                  bonus: '',
                  price: '',
                  seedType: 'Hardyline',
                  password: '',
                  confirmPassword: '',
                });
                setFormErrors({});
              }}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </Pressable>
            <Text style={styles.addUserHeaderTitle}>Add New User</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Form Content */}
          <ScrollView
            style={styles.addUserFormContainer}
            contentContainerStyle={styles.addUserFormContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          {/* Profile Information Section */}
          <Text style={styles.formSectionTitle}>Profile Information</Text>

          <View style={styles.formField}>
            <Text style={styles.formFieldLabel}>Full Name *</Text>
            <TextInput
              style={[styles.formInput, formErrors.fullName && styles.formInputError]}
              placeholder="Enter full name"
              placeholderTextColor={Colors.textLight}
              value={formData.fullName}
              onChangeText={(value) => handleFormChange('fullName', value)}
            />
            {formErrors.fullName && (
              <Text style={styles.formErrorText}>{formErrors.fullName}</Text>
            )}
          </View>

          <View style={styles.formField}>
            <Text style={styles.formFieldLabel}>Phone Number *</Text>
            <TextInput
              style={[styles.formInput, formErrors.mobileNumber && styles.formInputError]}
              placeholder="Enter phone number"
              placeholderTextColor={Colors.textLight}
              value={formData.mobileNumber}
              onChangeText={(value) => handleFormChange('mobileNumber', value)}
              keyboardType="phone-pad"
            />
            {formErrors.mobileNumber && (
              <Text style={styles.formErrorText}>{formErrors.mobileNumber}</Text>
            )}
          </View>

          <View style={styles.formField}>
            <Text style={styles.formFieldLabel}>Email Address</Text>
            <TextInput
              style={[styles.formInput, formErrors.email && styles.formInputError]}
              placeholder="email@example.com"
              placeholderTextColor={Colors.textLight}
              value={formData.email}
              onChangeText={(value) => handleFormChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {formErrors.email && (
              <Text style={styles.formErrorText}>{formErrors.email}</Text>
            )}
          </View>

          <View style={styles.formRow}>
            <View style={styles.formFieldHalf}>
              <Text style={styles.formFieldLabel}>Country *</Text>
              <TextInput
                style={[styles.formInput, formErrors.country && styles.formInputError]}
                placeholder="Enter country"
                placeholderTextColor={Colors.textLight}
                value={formData.country}
                onChangeText={(value) => handleFormChange('country', value)}
              />
              {formErrors.country && (
                <Text style={styles.formErrorText}>{formErrors.country}</Text>
              )}
            </View>

            <View style={styles.formFieldHalf}>
              <Text style={styles.formFieldLabel}>State *</Text>
              <TextInput
                style={[styles.formInput, formErrors.state && styles.formInputError]}
                placeholder="Enter state"
                placeholderTextColor={Colors.textLight}
                value={formData.state}
                onChangeText={(value) => handleFormChange('state', value)}
              />
              {formErrors.state && (
                <Text style={styles.formErrorText}>{formErrors.state}</Text>
              )}
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formFieldHalf}>
              <Text style={styles.formFieldLabel}>District *</Text>
              <TextInput
                style={[styles.formInput, formErrors.district && styles.formInputError]}
                placeholder="Enter district"
                placeholderTextColor={Colors.textLight}
                value={formData.district}
                onChangeText={(value) => handleFormChange('district', value)}
              />
              {formErrors.district && (
                <Text style={styles.formErrorText}>{formErrors.district}</Text>
              )}
            </View>

            <View style={styles.formFieldHalf}>
              <Text style={styles.formFieldLabel}>Pincode *</Text>
              <TextInput
                style={[styles.formInput, formErrors.pincode && styles.formInputError]}
                placeholder="Enter pincode"
                placeholderTextColor={Colors.textLight}
                value={formData.pincode}
                onChangeText={(value) => handleFormChange('pincode', value)}
                keyboardType="numeric"
              />
              {formErrors.pincode && (
                <Text style={styles.formErrorText}>{formErrors.pincode}</Text>
              )}
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.formFieldLabel}>Full Address *</Text>
            <TextInput
              style={[
                styles.formInput,
                styles.formTextArea,
                formErrors.fullAddress && styles.formInputError,
              ]}
              placeholder="Enter complete address"
              placeholderTextColor={Colors.textLight}
              value={formData.fullAddress}
              onChangeText={(value) => handleFormChange('fullAddress', value)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            {formErrors.fullAddress && (
              <Text style={styles.formErrorText}>{formErrors.fullAddress}</Text>
            )}
          </View>

          {/* Seeds Information Section */}
          <Text style={styles.formSectionTitle}>Seeds Information</Text>

          <View style={styles.formRow}>
            <View style={styles.formFieldHalf}>
              <Text style={styles.formFieldLabel}>Seeds Count *</Text>
              <TextInput
                style={[styles.formInput, formErrors.seedsCount && styles.formInputError]}
                placeholder="Enter seeds count"
                placeholderTextColor={Colors.textLight}
                value={formData.seedsCount}
                onChangeText={(value) => {
                  const formatted = formatNumberInput(value);
                  handleFormChange('seedsCount', formatted);
                }}
                keyboardType="numeric"
              />
              {formErrors.seedsCount && (
                <Text style={styles.formErrorText}>{formErrors.seedsCount}</Text>
              )}
            </View>

            <View style={styles.formFieldHalf}>
              <Text style={styles.formFieldLabel}>Bonus</Text>
              <TextInput
                style={[styles.formInput, formErrors.bonus && styles.formInputError]}
                placeholder="Enter bonus"
                placeholderTextColor={Colors.textLight}
                value={formData.bonus}
                onChangeText={(value) => {
                  const formatted = formatNumberInput(value);
                  handleFormChange('bonus', formatted);
                }}
                keyboardType="numeric"
              />
              {formErrors.bonus && (
                <Text style={styles.formErrorText}>{formErrors.bonus}</Text>
              )}
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formFieldHalf}>
              <Text style={styles.formFieldLabel}>Price *</Text>
              <TextInput
                style={[styles.formInput, formErrors.price && styles.formInputError]}
                placeholder="Enter price"
                placeholderTextColor={Colors.textLight}
                value={formData.price}
                onChangeText={(value) => {
                  const formatted = formatNumberInput(value);
                  handleFormChange('price', formatted);
                }}
                keyboardType="numeric"
              />
              {formErrors.price && (
                <Text style={styles.formErrorText}>{formErrors.price}</Text>
              )}
            </View>

            <View style={styles.formFieldHalf}>
              <Text style={styles.formFieldLabel}>Seed Type *</Text>
              <TextInput
                style={[styles.formInput, formErrors.seedType && styles.formInputError]}
                placeholder="Enter seed type"
                placeholderTextColor={Colors.textLight}
                value={formData.seedType}
                onChangeText={(value) => handleFormChange('seedType', value)}
              />
              {formErrors.seedType && (
                <Text style={styles.formErrorText}>{formErrors.seedType}</Text>
              )}
            </View>
          </View>

          {/* Security Section */}
          <Text style={styles.formSectionTitle}>Security</Text>

          <View style={styles.formField}>
            <Text style={styles.formFieldLabel}>Create Password *</Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={[styles.formInput, styles.passwordInput, formErrors.password && styles.formInputError]}
                placeholder="Enter password (min. 6 characters)"
                placeholderTextColor={Colors.textLight}
                value={formData.password}
                onChangeText={(value) => handleFormChange('password', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={Colors.textLight}
                />
              </Pressable>
            </View>
            {formErrors.password && (
              <Text style={styles.formErrorText}>{formErrors.password}</Text>
            )}
          </View>

          <View style={styles.formField}>
            <Text style={styles.formFieldLabel}>Confirm Password *</Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={[styles.formInput, styles.passwordInput, formErrors.confirmPassword && styles.formInputError]}
                placeholder="Confirm your password"
                placeholderTextColor={Colors.textLight}
                value={formData.confirmPassword}
                onChangeText={(value) => handleFormChange('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <Pressable
                style={styles.passwordToggle}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={Colors.textLight}
                />
              </Pressable>
            </View>
            {formErrors.confirmPassword && (
              <Text style={styles.formErrorText}>{formErrors.confirmPassword}</Text>
            )}
          </View>

          {/* Submit Button */}
          <Pressable
            style={[styles.submitButton, addingUser && styles.submitButtonDisabled]}
            onPress={handleAddUser}
            disabled={addingUser}
          >
            {addingUser ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <Ionicons name="person-add" size={18} color={Colors.white} />
                <Text style={styles.submitButtonText}>Add Seller</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top Bar - Always Visible */}
      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <Image
            source={logoSource}
            style={styles.appLogo}
            resizeMode="cover"
          />
          <Text style={styles.logoTitle}>Lord's Aqua</Text>
        </View>
        <View style={styles.topBarRight}>
          <Pressable
            style={styles.notificationBellButton}
            onPress={() => setActiveTab('notifications')}
          >
            <Ionicons name="notifications" size={24} color={Colors.primary} />
          </Pressable>
          <ProfileMenu
            userType="admin"
            userName={adminData?.profile?.name || adminData?.name || 'Admin'}
            onMyProfile={() => {
              router.push('/(admin)/profile');
            }}
            onLogout={handleLogout}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {renderContent()}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Pressable
          style={styles.navItem}
          onPress={() => setActiveTab('home')}
        >
          <Ionicons
            name={activeTab === 'home' ? 'home' : 'home-outline'}
            size={24}
            color={activeTab === 'home' ? Colors.primary : Colors.textLight}
          />
          <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>
            Home
          </Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => setActiveTab('sellers')}
        >
          <Ionicons
            name={activeTab === 'sellers' ? 'people' : 'people-outline'}
            size={24}
            color={activeTab === 'sellers' ? Colors.primary : Colors.textLight}
          />
          <Text style={[styles.navLabel, activeTab === 'sellers' && styles.navLabelActive]}>
            Sellers
          </Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons
            name={activeTab === 'history' ? 'time' : 'time-outline'}
            size={24}
            color={activeTab === 'history' ? Colors.primary : Colors.textLight}
          />
          <Text style={[styles.navLabel, activeTab === 'history' && styles.navLabelActive]}>
            History
          </Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => {
            setActiveTab('help');
            setHelpUnreadCount(0); // Clear badge immediately when tab is clicked
          }}
        >
          <View style={{ position: 'relative' }}>
            <Ionicons
              name={activeTab === 'help' ? 'help-circle' : 'help-circle-outline'}
              size={24}
              color={activeTab === 'help' ? Colors.primary : Colors.textLight}
            />
            {helpUnreadCount > 0 && (
              <View style={styles.helpBadge}>
                <Text style={styles.helpBadgeText}>
                  {helpUnreadCount > 9 ? '9+' : helpUnreadCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.navLabel, activeTab === 'help' && styles.navLabelActive]}>
            Help
          </Text>
        </Pressable>
      </View>

      {/* Conversation Modal */}
      <Modal
        visible={showConversationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConversationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.conversationModalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedConversation?.subject}</Text>
                <Text style={styles.conversationModalSubtitle}>
                  {selectedConversation?.userName} • {selectedConversation?.userPhone}
                </Text>
              </View>
              <Pressable onPress={() => setShowConversationModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>

            {/* Messages */}
            <ScrollView style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
              {selectedConversation?.messages?.map((msg: any, index: number) => (
                <View
                  key={msg._id || index}
                  style={[
                    styles.messageBubble,
                    msg.sender === 'admin' ? styles.adminMessage : styles.userMessage,
                  ]}
                >
                  <Text style={[styles.messageText, msg.sender === 'admin' && styles.adminMessageText]}>
                    {msg.message}
                  </Text>
                  <Text style={[styles.messageTime, msg.sender === 'admin' && styles.adminMessageTime]}>
                    {formatDate(msg.createdAt)}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* Reply Section */}
            {selectedConversation?.status === 'open' && (
              <View style={styles.replySection}>
                <TextInput
                  style={styles.replyInput}
                  placeholder="Type your reply..."
                  placeholderTextColor={Colors.textLight}
                  value={replyText}
                  onChangeText={setReplyText}
                  multiline
                />
                <View style={styles.replyActions}>
                  <Pressable
                    style={[styles.replyButton, sendingReply && styles.replyButtonDisabled]}
                    onPress={handleSendReply}
                    disabled={sendingReply}
                  >
                    {sendingReply ? (
                      <ActivityIndicator color={Colors.white} size="small" />
                    ) : (
                      <>
                        <Ionicons name="send" size={18} color={Colors.white} />
                        <Text style={styles.replyButtonText}>Send Reply</Text>
                      </>
                    )}
                  </Pressable>
                  <Pressable
                    style={styles.closeConversationButton}
                    onPress={handleCloseConversation}
                  >
                    <Ionicons name="close-circle" size={18} color={Colors.white} />
                    <Text style={styles.closeConversationButtonText}>Close Conversation</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {selectedConversation?.status === 'closed' && (
              <View style={styles.closedNotice}>
                <Ionicons name="lock-closed" size={20} color={Colors.textLight} />
                <Text style={styles.closedNoticeText}>This conversation has been closed</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Reject User Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={closeRejectModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.rejectModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject User</Text>
              <Pressable onPress={closeRejectModal}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>

            <View style={styles.rejectModalBody}>
              <View style={styles.warningContainer}>
                <Ionicons name="alert-circle" size={32} color={Colors.error} />
                <Text style={styles.warningTitle}>
                  Are you sure you want to reject {rejectingUser?.name}?
                </Text>
              </View>

              <View style={styles.formField}>
                <Text style={styles.formFieldLabel}>Reason for Rejection (Optional)</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="Enter the reason for rejecting this user (optional)..."
                  placeholderTextColor={Colors.textLight}
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={styles.rejectModalFooter}>
              <Pressable
                style={[styles.actionButton, styles.cancelButton2]}
                onPress={closeRejectModal}
                disabled={isRejecting}
              >
                <Text style={styles.cancelButton2Text}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.actionButton, styles.confirmRejectButton]}
                onPress={handleRejectUser}
                disabled={isRejecting}
              >
                {isRejecting ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.actionButtonText}>Confirm Rejection</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>


      {/* Transaction History Image Viewer (Simple Viewer without Feedback) */}
      {showTransactionImageViewer && selectedTransactionImageUrl && (
        <ZoomableImageViewer
          imageUrl={selectedTransactionImageUrl}
          onClose={() => setShowTransactionImageViewer(false)}
        />
      )}

      {/* Story Viewer Modal */}
      <StoryViewerModal
        visible={showStoryViewer}
        stories={adminStories}
        initialIndex={selectedStoryIndex}
        onClose={() => setShowStoryViewer(false)}
        onStoryViewed={() => {}}
      />
    </SafeAreaView>
  );
}

// Zoomable Image Viewer Component (for transaction history images only)
function ZoomableImageViewer({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else if (scale.value > 5) {
        scale.value = withSpring(5);
        savedScale.value = 5;
      } else {
        savedScale.value = scale.value;
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withSpring(2);
        savedScale.value = 2;
      }
    });

  const composedGesture = Gesture.Simultaneous(
    Gesture.Race(doubleTapGesture, Gesture.Simultaneous(panGesture, pinchGesture))
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const handleZoomIn = () => {
    const newScale = Math.min(5, scale.value + 0.5);
    scale.value = withSpring(newScale);
    savedScale.value = newScale;
  };

  const handleZoomOut = () => {
    const newScale = Math.max(1, scale.value - 0.5);
    scale.value = withSpring(newScale);
    savedScale.value = newScale;
    if (newScale === 1) {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    }
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.transactionImageViewerContainer}>
        <SafeAreaView style={styles.transactionImageViewerSafeArea} edges={['top']}>
          <GestureDetector gesture={composedGesture}>
            <Animated.View style={[styles.transactionImageViewerImageContainer, animatedStyle]}>
              <Image
                source={{ uri: imageUrl }}
                style={[styles.transactionImageViewerImage, { width, height }]}
                resizeMode="contain"
              />
            </Animated.View>
          </GestureDetector>

          <View style={styles.transactionImageViewerHeader}>
            <Pressable
              style={styles.transactionImageViewerBackButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </Pressable>
            <Text style={styles.transactionImageViewerTitle}>Image Viewer</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.transactionImageViewerControls}>
            <Pressable style={styles.transactionImageViewerControlButton} onPress={handleZoomOut}>
              <Ionicons name="remove-outline" size={24} color={Colors.white} />
            </Pressable>
            <Pressable style={styles.transactionImageViewerControlButton} onPress={handleZoomIn}>
              <Ionicons name="add-outline" size={24} color={Colors.white} />
            </Pressable>
          </View>

          <View style={styles.transactionImageViewerHint}>
            <Text style={styles.transactionImageViewerHintText}>
              Pinch to zoom • Drag to move • Double tap to zoom
            </Text>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
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
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  logoTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 24,
    marginTop: 20,
  },
  welcomeText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  adminName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  actionDescription: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  storyBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  addStoryButton: {
    padding: 4,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  navLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  helpBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  helpBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  tabContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
  },
  tabDescription: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
  },
  sellerCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  sellerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  sellerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  sellerMetaText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  viewButton: {
    padding: 8,
  },
  imagesPreview: {
    marginTop: 8,
  },
  imagesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  imageThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  seedsInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.inputBg,
    borderRadius: 8,
  },
  seedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  seedLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  seedValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  // Notification styles
  notificationCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notificationCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  targetOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  targetOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  targetOptionActive: {
    backgroundColor: Colors.primary,
  },
  targetOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  targetOptionTextActive: {
    color: Colors.white,
  },
  userSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 48,
  },
  userSelectorText: {
    fontSize: 14,
    color: Colors.text,
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  priorityOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  priorityOptionTextActive: {
    color: Colors.white,
  },
  messageInput: {
    backgroundColor: Colors.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    minHeight: 100,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  notificationHistorySection: {
    marginBottom: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  historyLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 32,
  },
  historyLoadingText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 12,
  },
  historyItem: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityBadgeHigh: {
    backgroundColor: '#fee2e2',
  },
  priorityBadgeMedium: {
    backgroundColor: '#fef3c7',
  },
  priorityBadgeLow: {
    backgroundColor: '#dbeafe',
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text,
  },
  historyRecipientCount: {
    fontSize: 12,
    color: Colors.textLight,
  },
  historyTime: {
    fontSize: 12,
    color: Colors.textLight,
  },
  historyMessage: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  userPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  userPickerItemSelected: {
    backgroundColor: Colors.inputBg,
  },
  userPickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userPickerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPickerAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  userPickerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  userPickerPhone: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 2,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  emptyList: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  // Help section styles
  helpSection: {
    marginBottom: 24,
    marginTop: 20,
  },
  helpSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  helpHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  conversationsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 32,
  },
  conversationsLoadingText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  emptyConversations: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyConversationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
  },
  emptyConversationsText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  conversationCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  conversationSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  conversationStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  conversationUserInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  conversationUserDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  conversationUserText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  conversationMessageCount: {
    fontSize: 12,
    color: Colors.textLight,
  },
  viewChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewChatButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 12,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  // FAQ styles
  faqSection: {
    marginBottom: 24,
  },
  faqSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  faqSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  faqItem: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestionActive: {
    backgroundColor: Colors.inputBg,
  },
  faqQuestionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  faqChevron: {
    transform: [{ rotate: '0deg' }],
  },
  faqChevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  faqAnswer: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: Colors.inputBg,
  },
  faqAnswerText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  // Conversation modal styles
  conversationModalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    height: '85%',
  },
  conversationModalSubtitle: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  adminMessage: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
  },
  userMessage: {
    backgroundColor: Colors.inputBg,
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  adminMessageText: {
    color: Colors.white,
  },
  messageTime: {
    fontSize: 10,
    color: Colors.textLight,
    alignSelf: 'flex-end',
  },
  adminMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  replySection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 16,
  },
  replyInput: {
    backgroundColor: Colors.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    minHeight: 60,
    marginBottom: 12,
  },
  replyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  replyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
  },
  replyButtonDisabled: {
    opacity: 0.6,
  },
  replyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  closeConversationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.error,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeConversationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  closedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: Colors.inputBg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  closedNoticeText: {
    fontSize: 14,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  // Add Seller styles
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationBellButton: {
    padding: 8,
    borderRadius: 8,
  },
  addUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addUserButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  addSellerButtonInTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addSellerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  addUserHeader: {
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
  addUserHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  addUserFormContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  addUserFormContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 12,
  },
  formField: {
    marginBottom: 16,
  },
  formFieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: Colors.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  formInputError: {
    borderColor: Colors.error,
  },
  formTextArea: {
    minHeight: 80,
    paddingTop: 10,
  },
  formErrorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  formFieldHalf: {
    flex: 1,
  },
  passwordInputWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 45,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  // Filter Tabs styles
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    marginTop: 20,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  filterTabTextActive: {
    color: Colors.white,
  },
  // User Card styles
  userCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  userMetaText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  userDetails: {
    marginBottom: 12,
  },
  userDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  userDetailText: {
    fontSize: 13,
    color: Colors.text,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  rejectionReason: {
    marginTop: 8,
    padding: 12,
    backgroundColor: Colors.inputBg,
    borderRadius: 8,
  },
  rejectionReasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLight,
    marginBottom: 4,
  },
  rejectionReasonText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  userActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: Colors.error,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  viewProfileButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  // Reject Modal styles
  rejectModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
  },
  rejectModalBody: {
    padding: 20,
  },
  warningContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginTop: 12,
  },
  rejectModalFooter: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelButton2: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButton2Text: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  confirmRejectButton: {
    flex: 1,
    backgroundColor: Colors.error,
  },
  pickerContainer: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    height: 48,
  },
  picker: {
    color: Colors.text,
    height: 48,
  },
  pickerInputContainer: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  pickerInput: {
    color: Colors.text,
    backgroundColor: 'transparent',
  },
  // Image Preview Section Styles
  imagePreviewSection: {
    marginTop: 12,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  imagePreviewLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 8,
    fontWeight: '500',
  },
  imageScrollView: {
    flexGrow: 0,
  },
  imageThumbnail: {
    marginRight: 8,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumbnailImage: {
    width: 50,
    height: 50,
  },
  moreImagesIndicator: {
    width: 50,
    height: 50,
    backgroundColor: Colors.gray[100],
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  historyList: {
    gap: 16,
  },
  historyCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  historyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  historyUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  historyUserPhone: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  historyStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#d1fae5',
    borderRadius: 12,
  },
  historyStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  historyDetails: {
    gap: 8,
    marginBottom: 12,
  },
  historyDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyDetailLabel: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '500',
  },
  historyDetailValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
  },
  historyImagesPreview: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  historyImagesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  historyImagesGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  historyImageThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  transactionImageViewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  transactionImageViewerSafeArea: {
    flex: 1,
  },
  transactionImageViewerHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 10,
  },
  transactionImageViewerBackButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 22,
  },
  transactionImageViewerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
  },
  transactionImageViewerImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionImageViewerImage: {
    width: '100%',
    height: '100%',
  },
  transactionImageViewerControls: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 16,
  },
  transactionImageViewerControlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
    padding: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionImageViewerHint: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    zIndex: 10,
  },
  transactionImageViewerHintText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
