import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
  Pressable,
  Modal,
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
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/src/store/context/AuthContext';
import { Colors } from '@/src/constants/colors';
import { getUserTransactionHistory } from '@/src/services/api/imageApi';
import UserHeader from '@/src/components/UserHeader';
import { getNotificationCount } from '@/src/services/api/userNotificationApi';
import { getUserProfile } from '@/src/services/api/authApi';
import InvoiceCard from '@/src/components/InvoiceCard';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    loadHistory();
    loadUserProfileAndNotifications();
  }, [user?.userId]);

  // Reset states when tab gains focus
  useFocusEffect(
    useCallback(() => {
      setShowImageViewer(false);
      setSelectedImageUrl(null);
    }, [])
  );

  const loadUserProfileAndNotifications = async () => {
    try {
      if (!user?.phoneNumber) return;

      const response = await getUserProfile(user.phoneNumber);
      if (response.success) {
        setUserProfile(response.user);
        await loadNotificationCount(response.user);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadNotificationCount = async (profile: any) => {
    try {
      const userId = profile?.mongoId || profile?._id || profile?.id;
      if (!userId) return;

      const response = await getNotificationCount(userId);
      if (response.success) {
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  };

  const loadHistory = async () => {
    if (!user?.userId) return;
    setLoading(true);
    try {
      const response = await getUserTransactionHistory(user.userId);
      if (response.success) {
        setTransactionHistory(response.transactions || []);
      }
    } catch (error: any) {
      console.error('Error loading transaction history:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleImagePress = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setShowImageViewer(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <UserHeader
        userName={userProfile?.name || user?.name}
        unreadCount={unreadCount}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : transactionHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>
              Your completed hatchery approvals will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {transactionHistory.map((transaction: any) => (
              <InvoiceCard
                key={transaction._id}
                transaction={transaction}
                onImagePress={handleImagePress}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Zoomable Image Viewer Modal */}
      {showImageViewer && selectedImageUrl && (
        <ZoomableImageViewer
          imageUrl={selectedImageUrl}
          onClose={() => setShowImageViewer(false)}
        />
      )}
    </SafeAreaView>
  );
}

// Zoomable Image Viewer Component
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
      // Limit zoom between 1x and 5x
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
      <GestureHandlerRootView style={styles.imageViewerContainer}>
        <View style={styles.imageViewerHeader}>
          <Pressable style={styles.imageViewerBackButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </Pressable>
          <Text style={styles.imageViewerTitle}>Image Viewer</Text>
          <View style={{ width: 24 }} />
        </View>

        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.imageViewerImageContainer, animatedStyle]}>
            <Image
              source={{ uri: imageUrl }}
              style={[styles.imageViewerImage, { width, height: height - 150 }]}
              resizeMode="contain"
            />
          </Animated.View>
        </GestureDetector>

        {/* Zoom Controls */}
        <View style={styles.imageViewerControls}>
          <Pressable style={styles.imageViewerControlButton} onPress={handleZoomOut}>
            <Ionicons name="remove-outline" size={24} color={Colors.white} />
          </Pressable>
          <Pressable style={styles.imageViewerControlButton} onPress={handleZoomIn}>
            <Ionicons name="add-outline" size={24} color={Colors.white} />
          </Pressable>
        </View>

        {/* Hint */}
        <View style={styles.imageViewerHint}>
          <Text style={styles.imageViewerHintText}>
            Pinch to zoom • Drag to move • Double tap to zoom
          </Text>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtext: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  cardDate: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#d1fae5',
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
  },
  cardDetails: {
    gap: 10,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '500',
    minWidth: 120,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
  },
  imagesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  imagesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  imagesGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  imageThumb: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  imageViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  imageViewerBackButton: {
    padding: 8,
  },
  imageViewerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  imageViewerImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerImage: {
    width: '100%',
    height: '100%',
  },
  imageViewerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 16,
  },
  imageViewerControlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
    padding: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerHint: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  imageViewerHintText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

