import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/src/constants/colors';
import ProfileMenu from './ProfileMenu';

interface UserHeaderProps {
  userName?: string;
  unreadCount?: number;
  onLogout: () => void;
}

export default function UserHeader({ userName, unreadCount = 0, onLogout }: UserHeaderProps) {
  const router = useRouter();

  // Memoize logo source to prevent re-rendering
  const logoSource = useMemo(() => require('@/assets/images/logo.png'), []);

  return (
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
          style={styles.notificationButton}
          onPress={() => router.push('/(tabs)/notifications')}
        >
          <Ionicons name="notifications" size={24} color={Colors.primary} />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </Pressable>
        <ProfileMenu
          userType="user"
          userName={userName}
          onMyProfile={() => router.push('/(tabs)/profile')}
          onLogout={onLogout}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});
