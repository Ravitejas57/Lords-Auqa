import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Linking } from 'react-native';
import { Colors } from '@/src/constants/colors';
import type { HatcheryImage } from '@/src/services/api/imageApi';
import { deleteHatcheryImage } from '@/src/services/api/imageApi';
import { useAuth } from '@/src/store/context/AuthContext';
import UserHeader from '@/src/components/UserHeader';
import { getUserProfile } from '@/src/services/api/authApi';
import { getNotificationCount } from '@/src/services/api/userNotificationApi';

export default function ImageViewerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, logout } = useAuth();
  const [fullScreenMode, setFullScreenMode] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [image, setImage] = useState<HatcheryImage | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [hatcheryId, setHatcheryId] = useState<string>('');
  const [deleting, setDeleting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const loadingProfileRef = useRef(false);
  
  const mapScale = useSharedValue(1);
  const mapSavedScale = useSharedValue(1);
  const mapTranslateX = useSharedValue(0);
  const mapTranslateY = useSharedValue(0);
  const mapSavedTranslateX = useSharedValue(0);
  const mapSavedTranslateY = useSharedValue(0);
  const { width, height } = useWindowDimensions();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  useEffect(() => {
    // Parse image data from params
    if (params.imageData) {
      try {
        const imageData = JSON.parse(params.imageData as string);
        setImage(imageData);
      } catch (error) {
        console.error('Error parsing image data:', error);
        Alert.alert('Error', 'Invalid image data');
        router.replace('/(tabs)/hatchery');
      }
    }
    
    if (params.imageIndex) {
      setImageIndex(parseInt(params.imageIndex as string, 10));
    }
    
    if (params.hatcheryId) {
      setHatcheryId(params.hatcheryId as string);
    }
  }, [params.imageData, params.imageIndex, params.hatcheryId]);

  useEffect(() => {
    // Load user profile and notifications only once on mount
    const loadUserProfileAndNotifications = async () => {
      // Prevent multiple simultaneous calls using ref
      if (loadingProfileRef.current) {
        return;
      }
      
      // If profile is already loaded, don't reload
      if (userProfile) {
        return;
      }
      
      try {
        if (!user?.phoneNumber) {
          return;
        }

        loadingProfileRef.current = true;
        const response = await getUserProfile(user.phoneNumber);
        if (response.success) {
          setUserProfile(response.user);
          
          // Load notification count
          // Use _id from User type, or check for mongoId/id if API returns additional fields
          const userId = (response.user as any)?.mongoId || response.user?._id || (response.user as any)?.id;
          if (userId) {
            const notificationResponse = await getNotificationCount(userId);
            if (notificationResponse.success) {
              setUnreadCount(notificationResponse.unreadCount || 0);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        loadingProfileRef.current = false;
      }
    };

    loadUserProfileAndNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };


  const handleImagePress = () => {
    setFullScreenMode(true);
  };

  const handleCloseFullScreen = () => {
    setFullScreenMode(false);
    // Reset zoom and position
    scale.value = withTiming(1);
    savedScale.value = 1;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const checkCanDelete = (img: HatcheryImage): boolean => {
    if (!img.uploadedAt) return false;
    const uploadTime = new Date(img.uploadedAt).getTime();
    const now = Date.now();
    const timeDiff = now - uploadTime;
    const sixtySeconds = 60 * 1000;
    return timeDiff < sixtySeconds || img.status === 'rejected' || img.adminFeedback?.action === 'decline';
  };

  const handleDelete = async () => {
    if (!image || !hatcheryId) return;

    const canDelete = checkCanDelete(image);

    if (!canDelete) {
      Alert.alert(
        'Cannot Delete',
        'Images can only be deleted within 60 seconds of upload or if rejected by admin.'
      );
      return;
    }

    Alert.alert(
      'Delete Image',
      `Are you sure you want to delete Image ${imageIndex + 1}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              const response = await deleteHatcheryImage(hatcheryId, imageIndex);

              if (response.success) {
                Alert.alert('Success', 'Image deleted successfully', [
                  { text: 'OK', onPress: () => router.replace('/(tabs)/hatchery') }
                ]);
              }
            } catch (error: any) {
              console.error('Delete error:', error);
              Alert.alert('Error', error.message || 'Failed to delete image');
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

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
        // Reset position when zooming out to 1x
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

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  // Map gestures and animated style (must be at top level for Rules of Hooks)
  const mapPanGesture = Gesture.Pan()
    .onUpdate((event) => {
      mapTranslateX.value = mapSavedTranslateX.value + event.translationX;
      mapTranslateY.value = mapSavedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      mapSavedTranslateX.value = mapTranslateX.value;
      mapSavedTranslateY.value = mapTranslateY.value;
    });

  const mapPinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      mapScale.value = mapSavedScale.value * event.scale;
    })
    .onEnd(() => {
      if (mapScale.value < 1) {
        mapScale.value = withSpring(1);
        mapSavedScale.value = 1;
        mapTranslateX.value = withSpring(0);
        mapTranslateY.value = withSpring(0);
        mapSavedTranslateX.value = 0;
        mapSavedTranslateY.value = 0;
      } else if (mapScale.value > 5) {
        mapScale.value = withSpring(5);
        mapSavedScale.value = 5;
      } else {
        mapSavedScale.value = mapScale.value;
      }
    });

  const mapComposedGesture = Gesture.Simultaneous(mapPanGesture, mapPinchGesture);

  const mapAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: mapTranslateX.value },
        { translateY: mapTranslateY.value },
        { scale: mapScale.value },
      ],
    };
  });

  if (!image) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <UserHeader
          userName={userProfile?.name || user?.name}
          unreadCount={unreadCount}
          onLogout={handleLogout}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading image...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {mapFullscreen && image.location ? (
        <GestureHandlerRootView style={styles.fullscreenMapContainer}>
          <SafeAreaView style={styles.fullscreenMapSafeArea} edges={['top']}>
            <UserHeader
              userName={userProfile?.name || user?.name}
              unreadCount={unreadCount}
              onLogout={handleLogout}
            />
            <View style={styles.fullscreenMapHeader}>
              <Pressable style={styles.fullscreenMapCloseButton} onPress={() => {
                setMapFullscreen(false);
                // Reset zoom and pan
                mapScale.value = withTiming(1);
                mapSavedScale.value = 1;
                mapTranslateX.value = withTiming(0);
                mapTranslateY.value = withTiming(0);
                mapSavedTranslateX.value = 0;
                mapSavedTranslateY.value = 0;
              }}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </Pressable>
              <Text style={styles.fullscreenMapTitle}>Map Location</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>

          <GestureDetector gesture={mapComposedGesture}>
            <Animated.View style={[styles.fullscreenMapWrapper, mapAnimatedStyle]}>
              <WebView
                style={styles.fullscreenMapWebView}
                source={{
                  uri: `https://www.openstreetmap.org/export/embed.html?bbox=${image.location.longitude - 0.01},${image.location.latitude - 0.01},${image.location.longitude + 0.01},${image.location.latitude + 0.01}&layer=mapnik&marker=${image.location.latitude},${image.location.longitude}`,
                }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                scalesPageToFit={true}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
              />
            </Animated.View>
          </GestureDetector>

          <SafeAreaView style={styles.fullscreenMapFooterSafeArea} edges={['bottom']}>
            <View style={styles.fullscreenMapFooter}>
              <View style={styles.fullscreenMapCoordinates}>
                <Ionicons name="location" size={16} color={Colors.textLight} />
                <Text style={styles.fullscreenMapCoordinatesText}>
                  {image.location.latitude.toFixed(6)}, {image.location.longitude.toFixed(6)}
                </Text>
              </View>
              <Pressable
                style={styles.fullscreenMapOpenButton}
                onPress={() => {
                  if (!image.location) return;
                  const lat = image.location.latitude;
                  const lng = image.location.longitude;

                  const openMaps = async () => {
                    // Try platform-specific URLs first
                    const platformUrl = Platform.select({
                      ios: `maps://maps.apple.com/?q=${lat},${lng}`,
                      android: `geo:${lat},${lng}?q=${lat},${lng}`,
                    });

                    // Fallback to Google Maps web
                    const fallbackUrl = `https://www.google.com/maps?q=${lat},${lng}`;

                    try {
                      if (platformUrl) {
                        const canOpen = await Linking.canOpenURL(platformUrl);
                        if (canOpen) {
                          await Linking.openURL(platformUrl);
                          return;
                        }
                      }
                      // Fallback to web URL
                      await Linking.openURL(fallbackUrl);
                    } catch (err) {
                      console.error('Error opening maps:', err);
                    }
                  };

                  openMaps();
                }}
              >
                <Ionicons name="open-outline" size={18} color={Colors.white} />
                <Text style={styles.fullscreenMapOpenButtonText}>Open in Maps App</Text>
              </Pressable>
              <Text style={styles.fullscreenMapHint}>Pinch to zoom • Drag to move</Text>
            </View>
          </SafeAreaView>
        </GestureHandlerRootView>
      ) : !fullScreenMode ? (
        <SafeAreaView style={styles.container} edges={['top']}>
          <UserHeader
            userName={userProfile?.name || user?.name}
            unreadCount={unreadCount}
            onLogout={handleLogout}
          />
          <View style={styles.header}>
            <Pressable
              style={styles.closeButton}
              onPress={() => router.replace('/(tabs)/hatchery')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Image {imageIndex + 1}</Text>
            {checkCanDelete(image) ? (
              <Pressable
                style={styles.deleteButton}
                onPress={handleDelete}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Ionicons name="trash" size={24} color="#ef4444" />
                )}
              </Pressable>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Image Preview - Tappable */}
            <Pressable onPress={handleImagePress} style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: image.url }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <View style={styles.tapHint}>
                <Ionicons name="expand" size={20} color={Colors.white} />
                <Text style={styles.tapHintText}>Tap to zoom</Text>
              </View>
            </Pressable>

            <View style={styles.infoCard}>
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
            </View>

            {/* Location Info Section with Map */}
            {image.location && (
              <View style={styles.mapSection}>
                <View style={styles.mapHeader}>
                  <View style={styles.mapHeaderLeft}>
                    <Ionicons name="location" size={20} color={Colors.primary} />
                    <Text style={styles.mapTitle}>Image Location</Text>
                  </View>
                </View>
                <View style={styles.mapContainer}>
                  {mapLoading && (
                    <View style={styles.mapLoadingContainer}>
                      <ActivityIndicator size="large" color={Colors.primary} />
                      <Text style={styles.mapLoadingText}>Loading map...</Text>
                    </View>
                  )}
                  <WebView
                    style={styles.mapWebView}
                    source={{
                      uri: `https://www.openstreetmap.org/export/embed.html?bbox=${image.location.longitude - 0.01},${image.location.latitude - 0.01},${image.location.longitude + 0.01},${image.location.latitude + 0.01}&layer=mapnik&marker=${image.location.latitude},${image.location.longitude}`,
                    }}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                    scalesPageToFit={true}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    onError={(syntheticEvent) => {
                      const { nativeEvent } = syntheticEvent;
                      console.error('WebView error: ', nativeEvent);
                      setMapLoading(false);
                    }}
                    onHttpError={(syntheticEvent) => {
                      const { nativeEvent } = syntheticEvent;
                      console.error('WebView HTTP error: ', nativeEvent);
                      setMapLoading(false);
                    }}
                    onLoadEnd={() => {
                      console.log('Map WebView loaded');
                      setMapLoading(false);
                    }}
                  />
                  <View style={styles.mapButtonsContainer} pointerEvents="box-none">
                    <Pressable
                      style={styles.mapFullscreenButton}
                      onPress={() => {
                        console.log('Fullscreen button pressed');
                        setMapFullscreen(true);
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="expand-outline" size={20} color={Colors.white} />
                      <Text style={styles.mapFullscreenButtonText}>View Fullscreen</Text>
                    </Pressable>
                  </View>
                  <Pressable
                    style={styles.mapOverlayButton}
                    onPress={() => {
                      if (!image.location) return;
                      const lat = image.location.latitude;
                      const lng = image.location.longitude;

                      const openMaps = async () => {
                        // Try platform-specific URLs first
                        const platformUrl = Platform.select({
                          ios: `maps://maps.apple.com/?q=${lat},${lng}`,
                          android: `geo:${lat},${lng}?q=${lat},${lng}`,
                        });

                        // Fallback to Google Maps web
                        const fallbackUrl = `https://www.google.com/maps?q=${lat},${lng}`;

                        try {
                          if (platformUrl) {
                            const canOpen = await Linking.canOpenURL(platformUrl);
                            if (canOpen) {
                              await Linking.openURL(platformUrl);
                              return;
                            }
                          }
                          // Fallback to web URL
                          await Linking.openURL(fallbackUrl);
                        } catch (err) {
                          console.error('Error opening maps:', err);
                        }
                      };

                      openMaps();
                    }}
                  >
                    <View style={styles.mapOverlay}>
                      <Ionicons name="open-outline" size={20} color={Colors.white} />
                      <Text style={styles.mapOverlayText}>Open in Maps App</Text>
                    </View>
                  </Pressable>
                </View>
                <View style={styles.coordinatesBox}>
                  <Ionicons name="navigate" size={16} color={Colors.textLight} />
                  <Text style={styles.coordinatesText}>
                    Latitude: {image.location.latitude.toFixed(6)} | Longitude: {image.location.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      ) : (
        <GestureHandlerRootView style={styles.fullScreenContainer}>
          <SafeAreaView style={styles.fullScreenSafeArea} edges={['top']}>
            <GestureDetector gesture={composedGesture}>
              <Animated.View style={[styles.fullScreenImageWrapper, animatedStyle]}>
                <Image
                  source={{ uri: image.url }}
                  style={[styles.fullScreenImage, { width, height }]}
                  resizeMode="contain"
                />
              </Animated.View>
            </GestureDetector>

            <View style={styles.fullScreenHeader}>
              <Pressable
                style={styles.fullScreenCloseButton}
                onPress={() => {
                  handleCloseFullScreen();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-back" size={24} color={Colors.white} />
              </Pressable>
              <Text style={styles.fullScreenTitle}>Image Viewer</Text>
              <View style={{ width: 44 }} />
            </View>

            <View style={styles.fullScreenControls}>
              <Pressable style={styles.fullScreenControlButton} onPress={handleZoomOut}>
                <Ionicons name="remove-outline" size={24} color={Colors.white} />
              </Pressable>
              <Pressable style={styles.fullScreenControlButton} onPress={handleZoomIn}>
                <Ionicons name="add-outline" size={24} color={Colors.white} />
              </Pressable>
            </View>

            <View style={styles.fullScreenFooter}>
              <Text style={styles.zoomHint}>Pinch to zoom • Drag to move • Double tap to zoom</Text>
            </View>
          </SafeAreaView>
        </GestureHandlerRootView>
      )}
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  imagePreviewContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  tapHint: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tapHintText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  infoCard: {
    padding: 16,
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
  // Full Screen Styles
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullScreenSafeArea: {
    flex: 1,
  },
  fullScreenHeader: {
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
  fullScreenCloseButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 22,
  },
  fullScreenImageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  fullScreenControls: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  fullScreenControlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
    padding: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenFooter: {
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
  zoomHint: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  fullScreenTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  // Map Section Styles
  mapSection: {
    marginTop: 20,
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.gray[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  mapHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  mapContainer: {
    height: 300,
    width: '100%',
    backgroundColor: Colors.gray[100],
    overflow: 'hidden',
    position: 'relative',
  },
  mapLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  mapLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '500',
  },
  mapWebView: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.gray[50],
    flex: 1,
  },
  mapButtonsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  mapFullscreenButton: {
    position: 'absolute',
    bottom: 60,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#5B7C99',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10,
  },
  mapFullscreenButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  mapOverlayButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  mapOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  mapOverlayText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  coordinatesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: Colors.gray[50],
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  coordinatesText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  // Fullscreen Map Styles
  fullscreenMapContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  fullscreenMapSafeArea: {
    backgroundColor: Colors.white,
  },
  fullscreenMapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  fullscreenMapCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenMapTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  fullscreenMapWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  fullscreenMapWebView: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.gray[50],
  },
  fullscreenMapFooterSafeArea: {
    backgroundColor: Colors.white,
  },
  fullscreenMapFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
    gap: 12,
  },
  fullscreenMapCoordinates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  fullscreenMapCoordinatesText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  fullscreenMapOpenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  fullscreenMapOpenButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  fullscreenMapHint: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 4,
  },
});

