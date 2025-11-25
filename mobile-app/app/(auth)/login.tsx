import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/src/store/context/AuthContext';
import { getAdmins, adminLogin, adminSignup } from '@/src/services/api/authApi';
import { Colors } from '@/src/constants/colors';
import type { Admin } from '@/src/types/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { login, signup } = useAuth();

  // Mode states
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Form states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');

  // Admin selection
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState('');
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [isLoadingSignup, setIsLoadingSignup] = useState(false);
  const [showAdminPicker, setShowAdminPicker] = useState(false);

  // Fetch admins when switching to signup mode
  useEffect(() => {
    const fetchAdminsList = async () => {
      if (isSignUp && admins.length === 0) {
        setLoadingAdmins(true);
        try {
          const response = await getAdmins();
          if (response.success) {
            setAdmins(response.admins);
          }
        } catch (error) {
          // console.error('Error fetching admins:', error);
          Alert.alert('Error', 'Failed to load admins list');
        } finally {
          setLoadingAdmins(false);
        }
      }
    };
    fetchAdminsList();
  }, [isSignUp]);

  const handleAdminLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    setIsLoadingLogin(true);

    try {
      const response = await adminLogin({ username, password });

      // Store admin data and token
      await AsyncStorage.setItem('adminData', JSON.stringify(response.admin));
      await AsyncStorage.setItem('adminToken', response.token);

      // Navigate to admin dashboard
      router.replace('/(admin)/dashboard' as any);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Please check your credentials and try again.');
    } finally {
      setIsLoadingLogin(false);
    }
  };

  const handleLogin = async () => {
    if (isAdminMode) {
      handleAdminLogin();
      return;
    }

    if (!phoneNumber || !password) {
      Alert.alert('Error', 'Please enter mobile number and password');
      return;
    }

    if (phoneNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoadingLogin(true);

    try {
      await login({ phoneNumber, password });
      Alert.alert('Success', 'Login successful!');
      // Navigate directly to dashboard
      router.replace('/(tabs)');
    } catch (error: any) {
      

      if (error.data?.pendingApproval) {
        Alert.alert(
          'Pending Approval',
          'Your account is pending admin approval. Please wait for confirmation.',
          [{ text: 'OK' }]
        );
      } else if (error.data?.notRegistered) {
        Alert.alert(
          'Not Registered',
          'This mobile number is not registered. Please sign up first.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Login Failed', error.message || 'Please check your credentials and try again.');
      }
    } finally {
      setIsLoadingLogin(false);
    }
  };

  const handleSignup = async () => {
    if (isAdminMode) {
      // Admin signup validation
      if (!username.trim()) {
        Alert.alert('Error', 'Please enter a username');
        return;
      }
      if (!phoneNumber || phoneNumber.length !== 10) {
        Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
        return;
      }
      if (!password || password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters long');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }

      setIsLoadingSignup(true);

      try {
        // Clean phone number to get last 10 digits
        const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
        const last10Digits = cleanPhoneNumber.slice(-10);

        const response = await adminSignup({
          username: username.trim(),
          phoneNumber: last10Digits,
          password,
        });

        Alert.alert(
          'Success',
          response.message || 'Admin registered successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                resetForm();
                setIsSignUp(false);
              },
            },
          ]
        );
      } catch (error: any) {
        Alert.alert('Signup Failed', error?.message || 'Failed to create admin account. Please try again.');
      } finally {
        setIsLoadingSignup(false);
      }
      return;
    }

    // User Validation
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }
    if (phoneNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }
    if (!selectedAdmin) {
      Alert.alert('Error', 'Please select an admin');
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoadingSignup(true);

    try {
      await signup({
        name,
        phoneNumber,
        email: email || undefined,
        password,
        confirmPassword,
        assignedAdmin: selectedAdmin,
      });

      Alert.alert(
        'Success',
        'Account created successfully! Your account is pending admin approval.',
        [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              setIsSignUp(false);
            },
          },
        ]
      );
    } catch (error: any) {

      if (error.data?.pendingApproval || error.data?.alreadySignedUp) {
        Alert.alert(
          'Already Signed Up',
          'You have already signed up. Please wait for admin approval.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Signup Failed', error.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setIsLoadingSignup(false);
    }
  };

  const resetForm = () => {
    setPhoneNumber('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setEmail('');
    setSelectedAdmin('');
    setUsername('');
  };

  const toggleMode = () => {
    resetForm();
    setIsSignUp(!isSignUp);
  };

  const toggleAdminMode = () => {
    resetForm();
    setIsAdminMode(!isAdminMode);
    setIsSignUp(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo/Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/logo.png')}
                style={styles.logo}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.title}>Lords Aqua Hatcheries</Text>
            <Text style={styles.subtitle}>
              {isAdminMode
                ? isSignUp
                  ? 'Admin Registration'
                  : 'Administrator Login'
                : isSignUp
                ? 'Create your account'
                : 'Welcome back'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {isSignUp && !isAdminMode && (
              <View style={styles.inputGroup}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={Colors.textLight}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name *"
                  placeholderTextColor={Colors.textLight}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            {isAdminMode ? (
              <>
                <View style={styles.inputGroup}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={Colors.textLight}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Username *"
                    placeholderTextColor={Colors.textLight}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>
                {isSignUp && (
                  <View style={styles.inputGroup}>
                    <Ionicons
                      name="call-outline"
                      size={20}
                      color={Colors.textLight}
                      style={styles.inputIcon}
                    />
                    <Text style={styles.countryCode}>+91</Text>
                    <TextInput
                      style={[styles.input, styles.phoneInput]}
                      placeholder="Mobile Number *"
                      placeholderTextColor={Colors.textLight}
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>
                )}
              </>
            ) : (
              <View style={styles.inputGroup}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={Colors.textLight}
                  style={styles.inputIcon}
                />
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  style={[styles.input, styles.phoneInput]}
                  placeholder={isSignUp ? 'Mobile Number *' : 'Enter Mobile Number'}
                  placeholderTextColor={Colors.textLight}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            )}

            {isSignUp && !isAdminMode && (
              <View style={styles.inputGroup}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={Colors.textLight}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address (Optional)"
                  placeholderTextColor={Colors.textLight}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            )}

            {isSignUp && !isAdminMode && (
              <View style={styles.inputGroup}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={Colors.textLight}
                  style={styles.inputIcon}
                />
                <Pressable
                  style={styles.dropdownButton}
                  onPress={() => setShowAdminPicker(true)}
                  disabled={loadingAdmins}
                >
                  {loadingAdmins ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Text
                      style={[
                        styles.dropdownText,
                        !selectedAdmin && styles.dropdownPlaceholder,
                      ]}
                    >
                      {selectedAdmin
                        ? admins.find((a) => a._id === selectedAdmin)?.name
                        : 'Select Your Admin *'}
                    </Text>
                  )}
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={Colors.textLight}
                  />
                </Pressable>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={Colors.textLight}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder={isSignUp ? 'Password (min 6 characters) *' : 'Enter Password'}
                placeholderTextColor={Colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={Colors.primary}
                />
              </Pressable>
            </View>

            {isSignUp && isAdminMode && (
              <View style={styles.inputGroup}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={Colors.textLight}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Confirm Password *"
                  placeholderTextColor={Colors.textLight}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <Pressable
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={Colors.primary}
                  />
                </Pressable>
              </View>
            )}

            {/* Submit Button */}
            <Pressable
              style={[
                styles.button,
                (isLoadingLogin || isLoadingSignup) && styles.buttonDisabled,
              ]}
              onPress={isSignUp ? handleSignup : handleLogin}
              disabled={isLoadingLogin || isLoadingSignup}
            >
              {isLoadingLogin || isLoadingSignup ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.buttonText}>
                  {isAdminMode
                    ? isSignUp
                      ? 'Create Admin Account'
                      : 'Admin Login'
                    : isSignUp
                    ? 'Create Account'
                    : 'Login to Dashboard'}
                </Text>
              )}
            </Pressable>

            {/* Toggle Mode */}
            {!isAdminMode && (
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleText}>
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                </Text>
                <Pressable onPress={toggleMode}>
                  <Text style={styles.toggleLink}>
                    {isSignUp ? 'Login here' : 'Sign up now'}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Administrator Toggle - Subtle */}
            <View style={styles.adminToggleContainer}>
              <Text style={styles.adminToggleText}>Administrator?</Text>
              <Pressable onPress={toggleAdminMode}>
                <Text style={styles.adminToggleLink}>
                  {isAdminMode ? 'Back to User Login' : 'Login'}
                </Text>
              </Pressable>
              {!isAdminMode && (
                <>
                  <Text style={styles.adminToggleSeparator}>•</Text>
                  <Pressable
                    onPress={() => {
                      setIsAdminMode(true);
                      setIsSignUp(true);
                      resetForm();
                    }}
                  >
                    <Text style={styles.adminToggleLink}>Sign up</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Admin Picker Modal */}
      <Modal
        visible={showAdminPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdminPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your Admin</Text>
              <Pressable onPress={() => setShowAdminPicker(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>

            <FlatList
              data={admins}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.adminItem,
                    selectedAdmin === item._id && styles.adminItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedAdmin(item._id);
                    setShowAdminPicker(false);
                  }}
                >
                  <View style={styles.adminItemLeft}>
                    <View style={styles.adminAvatar}>
                      <Text style={styles.adminAvatarText}>
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.adminName}>{item.name}</Text>
                  </View>
                  {selectedAdmin === item._id && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                  )}
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={styles.emptyText}>No admins available</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  countryCode: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  phoneInput: {
    paddingLeft: 0,
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  pickerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: Colors.text,
  },
  pickerPlaceholder: {
    color: Colors.textLight,
  },
  dropdownButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  dropdownPlaceholder: {
    color: Colors.textLight,
  },
  button: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 4,
  },
  toggleText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  toggleLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  adminToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 6,
  },
  adminToggleText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  adminToggleLink: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  adminToggleSeparator: {
    fontSize: 12,
    color: Colors.textLight,
    marginHorizontal: 4,
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
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  adminItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  adminItemSelected: {
    backgroundColor: Colors.inputBg,
  },
  adminItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  adminName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyList: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
  },
});
