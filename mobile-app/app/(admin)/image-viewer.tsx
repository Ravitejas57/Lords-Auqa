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
  TextInput,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/src/constants/colors';
import ProfileMenu from '@/src/components/ProfileMenu';

export default function AdminImageViewerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [fullScreenMode, setFullScreenMode] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [seller, setSeller] = useState<any>(null);
  const [adminData, setAdminData] = useState<any>(null);
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
    // Parse params
    if (params.imageUrl) {
      setImageUrl(params.imageUrl as string);
    }
    if (params.sellerData) {
      try {
        const sellerData = JSON.parse(params.sellerData as string);
        setSeller(sellerData);
      } catch (error) {
        console.error('Error parsing seller data:', error);
        Alert.alert('Error', 'Invalid seller data');
        router.back();
      }
    }
  }, [params.imageUrl, params.sellerData]);

  useEffect(() => {
    // Load admin data only once on mount
    const loadAdminData = async () => {
      if (loadingProfileRef.current) {
        return;
      }
      
      if (adminData) {
        return;
      }
      
      try {
        loadingProfileRef.current = true;
        const storedAdminData = await AsyncStorage.getItem('adminData');
        if (storedAdminData) {
          const parsed = JSON.parse(storedAdminData);
          setAdminData(parsed);
        }
      } catch (error) {
        console.error('Error loading admin data:', error);
      } finally {
        loadingProfileRef.current = false;
      }
    };

    loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Find the image object from seller's images array
  const currentImage = seller?.images?.find((img: any) => img.url === imageUrl);

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

  const handleBack = () => {
    router.back();
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

  // Gestures (must be at top level for Rules of Hooks)
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

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

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

  // Logo source
  const logoSource = require('@/assets/images/logo.png');

  if (!imageUrl || !seller) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Full-screen zoom mode
  if (fullScreenMode) {
    return (
      <GestureHandlerRootView style={styles.fullScreenContainer}>
        <SafeAreaView style={styles.fullScreenContainer} edges={['top']}>
          {/* Admin Header */}
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
                onPress={() => router.push('/(admin)/notifications')}
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

          <View style={styles.fullScreenHeader}>
            <Pressable style={styles.fullScreenCloseButton} onPress={handleCloseFullScreen}>
              <Ionicons name="close" size={32} color={Colors.white} />
            </Pressable>
          </View>

          <GestureDetector gesture={composedGesture}>
            <Animated.View style={[styles.fullScreenImageWrapper, animatedStyle]}>
              <Image
                source={{ uri: imageUrl }}
                style={[styles.fullScreenImage, { width, height }]}
                resizeMode="contain"
              />
            </Animated.View>
          </GestureDetector>

          <View style={styles.fullScreenFooter}>
            <Text style={styles.zoomHint}>Pinch to zoom • Drag to move</Text>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  // Fullscreen map view
  if (mapFullscreen && currentImage?.location) {
    return (
      <GestureHandlerRootView style={styles.fullscreenMapContainer}>
        <SafeAreaView style={styles.fullscreenMapSafeArea} edges={['top']}>
          {/* Admin Header */}
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
                onPress={() => router.push('/(admin)/notifications')}
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

          <GestureDetector gesture={mapComposedGesture}>
            <Animated.View style={[styles.fullscreenMapWrapper, mapAnimatedStyle]}>
              <WebView
                style={styles.fullscreenMapWebView}
                source={{
                  uri: `https://www.openstreetmap.org/export/embed.html?bbox=${currentImage.location.longitude - 0.01},${currentImage.location.latitude - 0.01},${currentImage.location.longitude + 0.01},${currentImage.location.latitude + 0.01}&layer=mapnik&marker=${currentImage.location.latitude},${currentImage.location.longitude}`,
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
                  {currentImage.location.latitude.toFixed(6)}, {currentImage.location.longitude.toFixed(6)}
                </Text>
              </View>
              <Pressable
                style={styles.fullscreenMapOpenButton}
                onPress={() => {
                  if (!currentImage.location) return;
                  const lat = currentImage.location.latitude;
                  const lng = currentImage.location.longitude;

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
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  // Main screen view
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Admin Header */}
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
            onPress={() => router.push('/(admin)/notifications')}
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

      {/* Back Button */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Image Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Preview - Tappable */}
        <Pressable onPress={handleImagePress} style={styles.imagePreviewContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.imagePreview}
            resizeMode="cover"
          />
          <View style={styles.tapHint}>
            <Ionicons name="expand" size={20} color={Colors.white} />
            <Text style={styles.tapHintText}>Tap to zoom</Text>
          </View>
        </Pressable>

        {/* Seller Information */}
        <View style={styles.infoCard}>
          <View style={styles.sellerInfo}>
            <Ionicons name="person" size={20} color={Colors.primary} />
            <Text style={styles.sellerName}>{seller?.name || 'Unknown Seller'}</Text>
          </View>
          <View style={styles.sellerContactRow}>
            <Ionicons name="call" size={16} color={Colors.textLight} />
            <Text style={styles.sellerContact}>{seller?.phoneNumber || 'N/A'}</Text>
          </View>
        </View>

        {/* Image Information */}
        <View style={styles.infoCard}>
          {currentImage?.uploadedAt && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={Colors.textLight} />
              <Text style={styles.infoLabel}>Uploaded:</Text>
              <Text style={styles.infoValue}>
                {new Date(currentImage.uploadedAt).toLocaleString()}
              </Text>
            </View>
          )}

          {currentImage?.location && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={Colors.textLight} />
              <Text style={styles.infoLabel}>Location:</Text>
              <Text style={styles.infoValue}>
                {currentImage.location.latitude.toFixed(6)}, {currentImage.location.longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </View>

        {/* Location Info Section with Map */}
        {currentImage?.location && (
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
                  uri: `https://www.openstreetmap.org/export/embed.html?bbox=${currentImage.location.longitude - 0.01},${currentImage.location.latitude - 0.01},${currentImage.location.longitude + 0.01},${currentImage.location.latitude + 0.01}&layer=mapnik&marker=${currentImage.location.latitude},${currentImage.location.longitude}`,
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
                    console.log('Fullscreen button pressed, currentImage:', currentImage?.location);
                    console.log('Setting mapFullscreen to true');
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
                  if (!currentImage.location) return;
                  const lat = currentImage.location.latitude;
                  const lng = currentImage.location.longitude;

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
              <View style={styles.coordinatesBox}>
                <Ionicons name="navigate" size={16} color={Colors.textLight} />
                <Text style={styles.coordinatesText}>
                  Latitude: {currentImage.location.latitude.toFixed(6)} | Longitude: {currentImage.location.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          </View>
        )}
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
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textLight,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationBellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
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
    flexGrow: 1,
    paddingBottom: 40,
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
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tapHintText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  sellerContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 32,
  },
  sellerContact: {
    fontSize: 14,
    color: Colors.textLight,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textLight,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  mapSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    overflow: 'hidden',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    width: '100%',
    height: 300,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.gray[50],
    position: 'relative',
  },
  mapLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    zIndex: 1,
  },
  mapLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textLight,
  },
  mapWebView: {
    width: '100%',
    height: '100%',
  },
  mapButtonsContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: 2,
  },
  mapFullscreenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  mapFullscreenButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  mapOverlayButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 2,
  },
  mapOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  mapOverlayText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  coordinatesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
  },
  coordinatesText: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    flex: 1,
  },
  // Fullscreen image styles
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullScreenHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  fullScreenCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenImageWrapper: {
    width: '100%',
    height: '100%',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  fullScreenFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  zoomHint: {
    color: Colors.white,
    fontSize: 14,
    textAlign: 'center',
  },
  // Fullscreen map styles
  fullscreenMapContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  fullscreenMapSafeArea: {
    flex: 1,
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

