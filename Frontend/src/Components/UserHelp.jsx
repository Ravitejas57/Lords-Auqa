import React, { useState, useEffect } from "react";
import {
  FiHelpCircle,
  FiChevronRight,
  FiMessageCircle,
  FiMail,
  FiPhone,
  FiClock,
  FiSend,
  FiBook,
  FiShield,
  FiDatabase,
  FiX,
  FiUser,
  FiRefreshCw
} from "react-icons/fi";
import { io } from "socket.io-client";

const UserHelp = () => {
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
    adminId: ""
  });
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [userData, setUserData] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [socket, setSocket] = useState(null);

  // Fetch user data and admins on component mount
  useEffect(() => {
    fetchUserData();
    fetchAdmins();
  }, []);

  // Socket.IO setup for real-time updates
  useEffect(() => {
    if (!userData) return;

    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    // Join user's room
    newSocket.emit('joinUser', userData._id);

    // Listen for admin replies
    newSocket.on('admin-reply', (data) => {
      console.log('Admin replied:', data);

      // Update the conversation in state
      setConversations(prev =>
        prev.map(conv =>
          conv._id === data.conversationId
            ? { ...conv, updatedAt: data.timestamp }
            : conv
        )
      );

      // If viewing this conversation, reload it
      if (selectedConversation && selectedConversation._id === data.conversationId) {
        fetchConversationById(data.conversationId);
      }

      // Show notification
      alert(`New reply from ${data.adminName}: ${data.message}`);

      // Refresh conversations list
      fetchConversations();
    });

    // Listen for conversation closed events
    newSocket.on('conversation-closed', (data) => {
      console.log('Conversation closed:', data);
      fetchConversations();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [userData, selectedConversation]);

  // Fetch conversations when user data is available
  useEffect(() => {
    if (userData) {
      fetchConversations();
    }
  }, [userData]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const userId = localStorage.getItem('userId') || localStorage.getItem('userMongoId');

      if (!token) {
        console.log('No token found');
        return;
      }

      // Use the /me endpoint to get the authenticated user's profile
      const response = await fetch(`http://localhost:3000/api/user/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('User profile data:', data);

        // The response has { success: true, profile: {...} }
        const user = data.profile || data.user || data;
        setUserData(user);

        // Set the assigned admin as default
        if (user.assignedAdmin) {
          const adminId = user.assignedAdmin._id || user.assignedAdmin;
          console.log('Assigned admin ID:', adminId);
          setContactForm(prev => ({
            ...prev,
            adminId: adminId
          }));
        } else {
          console.warn('No assigned admin found for user. User data:', user);
        }
      } else {
        console.error('Failed to fetch user profile:', response.status);
        const errorData = await response.json();
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/adminActions/getAllAdmins');

      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins || []);
      } else {
        // Fallback to mock data if API fails
        const mockAdmins = [
          {
            _id: "admin1",
            name: "Admin Support",
            email: "support@lordsaqua.com",
            phoneNumber: "+91 98765 43210"
          }
        ];
        setAdmins(mockAdmins);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      if (!userData || !userData._id) return;

      const response = await fetch(`http://localhost:3000/api/user-help/conversations/${userData._id}`);

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchConversationById = async (conversationId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/user-help/conversation/${conversationId}`);

      if (response.ok) {
        const data = await response.json();
        setSelectedConversation(data.conversation);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  const handleContactSubmit = async () => {
    if (!contactForm.message) {
      alert("Please enter a message!");
      return;
    }

    // Get the assigned admin ID
    const assignedAdminId = userData?.assignedAdmin?._id || userData?.assignedAdmin;

    if (!assignedAdminId) {
      alert("You don't have an assigned admin. Please contact support.");
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/user-help/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userData._id,
          subject: contactForm.subject || 'General Inquiry', // Default subject if not provided
          message: contactForm.message,
          adminId: assignedAdminId
        })
      });

      if (response.ok) {
        const currentAdmin = getAssignedAdmin();
        alert(`Your message has been sent to ${currentAdmin?.name || 'your admin'}. We'll respond within 24 hours.`);
        setShowContactModal(false);
        setContactForm({
          subject: "",
          message: "",
          adminId: assignedAdminId
        });

        // Refresh conversations list
        fetchConversations();
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert("Failed to send message. Please try again.");
    }
  };

  const handleReplySubmit = async () => {
    if (!replyMessage.trim() || !selectedConversation) {
      alert("Please enter a message!");
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/user-help/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userData._id,
          conversationId: selectedConversation._id,
          message: replyMessage
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedConversation(data.conversation);
        setReplyMessage("");

        // Refresh conversations list
        fetchConversations();
      } else {
        alert("Failed to send reply. Please try again.");
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert("Failed to send reply. Please try again.");
    }
  };

  // Get current assigned admin details
  const getAssignedAdmin = () => {
    if (!userData?.assignedAdmin) return null;

    // Handle both ObjectId and populated object
    const assignedAdminId = userData.assignedAdmin._id || userData.assignedAdmin;

    // Try to find in admins list
    const foundAdmin = admins.find(admin => admin._id === assignedAdminId || admin._id === assignedAdminId.toString());

    // If found in list, return it
    if (foundAdmin) return foundAdmin;

    // If assignedAdmin is already populated (has a name property), return it
    if (userData.assignedAdmin.name) {
      return userData.assignedAdmin;
    }

    return null;
  };

  const assignedAdmin = getAssignedAdmin();

  const faqs = [
    {
      id: 1,
      question: "How do I upload images for my hatchery?",
      answer:
        "In the 'My Hatchery' section, find your hatchery card and click on any of the 4 image slots. Your device camera will open automatically for you to capture live images. For authenticity, only camera capture is enabled - gallery uploads are not available. Each hatchery requires 4 progress images with location data."
    },
    {
      id: 2,
      question: "How do I update my profile picture?",
      answer:
        "Go to 'Settings' and click on 'Take Photo' or 'Change Photo' button. Your device camera will open to capture a new profile picture. Only camera capture is available to ensure authentic profile photos. Maximum file size: 5MB."
    },
    {
      id: 3,
      question: "Why are my images captured with location data?",
      answer:
        "Location data is automatically captured with hatchery images to verify the authenticity and geographic origin of your hatchery operations. This helps maintain data integrity and provides valuable insights for reporting and analytics."
    },
    {
      id: 4,
      question: "How can I contact the admin for help?",
      answer:
        "Click on 'Help' in the sidebar, then select 'Contact Admin'. Fill in the subject and message fields, choose your assigned admin (if applicable), and submit your query. You'll receive responses directly in the conversation thread. You can track unread messages via the badge on the Help icon."
    },
    {
      id: 5,
      question: "How do I view my hatchery images and location data?",
      answer:
        "In 'My Hatchery', click on any uploaded image to view it in full screen. You can see the upload date, time, and exact GPS coordinates on an interactive map. Use the fullscreen toggle to expand the map for detailed location viewing."
    },
    {
      id: 6,
      question: "Can I delete hatchery images?",
      answer:
        "Yes, click on any uploaded image and then click the delete (trash) icon. You'll be asked to confirm before deletion. Once deleted, you can upload a new image in that slot using your camera. Note: Images cannot be deleted after the deletion timer expires to maintain data integrity."
    },
    {
      id: 7,
      question: "What information can the admin see about my profile?",
      answer:
        "Admins can view your complete profile including name, contact details, address, profile picture, seeds information (available, sold, active batches), and hatchery details. They can also reset your password if needed. Your profile is displayed in a secure, organized format."
    }
  ];

  const policies = [
    {
      id: 1,
      title: "Privacy Policy",
      icon: <FiShield />,
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
You have the right to access, update, or delete your personal information at any time through your account settings.`
    },
    {
      id: 2,
      title: "Terms of Service",
      icon: <FiBook />,
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
We reserve the right to suspend or terminate accounts that violate these terms.

6. Limitation of Liability
Lords Aqua Hatcheries is not liable for any indirect or consequential damages arising from platform use.`
    },
    {
      id: 3,
      title: "Data Usage Policy",
      icon: <FiDatabase />,
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

4. Data Export
- You can download all your data anytime
- Exported data includes hatcheries, reports, and images
- Data is provided in standard formats (PDF, Excel)

5. Analytics
We use anonymized data to improve our services and generate insights without identifying individual users.`
    }
  ];

  return (
    <div className="help-section">
      <h2 className="section-title">Help & Support</h2>
      <p className="section-subtitle">Get assistance and learn more about our platform</p>

      {/* My Conversations Section */}
      {conversations.length > 0 && (
        <div className="help-category">
          <div className="category-header">
            <FiMessageCircle className="category-icon" />
            <h3 className="category-title">My Conversations</h3>
            <button
              className="btn-refresh"
              onClick={fetchConversations}
              style={{ marginLeft: 'auto', padding: '5px 10px', fontSize: '12px' }}
            >
              <FiRefreshCw /> Refresh
            </button>
          </div>

          <div className="conversations-list">
            {conversations.map(conv => (
              <div
                key={conv._id}
                className="conversation-card"
                onClick={() => fetchConversationById(conv._id)}
                style={{ cursor: 'pointer', marginBottom: '10px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0' }}>{conv.subject}</h4>
                    <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                      With: {conv.adminId?.name || 'Admin'}
                    </p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
                      {conv.messages?.length || 0} messages • {conv.status === 'open' ? '🟢 Open' : '🔴 Closed'}
                    </p>
                  </div>
                  <button
                    className="btn-secondary"
                    style={{ padding: '5px 15px' }}
                  >
                    View Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="help-category">
        <div className="category-header">
          <FiHelpCircle className="category-icon" />
          <h3 className="category-title">Frequently Asked Questions</h3>
        </div>

        <div className="faq-list">
          {faqs.map((faq) => (
            <div key={faq.id} className="faq-item">
              <button
                aria-expanded={expandedFaq === faq.id}
                className={`faq-question ${expandedFaq === faq.id ? "active" : ""}`}
                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
              >
                <span>{faq.question}</span>
                <FiChevronRight className={`faq-icon ${expandedFaq === faq.id ? "rotated" : ""}`} />
              </button>
              {expandedFaq === faq.id && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="help-category">
        <div className="category-header">
          <FiMessageCircle className="category-icon" />
          <h3 className="category-title">Contact Admin Support</h3>
        </div>

        <div className="help-card">
          <div className="contact-info">
            <p className="contact-description">
              Need help? Your assigned admin support team is here to assist you with any questions or issues.
            </p>
            
            {assignedAdmin && (
              <div className="assigned-admin-info">
                <div className="admin-badge">
                  <FiUser className="admin-icon" />
                  <span>Your Assigned Admin</span>
                </div>
                <div className="contact-details">
                  <div className="contact-item">
                    <FiUser className="contact-icon" />
                    <div>
                      <div className="contact-label">Admin Name</div>
                      <div className="contact-value">{assignedAdmin.name}</div>
                    </div>
                  </div>
                  <div className="contact-item">
                    <FiMail className="contact-icon" />
                    <div>
                      <div className="contact-label">Email</div>
                      <div className="contact-value">{assignedAdmin.email}</div>
                    </div>
                  </div>
                  <div className="contact-item">
                    <FiPhone className="contact-icon" />
                    <div>
                      <div className="contact-label">Phone</div>
                      <div className="contact-value">{assignedAdmin.phoneNumber}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="contact-details">
              <div className="contact-item">
                <FiClock className="contact-icon" />
                <div>
                  <div className="contact-label">Support Hours</div>
                  <div className="contact-value">Mon - Sat: 9:00 AM - 6:00 PM</div>
                </div>
              </div>
            </div>
            
            <button className="btn-primary" onClick={() => setShowContactModal(true)}>
              <FiSend /> Send Message to Admin
            </button>
          </div>
        </div>
      </div>

      {/* Policies Section */}
      <div className="help-category">
        <div className="category-header">
          <FiBook className="category-icon" />
          <h3 className="category-title">Policies</h3>
        </div>

        <div className="policies-grid">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="policy-card"
              role="button"
              tabIndex={0}
              onClick={() => setSelectedPolicy(policy)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setSelectedPolicy(policy);
              }}
            >
              <div className="policy-icon">{policy.icon}</div>
              <h4 className="policy-title">{policy.title}</h4>
              <p className="policy-description">Click to read more</p>
              <FiChevronRight className="policy-arrow" />
            </div>
          ))}
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Contact Admin Support</h3>
              <button aria-label="Close" className="modal-close" onClick={() => setShowContactModal(false)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              {/* Show assigned admin info */}
              {assignedAdmin && (
                <div className="form-group">
                  <label>Sending message to your assigned admin:</label>
                  <div style={{
                    padding: '10px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '4px',
                    marginBottom: '15px'
                  }}>
                    <strong>{assignedAdmin.name}</strong><br/>
                    <small>{assignedAdmin.phoneNumber}</small>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Subject <span style={{ color: '#999', fontSize: '12px' }}>(optional)</span></label>
                <input
                  type="text"
                  placeholder="What do you need help with? (e.g., Image Upload Issue)"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                />
              </div>
              
              <div className="form-group">
                <label>Message</label>
                <textarea
                  rows="6"
                  placeholder="Describe your issue or question in detail..."
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                />
              </div>
              
              <div className="form-actions">
                <button className="btn-secondary" onClick={() => setShowContactModal(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleContactSubmit}>
                  <FiSend /> Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Policy Modal */}
      {selectedPolicy && (
        <div className="modal-overlay" onClick={() => setSelectedPolicy(null)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedPolicy.title}</h3>
              <button aria-label="Close" className="modal-close" onClick={() => setSelectedPolicy(null)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="policy-content">
                <pre>{selectedPolicy.content}</pre>
              </div>
              <div className="form-actions">
                <button className="btn-primary" onClick={() => setSelectedPolicy(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversation Thread Modal */}
      {selectedConversation && (
        <div className="modal-overlay" onClick={() => setSelectedConversation(null)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{selectedConversation.subject}</h3>
                <small style={{ color: '#666' }}>
                  Conversation with {selectedConversation.adminId?.name || 'Admin'}
                </small>
              </div>
              <button aria-label="Close" className="modal-close" onClick={() => setSelectedConversation(null)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              {/* Message Thread */}
              <div className="message-thread" style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
                {selectedConversation.messages && selectedConversation.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`message-bubble ${msg.sender}`}
                    style={{
                      marginBottom: '15px',
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: msg.sender === 'user' ? '#e3f2fd' : '#f5f5f5',
                      marginLeft: msg.sender === 'user' ? '0' : 'auto',
                      marginRight: msg.sender === 'user' ? 'auto' : '0',
                      maxWidth: '80%'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <strong style={{ fontSize: '14px' }}>
                        {msg.sender === 'user' ? '👤 You' : '👨‍💼 ' + msg.senderName}
                      </strong>
                      <small style={{ color: '#999', fontSize: '12px' }}>
                        {new Date(msg.timestamp).toLocaleString()}
                      </small>
                    </div>
                    <p style={{ margin: '0', fontSize: '14px', lineHeight: '1.5' }}>{msg.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply Input */}
              {selectedConversation.status === 'open' && (
                <div className="reply-section">
                  <div className="form-group">
                    <label>Reply to this conversation</label>
                    <textarea
                      rows="4"
                      placeholder="Type your reply..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                  <div className="form-actions">
                    <button className="btn-secondary" onClick={() => setSelectedConversation(null)}>
                      Close
                    </button>
                    <button className="btn-primary" onClick={handleReplySubmit}>
                      <FiSend /> Send Reply
                    </button>
                  </div>
                </div>
              )}

              {selectedConversation.status === 'closed' && (
                <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', textAlign: 'center' }}>
                  <p style={{ margin: '0', color: '#856404' }}>
                    ⚠️ This conversation has been closed by the admin.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserHelp;