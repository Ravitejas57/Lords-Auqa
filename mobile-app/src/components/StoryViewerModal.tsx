import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  Pressable,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { Colors } from '@/src/constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Story {
  _id: string;
  message: string;
  files: Array<{
    url: string;
    fileType: string;
  }>;
  createdAt: string;
  expiresAt: string;
  read: boolean;
}

interface StoryViewerModalProps {
  visible: boolean;
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
  onStoryViewed: (storyId: string) => void;
}

export default function StoryViewerModal({
  visible,
  stories,
  initialIndex,
  onClose,
  onStoryViewed,
}: StoryViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<Video>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const currentStory = stories[currentIndex];
  const currentFile = currentStory?.files[currentFileIndex];
  const isVideo = currentFile?.fileType?.includes('video');
  const totalFiles = currentStory?.files?.length || 0;

  useEffect(() => {
    if (visible && currentStory) {
      setCurrentFileIndex(0);
      setProgress(0);
      markAsViewed(currentStory._id);
      startProgress();
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentIndex, visible]);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, visible]);

  const startProgress = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    setProgress(0);
    const duration = isVideo ? 15000 : 5000; // 15s for videos, 5s for images
    const interval = 50;
    const increment = (interval / duration) * 100;

    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + increment;
      });
    }, interval);
  };

  const markAsViewed = (storyId: string) => {
    if (!currentStory.read) {
      onStoryViewed(storyId);
    }
  };

  const handleNext = () => {
    // Check if there are more files in the current story
    if (currentFileIndex < totalFiles - 1) {
      setCurrentFileIndex(currentFileIndex + 1);
      startProgress();
    } else if (currentIndex < stories.length - 1) {
      // Move to next story
      setCurrentIndex(currentIndex + 1);
      setCurrentFileIndex(0);
    } else {
      // End of stories
      onClose();
    }
  };

  const handlePrevious = () => {
    // Check if we're not on the first file of the current story
    if (currentFileIndex > 0) {
      setCurrentFileIndex(currentFileIndex - 1);
      startProgress();
    } else if (currentIndex > 0) {
      // Move to previous story
      setCurrentIndex(currentIndex - 1);
      setCurrentFileIndex(0);
    }
  };

  const handleTap = (x: number) => {
    const tapZone = SCREEN_WIDTH / 3;
    if (x < tapZone) {
      handlePrevious();
    } else if (x > SCREEN_WIDTH - tapZone) {
      handleNext();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    return date.toLocaleDateString();
  };

  if (!currentStory || !currentFile) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Progress bars */}
        <View style={styles.progressContainer}>
          {currentStory.files.map((_, index) => (
            <View key={index} style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width:
                      index < currentFileIndex
                        ? '100%'
                        : index === currentFileIndex
                        ? `${progress}%`
                        : '0%',
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.adminAvatar}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.white} />
            </View>
            <View>
              <Text style={styles.adminName}>Admin</Text>
              <Text style={styles.timeAgo}>{formatTime(currentStory.createdAt)}</Text>
            </View>
          </View>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color={Colors.white} />
          </Pressable>
        </View>

        {/* Story content */}
        <Pressable
          style={styles.contentContainer}
          onPress={(e) => handleTap(e.nativeEvent.locationX)}
        >
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.white} />
            </View>
          )}

          {isVideo ? (
            <Video
              ref={videoRef}
              source={{ uri: currentFile.url }}
              style={styles.media}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              isLooping={false}
              onLoad={() => setLoading(false)}
              onError={(error) => {
                console.error('Video error:', error);
                setLoading(false);
              }}
            />
          ) : (
            <Image
              source={{ uri: currentFile.url }}
              style={styles.media}
              resizeMode="contain"
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
            />
          )}
        </Pressable>

        {/* Message */}
        {currentStory.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>{currentStory.message}</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 4,
  },
  progressBarBackground: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 1.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  timeAgo: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  media: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  messageContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  messageText: {
    fontSize: 16,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 22,
  },
});
