import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/src/store/context/AuthContext';
import { Colors } from '@/src/constants/colors';
import { getUserProfile, updateUserProfile } from '@/src/services/api/authApi';
import type { User } from '@/src/types/auth';

const DEFAULT_PROFILE_ICON = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

export default function ProfileScreen() {
  const { user } = useAuth();

  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form data
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    country: '',
    state: '',
    district: '',
    pincode: '',
    address: '',
    seedsCount: 0,
    bonus: 0,
    price: 0,
    seedType: '',
  });

  // Image handling
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeProfileImage, setRemoveProfileImage] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      if (!user?.phoneNumber) {
        setError('Please log in to access profile.');
        return;
      }

      const response = await getUserProfile(user.phoneNumber);

      if (response.success && response.user) {
        setUserData(response.user);
        setEditData({
          name: response.user.name || '',
          email: response.user.email || '',
          country: response.user.country || '',
          state: response.user.state || '',
          district: response.user.district || '',
          pincode: response.user.pincode || '',
          address: response.user.address || '',
          seedsCount: response.user.seedsCount || 0,
          bonus: response.user.bonus || 0,
          price: response.user.price || 0,
          seedType: response.user.seedType || '',
        });
      } else {
        setError('Failed to fetch user data');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError('Unable to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (field: string, value: string | number) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please grant permission to access photos');
        return;
      }

      Alert.alert(
        'Profile Photo',
        'Choose photo source',
        [
          {
            text: 'Take Photo',
            onPress: async () => {
              const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
              if (!cameraPermission.granted) {
                Alert.alert('Permission Required', 'Camera permission is required');
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: 'images',
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                setImageFile(result.assets[0].uri);
                setImagePreview(result.assets[0].uri);
                setRemoveProfileImage(false);
              }
            },
          },
          {
            text: 'Choose from Gallery',
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                setImageFile(result.assets[0].uri);
                setImagePreview(result.assets[0].uri);
                setRemoveProfileImage(false);
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Image picker error:', error);
    }
  };

  const handleRemoveProfileImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveProfileImage(true);
  };

  const handleSave = async () => {
    const finalUserId = userData?.userId;

    if (!finalUserId) {
      Alert.alert('Error', 'User ID missing! Please refresh the page.');
      return;
    }

    // Validation
    if (!editData.name?.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (editData.pincode && !/^\d{6}$/.test(editData.pincode)) {
      Alert.alert('Error', 'Please enter a valid 6-digit pincode');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();

      // Add all edit data fields
      Object.keys(editData).forEach((key) => {
        const value = editData[key as keyof typeof editData];
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      // Add profile image if selected
      if (imageFile) {
        const filename = imageFile.split('/').pop() || 'profile.jpg';
        const type = `image/${filename.split('.').pop()}`;
        formData.append('profileImage', {
          uri: imageFile,
          name: filename,
          type: type,
        } as any);
      }

      // Add remove flag if needed
      if (removeProfileImage) {
        formData.append('removeProfileImage', 'true');
      }

      const response = await updateUserProfile(finalUserId, formData);

      if (response.success) {
        Alert.alert('Success', 'Profile updated successfully!');
        setEditMode(false);
        setImageFile(null);
        setImagePreview(null);
        setRemoveProfileImage(false);
        await fetchUserProfile();
      } else {
        Alert.alert('Error', 'Update failed');
      }
    } catch (err: any) {
      console.error('Save error:', err);
      Alert.alert('Error', err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setImageFile(null);
    setImagePreview(null);
    setRemoveProfileImage(false);
    if (userData) {
      setEditData({
        name: userData.name || '',
        email: userData.email || '',
        country: userData.country || '',
        state: userData.state || '',
        district: userData.district || '',
        pincode: userData.pincode || '',
        address: userData.address || '',
        seedsCount: userData.seedsCount || 0,
        bonus: userData.bonus || 0,
        price: userData.price || 0,
        seedType: userData.seedType || '',
      });
    }
  };

  const getProfileImageSrc = () => {
    if (removeProfileImage) return DEFAULT_PROFILE_ICON;
    if (imagePreview) return imagePreview;
    if (userData?.profileImage?.url) return userData.profileImage.url;
    return DEFAULT_PROFILE_ICON;
  };

  const hasCustomProfileImage = userData?.profileImage?.url &&
                                 userData.profileImage.url !== DEFAULT_PROFILE_ICON;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.subtitle}>Your account information</Text>
        </View>

        {!editMode ? (
          /* View Mode */
          <>
            {/* Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <Image
                  source={{ uri: getProfileImageSrc() }}
                  style={styles.profileImage}
                />
                <View style={styles.profileHeaderInfo}>
                  <Text style={styles.profileName}>{userData?.name || 'User'}</Text>
                  <Text style={styles.profilePhone}>{userData?.phoneNumber || ''}</Text>
                </View>
              </View>
              <Pressable style={styles.editButton} onPress={() => setEditMode(true)}>
                <Ionicons name="create-outline" size={20} color={Colors.white} />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </Pressable>
            </View>

            {/* Profile Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profile Information</Text>

              <View style={styles.infoItem}>
                <Ionicons name="mail-outline" size={20} color={Colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{userData?.email || 'Not provided'}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="call-outline" size={20} color={Colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone Number</Text>
                  <Text style={styles.infoValue}>{userData?.phoneNumber || 'Not provided'}</Text>
                </View>
              </View>
            </View>

            {/* Location Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location Details</Text>

              {[
                { icon: 'location-outline', label: 'Country', value: userData?.country },
                { icon: 'location-outline', label: 'State', value: userData?.state },
                { icon: 'location-outline', label: 'District', value: userData?.district },
                { icon: 'location-outline', label: 'Pincode', value: userData?.pincode },
              ].map((item, index) => (
                <View key={index} style={styles.infoItem}>
                  <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{item.label}</Text>
                    <Text style={styles.infoValue}>{item.value || 'Not provided'}</Text>
                  </View>
                </View>
              ))}

              {userData?.address && (
                <View style={[styles.infoItem, styles.addressItem]}>
                  <Ionicons name="home-outline" size={20} color={Colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Full Address</Text>
                    <Text style={styles.infoValue}>{userData.address}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Seeds Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Seeds Information</Text>
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                  <Text style={[styles.statLabel, { color: '#166534' }]}>Seeds Count</Text>
                  <Text style={[styles.statValue, { color: '#15803d' }]}>{userData?.seedsCount || 0}</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                  <Text style={[styles.statLabel, { color: '#1e40af' }]}>Bonus</Text>
                  <Text style={[styles.statValue, { color: '#2563eb' }]}>{userData?.bonus || 0}</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
                  <Text style={[styles.statLabel, { color: '#991b1b' }]}>Price</Text>
                  <Text style={[styles.statValue, { color: '#dc2626' }]}>₹{userData?.price || 0}</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#fefce8', borderColor: '#fef08a' }]}>
                  <Text style={[styles.statLabel, { color: '#854d0e' }]}>Seed Type</Text>
                  <Text style={[styles.statValue, { color: '#a16207' }]}>{userData?.seedType || 'N/A'}</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          /* Edit Mode */
          <>
            <View style={styles.editHeader}>
              <Text style={styles.editTitle}>Edit Profile</Text>
              <Pressable onPress={handleCancel}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </Pressable>
            </View>

            {/* Profile Photo Section */}
            <View style={styles.photoSection}>
              <Image
                source={{ uri: getProfileImageSrc() }}
                style={styles.editProfileImage}
              />
              <View style={styles.photoActions}>
                <Pressable style={styles.photoButton} onPress={handleImageChange}>
                  <Ionicons name="camera" size={20} color={Colors.primary} />
                  <Text style={styles.photoButtonText}>Change Photo</Text>
                </Pressable>
                {(hasCustomProfileImage || imagePreview) && !removeProfileImage && (
                  <Pressable style={styles.removeButton} onPress={handleRemoveProfileImage}>
                    <Ionicons name="trash-outline" size={20} color="#dc2626" />
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </Pressable>
                )}
              </View>
              {removeProfileImage && (
                <Text style={styles.removeMessage}>Profile image will be removed on save</Text>
              )}
            </View>

            {/* Basic Information */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Basic Information</Text>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Full Name"
                  placeholderTextColor={Colors.textLight}
                  value={editData.name}
                  onChangeText={(value) => handleEditChange('name', value)}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <TextInput
                  style={[styles.textInput, styles.disabledInput]}
                  value={userData?.phoneNumber}
                  editable={false}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="email@example.com"
                  placeholderTextColor={Colors.textLight}
                  value={editData.email}
                  onChangeText={(value) => handleEditChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Location Details */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Location Details</Text>

              <View style={styles.formRow}>
                <View style={[styles.formField, styles.halfWidth]}>
                  <Text style={styles.fieldLabel}>Country</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Country"
                    placeholderTextColor={Colors.textLight}
                    value={editData.country}
                    onChangeText={(value) => handleEditChange('country', value)}
                  />
                </View>

                <View style={[styles.formField, styles.halfWidth]}>
                  <Text style={styles.fieldLabel}>State</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="State"
                    placeholderTextColor={Colors.textLight}
                    value={editData.state}
                    onChangeText={(value) => handleEditChange('state', value)}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formField, styles.halfWidth]}>
                  <Text style={styles.fieldLabel}>District</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="District"
                    placeholderTextColor={Colors.textLight}
                    value={editData.district}
                    onChangeText={(value) => handleEditChange('district', value)}
                  />
                </View>

                <View style={[styles.formField, styles.halfWidth]}>
                  <Text style={styles.fieldLabel}>Pincode</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="6-digit pincode"
                    placeholderTextColor={Colors.textLight}
                    value={editData.pincode}
                    onChangeText={(value) => handleEditChange('pincode', value.replace(/\D/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Full Address</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Enter your full address"
                  placeholderTextColor={Colors.textLight}
                  value={editData.address}
                  onChangeText={(value) => handleEditChange('address', value)}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            {/* Seeds Information - Read Only */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Seeds Information</Text>

              <View style={styles.readOnlyGrid}>
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyLabel}>Seeds Count</Text>
                  <View style={styles.disabledInputContainer}>
                    <TextInput
                      style={styles.disabledInput}
                      value={editData.seedsCount?.toString() || '0'}
                      editable={false}
                    />
                    <Ionicons name="lock-closed" size={16} color={Colors.textLight} style={styles.lockIcon} />
                  </View>
                </View>
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyLabel}>Bonus</Text>
                  <View style={styles.disabledInputContainer}>
                    <TextInput
                      style={styles.disabledInput}
                      value={editData.bonus?.toString() || '0'}
                      editable={false}
                    />
                    <Ionicons name="lock-closed" size={16} color={Colors.textLight} style={styles.lockIcon} />
                  </View>
                </View>
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyLabel}>Price</Text>
                  <View style={styles.disabledInputContainer}>
                    <TextInput
                      style={styles.disabledInput}
                      value={`₹${editData.price || 0}`}
                      editable={false}
                    />
                    <Ionicons name="lock-closed" size={16} color={Colors.textLight} style={styles.lockIcon} />
                  </View>
                </View>
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyLabel}>Seed Type</Text>
                  <View style={styles.disabledInputContainer}>
                    <TextInput
                      style={styles.disabledInput}
                      value={editData.seedType || 'N/A'}
                      editable={false}
                    />
                    <Ionicons name="lock-closed" size={16} color={Colors.textLight} style={styles.lockIcon} />
                  </View>
                </View>
              </View>
            </View>

            {/* Save/Cancel Buttons */}
            <View style={styles.formActions}>
              <Pressable
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      {/* Loading Overlay */}
      {saving && (
        <Modal transparent visible={saving}>
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.savingText}>Saving changes...</Text>
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
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textLight,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
  },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    backgroundColor: Colors.gray[100],
  },
  profileHeaderInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 14,
    color: Colors.textLight,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  editButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textLight,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addressItem: {
    alignItems: 'flex-start',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  // Edit Mode Styles
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  editTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  photoSection: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    backgroundColor: Colors.gray[100],
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  photoButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  removeButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  removeMessage: {
    marginTop: 8,
    fontSize: 12,
    color: '#059669',
  },
  formSection: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  formField: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
  },
  disabledInput: {
    backgroundColor: Colors.gray[100],
    color: Colors.textLight,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.gray[100],
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 150,
  },
  savingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  readOnlyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  readOnlyField: {
    flex: 1,
    minWidth: '45%',
  },
  readOnlyLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 6,
    fontWeight: '600',
  },
  readOnlyValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
  },
  disabledInputContainer: {
    position: 'relative',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    paddingRight: 36,
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  lockIcon: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
});
