import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';

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

interface StoriesProps {
  stories: Story[];
  onStoryPress: (storyIndex: number) => void;
  isAdmin?: boolean;
  onDeleteStory?: (storyId: string) => void;
  sectionTitle?: string;
}

export default function Stories({ stories, onStoryPress, isAdmin = false, onDeleteStory, sectionTitle = "Admin's Recent Updates" }: StoriesProps) {
  if (!stories || stories.length === 0) {
    return null;
  }

  const calculateTimeLeft = (expiresAt: string) => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours}h left`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{sectionTitle}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesContainer}
      >
        {stories.map((story, index) => {
          const thumbnail = story.files[0]?.url;
          const isVideo = story.files[0]?.fileType?.includes('video');
          const timeLeft = calculateTimeLeft(story.expiresAt);

          const handleDelete = (e: any) => {
            e.stopPropagation();
            Alert.alert(
              'Delete Story',
              'Are you sure you want to delete this story? It will be removed for all users.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => onDeleteStory?.(story._id),
                },
              ]
            );
          };

          return (
            <View key={story._id} style={styles.storyWrapper}>
              <Pressable
                style={styles.storyPressable}
                onPress={() => onStoryPress(index)}
              >
                <View style={[
                  styles.storyRing,
                  story.read && styles.storyRingViewed
                ]}>
                  <View style={styles.storyCircle}>
                    {thumbnail ? (
                      isVideo ? (
                        <View style={styles.videoThumbnailContainer}>
                          <View style={styles.videoPlaceholder}>
                            <Ionicons name="videocam" size={32} color={Colors.white} />
                          </View>
                          <View style={styles.videoPlayOverlay}>
                            <Ionicons name="play-circle" size={32} color={Colors.white} />
                          </View>
                        </View>
                      ) : (
                        <Image
                          source={{ uri: thumbnail }}
                          style={styles.storyImage}
                          resizeMode="cover"
                        />
                      )
                    ) : (
                      <View style={styles.placeholderImage}>
                        <Ionicons name="image" size={32} color={Colors.textLight} />
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.timeLeft} numberOfLines={1}>
                  {timeLeft}
                </Text>
              </Pressable>
              {isAdmin && onDeleteStory && (
                <Pressable
                  style={styles.deleteButton}
                  onPress={handleDelete}
                >
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </Pressable>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  storiesContainer: {
    paddingHorizontal: 12,
    gap: 12,
  },
  storyWrapper: {
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  storyPressable: {
    alignItems: 'center',
    gap: 6,
  },
  deleteButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  storyRing: {
    padding: 3,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  storyRingViewed: {
    borderColor: Colors.gray[300],
  },
  storyCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    backgroundColor: Colors.gray[100],
    borderWidth: 3,
    borderColor: Colors.white,
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray[100],
  },
  videoThumbnailContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  videoPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  timeLeft: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textLight,
    maxWidth: 76,
    textAlign: 'center',
  },
});
