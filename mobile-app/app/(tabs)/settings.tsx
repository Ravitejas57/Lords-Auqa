import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/store/context/AuthContext';
import { Colors } from '@/src/constants/colors';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
              // Error alert is already shown in AuthContext
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>App preferences and information</Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarSmallText}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'User Name'}</Text>
            <Text style={styles.userPhone}>{user?.phoneNumber || 'Phone'}</Text>
          </View>
        </View>

        {/* Need Help Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Need Help?</Text>

          <Pressable
            style={styles.settingItem}
            onPress={() => router.push('/help')}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Ionicons name="help-circle-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.settingLabel}>Help & Support</Text>
            </View>
            <View style={styles.settingRight}>
              <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
            </View>
          </Pressable>
        </View>

        {/* App Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>

          <Pressable
            style={styles.settingItem}
            onPress={() => Alert.alert('Lords Aqua Hatcheries', 'Version 1.0.0\n\nHatchery Management System')}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.settingLabel}>About</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>Version 1.0.0</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
            </View>
          </Pressable>
        </View>

        {/* Logout Button */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={Colors.white} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        {/* App Version */}
        <Text style={styles.versionText}>
          Lords Aqua Hatcheries v1.0.0
        </Text>
      </ScrollView>
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
    fontFamily: 'Nunito_400Regular',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: 'Nunito_400Regular',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarSmall: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarSmallText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: 'Nunito_400Regular',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
    fontFamily: 'Nunito_400Regular',
  },
  userPhone: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: 'Nunito_400Regular',
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
    fontFamily: 'Nunito_400Regular',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'Nunito_400Regular',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: 'Nunito_400Regular',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  logoutText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: 'Nunito_400Regular',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 24,
    fontFamily: 'Nunito_400Regular',
  },
});
