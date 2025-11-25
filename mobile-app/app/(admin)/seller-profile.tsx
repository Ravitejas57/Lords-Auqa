import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/src/constants/colors';
import { updateUserSeeds, resetUserPassword } from '@/src/services/api/adminApi';
import { getUserHatcheries, approveHatchery, deleteAndResetHatchery } from '@/src/services/api/imageApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatNumber, formatNumberInput, parseFormattedNumber } from '@/src/utils/formatNumber';

export default function SellerProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse seller data from params
  const seller = params.seller ? JSON.parse(params.seller as string) : null;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Seeds information update states
  const [showSeedsModal, setShowSeedsModal] = useState(false);
  const [seedsData, setSeedsData] = useState({
    seedsCount: seller?.seedsCount?.toString() || '0',
    bonus: seller?.bonus?.toString() || '0',
    price: seller?.price?.toString() || '0',
    seedType: seller?.seedType || 'None',
  });
  const [isUpdatingSeeds, setIsUpdatingSeeds] = useState(false);

  // Hatchery states
  const [hatchery, setHatchery] = useState<any>(null);
  const [loadingHatchery, setLoadingHatchery] = useState(false);
  const [approvingHatchery, setApprovingHatchery] = useState(false);
  const [deletingHatchery, setDeletingHatchery] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);

  // Fetch hatchery data
  useEffect(() => {
    if (seller?.userId) {
      loadHatchery();
    }
  }, [seller?.userId]);

  const loadHatchery = async () => {
    if (!seller?.userId) return;
    setLoadingHatchery(true);
    try {
      // Pass forAdminView=true to filter out images still in delete window
      const response = await getUserHatcheries(seller.userId, true);
      if (response.success && response.hatcheries && response.hatcheries.length > 0) {
        // Get the most recent hatchery (first one)
        setHatchery(response.hatcheries[0]);
      }
    } catch (error) {
      console.error('Error loading hatchery:', error);
    } finally {
      setLoadingHatchery(false);
    }
  };

  // Check if all 4 images are uploaded
  const allImagesApproved = hatchery?.images?.length === 4;

  const handleApproveHatchery = async () => {
    if (!hatchery || !seller?.userId) return;

    Alert.alert(
      'Approve Hatchery',
      'Are you sure you want to approve this hatchery? This will complete the transaction and reset all image slots for the user.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            setApprovingHatchery(true);
            try {
              const adminData = await AsyncStorage.getItem('adminData');
              const admin = adminData ? JSON.parse(adminData) : null;

              const response = await approveHatchery({
                hatcheryId: hatchery._id,
                userId: seller.userId,
                adminId: admin?.profile?._id || admin?._id || admin?.id,
                adminName: admin?.name || 'Admin',
              });

              if (response.success) {
                Alert.alert('Success', 'Hatchery approved successfully! Image slots have been reset.', [
                  {
                    text: 'OK',
                    onPress: () => {
                      loadHatchery(); // Reload to show reset state
                    },
                  },
                ]);
              }
            } catch (error: any) {
              console.error('Error approving hatchery:', error);
              Alert.alert('Error', error.message || 'Failed to approve hatchery');
            } finally {
              setApprovingHatchery(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteHatchery = async () => {
    if (!hatchery || !seller?.userId) return;

    Alert.alert(
      'Delete Hatchery',
      'Are you sure you want to delete this hatchery? This will reset all image slots WITHOUT creating a purchase history entry. The slots will remain locked until you update the seeds count.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingHatchery(true);
            try {
              const adminData = await AsyncStorage.getItem('adminData');
              const admin = adminData ? JSON.parse(adminData) : null;

              const response = await deleteAndResetHatchery({
                hatcheryId: hatchery._id,
                userId: seller.userId,
                adminId: admin?.profile?._id || admin?._id || admin?.id,
                adminName: admin?.name || 'Admin',
              });

              if (response.success) {
                Alert.alert('Success', 'Hatchery deleted successfully! Image slots have been reset and are now locked.', [
                  {
                    text: 'OK',
                    onPress: () => {
                      loadHatchery(); // Reload to show reset state
                    },
                  },
                ]);
              }
            } catch (error: any) {
              console.error('Error deleting hatchery:', error);
              Alert.alert('Error', error.message || 'Failed to delete hatchery');
            } finally {
              setDeletingHatchery(false);
            }
          },
        },
      ]
    );
  };

  const handleImagePress = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setShowImageViewer(true);
  };

  const handleResetPassword = async () => {
    // Trim passwords to remove whitespace
    const trimmedPassword = newPassword.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedPassword || trimmedPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!seller?.userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    Alert.alert(
      'Confirm Password Reset',
      `Are you sure you want to reset password for ${seller?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            try {
              // Use _id first (same as web app - AdminDashboardContent.jsx line 421)
              const userId = seller?._id || seller?.userId || seller?.id;
              
              console.log('🔍 Mobile - Seller object:', JSON.stringify(seller, null, 2));
              console.log('🔍 Mobile - Attempting to reset password for userId:', userId);
              console.log('🔍 Mobile - User ID type:', typeof userId);
              
              if (!userId) {
                Alert.alert('Error', 'User ID not found. Please check seller data.');
                return;
              }

              // Validate MongoDB ObjectId format (24 hex characters)
              const objectIdRegex = /^[0-9a-fA-F]{24}$/;
              const userIdString = userId.toString();
              
              if (!objectIdRegex.test(userIdString)) {
                console.error('🔍 Mobile - Invalid userId format:', userId);
                Alert.alert('Error', `Invalid user ID format: ${userIdString}. Expected MongoDB ObjectId.`);
                return;
              }

              console.log('🔍 Mobile - Calling resetUserPassword with:', {
                userId: userIdString,
                passwordLength: newPassword.length,
              });

              const response = await resetUserPassword(userIdString, newPassword);
              
              console.log('🔍 Mobile - Reset password response:', response);
              
              if (response.success) {
                Alert.alert('Success', 'Password reset successfully!', [
                  {
                    text: 'OK',
                    onPress: () => {
                      setNewPassword('');
                      setConfirmPassword('');
                      setShowPassword(false);
                    },
                  },
                ]);
              } else {
                throw new Error(response.message || 'Failed to reset password');
              }
            } catch (error: any) {
              console.error('🔍 Mobile - Error resetting password:', error);
              Alert.alert(
                'Error',
                error.message || 'Failed to reset password. Please try again.'
              );
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdateSeeds = async () => {
    // Validate inputs
    if (!seedsData.seedsCount || isNaN(parseFormattedNumber(seedsData.seedsCount))) {
      Alert.alert('Error', 'Seeds count must be a valid number');
      return;
    }

    if (seedsData.bonus && isNaN(parseFormattedNumber(seedsData.bonus))) {
      Alert.alert('Error', 'Bonus must be a valid number');
      return;
    }

    if (!seedsData.price || isNaN(parseFormattedNumber(seedsData.price))) {
      Alert.alert('Error', 'Price must be a valid number');
      return;
    }

    if (!seedsData.seedType.trim()) {
      Alert.alert('Error', 'Seed type is required');
      return;
    }

    setIsUpdatingSeeds(true);
    try {
      const response = await updateUserSeeds(seller._id, {
        seedsCount: parseFormattedNumber(seedsData.seedsCount),
        bonus: parseFormattedNumber(seedsData.bonus),
        price: parseFormattedNumber(seedsData.price),
        seedType: seedsData.seedType,
      });

      if (response.success) {
        // Update local seller data
        if (seller) {
          seller.seedsCount = parseFormattedNumber(seedsData.seedsCount);
          seller.bonus = parseFormattedNumber(seedsData.bonus);
          seller.price = parseFormattedNumber(seedsData.price);
          seller.seedType = seedsData.seedType;
        }

        Alert.alert('Success', 'Seeds information updated successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setShowSeedsModal(false);
            },
          },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to update seeds information');
      }
    } catch (error: any) {
      console.error('Error updating seeds:', error);
      Alert.alert('Error', error.message || 'Failed to update seeds information');
    } finally {
      setIsUpdatingSeeds(false);
    }
  };

  if (!seller) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.error} />
          <Text style={styles.errorText}>Seller not found</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Seller Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {seller.profileImage?.url && seller.profileImage.url !== '' ? (
            <Image
              source={{ uri: seller.profileImage.url }}
              style={styles.avatarLarge}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>
                {seller.name?.charAt(0).toUpperCase() || 'S'}
              </Text>
            </View>
          )}
          <Text style={styles.sellerNameLarge}>{seller.name || 'N/A'}</Text>
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.statusText}>Approved</Text>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="person" size={16} color={Colors.textLight} />
                <Text style={styles.infoLabelText}>Full Name</Text>
              </View>
              <Text style={styles.infoValue}>{seller.name || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="call" size={16} color={Colors.textLight} />
                <Text style={styles.infoLabelText}>Phone Number</Text>
              </View>
              <Text style={styles.infoValue}>{seller.phoneNumber || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="mail" size={16} color={Colors.textLight} />
                <Text style={styles.infoLabelText}>Email</Text>
              </View>
              <Text style={styles.infoValue}>{seller.email || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="globe" size={16} color={Colors.textLight} />
                <Text style={styles.infoLabelText}>Country</Text>
              </View>
              <Text style={styles.infoValue}>{seller.country || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="map" size={16} color={Colors.textLight} />
                <Text style={styles.infoLabelText}>State</Text>
              </View>
              <Text style={styles.infoValue}>{seller.state || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="location" size={16} color={Colors.textLight} />
                <Text style={styles.infoLabelText}>District</Text>
              </View>
              <Text style={styles.infoValue}>{seller.district || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="pin" size={16} color={Colors.textLight} />
                <Text style={styles.infoLabelText}>Pincode</Text>
              </View>
              <Text style={styles.infoValue}>{seller.pincode || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="home" size={16} color={Colors.textLight} />
                <Text style={styles.infoLabelText}>Full Address</Text>
              </View>
              <Text style={[styles.infoValue, styles.infoValueMultiline]}>
                {seller.address || 'N/A'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="calendar" size={16} color={Colors.textLight} />
                <Text style={styles.infoLabelText}>Registration Date</Text>
              </View>
              <Text style={styles.infoValue}>
                {seller.createdAt
                  ? new Date(seller.createdAt).toLocaleDateString()
                  : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Seeds Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="fish" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Seeds Information</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="cube" size={16} color={Colors.textLight} />
                <Text style={styles.infoLabelText}>Seeds Count</Text>
              </View>
              <Text style={styles.infoValue}>
                {formatNumber(seller.seedsCount || 0)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="gift" size={16} color={Colors.textLight} />
                <Text style={styles.infoLabelText}>Bonus</Text>
              </View>
              <Text style={styles.infoValue}>
                {formatNumber(seller.bonus || 0)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="cash" size={16} color={Colors.textLight} />
                <Text style={styles.infoLabelText}>Price</Text>
              </View>
              <Text style={styles.infoValue}>
                ₹{formatNumber(seller.price || 0)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="fish" size={16} color={Colors.textLight} />
                <Text style={styles.infoLabelText}>Seed Type</Text>
              </View>
              <Text style={styles.infoValue}>
                {seller.seedType || 'None'}
              </Text>
            </View>

            <Pressable
              style={styles.updateSeedsButton}
              onPress={() => setShowSeedsModal(true)}
            >
              <Ionicons name="create-outline" size={20} color={Colors.primary} />
              <Text style={styles.updateSeedsText}>Update Seeds Information</Text>
            </Pressable>
          </View>
        </View>

        {/* Reset Password */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="key" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Reset Password</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.resetDescription}>
              Reset the password for this seller's account
            </Text>

            <View style={styles.passwordInputGroup}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={Colors.textLight}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.passwordInput}
                placeholder="New Password (min 6 characters)"
                placeholderTextColor={Colors.textLight}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={Colors.primary}
                />
              </Pressable>
            </View>

            <View style={styles.passwordInputGroup}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={Colors.textLight}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password"
                placeholderTextColor={Colors.textLight}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>

            <Pressable
              style={[styles.resetButton, isResetting && styles.resetButtonDisabled]}
              onPress={handleResetPassword}
              disabled={isResetting}
            >
              {isResetting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="refresh" size={20} color={Colors.white} />
                  <Text style={styles.resetButtonText}>Reset Password</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        {/* Hatchery Images Gallery */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="images" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>
              Hatchery Images {hatchery?.images?.length ? `(${hatchery.images.length}/4)` : '(0/4)'}
            </Text>
          </View>

          <View style={styles.infoCard}>
            {loadingHatchery ? (
              <View style={styles.emptyImagesContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.emptyImagesText}>Loading hatchery images...</Text>
              </View>
            ) : hatchery?.images && hatchery.images.length > 0 ? (
              <>
                <View style={styles.imagesGrid}>
                  {[0, 1, 2, 3].map((index) => {
                    const image = hatchery.images[index];
                    return (
                      <Pressable
                        key={index}
                        style={styles.imageGridItem}
                        onPress={() => image?.url && handleImagePress(image.url)}
                      >
                        {image?.url ? (
                          <>
                            <Image
                              source={{ uri: image.url }}
                              style={styles.gridImage}
                              resizeMode="cover"
                            />
                            {image.location && (
                              <View style={styles.locationBadge}>
                                <Ionicons name="location" size={12} color={Colors.white} />
                              </View>
                            )}
                          </>
                        ) : (
                          <View style={styles.emptySlot}>
                            <Ionicons name="image-outline" size={32} color={Colors.textLight} />
                            <Text style={styles.emptySlotText}>Slot {index + 1}</Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                {/* Approve Hatchery Button */}
                {allImagesApproved && (
                  <Pressable
                    style={[styles.approveHatcheryButton, approvingHatchery && styles.approveHatcheryButtonDisabled]}
                    onPress={handleApproveHatchery}
                    disabled={approvingHatchery}
                  >
                    {approvingHatchery ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                        <Text style={styles.approveHatcheryButtonText}>Approve Hatchery</Text>
                      </>
                    )}
                  </Pressable>
                )}

                {/* Delete Hatchery Button - Only show if there are images */}
                {hatchery.images.length > 0 && (
                  <Pressable
                    style={[styles.deleteHatcheryButton, deletingHatchery && styles.deleteHatcheryButtonDisabled]}
                    onPress={handleDeleteHatchery}
                    disabled={deletingHatchery}
                  >
                    {deletingHatchery ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <>
                        <Ionicons name="trash-outline" size={20} color={Colors.white} />
                        <Text style={styles.deleteHatcheryButtonText}>Delete Hatchery</Text>
                      </>
                    )}
                  </Pressable>
                )}
              </>
            ) : (
              <View style={styles.emptyImagesContainer}>
                <Ionicons name="images-outline" size={48} color={Colors.textLight} />
                <Text style={styles.emptyImagesText}>No hatchery images uploaded yet</Text>
                <Text style={styles.emptyImagesSubtext}>
                  This seller hasn't uploaded any hatchery images
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Zoomable Image Viewer Modal */}
      {showImageViewer && selectedImageUrl && (
        <ZoomableImageViewer
          imageUrl={selectedImageUrl}
          onClose={() => {
            setShowImageViewer(false);
            setSelectedImageUrl(null);
          }}
        />
      )}

      {/* Update Seeds Information Modal */}
      <Modal
        visible={showSeedsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSeedsModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Update Seeds Information</Text>
                <Pressable onPress={() => setShowSeedsModal(false)}>
                  <Ionicons name="close" size={24} color={Colors.text} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.modalBody}
                keyboardShouldPersistTaps="handled"
              >
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Seeds Count *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter seeds count"
                  placeholderTextColor={Colors.textLight}
                  value={seedsData.seedsCount}
                  onChangeText={(value) => {
                    const formatted = formatNumberInput(value);
                    setSeedsData({ ...seedsData, seedsCount: formatted });
                  }}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Bonus</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter bonus"
                  placeholderTextColor={Colors.textLight}
                  value={seedsData.bonus}
                  onChangeText={(value) => {
                    const formatted = formatNumberInput(value);
                    setSeedsData({ ...seedsData, bonus: formatted });
                  }}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Price *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter price"
                  placeholderTextColor={Colors.textLight}
                  value={seedsData.price}
                  onChangeText={(value) => {
                    const formatted = formatNumberInput(value);
                    setSeedsData({ ...seedsData, price: formatted });
                  }}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Seed Type *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter seed type"
                  placeholderTextColor={Colors.textLight}
                  value={seedsData.seedType}
                  onChangeText={(value) =>
                    setSeedsData({ ...seedsData, seedType: value })
                  }
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSeedsModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalButton,
                  styles.updateButton,
                  isUpdatingSeeds && styles.disabledButton,
                ]}
                onPress={handleUpdateSeeds}
                disabled={isUpdatingSeeds}
              >
                {isUpdatingSeeds ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.updateButtonText}>Update</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
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
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  scrollContent: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 20,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarLargeText: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
  },
  sellerNameLarge: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#d1fae5',
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabelText: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  infoValueMultiline: {
    flex: 1,
    textAlign: 'right',
  },
  emptySeeds: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptySeedsText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
  },
  resetDescription: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 16,
  },
  passwordInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.error,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  resetButtonDisabled: {
    opacity: 0.6,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  imageGridItem: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.inputBg,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  locationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  updateSeedsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.inputBg,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  updateSeedsText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
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
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  modalField: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  pickerWrapper: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    color: Colors.text,
    height: 48,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  updateButton: {
    backgroundColor: Colors.primary,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  disabledButton: {
    opacity: 0.5,
  },
  emptyImagesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyImagesText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
  },
  emptyImagesSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  imageStatusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
  },
  imageStatusBadgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  emptySlot: {
    width: '100%',
    height: 150,
    backgroundColor: Colors.inputBg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptySlotText: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 8,
    fontWeight: '600',
  },
  approveHatcheryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 16,
  },
  approveHatcheryButtonDisabled: {
    opacity: 0.6,
  },
  approveHatcheryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  deleteHatcheryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 12,
  },
  deleteHatcheryButtonDisabled: {
    opacity: 0.6,
  },
  deleteHatcheryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  modalImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: Colors.inputBg,
  },
  modalTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  modalActionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  // Image Viewer Styles
  imageViewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  imageViewerBackButton: {
    padding: 8,
  },
  imageViewerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  imageViewerImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerImage: {
    width: '100%',
    height: '100%',
  },
  imageViewerControls: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    zIndex: 10,
  },
  imageViewerControlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  imageViewerHint: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  imageViewerHintText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
});
