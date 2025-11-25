import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  FlatList,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/src/constants/colors';
import {
  sendBroadcastNotification,
  getNotificationHistory,
} from '@/src/services/api/notificationApi';

interface NotificationsProps {
  adminData: any;
  approvedUsers: any[];
}

export default function NotificationsScreen({ adminData, approvedUsers }: NotificationsProps) {
  // Notification states
  const [notificationForm, setNotificationForm] = useState({
    target: 'all',
    userIds: [],
    priority: 'medium',
    message: '',
  });
  const [notificationHistory, setNotificationHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Array<{ uri: string; type: string; name: string }>>([]);

  // User selection states
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Media picker modal state
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // View all state for notifications
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  useEffect(() => {
    loadNotificationHistory();
  }, []);

  const loadNotificationHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await getNotificationHistory();
      if (response.success) {
        setNotificationHistory(response.history || []);
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to load notification history. Please try again.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleMediaPickerOpen = () => {
    setShowMediaPicker(true);
  };

  const handleCameraCapture = async () => {
    try {
      // Close modal first
      setShowMediaPicker(false);
      
      // Check and request camera permission first
      const { status: existingCameraStatus } = await ImagePicker.getCameraPermissionsAsync();
      let finalCameraStatus = existingCameraStatus;
      
      if (existingCameraStatus !== 'granted') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        finalCameraStatus = status;
      }
      
      // Handle camera permission denial
      if (finalCameraStatus !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in your device settings to take photos or record videos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => {
                Alert.alert(
                  'Settings',
                  'Please go to Settings > Apps > Hatch Track > Permissions and enable Camera access.'
                );
              }
            }
          ]
        );
        return;
      }

      // Show options to choose between photo and video
      // This ensures video option is available on all platforms
      Alert.alert(
        'Camera',
        'What would you like to capture?',
        [
          {
            text: 'Take Photo',
            onPress: () => launchCameraForPhoto(),
          },
          {
            text: 'Record Video',
            onPress: () => launchCameraForVideo(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to open camera options');
    }
  };

  const launchCameraForPhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newFiles = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          name: asset.fileName || `image_${Date.now()}.jpg`,
        }));
        
        if (selectedFiles.length + newFiles.length > 5) {
          Alert.alert('Limit Reached', 'You can upload a maximum of 5 files');
          return;
        }
        
        setSelectedFiles([...selectedFiles, ...newFiles]);
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to capture photo');
    }
  };

  const launchCameraForVideo = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'videos',
        allowsEditing: false,
        videoMaxDuration: 60,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newFiles = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.mimeType || 'video/mp4',
          name: asset.fileName || `video_${Date.now()}.mp4`,
        }));
        
        if (selectedFiles.length + newFiles.length > 5) {
          Alert.alert('Limit Reached', 'You can upload a maximum of 5 files');
          return;
        }
        
        setSelectedFiles([...selectedFiles, ...newFiles]);
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to record video');
    }
  };

  const handleMediaLibraryPick = async () => {
    try {
      // Close modal first
      setShowMediaPicker(false);

      // Small delay to ensure modal closes before opening picker
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check current permission status
      const { status: existingStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();

      let finalStatus = existingStatus;

      // Request permission if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        finalStatus = status;
      }

      // Handle permission denial
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Media Library Permission Required',
          'Please enable media library access in your device settings to select photos or videos.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                // On iOS, this will open Settings app
                // On Android, user needs to manually go to app settings
                Alert.alert(
                  'Settings',
                  'Please go to Settings > Apps > Hatch Track > Permissions and enable Storage/Photos access.'
                );
              }
            }
          ]
        );
        return;
      }

      // Open media library after permission is granted
      const remainingSlots = 5 - selectedFiles.length;

      // Configure picker options for cross-platform compatibility
      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow both images and videos
        allowsMultipleSelection: remainingSlots > 1, // Only allow multiple if slots available
        quality: 0.8, // Image quality (0.0 to 1.0)
        allowsEditing: false,
        selectionLimit: remainingSlots > 0 ? remainingSlots : 1, // Limit selection
      };

      // For iOS, add orderedSelection
      if (Platform.OS === 'ios' && remainingSlots > 1) {
        (pickerOptions as any).orderedSelection = true;
      }

      console.log('Opening media picker with options:', pickerOptions);
      console.log('Current permission status:', finalStatus);
      console.log('Platform:', Platform.OS);

      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

      console.log('Media picker result:', {
        canceled: result.canceled,
        assetsCount: result.assets?.length || 0
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('Selected assets:', result.assets.length);
        const newFiles = result.assets.map(asset => {
          // Determine file type and mime type
          const isVideo = asset.type === 'video' || asset.mimeType?.startsWith('video/');
          const mimeType = asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg');
          const fileName = asset.fileName || (isVideo ? `video_${Date.now()}.mp4` : `image_${Date.now()}.jpg`);
          
          console.log('Asset:', {
            uri: asset.uri,
            type: asset.type,
            mimeType: mimeType,
            fileName: fileName
          });
          
          return {
            uri: asset.uri,
            type: mimeType,
            name: fileName,
          };
        });

        // Limit to 5 files total
        if (selectedFiles.length + newFiles.length > 5) {
          Alert.alert('Limit Reached', 'You can upload a maximum of 5 files');
          return;
        }

        setSelectedFiles([...selectedFiles, ...newFiles]);
        console.log('Files added successfully. Total files:', selectedFiles.length + newFiles.length);
      } else {
        console.log('Media picker was canceled or no assets selected');
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message ||
        error.message || 'Failed to open media library. Please try again.'
      );
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSendNotification = async () => {
    // Message is optional if media files are uploaded
    if (!notificationForm.message.trim() && selectedFiles.length === 0) {
      Alert.alert('Error', 'Please enter a message or upload media');
      return;
    }

    if (notificationForm.target === 'users' && selectedUserIds.length === 0) {
      Alert.alert('Error', 'Please select at least one user');
      return;
    }

    setSendingNotification(true);
    try {
      const adminId = adminData?.profile?._id || adminData?._id || adminData?.id;

      const response = await sendBroadcastNotification({
        target: notificationForm.target,
        userIds: notificationForm.target === 'users' ? selectedUserIds : [],
        type: 'info',
        priority: notificationForm.priority,
        message: notificationForm.message,
        adminId: adminId,
        files: selectedFiles,
      });

      if (response.success) {
        Alert.alert(
          'Success',
          `Notification sent successfully to ${response.count} user(s)!`
        );
        setNotificationForm({ target: 'all', userIds: [], priority: 'medium', message: '' });
        setSelectedUserIds([]);
        setSelectedFiles([]);
        loadNotificationHistory();
      }
    } catch (error: any) {
      console.error('Error sending notification:', error);
      Alert.alert('Error', error.message || 'Failed to send notification');
    } finally {
      setSendingNotification(false);
    }
  };

  const handleSelectAllUsers = () => {
    if (selectedUserIds.length === approvedUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(approvedUsers.map((user) => user._id));
    }
  };

  const handleToggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Send Notification Form */}
        <View style={styles.notificationCard}>
          <Text style={styles.notificationCardTitle}>Send Broadcast Notification</Text>

          {/* Target Audience */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Target Audience</Text>
            <View style={styles.targetOptions}>
              <Pressable
                style={[
                  styles.targetOption,
                  notificationForm.target === 'all' && styles.targetOptionActive,
                ]}
                onPress={() => {
                  setNotificationForm({ ...notificationForm, target: 'all' });
                  setSelectedUserIds([]);
                }}
              >
                <Ionicons
                  name="people"
                  size={20}
                  color={notificationForm.target === 'all' ? Colors.white : Colors.primary}
                />
                <Text
                  style={[
                    styles.targetOptionText,
                    notificationForm.target === 'all' && styles.targetOptionTextActive,
                  ]}
                >
                  All Sellers
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.targetOption,
                  notificationForm.target === 'users' && styles.targetOptionActive,
                ]}
                onPress={() => setNotificationForm({ ...notificationForm, target: 'users' })}
              >
                <Ionicons
                  name="person"
                  size={20}
                  color={notificationForm.target === 'users' ? Colors.white : Colors.primary}
                />
                <Text
                  style={[
                    styles.targetOptionText,
                    notificationForm.target === 'users' && styles.targetOptionTextActive,
                  ]}
                >
                  Specific Sellers
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Seller Selection */}
          {notificationForm.target === 'users' && (
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Select Sellers</Text>
              <Pressable
                style={styles.userSelector}
                onPress={() => setShowUserPicker(true)}
              >
                <Text style={styles.userSelectorText}>
                  {selectedUserIds.length === 0
                    ? 'Tap to select sellers'
                    : `${selectedUserIds.length} seller(s) selected`}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textLight} />
              </Pressable>
            </View>
          )}

          {/* Priority */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Priority</Text>
            <View style={styles.priorityOptions}>
              {['low', 'medium', 'high'].map((priority) => (
                <Pressable
                  key={priority}
                  style={[
                    styles.priorityOption,
                    notificationForm.priority === priority && styles.priorityOptionActive,
                  ]}
                  onPress={() => setNotificationForm({ ...notificationForm, priority })}
                >
                  <Text
                    style={[
                      styles.priorityOptionText,
                      notificationForm.priority === priority && styles.priorityOptionTextActive,
                    ]}
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Message */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              Message {selectedFiles.length > 0 && <Text style={styles.optionalText}>(Optional)</Text>}
            </Text>
            <View style={styles.messageInputContainer}>
              <TextInput
                style={styles.messageInput}
                placeholder={selectedFiles.length > 0 ? "Enter notification message (optional)..." : "Enter notification message..."}
                placeholderTextColor={Colors.textLight}
                value={notificationForm.message}
                onChangeText={(text) =>
                  setNotificationForm({ ...notificationForm, message: text })
                }
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Pressable style={styles.addFileButton} onPress={handleMediaPickerOpen}>
                <Ionicons name="add-circle" size={28} color={Colors.primary} />
              </Pressable>
            </View>
            {selectedFiles.length > 0 && (
              <View style={styles.filesContainer}>
                {selectedFiles.map((file, index) => (
                  <View key={index} style={styles.fileItem}>
                    {file.type.startsWith('image') ? (
                      <Image source={{ uri: file.uri }} style={styles.filePreview} />
                    ) : (
                      <View style={[styles.filePreview, styles.videoPreview]}>
                        <Ionicons name="videocam" size={24} color={Colors.primary} />
                      </View>
                    )}
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <Text style={styles.fileType}>
                        {file.type.startsWith('image') ? 'Image' : 'Video'}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.removeFileButton}
                      onPress={() => handleRemoveFile(index)}
                    >
                      <Ionicons name="close-circle" size={24} color={Colors.error} />
                    </Pressable>
                  </View>
                ))}
                <Text style={styles.fileCountText}>
                  {selectedFiles.length} file(s) selected (max 5)
                </Text>
              </View>
            )}
          </View>

          {/* Send Button */}
          <Pressable
            style={[styles.sendButton, sendingNotification && styles.sendButtonDisabled]}
            onPress={handleSendNotification}
            disabled={sendingNotification}
          >
            {sendingNotification ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="send" size={20} color={Colors.white} />
                <Text style={styles.sendButtonText}>Send Notification</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Notification History */}
        <View style={styles.notificationHistorySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Notification History</Text>
            <Pressable onPress={loadNotificationHistory} disabled={loadingHistory}>
              <Ionicons
                name="refresh"
                size={20}
                color={loadingHistory ? Colors.textLight : Colors.primary}
              />
            </Pressable>
          </View>

          {loadingHistory ? (
            <View style={styles.historyLoading}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.historyLoadingText}>Loading history...</Text>
            </View>
          ) : notificationHistory.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Ionicons name="notifications-off" size={48} color={Colors.textLight} />
              <Text style={styles.emptyHistoryText}>No notifications sent yet</Text>
            </View>
          ) : (
            <>
              {(showAllNotifications ? notificationHistory : notificationHistory.slice(0, 3)).map((notification, index) => (
                <View key={notification._id || index} style={styles.historyItem}>
                  <View style={styles.historyItemHeader}>
                    <View style={styles.historyBadges}>
                      <View
                        style={[
                          styles.priorityBadge,
                          notification.priority === 'high' && styles.priorityBadgeHigh,
                          notification.priority === 'medium' && styles.priorityBadgeMedium,
                          notification.priority === 'low' && styles.priorityBadgeLow,
                        ]}
                      >
                        <Text style={styles.priorityBadgeText}>
                          {notification.priority?.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.historyRecipientCount}>
                        {notification.recipients && notification.recipients.length === 1 && notification.recipients[0] !== 'All Sellers'
                          ? notification.recipients[0]
                          : notification.recipients && notification.recipients[0] === 'All Sellers'
                          ? 'All Users'
                          : `${notification.recipientCount} recipient(s)`}
                      </Text>
                    </View>
                    <Text style={styles.historyTime}>{formatDate(notification.sentAt)}</Text>
                  </View>
                  <Text style={styles.historyMessage}>{notification.message}</Text>
                  {notification.files && notification.files.length > 0 && (
                    <View style={styles.historyFilesContainer}>
                      <Text style={styles.historyFilesLabel}>
                        {notification.files.length} file(s) attached
                      </Text>
                    </View>
                  )}
                </View>
              ))}
              {notificationHistory.length > 3 && (
                <Pressable
                  style={styles.viewAllButton}
                  onPress={() => setShowAllNotifications(!showAllNotifications)}
                >
                  <Text style={styles.viewAllButtonText}>
                    {showAllNotifications ? 'Show Less' : `View All (${notificationHistory.length})`}
                  </Text>
                  <Ionicons
                    name={showAllNotifications ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={Colors.primary}
                  />
                </Pressable>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Media Picker Modal */}
      <Modal
        visible={showMediaPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMediaPicker(false)}
      >
        <Pressable 
          style={styles.mediaPickerOverlay}
          onPress={() => setShowMediaPicker(false)}
        >
          <View style={styles.mediaPickerContent}>
            <View style={styles.mediaPickerHeader}>
              <Text style={styles.mediaPickerTitle}>Select Media</Text>
              <Pressable onPress={() => setShowMediaPicker(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>
            
            <View style={styles.mediaPickerOptions}>
              <Pressable
                style={styles.mediaPickerMainButton}
                onPress={handleCameraCapture}
              >
                <Ionicons name="camera" size={32} color={Colors.primary} />
                <Text style={styles.mediaPickerMainButtonText}>Camera</Text>
                <Text style={styles.mediaPickerMainButtonSubtext}>
                  Take photos or record videos
                </Text>
              </Pressable>

              <Pressable
                style={styles.mediaPickerMainButton}
                onPress={handleMediaLibraryPick}
              >
                <Ionicons name="images" size={32} color={Colors.primary} />
                <Text style={styles.mediaPickerMainButtonText}>Media Library</Text>
                <Text style={styles.mediaPickerMainButtonSubtext}>
                  Select photos or videos from device
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* User Picker Modal */}
      <Modal
        visible={showUserPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUserPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Sellers</Text>
              <Pressable onPress={() => setShowUserPicker(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>

            {/* Select All Button */}
            <Pressable style={styles.selectAllButton} onPress={handleSelectAllUsers}>
              <Ionicons
                name={selectedUserIds.length === approvedUsers.length ? 'checkbox' : 'square-outline'}
                size={24}
                color={Colors.primary}
              />
              <Text style={styles.selectAllText}>
                {selectedUserIds.length === approvedUsers.length ? 'Deselect All' : 'Select All Sellers'}
              </Text>
            </Pressable>

            <FlatList
              data={approvedUsers}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.userItem}
                  onPress={() => handleToggleUser(item._id)}
                >
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userPhone}>{item.phoneNumber}</Text>
                  </View>
                  <Ionicons
                    name={selectedUserIds.includes(item._id) ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={Colors.primary}
                  />
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={styles.emptyText}>No sellers available</Text>
                </View>
              }
            />

            <Pressable
              style={styles.doneButton}
              onPress={() => setShowUserPicker(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 5,
    paddingTop: 20,
    paddingBottom: 40,
  },
  // Notification styles
  notificationCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  optionalText: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textLight,
    fontStyle: 'italic',
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
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  messageInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    minHeight: 100,
    paddingVertical: 4,
  },
  addFileButton: {
    marginLeft: 8,
    padding: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: Colors.textLight,
  },
  emptyList: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  filesContainer: {
    marginTop: 12,
    gap: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filePreview: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
  videoPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray[200],
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  fileType: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  removeFileButton: {
    marginLeft: 8,
  },
  fileCountText: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  historyFilesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  historyFilesLabel: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  mediaPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaPickerContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: '85%',
    maxWidth: 400,
    padding: 20,
  },
  mediaPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  mediaPickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  mediaPickerOptions: {
    gap: 16,
  },
  mediaPickerMainButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  mediaPickerMainButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 4,
  },
  mediaPickerMainButtonSubtext: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
  },
});
