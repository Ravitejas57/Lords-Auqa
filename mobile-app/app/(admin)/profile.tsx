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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/src/constants/colors';
import { getAdminProfile, updateAdminProfile, getAdminStatistics } from '@/src/services/api/adminApi';

const DEFAULT_PROFILE_ICON = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

export default function AdminProfileScreen() {
  const router = useRouter();
  const [adminData, setAdminData] = useState<any>(null);
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    approvedRequests: 0,
    pendingApprovals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editData, setEditData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    location: '',
    bio: '',
  });

  const [imageFile, setImageFile] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeProfileImage, setRemoveProfileImage] = useState(false);

  useEffect(() => {
    fetchAdminProfile();
    fetchStatistics();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const storedAdminData = await AsyncStorage.getItem('adminData');
      if (!storedAdminData) {
        Alert.alert('Error', 'Please log in to access profile.');
        router.replace('/(auth)/login');
        return;
      }

      const parsedData = JSON.parse(storedAdminData);
      const adminId = parsedData.profile?.adminId || parsedData.adminId;

      if (!adminId) {
        Alert.alert('Error', 'Admin ID not found');
        setLoading(false);
        return;
      }

      const response = await getAdminProfile(adminId);

      if (response.success && response.admin) {
        setAdminData(response.admin);
        setEditData({
          name: response.admin.name || '',
          email: response.admin.email || '',
          phoneNumber: response.admin.phoneNumber || '',
          location: response.admin.location || '',
          bio: response.admin.bio || '',
        });
      } else {
        Alert.alert('Error', response.message || 'Failed to fetch admin profile');
      }
    } catch (err: any) {
      console.error('Error fetching admin profile:', err);
      Alert.alert('Error', 'Unable to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const storedAdminData = await AsyncStorage.getItem('adminData');
      let adminId = null;

      if (storedAdminData) {
        const parsedData = JSON.parse(storedAdminData);
        adminId = parsedData.profile?.adminId || parsedData.adminId;
      }

      const response = await getAdminStatistics(adminId);

      if (response.success && response.statistics) {
        setStatistics(response.statistics);
      }
    } catch (err: any) {
      console.error('Error fetching statistics:', err);
    }
  };

  const handleEditChange = (field: string, value: string) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please grant photo library permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageFile(result.assets[0].uri);
        setImagePreview(result.assets[0].uri);
        setRemoveProfileImage(false);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleRemoveProfileImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveProfileImage(true);
  };

  const handleSave = async () => {
    if (!adminData?.adminId) {
      return;
    }

    if (!editData.name?.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();

      Object.keys(editData).forEach((key) => {
        if (editData[key as keyof typeof editData] !== undefined && editData[key as keyof typeof editData] !== null) {
          formData.append(key, editData[key as keyof typeof editData]);
        }
      });

      if (imageFile) {
        const filename = imageFile.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('profileImage', {
          uri: imageFile,
          name: filename,
          type,
        } as any);
      }

      if (removeProfileImage) {
        formData.append('removeProfileImage', 'true');
      }

      const response = await updateAdminProfile(adminData.adminId, formData);

      if (response.success) {
        Alert.alert('Success', 'Profile updated successfully!');
        setEditMode(false);
        setImageFile(null);
        setImagePreview(null);
        setRemoveProfileImage(false);
        fetchAdminProfile();
      } else {
        Alert.alert('Error', response.message || 'Update failed');
      }
    } catch (err: any) {
      console.error('Save error:', err);
      Alert.alert('Error', 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

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

  const profileImageUrl = imagePreview || adminData?.profileImage?.url || DEFAULT_PROFILE_ICON;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: profileImageUrl }}
              style={styles.profileImage}
              resizeMode="cover"
            />
            {editMode && (
              <View style={styles.imageActions}>
                <Pressable style={styles.imageActionButton} onPress={handleImageChange}>
                  <Ionicons name="camera" size={16} color={Colors.white} />
                </Pressable>
                {adminData?.profileImage?.url && (
                  <Pressable style={[styles.imageActionButton, styles.removeButton]} onPress={handleRemoveProfileImage}>
                    <Ionicons name="trash" size={16} color={Colors.white} />
                  </Pressable>
                )}
              </View>
            )}
          </View>
          <Text style={styles.profileName}>{adminData?.name || 'Admin'}</Text>
          <Text style={styles.profileRole}>Administrator</Text>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{statistics.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Sellers</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            <Text style={styles.statValue}>{statistics.approvedRequests}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color="#f59e0b" />
            <Text style={styles.statValue}>{statistics.pendingApprovals}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Profile Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            {!editMode && (
              <Pressable style={styles.editButton} onPress={() => setEditMode(true)}>
                <Ionicons name="create" size={18} color={Colors.primary} />
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.formContainer}>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Full Name</Text>
              <TextInput
                style={[styles.formInput, !editMode && styles.formInputDisabled]}
                value={editData.name}
                onChangeText={(value) => handleEditChange('name', value)}
                editable={editMode}
                placeholder="Enter your name"
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Email</Text>
              <TextInput
                style={[styles.formInput, !editMode && styles.formInputDisabled]}
                value={editData.email}
                onChangeText={(value) => handleEditChange('email', value)}
                editable={editMode}
                placeholder="Enter your email"
                placeholderTextColor={Colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Phone Number</Text>
              <TextInput
                style={[styles.formInput, styles.formInputDisabled]}
                value={editData.phoneNumber}
                editable={false}
                placeholder="Phone number"
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Location</Text>
              <TextInput
                style={[styles.formInput, !editMode && styles.formInputDisabled]}
                value={editData.location}
                onChangeText={(value) => handleEditChange('location', value)}
                editable={editMode}
                placeholder="Enter your location"
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Bio</Text>
              <TextInput
                style={[styles.formInput, styles.textArea, !editMode && styles.formInputDisabled]}
                value={editData.bio}
                onChangeText={(value) => handleEditChange('bio', value)}
                editable={editMode}
                placeholder="Tell us about yourself"
                placeholderTextColor={Colors.textLight}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {editMode && (
            <View style={styles.actionButtons}>
              <Pressable
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => {
                  setEditMode(false);
                  setImageFile(null);
                  setImagePreview(null);
                  setRemoveProfileImage(false);
                  fetchAdminProfile();
                }}
              >
                <Ionicons name="close" size={20} color={Colors.text} />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color={Colors.white} />
                    <Text style={styles.saveButtonText}>Save</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </View>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  placeholder: {
    width: 70,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  imageActions: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    gap: 8,
  },
  imageActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  removeButton: {
    backgroundColor: '#ef4444',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  section: {
    backgroundColor: Colors.white,
    marginTop: 12,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.gray[100],
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  formContainer: {
    gap: 16,
  },
  formField: {
    gap: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  formInput: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
  },
  formInputDisabled: {
    backgroundColor: Colors.gray[100],
    color: Colors.textLight,
  },
  textArea: {
    minHeight: 100,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: Colors.gray[100],
    borderWidth: 1,
    borderColor: Colors.border,
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
});
