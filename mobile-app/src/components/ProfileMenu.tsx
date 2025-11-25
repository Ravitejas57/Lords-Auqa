import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';

interface ProfileMenuProps {
  userType: 'admin' | 'user';
  userName?: string;
  onMyProfile: () => void;
  onLogout: () => void;
}

export default function ProfileMenu({
  userType,
  userName,
  onMyProfile,
  onLogout,
}: ProfileMenuProps) {
  const [menuVisible, setMenuVisible] = useState(false);

  const handleMenuPress = (action: () => void) => {
    setMenuVisible(false);
    // Small delay to allow menu animation to finish
    setTimeout(action, 100);
  };

  return (
    <View>
      {/* Profile Button */}
      <Pressable
        style={styles.profileButton}
        onPress={() => setMenuVisible(true)}
      >
        <View style={styles.profileAvatar}>
          <Ionicons name="person" size={20} color={Colors.white} />
        </View>
      </Pressable>

      {/* Dropdown Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            {/* User Info Header */}
            <View style={styles.menuHeader}>
              <View style={styles.menuAvatar}>
                <Ionicons name="person" size={24} color={Colors.primary} />
              </View>
              {userName && (
                <View style={styles.menuUserInfo}>
                  <Text style={styles.menuUserName}>{userName}</Text>
                  <Text style={styles.menuUserType}>
                    {userType === 'admin' ? 'Administrator' : 'User'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.menuDivider} />

            {/* Menu Items */}
            <View style={styles.menuItems}>
              <Pressable
                style={styles.menuItem}
                onPress={() => handleMenuPress(onMyProfile)}
              >
                <View style={[styles.menuIcon, styles.menuIconProfile]}>
                  <Ionicons name="person-outline" size={18} color="#3b82f6" />
                </View>
                <Text style={styles.menuItemText}>My Profile</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
              </Pressable>

              <View style={styles.menuDivider} />

              <Pressable
                style={styles.menuItem}
                onPress={() => handleMenuPress(onLogout)}
              >
                <View style={[styles.menuIcon, styles.menuIconLogout]}>
                  <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                </View>
                <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
                <Ionicons name="chevron-forward" size={16} color="#ef4444" />
              </Pressable>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  profileButton: {
    padding: 4,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 12,
  },
  menuContainer: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    minWidth: 240,
    maxWidth: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.gray[50],
  },
  menuAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  menuUserInfo: {
    marginLeft: 12,
    flex: 1,
  },
  menuUserName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  menuUserType: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  menuItems: {
    padding: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 6,
    marginBottom: 2,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  menuIconProfile: {
    backgroundColor: '#dbeafe',
  },
  menuIconLogout: {
    backgroundColor: '#fee2e2',
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  logoutText: {
    color: '#ef4444',
  },
});
