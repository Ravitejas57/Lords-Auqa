import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  Pressable,
  ScrollView,
  useWindowDimensions,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { WebView } from 'react-native-webview';
import { Colors } from '@/src/constants/colors';

interface AdminImageViewerModalProps {
  visible: boolean;
  imageUrl: string | null;
  seller: any;
  onClose: () => void;
  onFeedbackSubmit?: () => void;
}

export default function AdminImageViewerModal({
  visible,
  imageUrl,
  seller,
  onClose,
  onFeedbackSubmit,
}: AdminImageViewerModalProps) {
  const [fullScreenMode, setFullScreenMode] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapFullscreen, setMapFullscreen] = useState(false);
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

  // Feedback states
  const [feedbackType, setFeedbackType] = useState<'approve' | 'decline'>('approve');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Find the image object from seller's images array
  const currentImage = seller?.images?.find((img: any) => img.url === imageUrl);

  // Check if feedback already exists
  const existingFeedback = currentImage?.adminFeedback;
  const hasExistingFeedback = existingFeedback && existingFeedback.action;

  const getStatusInfo = () => {
    if (!currentImage) return null;
    if (currentImage.status === 'approved' || currentImage.adminFeedback?.action === 'approve') {
      return { color: '#10b981', icon: 'checkmark-circle', text: 'Approved' };
    } else if (currentImage.status === 'rejected' || currentImage.adminFeedback?.action === 'decline') {
      return { color: '#ef4444', icon: 'close-circle', text: 'Rejected' };
    }
    return null;
  };

  const statusInfo = getStatusInfo();

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

  const handleClose = () => {
    handleCloseFullScreen();
    setFeedbackMessage('');
    setFeedbackType('approve');
    onClose();
  };

  const addQuickResponse = (response: string) => {
    setFeedbackMessage((prev) => {
      if (!prev) return response;
      const existing = prev.split(',').map((r) => r.trim()).filter(r => r.length > 0);
      if (existing.includes(response)) {
        // Toggle off - remove this response
        const filtered = existing.filter((r) => r !== response);
        return filtered.join(', ');
      }
      // Add this response
      return [...existing, response].join(', ');
    });
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim() && feedbackType === 'decline') {
      Alert.alert('Error', 'Please provide a reason for declining');
      return;
    }

    try {
      setSubmitting(true);

      const finalMessage = feedbackMessage.trim() ||
        `Image ${feedbackType === 'approve' ? 'approved' : 'declined'}`;

      const response = await submitImageFeedback({
        imageUrl: imageUrl || '',
        userId: seller.userId || seller._id,
        feedbackMessage: finalMessage,
        action: feedbackType,
      });

      if (response.success) {
        Alert.alert(
          'Success',
          `Image ${feedbackType === 'approve' ? 'approved' : 'declined'} successfully!`,
          [
            {
              text: 'OK',
              onPress: () => {
                handleClose();
                onFeedbackSubmit?.();
              },
            },
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to submit feedback');
      }
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', error.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
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

  if (!imageUrl) return null;

  // Full-screen zoom mode
  if (fullScreenMode) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseFullScreen}
      >
        <GestureHandlerRootView style={styles.fullScreenContainer}>
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
        </GestureHandlerRootView>
      </Modal>
    );
  }

  // Main full-screen modal
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      {mapFullscreen && currentImage?.location ? (
        <GestureHandlerRootView style={styles.fullscreenMapContainer}>
          <SafeAreaView style={styles.fullscreenMapSafeArea} edges={['top']}>
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
        </GestureHandlerRootView>
      ) : (
        <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleClose}>
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
              resizeMode="contain"
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
              </View>
              <View style={styles.coordinatesBox}>
                <Ionicons name="navigate" size={16} color={Colors.textLight} />
                <Text style={styles.coordinatesText}>
                  Latitude: {currentImage.location.latitude.toFixed(6)} | Longitude: {currentImage.location.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          )}

          {/* Feedback Section */}
          <View style={styles.feedbackCard}>
            {hasExistingFeedback ? (
              // Show existing feedback
              <>
                <View style={styles.feedbackHeader}>
                  <Ionicons name="checkmark-done" size={24} color={Colors.primary} />
                  <Text style={styles.feedbackHeaderTitle}>Feedback Submitted</Text>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: statusInfo?.color }]}>
                  <Ionicons name={statusInfo?.icon as any} size={20} color={Colors.white} />
                  <Text style={styles.statusText}>{statusInfo?.text}</Text>
                </View>

                {existingFeedback.message && (
                  <View style={styles.feedbackBox}>
                    <Text style={styles.feedbackLabel}>Message:</Text>
                    <Text style={styles.feedbackMessage}>{existingFeedback.message}</Text>
                  </View>
                )}

                {existingFeedback.reviewedByName && (
                  <Text style={styles.reviewedBy}>
                    Reviewed by: {existingFeedback.reviewedByName}
                  </Text>
                )}
                {existingFeedback.reviewedAt && (
                  <Text style={styles.reviewedAt}>
                    {new Date(existingFeedback.reviewedAt).toLocaleString()}
                  </Text>
                )}
              </>
            ) : (
              // Show feedback form
              <>
                <View style={styles.feedbackHeader}>
                  <Ionicons name="chatbox" size={24} color={Colors.primary} />
                  <Text style={styles.feedbackHeaderTitle}>Provide Feedback</Text>
                </View>

                {/* Approve/Decline Buttons */}
                <View style={styles.feedbackTypeSelector}>
                  <Pressable
                    style={[
                      styles.feedbackTypeButton,
                      styles.approveButton,
                      feedbackType === 'approve' && { backgroundColor: '#10b981' },
                    ]}
                    onPress={() => {
                      setFeedbackType('approve');
                      setFeedbackMessage(''); // Clear message when switching
                    }}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={feedbackType === 'approve' ? Colors.white : '#10b981'}
                    />
                    <Text
                      style={[
                        styles.feedbackTypeButtonText,
                        feedbackType === 'approve' && styles.feedbackTypeButtonTextActive,
                      ]}
                    >
                      Approve
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.feedbackTypeButton,
                      styles.declineButton,
                      feedbackType === 'decline' && { backgroundColor: '#ef4444' },
                    ]}
                    onPress={() => {
                      setFeedbackType('decline');
                      setFeedbackMessage(''); // Clear message when switching
                    }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={feedbackType === 'decline' ? Colors.white : '#ef4444'}
                    />
                    <Text
                      style={[
                        styles.feedbackTypeButtonText,
                        feedbackType === 'decline' && styles.feedbackTypeButtonTextActive,
                      ]}
                    >
                      Decline
                    </Text>
                  </Pressable>
                </View>

                {/* Feedback Message Input */}
                <View style={styles.feedbackInputSection}>
                  <Text style={styles.inputLabel}>Comment / Reason</Text>
                  <TextInput
                    style={styles.feedbackInput}
                    placeholder={
                      feedbackType === 'approve'
                        ? 'Add positive feedback or suggestions...'
                        : 'Explain the reason for declining...'
                    }
                    placeholderTextColor={Colors.textLight}
                    value={feedbackMessage}
                    onChangeText={setFeedbackMessage}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                {/* Quick Responses */}
                <View style={styles.quickResponsesSection}>
                  <Text style={styles.quickResponsesLabel}>Quick Responses:</Text>
                  <View style={styles.quickResponsesGrid}>
                    {feedbackType === 'approve'
                      ? ['Good quality', 'Clear images', 'Well documented', 'Approved for processing', 'Meets requirements'].map(
                          (response) => (
                            <Pressable
                              key={response}
                              style={[
                                styles.quickResponseChip,
                                feedbackMessage.includes(response) && styles.quickResponseChipActive,
                              ]}
                              onPress={() => addQuickResponse(response)}
                            >
                              <Text
                                style={[
                                  styles.quickResponseChipText,
                                  feedbackMessage.includes(response) && styles.quickResponseChipTextActive,
                                ]}
                              >
                                {response}
                              </Text>
                            </Pressable>
                          )
                        )
                      : ['Poor lighting', 'Out of focus', 'Wrong angle', 'Incomplete view', 'Date mismatch', 'Image unclear', 'Resubmit required'].map(
                          (reason) => (
                            <Pressable
                              key={reason}
                              style={[
                                styles.quickResponseChip,
                                feedbackMessage.includes(reason) && styles.quickResponseChipActive,
                              ]}
                              onPress={() => addQuickResponse(reason)}
                            >
                              <Text
                                style={[
                                  styles.quickResponseChipText,
                                  feedbackMessage.includes(reason) && styles.quickResponseChipTextActive,
                                ]}
                              >
                                {reason}
                              </Text>
                            </Pressable>
                          )
                        )}
                  </View>
                </View>

                {/* Submit Button */}
                <Pressable
                  style={[
                    styles.submitButton,
                    feedbackType === 'approve' ? styles.submitButtonApprove : styles.submitButtonDecline,
                    submitting && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmitFeedback}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons
                        name={feedbackType === 'approve' ? 'checkmark-circle' : 'close-circle'}
                        size={20}
                        color={Colors.white}
                      />
                      <Text style={styles.submitButtonText}>
                        {feedbackType === 'approve' ? 'Approve & Submit' : 'Decline & Submit'}
                      </Text>
                    </>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
      )}
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
    padding: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
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
  feedbackCard: {
    padding: 20,
    backgroundColor: Colors.white,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  feedbackHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  feedbackBox: {
    backgroundColor: Colors.gray[50],
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textLight,
    marginBottom: 8,
  },
  feedbackMessage: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  reviewedBy: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 4,
  },
  reviewedAt: {
    fontSize: 12,
    color: Colors.textLight,
  },
  feedbackTypeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  feedbackTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  approveButton: {
    borderColor: '#10b981',
    backgroundColor: 'transparent',
  },
  declineButton: {
    borderColor: '#ef4444',
    backgroundColor: 'transparent',
  },
  feedbackTypeButtonActive: {
    // Background color is set dynamically in the component
  },
  feedbackTypeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  feedbackTypeButtonTextActive: {
    color: Colors.white,
  },
  feedbackInputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  feedbackInput: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    minHeight: 100,
  },
  quickResponsesSection: {
    marginBottom: 24,
  },
  quickResponsesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  quickResponsesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickResponseChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.gray[100],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickResponseChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickResponseChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  quickResponseChipTextActive: {
    color: Colors.white,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 8,
  },
  submitButtonApprove: {
    backgroundColor: '#10b981',
  },
  submitButtonDecline: {
    backgroundColor: '#ef4444',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  // Full Screen Styles
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullScreenHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fullScreenCloseButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
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
  fullScreenFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
  },
  zoomHint: {
    color: Colors.white,
    fontSize: 14,
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
