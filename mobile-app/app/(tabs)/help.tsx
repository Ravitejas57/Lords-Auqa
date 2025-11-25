import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/store/context/AuthContext';
import { Colors } from '@/src/constants/colors';
import { getUserProfile } from '@/src/services/api/authApi';
import UserHeader from '@/src/components/UserHeader';
import { getNotificationCount } from '@/src/services/api/userNotificationApi';
import {
  sendHelpMessage,
  getUserConversations,
  getConversationById,
  replyToConversation,
} from '@/src/services/api/userHelpApi';

export default function HelpScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAllConversations, setShowAllConversations] = useState(false);

  // Form states
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (!user?.phoneNumber) return;

      const response = await getUserProfile(user.phoneNumber);
      if (response.success) {
        setUserProfile(response.user);
        await loadConversations(response.user);
        await loadNotificationCount(response.user);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationCount = async (profile: any) => {
    try {
      const userId = profile?.mongoId || profile?._id || profile?.id;
      if (!userId) return;

      const response = await getNotificationCount(userId);
      if (response.success) {
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  };

  const loadConversations = async (profile: any) => {
    try {
      const userId = profile?.mongoId || profile?._id || profile?.id;
      if (!userId) return;

      const response = await getUserConversations(userId);
      if (response.conversations) {
        setConversations(response.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    const assignedAdminId = userProfile?.assignedAdmin?._id || userProfile?.assignedAdmin;
    if (!assignedAdminId) {
      Alert.alert('Error', "You don't have an assigned admin");
      return;
    }

    try {
      const userId = userProfile?.mongoId || userProfile?._id || userProfile?.id;
      const response = await sendHelpMessage({
        userId,
        subject: subject || 'General Inquiry',
        message,
        adminId: assignedAdminId,
      });

      if (response) {
        Alert.alert('Success', 'Your message has been sent to your admin');
        setShowMessageModal(false);
        setSubject('');
        setMessage('');
        await loadConversations(userProfile);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send message');
    }
  };

  const handleViewConversation = async (conv: any) => {
    try {
      const response = await getConversationById(conv._id);
      if (response.conversation) {
        setSelectedConversation(response.conversation);
        setShowConversationModal(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load conversation');
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      Alert.alert('Error', 'Please enter a reply');
      return;
    }

    try {
      const userId = userProfile?.mongoId || userProfile?._id || userProfile?.id;
      const response = await replyToConversation({
        userId,
        conversationId: selectedConversation._id,
        message: replyMessage,
      });

      if (response.conversation) {
        setSelectedConversation(response.conversation);
        setReplyMessage('');
        await loadConversations(userProfile);
        Alert.alert('Success', 'Reply sent successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send reply');
    }
  };

  const getAssignedAdmin = () => {
    if (!userProfile?.assignedAdmin) return null;
    if (userProfile.assignedAdmin.name) {
      return userProfile.assignedAdmin;
    }
    return null;
  };

  const assignedAdmin = getAssignedAdmin();

  const faqs = [
    {
      id: 1,
      question: 'How do I upload images for my hatchery?',
      answer: 'In the "My Hatchery" section, find your hatchery card and click on any of the 4 image slots. Your device camera will open automatically for you to capture live images.',
    },
    {
      id: 2,
      question: 'How do I update my profile picture?',
      answer: 'Go to "Settings" and click on "Take Photo" or "Change Photo" button. Your device camera will open to capture a new profile picture.',
    },
    {
      id: 3,
      question: 'Why are my images captured with location data?',
      answer: 'Location data is automatically captured with hatchery images to verify the authenticity and geographic origin of your hatchery operations.',
    },
    {
      id: 4,
      question: 'How can I contact the admin for help?',
      answer: 'Click on "Send Message to Admin" button below. Fill in the subject and message fields, and submit your query. You\'ll receive responses in your conversations.',
    },
    {
      id: 5,
      question: 'How do I view my hatchery images?',
      answer: 'In "My Hatchery", click on any uploaded image to view it in full screen. You can see the upload date, time, and exact GPS coordinates.',
    },
  ];

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <UserHeader
          userName={userProfile?.name || user?.name}
          unreadCount={unreadCount}
          onLogout={handleLogout}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <UserHeader
        userName={userProfile?.name || user?.name}
        unreadCount={unreadCount}
        onLogout={handleLogout}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Help & Support</Text>
          <Text style={styles.subtitle}>Get assistance and learn more</Text>
        </View>

        {/* My Conversations */}
        {conversations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Conversations</Text>
            {(() => {
              // Display conversations: show latest only or all conversations
              const displayConversations = showAllConversations
                ? conversations
                : conversations.slice(0, 1);

              return (
                <>
                  {displayConversations.map((conv) => (
                    <Pressable
                      key={conv._id}
                      style={styles.conversationCard}
                      onPress={() => handleViewConversation(conv)}
                    >
                      <View style={styles.conversationHeader}>
                        <Ionicons name="chatbubbles" size={20} color={Colors.primary} />
                        <Text style={styles.conversationSubject}>{conv.subject}</Text>
                      </View>
                      <Text style={styles.conversationAdmin}>
                        With: {conv.adminId?.name || 'Admin'}
                      </Text>
                      <View style={styles.conversationFooter}>
                        <Text style={styles.conversationMeta}>
                          {conv.messages?.length || 0} messages
                        </Text>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: conv.status === 'open' ? '#10b981' : '#ef4444' },
                          ]}
                        >
                          <Text style={styles.statusText}>
                            {conv.status === 'open' ? 'Open' : 'Closed'}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                  {conversations.length > 1 && (
                    <Pressable
                      style={styles.viewAllButton}
                      onPress={() => setShowAllConversations(!showAllConversations)}
                    >
                      <Text style={styles.viewAllButtonText}>
                        {showAllConversations
                          ? 'Show Latest Only'
                          : `View All Conversations (${conversations.length})`}
                      </Text>
                      <Ionicons
                        name={showAllConversations ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={Colors.primary}
                      />
                    </Pressable>
                  )}
                </>
              );
            })()}
          </View>
        )}

        {/* Contact Admin Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Admin Support</Text>
          <View style={styles.adminCard}>
            {assignedAdmin ? (
              <>
                <View style={styles.adminBadge}>
                  <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
                  <Text style={styles.adminBadgeText}>Your Assigned Admin</Text>
                </View>
                <View style={styles.adminInfo}>
                  <View style={styles.adminRow}>
                    <Ionicons name="person" size={18} color={Colors.text} />
                    <Text style={styles.adminName}>{assignedAdmin.name}</Text>
                  </View>
                  {assignedAdmin.email && (
                    <View style={styles.adminRow}>
                      <Ionicons name="mail" size={18} color={Colors.text} />
                      <Text style={styles.adminDetail}>{assignedAdmin.email}</Text>
                    </View>
                  )}
                  {assignedAdmin.phoneNumber && (
                    <View style={styles.adminRow}>
                      <Ionicons name="call" size={18} color={Colors.text} />
                      <Text style={styles.adminDetail}>{assignedAdmin.phoneNumber}</Text>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <Text style={styles.noAdminText}>No admin assigned</Text>
            )}

            <Pressable style={styles.primaryButton} onPress={() => setShowMessageModal(true)}>
              <Ionicons name="send" size={20} color={Colors.white} />
              <Text style={styles.primaryButtonText}>Send Message to Admin</Text>
            </Pressable>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqs.map((faq) => (
            <Pressable
              key={faq.id}
              style={styles.faqCard}
              onPress={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons
                  name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.textLight}
                />
              </View>
              {expandedFaq === faq.id && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
            </Pressable>
          ))}
        </View>

        {/* Support Hours */}
        <View style={styles.section}>
          <View style={styles.hoursCard}>
            <Ionicons name="time" size={24} color={Colors.primary} />
            <View style={styles.hoursInfo}>
              <Text style={styles.hoursLabel}>Support Hours</Text>
              <Text style={styles.hoursValue}>Mon - Sat: 9:00 AM - 6:00 PM</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Send Message Modal */}
      <Modal visible={showMessageModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Send Message to Admin</Text>
                <Pressable onPress={() => setShowMessageModal(false)}>
                  <Ionicons name="close" size={24} color={Colors.text} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.modalBody}
                keyboardShouldPersistTaps="handled"
              >
              {assignedAdmin && (
                <View style={styles.adminPreview}>
                  <Text style={styles.adminPreviewLabel}>Sending to:</Text>
                  <Text style={styles.adminPreviewName}>{assignedAdmin.name}</Text>
                </View>
              )}

              <Text style={styles.inputLabel}>
                Subject <Text style={styles.optional}>(optional)</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Image Upload Issue"
                value={subject}
                onChangeText={setSubject}
                placeholderTextColor={Colors.textLight}
              />

              <Text style={styles.inputLabel}>Message</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe your issue or question..."
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholderTextColor={Colors.textLight}
              />

              <View style={styles.modalActions}>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => setShowMessageModal(false)}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.primaryButton} onPress={handleSendMessage}>
                  <Ionicons name="send" size={18} color={Colors.white} />
                  <Text style={styles.primaryButtonText}>Send</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Conversation Modal */}
      <Modal visible={showConversationModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
              <View style={{flex: 1}}>
                <Text style={styles.modalTitle}>{selectedConversation?.subject}</Text>
                <Text style={styles.modalSubtitle}>
                  With {selectedConversation?.adminId?.name || 'Admin'}
                </Text>
              </View>
              <Pressable onPress={() => setShowConversationModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Messages */}
              <View style={styles.messagesContainer}>
                {selectedConversation?.messages?.map((msg: any, idx: number) => (
                  <View
                    key={idx}
                    style={[
                      styles.messageBubble,
                      msg.sender === 'user' ? styles.userMessage : styles.adminMessage,
                    ]}
                  >
                    <Text style={styles.messageSender}>
                      {msg.sender === 'user' ? 'You' : msg.senderName}
                    </Text>
                    <Text style={styles.messageText}>{msg.message}</Text>
                    <Text style={styles.messageTime}>
                      {new Date(msg.timestamp).toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Reply Section */}
              {selectedConversation?.status === 'open' ? (
                <View style={styles.replySection}>
                  <Text style={styles.inputLabel}>Send Reply</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="Type your reply..."
                    value={replyMessage}
                    onChangeText={setReplyMessage}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    placeholderTextColor={Colors.textLight}
                  />
                  <View style={styles.modalActions}>
                    <Pressable
                      style={styles.secondaryButton}
                      onPress={() => setShowConversationModal(false)}
                    >
                      <Text style={styles.secondaryButtonText}>Close</Text>
                    </Pressable>
                    <Pressable style={styles.primaryButton} onPress={handleSendReply}>
                      <Ionicons name="send" size={18} color={Colors.white} />
                      <Text style={styles.primaryButtonText}>Send Reply</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={styles.closedBanner}>
                  <Ionicons name="lock-closed" size={20} color="#856404" />
                  <Text style={styles.closedText}>
                    This conversation has been closed by the admin
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textLight,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  conversationCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  conversationSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  conversationAdmin: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationMeta: {
    fontSize: 12,
    color: Colors.textLight,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  adminCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  adminInfo: {
    marginBottom: 16,
  },
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  adminName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  adminDetail: {
    fontSize: 14,
    color: Colors.textLight,
  },
  noAdminText: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.inputBg,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  faqCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  faqAnswer: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  hoursCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  hoursInfo: {
    flex: 1,
  },
  hoursLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 2,
  },
  hoursValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
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
    maxHeight: '90%',
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
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  modalBody: {
    padding: 20,
  },
  adminPreview: {
    backgroundColor: Colors.inputBg,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  adminPreviewLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 4,
  },
  adminPreviewName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  optional: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textLight,
  },
  textInput: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  messagesContainer: {
    marginBottom: 20,
  },
  messageBubble: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#e3f2fd',
    alignSelf: 'flex-end',
  },
  adminMessage: {
    backgroundColor: Colors.inputBg,
    alignSelf: 'flex-start',
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 10,
    color: Colors.textLight,
  },
  replySection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 20,
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
  },
  closedText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginTop: 12,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});
