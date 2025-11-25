# Image Upload Implementation Guide

## Overview

This document outlines the complete implementation of camera capture, image upload, and viewing functionality for the mobile app.

## Current Status

✅ **Completed:**
- Image slots UI (4 slots in 2x2 grid)
- Sequential unlocking logic
- Status badges (Pending/Approved/Rejected)
- Progress tracking
- Admin feedback display
- API service layer (`imageApi.ts`)

⏳ **In Progress:**
- Camera capture component
- Image picker integration
- Location services

🔜 **Pending:**
- Image viewer modal
- Full API integration with home screen
- Error handling and loading states

## Step 1: Install Required Packages

Run these commands in the `mobile-app` directory:

```bash
# Install camera and image picker
npx expo install expo-camera expo-image-picker

# Install location services (for geolocation)
npx expo install expo-location

# Install image manipulator (for compression)
npx expo install expo-image-manipulator
```

## Step 2: Update app.json Configuration

Add permissions to `mobile-app/app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow HatchTrack to access your camera to capture hatchery progress images."
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow HatchTrack to access your photos.",
          "cameraPermission": "Allow HatchTrack to capture hatchery images."
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow HatchTrack to access your location to tag images with geographic data."
        }
      ]
    ]
  }
}
```

## Step 3: Create Camera Component

Create `mobile-app/src/components/CameraCapture.tsx`:

```typescript
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';

interface CameraCaptureProps {
  onCapture: (uri: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const cameraRef = useRef<any>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={Colors.textLight} />
        <Text style={styles.permissionText}>
          Camera permission is required to capture images
        </Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </Pressable>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        onCapture(photo.uri);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to capture image');
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
      >
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <Pressable style={styles.iconButton} onPress={onClose}>
              <Ionicons name="close" size={32} color={Colors.white} />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse" size={32} color={Colors.white} />
            </Pressable>
          </View>

          <View style={styles.bottomBar}>
            <Pressable style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </Pressable>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
  },
  bottomBar: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.white,
    borderWidth: 3,
    borderColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  permissionText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  permissionButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  closeButtonText: {
    color: Colors.textLight,
    fontSize: 16,
  },
});
```

## Step 4: Create Image Viewer Modal

Create `mobile-app/src/components/ImageViewerModal.tsx`:

```typescript
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import type { HatcheryImage } from '@/src/services/api/imageApi';

interface ImageViewerModalProps {
  visible: boolean;
  image: HatcheryImage | null;
  imageIndex: number;
  onClose: () => void;
  onDelete?: () => void;
}

const { width, height } = Dimensions.get('window');

export default function ImageViewerModal({
  visible,
  image,
  imageIndex,
  onClose,
  onDelete,
}: ImageViewerModalProps) {
  if (!image) return null;

  const getStatusInfo = () => {
    if (image.status === 'approved' || image.adminFeedback?.action === 'approve') {
      return { color: '#10b981', icon: 'checkmark-circle', text: 'Approved' };
    } else if (image.status === 'rejected' || image.adminFeedback?.action === 'decline') {
      return { color: '#ef4444', icon: 'close-circle', text: 'Rejected' };
    } else {
      return { color: '#f59e0b', icon: 'time', text: 'Pending Review' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Image {imageIndex + 1}</Text>
          {onDelete && (
            <Pressable style={styles.deleteButton} onPress={onDelete}>
              <Ionicons name="trash" size={24} color="#ef4444" />
            </Pressable>
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: image.url }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>

          <View style={styles.infoCard}>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
              <Ionicons name={statusInfo.icon as any} size={20} color={Colors.white} />
              <Text style={styles.statusText}>{statusInfo.text}</Text>
            </View>

            {image.uploadedAt && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color={Colors.textLight} />
                <Text style={styles.infoLabel}>Uploaded:</Text>
                <Text style={styles.infoValue}>
                  {new Date(image.uploadedAt).toLocaleString()}
                </Text>
              </View>
            )}

            {image.location && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={Colors.textLight} />
                <Text style={styles.infoLabel}>Location:</Text>
                <Text style={styles.infoValue}>
                  {image.location.latitude.toFixed(6)}, {image.location.longitude.toFixed(6)}
                </Text>
              </View>
            )}

            {image.adminFeedback?.message && (
              <View style={styles.feedbackBox}>
                <View style={styles.feedbackHeader}>
                  <Ionicons
                    name={statusInfo.icon as any}
                    size={18}
                    color={statusInfo.color}
                  />
                  <Text style={[styles.feedbackTitle, { color: statusInfo.color }]}>
                    Admin Feedback
                  </Text>
                </View>
                <Text style={styles.feedbackMessage}>{image.adminFeedback.message}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageContainer: {
    width: width,
    height: height * 0.5,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoCard: {
    padding: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textLight,
    marginLeft: 12,
    width: 100,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  feedbackBox: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  feedbackMessage: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
});
```

## Step 5: Update API Constants

Add the Hatchery endpoint to `mobile-app/src/constants/api.ts`:

```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints
  HATCHERY: {
    CREATE: '/Hatchery/create',
    GET_USER_HATCHERIES: '/Hatchery/user',
    GET_BY_ID: '/Hatchery',
    UPDATE: '/Hatchery/update',
    DELETE: '/Hatchery/delete',
    UPLOAD_IMAGE: '/Hatchery/upload-image',
    DELETE_IMAGE: '/Hatchery/delete-image',
    IMAGE_FEEDBACK: '/Hatchery/image-feedback',
  },
};
```

## Step 6: Next Implementation Steps

### A. Integrate Camera with Home Screen

Update `handleUploadImage` in `index.tsx`:

```typescript
const handleUploadImage = async (index: number) => {
  // Request location permission
  const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

  // Show options: Camera or Gallery
  Alert.alert(
    'Upload Image',
    'Choose image source',
    [
      {
        text: 'Camera',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status === 'granted') {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });

            if (!result.canceled) {
              await handleImageSelected(result.assets[0].uri, index);
            }
          }
        }
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

          if (!result.canceled) {
            await handleImageSelected(result.assets[0].uri, index);
          }
        }
      },
      { text: 'Cancel', style: 'cancel' }
    ]
  );
};
```

### B. Handle Image Upload

```typescript
const handleImageSelected = async (uri: string, index: number) => {
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
      console.log('Location not available');
    }

    // Upload to backend
    const response = await uploadHatcheryImage(currentHatcheryId, uri, location);

    if (response.success) {
      Alert.alert('Success', 'Image uploaded successfully!');
      await loadUserImages(); // Refresh
    }
  } catch (error: any) {
    Alert.alert('Error', error.message || 'Failed to upload image');
  } finally {
    setUploading(false);
  }
};
```

## Testing Checklist

- [ ] Camera permission request works
- [ ] Camera capture works on both front and back cameras
- [ ] Image picker (gallery) works
- [ ] Location permission and capture works
- [ ] Image uploads successfully to backend
- [ ] Progress bar updates after upload
- [ ] Status badges display correctly
- [ ] Image viewer modal shows all info
- [ ] Delete works within 60-second window
- [ ] Admin feedback displays properly
- [ ] Sequential unlocking works correctly
- [ ] Error handling shows appropriate messages

## Common Issues & Solutions

### Issue: Camera not working in simulator
**Solution**: Use a physical device for camera testing

### Issue: Location permission denied
**Solution**: Gracefully handle by uploading without location data

### Issue: Upload fails with large images
**Solution**: Use expo-image-manipulator to compress images before upload

### Issue: FormData not working
**Solution**: Ensure Content-Type header is set to 'multipart/form-data'

## Production Considerations

1. **Image Compression**: Compress images before upload to reduce bandwidth
2. **Loading States**: Show spinners during upload/delete operations
3. **Error Boundaries**: Wrap components in error boundaries
4. **Offline Support**: Queue uploads for when connection returns
5. **Image Caching**: Cache loaded images to reduce API calls
6. **Performance**: Use FlatList for large image lists
7. **Analytics**: Track upload success/failure rates
