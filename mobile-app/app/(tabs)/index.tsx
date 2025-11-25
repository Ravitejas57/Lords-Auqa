import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/src/store/context/AuthContext';
import { Colors } from '@/src/constants/colors';
import { getUserProfile } from '@/src/services/api/authApi';
import { getNotificationCount, getActiveStories, markAsRead } from '@/src/services/api/userNotificationApi';
import UserHeader from '@/src/components/UserHeader';
import Stories from '@/src/components/Stories';
import StoryViewerModal from '@/src/components/StoryViewerModal';
import type { User } from '@/src/types/auth';
import { formatNumber } from '@/src/utils/formatNumber';

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stories, setStories] = useState<any[]>([]);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  useEffect(() => {
    loadUserProfile();
  }, []);

  // Refresh notification count and stories when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (userProfile) {
        loadNotificationCount(userProfile);
        loadStories(userProfile);
      }
    }, [userProfile])
  );

  const loadUserProfile = async () => {
    try {
      if (!user?.phoneNumber) return;

      const response = await getUserProfile(user.phoneNumber);
      if (response.success) {
        setUserProfile(response.user);
        // Load notification count
        await loadNotificationCount(response.user);
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to load user profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationCount = async (profile: any) => {
    try {
      const userId = profile?.mongoId || profile?._id || profile?.id;
      console.log('📊 Loading notification count for userId:', userId);

      if (!userId) {
        console.warn('⚠️ No userId found in profile:', profile);
        return;
      }

      console.log('📡 Calling getNotificationCount API...');
      const response = await getNotificationCount(userId);
      console.log('📥 Notification count response:', response);

      if (response.success) {
        const count = response.unreadCount || 0;
        console.log('✅ Setting unread count to:', count);
        setUnreadCount(count);
      } else {
        console.warn('⚠️ Response not successful:', response);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load notification count. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const loadStories = async (profile: any) => {
    try {
      const userId = profile?.mongoId || profile?._id || profile?.id;
      console.log('📖 Loading stories for userId:', userId);

      if (!userId) {
        console.warn('⚠️ No userId found for loading stories');
        return;
      }

      const response = await getActiveStories(userId);
      console.log('📖 Stories response:', response);

      if (response.success && response.stories) {
        console.log('✅ Stories loaded:', response.stories.length, 'stories');
        setStories(response.stories);
      } else {
        console.log('ℹ️ No active stories found');
        setStories([]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load stories. Please try again.';
      Alert.alert('Error', errorMessage);
      setStories([]);
    }
  };

  const handleStoryPress = (index: number) => {
    setSelectedStoryIndex(index);
    setShowStoryViewer(true);
  };

  const handleStoryViewed = async (storyId: string) => {
    try {
      // Story ID is the notification ID, so we can use markAsRead
      await markAsRead(storyId);
      // Update local state
      setStories(prev => prev.map(story =>
        story._id === storyId ? { ...story, read: true } : story
      ));
    } catch (error: any) {
      // Only show alert if it's not a 404 (notification might already be deleted/expired)
      if (error?.status !== 404) {
        Alert.alert('Error', error?.message || 'Failed to mark story as viewed. Please try again.');
      }
      // Still update local state even if API call fails
      setStories(prev => prev.map(story =>
        story._id === storyId ? { ...story, read: true } : story
      ));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserProfile();
    setRefreshing(false);
  };

  const stats = {
    seedsCount: userProfile?.seedsCount || 0,
    bonus: userProfile?.bonus || 0,
    price: userProfile?.price || 0,
    seedType: userProfile?.seedType || 'N/A',
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)/login');
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Failed to logout. Please try again.';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <UserHeader
        userName={userProfile?.name || user?.name}
        unreadCount={unreadCount}
        onLogout={handleLogout}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* User Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
          </View>
        </View>

        {/* Stories Section */}
        {stories.length > 0 && (
          <Stories stories={stories} onStoryPress={handleStoryPress} />
        )}

        {/* Stats Cards Section */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading stats...</Text>
          </View>
        ) : (
          <View style={styles.statsGrid}>
            {/* Seeds Count Card */}
            <View style={[styles.statCard, styles.seedsCountCard]}>
              <View style={styles.statIcon}>
                <Ionicons name="cube-outline" size={28} color="#10b981" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>
                  {formatNumber(stats.seedsCount)}
                </Text>
                <Text style={styles.statLabel}>Seeds Count</Text>
              </View>
            </View>

            {/* Bonus Card */}
            <View style={[styles.statCard, styles.bonusCard]}>
              <View style={styles.statIcon}>
                <Ionicons name="gift-outline" size={28} color="#3b82f6" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>
                  {formatNumber(stats.bonus)}
                </Text>
                <Text style={styles.statLabel}>Bonus</Text>
              </View>
            </View>

            {/* Price Card */}
            <View style={[styles.statCard, styles.priceCard]}>
              <View style={styles.statIcon}>
                <Ionicons name="cash-outline" size={28} color="#f59e0b" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>₹{formatNumber(stats.price)}</Text>
                <Text style={styles.statLabel}>Price</Text>
              </View>
            </View>

            {/* Seed Type Card */}
            <View style={[styles.statCard, styles.seedTypeCard]}>
              <View style={styles.statIcon}>
                <Ionicons name="fish-outline" size={28} color="#8b5cf6" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{stats.seedType}</Text>
                <Text style={styles.statLabel}>Seed Type</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Story Viewer Modal */}
      <StoryViewerModal
        visible={showStoryViewer}
        stories={stories}
        initialIndex={selectedStoryIndex}
        onClose={() => setShowStoryViewer(false)}
        onStoryViewed={handleStoryViewed}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: Colors.textLight,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textLight,
  },
  statsGrid: {
    gap: 16,
  },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  seedsCountCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  bonusCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  priceCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  seedTypeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '500',
  },
});
