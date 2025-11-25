import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/store/context/AuthContext';
import { Colors } from '@/src/constants/colors';
import { API_BASE_URL } from '@/src/constants/api';
import type { User } from '@/src/types/auth';

interface Message {
  sender: 'user' | 'admin';
  senderName?: string;
  message: string;
  timestamp: string;
}

interface Conversation {
  _id: string;
  subject: string;
  status: 'open' | 'closed';
  messages: Message[];
  adminId?: {
    _id: string;
    name: string;
    phoneNumber: string;
    email: string;
  };
  updatedAt: string;
}

interface Admin {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
}

export default function HelpScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [userData, setUserData] = useState<User | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  });

  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    await Promise.all([
      fetchUserData(),
      fetchAdmins(),
    ]);
    setLoading(false);
  };

  const fetchUserData = async () => {
    try {
      if (!user?.phoneNumber) return;

      const response = await fetch(`${API_BASE_URL}/user/phone/${user.phoneNumber}`);
      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);

        // Fetch conversations after we have user data
        if (data.user?._id) {
          fetchConversations(data.user._id);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/Auth/admins`);
      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins || []);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const fetchConversations = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user-help/conversations/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchConversationById = async (conversationId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user-help/conversation/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedConversation(data.conversation);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  const handleContactSubmit = async () => {
    if (!contactForm.message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    const assignedAdminId = userData?.assignedAdmin;
    if (!assignedAdminId) {
      Alert.alert('Error', "You don't have an assigned admin. Please contact support.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/user-help/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData._id,
          subject: contactForm.subject || 'General Inquiry',
          message: contactForm.message,
          adminId: assignedAdminId,
        }),
      });

      if (response.ok) {
        const assignedAdmin = getAssignedAdmin();
        Alert.alert(
          'Success',
          `Your message has been sent to ${assignedAdmin?.name || 'your admin'}. We'll respond within 24 hours.`
        );
        setShowContactModal(false);
        setContactForm({ subject: '', message: '' });
        if (userData?._id) {
          fetchConversations(userData._id);
        }
      } else {
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const handleReplySubmit = async () => {
    if (!replyMessage.trim() || !selectedConversation) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/user-help/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData?._id,
          conversationId: selectedConversation._id,
          message: replyMessage,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedConversation(data.conversation);
        setReplyMessage('');
        if (userData?._id) {
          fetchConversations(userData._id);
        }
      } else {
        Alert.alert('Error', 'Failed to send reply. Please try again.');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      Alert.alert('Error', 'Failed to send reply. Please try again.');
    }
  };

  const getAssignedAdmin = (): Admin | null => {
    if (!userData?.assignedAdmin) return null;

    const assignedAdminId = userData.assignedAdmin;
    const foundAdmin = admins.find(
      (admin) => admin._id === assignedAdminId || admin._id === assignedAdminId.toString()
    );

    return foundAdmin || null;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const assignedAdmin = getAssignedAdmin();

  const faqs = [
    {
      id: 1,
      question: 'How do I upload images for my hatchery?',
      answer:
        "In the 'Hatchery' tab, tap on any of the 4 image slots. Your device camera will open automatically for you to capture live images. For authenticity, only camera capture is enabled. Each hatchery requires 4 progress images with location data.",
    },
    {
      id: 2,
      question: 'How do I update my profile?',
      answer:
        "Go to 'Profile' tab and tap the 'Edit Profile' button. You can update your name, email, location details, and seeds information. Tap 'Change Photo' to update your profile picture using the camera.",
    },
    {
      id: 3,
      question: 'Why are my images captured with location data?',
      answer:
        'Location data is automatically captured with hatchery images to verify the authenticity and geographic origin of your hatchery operations. This helps maintain data integrity and provides valuable insights for reporting and analytics.',
    },
    {
      id: 4,
      question: 'How can I contact the admin for help?',
      answer:
        "Tap on 'Help' in the bottom navigation, then tap 'Send Message to Admin'. Fill in the subject and message fields, and submit your query. You'll receive responses directly in the conversation thread.",
    },
    {
      id: 5,
      question: 'Can I delete hatchery images?',
      answer:
        'Yes, tap on any uploaded image and then tap the delete (trash) icon. Once deleted, you can upload a new image in that slot using your camera. Note: Images cannot be deleted after the deletion timer expires to maintain data integrity.',
    },
  ];

  const policies = [
    {
      id: 1,
      title: 'Privacy Policy',
      icon: 'shield-checkmark-outline',
      content: `Last updated: October 2025

1. Information Collection
We collect information you provide directly to us, including your phone number, hatchery details, and uploaded images.

2. Use of Information
Your information is used to:
- Manage your hatchery operations
- Generate reports and analytics
- Provide customer support
- Improve our services

3. Data Security
We implement appropriate security measures to protect your personal information from unauthorized access, alteration, or disclosure.

4. Data Sharing
We do not sell or share your personal information with third parties except as required by law or with your explicit consent.

5. Your Rights
You have the right to access, update, or delete your personal information at any time through your account settings.`,
    },
    {
      id: 2,
      title: 'Terms of Service',
      icon: 'book-outline',
      content: `Last updated: October 2025

1. Acceptance of Terms
By accessing Lords Aqua Hatcheries platform, you agree to these Terms of Service.

2. User Responsibilities
- Provide accurate information
- Maintain confidentiality of your account
- Upload only authentic hatchery images
- Comply with local aquaculture regulations

3. Service Usage
- Use the platform for legitimate hatchery management only
- Do not misuse or attempt to breach security
- Report any issues or bugs to admin support

4. Image Upload Guidelines
- Upload clear, relevant hatchery images
- Images must be from your own hatcheries
- Maximum 4 images per hatchery
- Supported formats: JPG, PNG, JPEG

5. Account Termination
We reserve the right to suspend or terminate accounts that violate these terms.`,
    },
    {
      id: 3,
      title: 'Data Usage Policy',
      icon: 'server-outline',
      content: `Last updated: October 2025

1. Data Collection
We collect:
- Phone number for authentication
- Hatchery details (name, dates, location)
- Uploaded images
- Report data and analytics

2. Data Storage
- All data is stored securely on encrypted servers
- Images are stored with restricted access
- Backup performed regularly

3. Data Retention
- Active account data is retained indefinitely
- Deleted data is removed within 30 days
- You can request data deletion at any time

4. Analytics
We use anonymized data to improve our services and generate insights without identifying individual users.`,
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading help center...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header with Back Button */}
        <View style={styles.headerContainer}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
          <View style={styles.header}>
            <Text style={styles.title}>Help & Support</Text>
            <Text style={styles.subtitle}>Get assistance and learn more about our platform</Text>
          </View>
        </View>

        {/* My Conversations */}
        {conversations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="chatbubbles-outline" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>My Conversations</Text>
            </View>

            {conversations.map((conv) => (
              <Pressable
                key={conv._id}
                style={styles.conversationCard}
                onPress={() => fetchConversationById(conv._id)}
              >
                <View style={styles.conversationHeader}>
                  <Text style={styles.conversationSubject}>{conv.subject}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      conv.status === 'open' ? styles.statusOpen : styles.statusClosed,
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {conv.status === 'open' ? 'Open' : 'Closed'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.conversationAdmin}>
                  With: {conv.adminId?.name || 'Admin'}
                </Text>
                <Text style={styles.conversationMeta}>
                  {conv.messages?.length || 0} messages
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* FAQ Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          </View>

          {faqs.map((faq) => (
            <View key={faq.id} style={styles.faqItem}>
              <Pressable
                style={styles.faqQuestion}
                onPress={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
              >
                <Text style={styles.faqQuestionText}>{faq.question}</Text>
                <Ionicons
                  name={expandedFaq === faq.id ? 'chevron-down' : 'chevron-forward'}
                  size={20}
                  color={Colors.textLight}
                />
              </Pressable>
              {expandedFaq === faq.id && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Contact Support */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="mail-outline" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Contact Admin Support</Text>
          </View>

          <View style={styles.contactCard}>
            <Text style={styles.contactDescription}>
              Need help? Your assigned admin support team is here to assist you with any questions
              or issues.
            </Text>

            {assignedAdmin && (
              <View style={styles.adminInfo}>
                <Text style={styles.adminBadge}>Your Assigned Admin</Text>
                <View style={styles.adminDetails}>
                  <Ionicons name="person" size={16} color={Colors.textLight} />
                  <Text style={styles.adminText}>{assignedAdmin.name}</Text>
                </View>
                <View style={styles.adminDetails}>
                  <Ionicons name="mail" size={16} color={Colors.textLight} />
                  <Text style={styles.adminText}>{assignedAdmin.email}</Text>
                </View>
                <View style={styles.adminDetails}>
                  <Ionicons name="call" size={16} color={Colors.textLight} />
                  <Text style={styles.adminText}>{assignedAdmin.phoneNumber}</Text>
                </View>
              </View>
            )}

            <View style={styles.supportHours}>
              <Ionicons name="time-outline" size={16} color={Colors.textLight} />
              <Text style={styles.supportHoursText}>Mon - Sat: 9:00 AM - 6:00 PM</Text>
            </View>

            <Pressable style={styles.sendButton} onPress={() => setShowContactModal(true)}>
              <Ionicons name="send" size={20} color={Colors.white} />
              <Text style={styles.sendButtonText}>Send Message to Admin</Text>
            </Pressable>
          </View>
        </View>

        {/* Policies Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Policies</Text>
          </View>

          {policies.map((policy) => (
            <Pressable
              key={policy.id}
              style={styles.policyCard}
              onPress={() => setSelectedPolicy(policy)}
            >
              <View style={styles.policyIcon}>
                <Ionicons name={policy.icon as any} size={24} color={Colors.primary} />
              </View>
              <View style={styles.policyContent}>
                <Text style={styles.policyTitle}>{policy.title}</Text>
                <Text style={styles.policySubtitle}>Tap to read more</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Contact Modal */}
      <Modal visible={showContactModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contact Admin Support</Text>
              <Pressable onPress={() => setShowContactModal(false)}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {assignedAdmin && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Sending message to your assigned admin:</Text>
                  <View style={styles.adminPreview}>
                    <Text style={styles.adminPreviewName}>{assignedAdmin.name}</Text>
                    <Text style={styles.adminPreviewPhone}>{assignedAdmin.phoneNumber}</Text>
                  </View>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Subject <Text style={styles.optionalText}>(optional)</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="What do you need help with?"
                  placeholderTextColor={Colors.textLight}
                  value={contactForm.subject}
                  onChangeText={(value) => setContactForm({ ...contactForm, subject: value })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Message</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Describe your issue or question in detail..."
                  placeholderTextColor={Colors.textLight}
                  value={contactForm.message}
                  onChangeText={(value) => setContactForm({ ...contactForm, message: value })}
                  multiline
                  numberOfLines={6}
                />
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowContactModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleContactSubmit}
                >
                  <Ionicons name="send" size={18} color={Colors.white} />
                  <Text style={styles.submitButtonText}>Send Message</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Policy Modal */}
      <Modal visible={!!selectedPolicy} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedPolicy?.title}</Text>
              <Pressable onPress={() => setSelectedPolicy(null)}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.policyText}>{selectedPolicy?.content}</Text>

              <Pressable
                style={[styles.modalButton, styles.submitButton, { marginTop: 20 }]}
                onPress={() => setSelectedPolicy(null)}
              >
                <Text style={styles.submitButtonText}>Close</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Conversation Thread Modal */}
      <Modal visible={!!selectedConversation} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedConversation?.subject}</Text>
                <Text style={styles.modalSubtitle}>
                  with {selectedConversation?.adminId?.name || 'Admin'}
                </Text>
              </View>
              <Pressable onPress={() => setSelectedConversation(null)}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.messageThread}>
                {selectedConversation?.messages?.map((msg, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.messageBubble,
                      msg.sender === 'user' ? styles.userMessage : styles.adminMessage,
                    ]}
                  >
                    <View style={styles.messageHeader}>
                      <Text style={styles.messageSender}>
                        {msg.sender === 'user' ? 'You' : msg.senderName || 'Admin'}
                      </Text>
                      <Text style={styles.messageTime}>
                        {new Date(msg.timestamp).toLocaleString()}
                      </Text>
                    </View>
                    <Text style={styles.messageText}>{msg.message}</Text>
                  </View>
                ))}
              </View>

              {selectedConversation?.status === 'open' && (
                <View style={styles.replySection}>
                  <Text style={styles.formLabel}>Reply to this conversation</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="Type your reply..."
                    placeholderTextColor={Colors.textLight}
                    value={replyMessage}
                    onChangeText={setReplyMessage}
                    multiline
                    numberOfLines={4}
                  />
                  <View style={styles.modalActions}>
                    <Pressable
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => setSelectedConversation(null)}
                    >
                      <Text style={styles.cancelButtonText}>Close</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.modalButton, styles.submitButton]}
                      onPress={handleReplySubmit}
                    >
                      <Ionicons name="send" size={18} color={Colors.white} />
                      <Text style={styles.submitButtonText}>Send Reply</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {selectedConversation?.status === 'closed' && (
                <View style={styles.closedBanner}>
                  <Text style={styles.closedText}>
                    This conversation has been closed by the admin.
                  </Text>
                </View>
              )}
            </ScrollView>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textLight,
  },
  headerContainer: {
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    marginBottom: 8,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  conversationCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  conversationSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOpen: {
    backgroundColor: '#d1fae5',
  },
  statusClosed: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  conversationAdmin: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  conversationMeta: {
    fontSize: 12,
    color: Colors.textLight,
  },
  faqItem: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  faqAnswer: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: Colors.gray[50],
  },
  faqAnswerText: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contactDescription: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 16,
    lineHeight: 20,
  },
  adminInfo: {
    backgroundColor: Colors.gray[50],
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  adminBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  adminDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  adminText: {
    fontSize: 14,
    color: Colors.text,
  },
  supportHours: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  supportHoursText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  sendButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  policyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  policyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  policyContent: {
    flex: 1,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  policySubtitle: {
    fontSize: 12,
    color: Colors.textLight,
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
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 2,
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  optionalText: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '400',
  },
  textInput: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  adminPreview: {
    backgroundColor: Colors.gray[100],
    padding: 12,
    borderRadius: 8,
  },
  adminPreviewName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  adminPreviewPhone: {
    fontSize: 14,
    color: Colors.textLight,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  cancelButton: {
    backgroundColor: Colors.gray[100],
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  policyText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  messageThread: {
    marginBottom: 20,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#e3f2fd',
    alignSelf: 'flex-start',
  },
  adminMessage: {
    backgroundColor: Colors.gray[100],
    alignSelf: 'flex-end',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  messageTime: {
    fontSize: 10,
    color: Colors.textLight,
  },
  messageText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  replySection: {
    marginTop: 20,
  },
  closedBanner: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  closedText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
});
