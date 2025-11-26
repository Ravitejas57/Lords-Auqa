import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuth } from '@/src/store/context/AuthContext';
import { Colors } from '@/src/constants/colors';
import UserHeader from '@/src/components/UserHeader';
import { getNotificationCount } from '@/src/services/api/userNotificationApi';
import { getUserProfile } from '@/src/services/api/authApi';
import type { HatcheryImage, Hatchery } from '@/src/services/api/imageApi';
import {
  getUserHatcheries,
  uploadHatcheryImage,
  deleteHatcheryImage,
  createHatchery,
} from '@/src/services/api/imageApi';

export default function HatcheryScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentHatchery, setCurrentHatchery] = useState<Hatchery | null>(null);
  const [userImages, setUserImages] = useState<HatcheryImage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [slotUnlockTimers, setSlotUnlockTimers] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    loadUserImages();
    loadUserProfileAndNotifications();
  }, []);

  // Check slot unlock timers
  useEffect(() => {
    const checkTimers = () => {
      const now = Date.now();
      const updatedTimers: { [key: number]: number } = {};
      
      Object.keys(slotUnlockTimers).forEach((key) => {
        const slotIndex = parseInt(key);
        const unlockTime = slotUnlockTimers[slotIndex];
        if (unlockTime && now < unlockTime) {
          updatedTimers[slotIndex] = unlockTime;
        }
      });
      
      if (Object.keys(updatedTimers).length !== Object.keys(slotUnlockTimers).length) {
        setSlotUnlockTimers(updatedTimers);
      }
    };

    const interval = setInterval(checkTimers, 1000);
    return () => clearInterval(interval);
  }, [slotUnlockTimers]);


  const loadUserProfileAndNotifications = async () => {
    try {
      if (!user?.phoneNumber) return;

      const response = await getUserProfile(user.phoneNumber);
      if (response.success) {
        setUserProfile(response.user);
        await loadNotificationCount(response.user);
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to load user profile. Please try again.');
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load notification count. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const loadUserImages = async () => {
    try {
      if (!user?.userId) return;

      // Fetch user's hatcheries using userId (not _id)
      const response = await getUserHatcheries(user.userId);

      if (response.hatcheries && response.hatcheries.length > 0) {
        // Use the first hatchery (or most recent)
        const hatchery = response.hatcheries[0];
        setCurrentHatchery(hatchery);
        setUserImages(hatchery.images || []);
      } else {
        // Create a new hatchery for the user
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 30); // 30-day hatchery period

        const createResponse = await createHatchery({
          userId: user.userId,
          name: `Hatchery ${today.toLocaleDateString()}`,
          startDate: today.toISOString(),
          endDate: endDate.toISOString(),
        });

        if (createResponse.success) {
          setCurrentHatchery(createResponse.hatchery);
          setUserImages(createResponse.hatchery.images || []);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to load images. Please try again.');
      Alert.alert('Error', error.message || 'Failed to load images');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserImages();
    setRefreshing(false);
  };

  const handleImageSlotPress = (index: number) => {
    // Check if previous slot exists and is uploaded
    const previousImage = index > 0 ? userImages[index - 1] : null;
    const previousUploadTime = previousImage?.uploadedAt ? new Date(previousImage.uploadedAt).getTime() : null;
    const now = Date.now();
    const oneMinute = 60 * 1000; // 1 minute
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes
    const sixMinutes = oneMinute + fiveMinutes; // Total: 6 minutes (1 min delete + 5 min unlock)
    
    // Check if previous slot is uploaded
    const isPreviousUploaded = previousImage?.url !== undefined;
    
    // Check if 6 minutes have passed since previous upload (1 min delete window + 5 min unlock timer)
    const isUnlocked = index === 0 || (isPreviousUploaded && previousUploadTime && (now - previousUploadTime >= sixMinutes));
    
    // Check if there's a timer for this slot
    const unlockTime = slotUnlockTimers[index];
    const isTimerActive = unlockTime && now < unlockTime;
    
    const isLocked = index > 0 && (!isPreviousUploaded || isTimerActive);

    if (isLocked) {
      if (isTimerActive) {
        const remainingSeconds = Math.ceil((unlockTime - now) / 1000);
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        Alert.alert(
          'Slot Locked',
          `Next slot unlocks in ${minutes}:${seconds.toString().padStart(2, '0')}`,
          [{ text: 'OK' }]
        );
      } else if (!isPreviousUploaded) {
        Alert.alert(
          'Slot Locked',
          `Complete Image ${index} upload to unlock this slot`,
          [{ text: 'OK' }]
        );
      }
      return;
    }

    if (userImages[index]?.url) {
      // Image already exists - show options
      const canDelete = checkCanDelete(userImages[index]);

      Alert.alert(
        `Image ${index + 1}`,
        'Choose an action',
        [
          { text: 'View Image', onPress: () => handleViewImage(index) },
          ...(canDelete ? [{ text: 'Delete Image', style: 'destructive' as const, onPress: () => handleDeleteImage(index) }] : []),
          { text: 'Cancel', style: 'cancel' as const },
        ]
      );
    } else {
      // No image - upload new one
      handleUploadImage(index);
    }
  };

  const checkCanDelete = (image: HatcheryImage | undefined): boolean => {
    if (!image?.url) return false;

    // Can delete within 1 minute (60 seconds) of upload
    if (image.uploadedAt) {
      const uploadTime = new Date(image.uploadedAt).getTime();
      const oneMinute = 60 * 1000; // 1 minute in milliseconds
      const now = Date.now();
      const diff = now - uploadTime;
      return diff < oneMinute;
    }

    return false;
  };

  const handleUploadImage = async (index: number) => {
    if (!currentHatchery) {
      Alert.alert('Error', 'No hatchery found. Please try refreshing.');
      return;
    }

    // Check if seed information has been updated by admin
    if (!userProfile || !userProfile.seedsCount || userProfile.seedsCount === 0) {
      Alert.alert(
        'Upload Locked',
        'Image uploads are locked until the admin updates your seed count. Please contact your admin to update your seed details.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Request permissions upfront
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const locationPermission = await Location.requestForegroundPermissionsAsync();

      if (!cameraPermission.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos');
        return;
      }

      if (!locationPermission.granted) {
        Alert.alert('Permission Required', 'Location permission is required to tag images with location data');
        return;
      }

      // Show upload options
      Alert.alert(
        'Upload Image',
        'Choose image source',
        [
          {
            text: 'Take Photo',
            onPress: () => captureImage(index),
          },
          {
            text: 'Choose from Gallery',
            onPress: () => pickImage(index),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Camera permission is required to take photos.';
      Alert.alert('Permission Error', errorMessage);
    }
  };

  const captureImage = async (index: number) => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri, index);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to capture image';
      Alert.alert('Error', errorMessage);
    }
  };

  const pickImage = async (index: number) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri, index);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to pick image';
      Alert.alert('Error', errorMessage);
    }
  };

  const uploadImage = async (uri: string, index: number) => {
    if (!currentHatchery) return;

    try {
      setUploading(true);

      // Get current location
      let location;
      try {
        const { coords } = await Location.getCurrentPositionAsync({});
        location = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
      } catch (error) {
        console.log('Location not available, uploading without location');
      }

      // Upload to backend
      const response = await uploadHatcheryImage(currentHatchery._id, uri, location);

      if (response.success) {
        Alert.alert('Success', 'Image uploaded successfully!');
        
        // Set timer to unlock next slot: 1 minute (delete window) + 5 minutes (unlock timer) = 6 minutes total
        if (index < 3) {
          const oneMinute = 60 * 1000; // 1 minute
          const fiveMinutes = 5 * 60 * 1000; // 5 minutes
          const unlockTime = Date.now() + oneMinute + fiveMinutes; // 6 minutes from now
          setSlotUnlockTimers(prev => ({
            ...prev,
            [index + 1]: unlockTime
          }));
        }
        
        await loadUserImages(); // Refresh
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleViewImage = (index: number) => {
    if (userImages[index] && currentHatchery) {
      router.push({
        pathname: '/(tabs)/image-viewer',
        params: {
          imageData: JSON.stringify(userImages[index]),
          imageIndex: index.toString(),
          hatcheryId: currentHatchery._id,
        },
      });
    }
  };

  const handleDeleteImage = async (index: number) => {
    if (!currentHatchery) return;

    const canDelete = checkCanDelete(userImages[index]);

    if (!canDelete) {
      Alert.alert(
        'Cannot Delete',
                        'Images can only be deleted within 1 minute of upload.'
      );
      return;
    }

    Alert.alert(
      'Delete Image',
      `Are you sure you want to delete Image ${index + 1}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setUploading(true);
              const response = await deleteHatcheryImage(currentHatchery._id, index);

              if (response.success) {
                Alert.alert('Success', 'Image deleted successfully');
                await loadUserImages(); // Refresh
              }
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'Failed to delete image. Please try again.';
              Alert.alert('Error', errorMessage);
            } finally {
              setUploading(false);
            }
          }
        }
      ]
    );
  };



  const getImageStatusInfo = (image: HatcheryImage | undefined) => {
    if (!image?.url) return null;
    // No status needed - images are automatically accepted
    return null;
  };

  const uploadedCount = userImages.filter(img => img?.url).length;

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
            } catch (error: unknown) {
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="grid" size={32} color={Colors.primary} />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Hatchery Progress</Text>
              <Text style={styles.headerSubtitle}>Upload and track your images</Text>
            </View>
          </View>
        </View>

        {/* Upload Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Ionicons name="camera" size={24} color={Colors.primary} />
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>Image Upload Progress</Text>
              <Text style={styles.progressSubtitle}>
                {uploadedCount} / 4 images uploaded
              </Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(uploadedCount / 4) * 100}%` }]} />
          </View>
        </View>

        {/* Image Slots Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Slots</Text>
          <Text style={styles.sectionSubtitle}>
            Upload your hatchery progress images - delete available for 1 minute, then next slot unlocks after 5 minutes
          </Text>

          <View style={styles.imageGrid}>
            {[0, 1, 2, 3].map((index) => {
              // Check if previous slot exists and is uploaded
              const previousImage = index > 0 ? userImages[index - 1] : null;
              const previousUploadTime = previousImage?.uploadedAt ? new Date(previousImage.uploadedAt).getTime() : null;
              const now = Date.now();
              const oneMinute = 60 * 1000; // 1 minute
              const fiveMinutes = 5 * 60 * 1000; // 5 minutes
              const sixMinutes = oneMinute + fiveMinutes; // Total: 6 minutes (1 min delete + 5 min unlock)
              
              // Check if previous slot is uploaded
              const isPreviousUploaded = previousImage?.url !== undefined;
              
              // Check if 6 minutes have passed since previous upload (1 min delete window + 5 min unlock timer)
              const isUnlocked = index === 0 || (isPreviousUploaded && previousUploadTime && (now - previousUploadTime >= sixMinutes));
              
              // Check if there's a timer for this slot
              const unlockTime = slotUnlockTimers[index];
              const isTimerActive = unlockTime && now < unlockTime;
              
              // Check if seeds are updated
              const seedsNotUpdated = !userProfile || !userProfile.seedsCount || userProfile.seedsCount === 0;

              const isLocked = Boolean(seedsNotUpdated || (index > 0 && (!isPreviousUploaded || (isTimerActive && unlockTime !== undefined))));
              const hasImage = !!userImages[index]?.url;
              
              // Calculate remaining time for timer display
              let remainingTime = '';
              let timerMessage = '';
              if (previousUploadTime) {
                const timeSinceUpload = now - previousUploadTime;
                const oneMinute = 60 * 1000;
                const sixMinutes = oneMinute + (5 * 60 * 1000);
                
                if (timeSinceUpload < oneMinute) {
                  // Still in delete window
                  const remainingDeleteSeconds = Math.ceil((oneMinute - timeSinceUpload) / 1000);
                  timerMessage = `Delete available for ${remainingDeleteSeconds}s`;
                } else if (timeSinceUpload < sixMinutes) {
                  // In unlock timer phase (after delete disabled)
                  const remainingUnlockSeconds = Math.ceil((sixMinutes - timeSinceUpload) / 1000);
                  const minutes = Math.floor(remainingUnlockSeconds / 60);
                  const seconds = remainingUnlockSeconds % 60;
                  remainingTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                  timerMessage = `Unlocks in ${remainingTime}`;
                }
              } else if (isTimerActive && unlockTime) {
                const remainingSeconds = Math.ceil((unlockTime - now) / 1000);
                const minutes = Math.floor(remainingSeconds / 60);
                const seconds = remainingSeconds % 60;
                remainingTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                timerMessage = `Unlocks in ${remainingTime}`;
              }

              return (
                <Pressable
                  key={index}
                  style={styles.imageSlot}
                  onPress={() => handleImageSlotPress(index)}
                  disabled={isLocked && !hasImage}
                >
                  <View style={[
                    styles.imageContainer,
                    isLocked && !hasImage && styles.lockedContainer
                  ]}>
                    {hasImage ? (
                      <>
                        <Image
                          source={{ uri: userImages[index].url }}
                          style={styles.uploadedImage}
                          resizeMode="cover"
                        />

                        {/* Gradient overlay for better icon visibility */}
                        <View style={styles.imageOverlay} />

                        {/* Action buttons - Eye and Delete */}
                        <View style={styles.imageActions}>
                          <Pressable
                            style={styles.actionButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleViewImage(index);
                            }}
                          >
                            <Ionicons name="eye" size={18} color={Colors.primary} />
                          </Pressable>

                          <Pressable
                            style={[
                              styles.actionButton,
                              styles.deleteButton,
                              checkCanDelete(userImages[index]) ? {} : styles.deleteButtonDisabled
                            ]}
                            onPress={(e) => {
                              e.stopPropagation();
                              if (checkCanDelete(userImages[index])) {
                                handleDeleteImage(index);
                              }
                            }}
                            disabled={!checkCanDelete(userImages[index])}
                          >
                            <Ionicons
                              name="trash"
                              size={18}
                              color={checkCanDelete(userImages[index]) ? '#dc2626' : '#9ca3af'}
                            />
                          </Pressable>
                        </View>

                      </>
                    ) : isLocked ? (
                      <View style={styles.placeholderContent}>
                        <Ionicons name="lock-closed" size={40} color="#9ca3af" />
                        <Text style={styles.lockedText}>Slot {index + 1} Locked</Text>
                        <Text style={styles.lockedSubtext}>
                          {seedsNotUpdated
                            ? 'Awaiting admin seed count update'
                            : (!isPreviousUploaded 
                                ? 'Upload previous image' 
                                : timerMessage || 'Unlocking...')}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.placeholderContent}>
                        <Ionicons name="camera" size={40} color={Colors.primary} />
                        <Text style={styles.uploadText}>Upload Image {index + 1}</Text>
                        <Text style={styles.uploadSubtext}>Tap to capture</Text>
                      </View>
                    )}
                  </View>

                  {/* Slot Footer */}
                  <View style={styles.slotFooter}>
                    <Text style={styles.slotLabel}>Image Slot {index + 1}</Text>
                    {hasImage && (
                      <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    )}
                    {isLocked && !hasImage && (
                      <Ionicons name="lock-closed" size={16} color="#9ca3af" />
                    )}
                  </View>

                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {uploading && (
        <Modal transparent visible={uploading}>
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Uploading image...</Text>
            </View>
          </View>
        </Modal>
      )}
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
    fontFamily: 'Nunito_400Regular',
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: 'Nunito_400Regular',
  },
  progressCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressInfo: {
    flex: 1,
    marginLeft: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Nunito_400Regular',
  },
  progressSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 2,
    fontFamily: 'Nunito_400Regular',
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    fontFamily: 'Nunito_400Regular',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 16,
    fontFamily: 'Nunito_400Regular',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  imageSlot: {
    width: '48%',
    marginBottom: 16,
  },
  imageContainer: {
    aspectRatio: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    position: 'relative',
  },
  lockedContainer: {
    backgroundColor: Colors.gray[50],
    borderColor: Colors.gray[300],
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Nunito_400Regular',
  },
  uploadSubtext: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Nunito_400Regular',
  },
  lockedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Nunito_400Regular',
  },
  lockedSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Nunito_400Regular',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  imageActions: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    gap: 6,
    zIndex: 10,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  deleteButton: {
    // Additional delete button specific styles can go here
  },
  deleteButtonDisabled: {
    backgroundColor: 'rgba(200, 200, 200, 0.95)',
    opacity: 0.6,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Nunito_400Regular',
  },
  slotFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  slotLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLight,
    fontFamily: 'Nunito_400Regular',
  },
  rejectionBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  rejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  rejectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
    fontFamily: 'Nunito_400Regular',
  },
  rejectionMessage: {
    fontSize: 12,
    color: '#991b1b',
    marginBottom: 6,
    fontFamily: 'Nunito_400Regular',
  },
  rejectionAction: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '600',
    fontFamily: 'Nunito_400Regular',
  },
  approvalBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  approvalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  approvalTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
    fontFamily: 'Nunito_400Regular',
  },
  approvalMessage: {
    fontSize: 12,
    color: '#065f46',
    fontFamily: 'Nunito_400Regular',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 150,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
    fontFamily: 'Nunito_400Regular',
  },
});
