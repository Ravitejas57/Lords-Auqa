import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import {
  FiMessageCircle,
  FiHelpCircle,
  FiRefreshCw,
  FiSend,
  FiX,
  FiChevronRight
} from "react-icons/fi";
import "../CSS/AdminHelp.css";

const AdminHelp = () => {
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState("");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [userConversations, setUserConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [socket, setSocket] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      id: 1,
      question: "How do I manage user approvals?",
      answer: "Go to 'Pending Users' section to view all pending approval requests. Click 'Approve' to accept or 'Reject' to decline with a reason."
    },
    {
      id: 2,
      question: "How do I send notifications to users?",
      answer: "Navigate to 'Send Announcements' section. Choose target audience (all users or specific users), set priority, type your message, and click send."
    },
    {
      id: 3,
      question: "How do I view user uploaded images?",
      answer: "Go to 'Approved Users' section, click on any user to see their hatcheries, and click on images to view them in fullscreen with location data."
    },
    {
      id: 4,
      question: "How do I respond to user help requests?",
      answer: "Check this 'User Help Requests' section. Click on any conversation to view the message thread and reply to the user."
    },
    {
      id: 5,
      question: "How do I add a new user manually?",
      answer: "Go to 'Add User' section, fill in the user details including name, phone number, password, and optional seed count, then submit."
    }
  ];

  // Helper function to get admin ID from localStorage
  const getAdminId = () => {
    // Try multiple possible storage keys
    const adminData = localStorage.getItem('adminData');
    if (adminData) {
      try {
        const parsed = JSON.parse(adminData);
        return parsed.id || parsed._id || parsed.adminId;
      } catch (e) {
        console.error('Error parsing adminData:', e);
      }
    }
    return localStorage.getItem('adminId') || localStorage.getItem('admin_id');
  };

  // Fetch admin data and conversations on component mount
  useEffect(() => {
    const adminId = getAdminId();
    console.log('Admin ID for fetching conversations:', adminId);
    if (adminId) {
      fetchUserConversations(adminId);
    } else {
      console.warn('No admin ID found in localStorage');
    }
  }, []);

  // Socket.IO setup for real-time updates
  useEffect(() => {
    const adminId = getAdminId();
    if (!adminId) return;

    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    // Join admin's room
    newSocket.emit('joinUser', adminId);
    console.log('Admin joined socket room:', adminId);

    // Listen for new help messages from users
    newSocket.on('new-help-message', (data) => {
      console.log('New help message received:', data);
      alert(`New help request from ${data.userName}: ${data.subject}`);

      // Refresh conversations
      fetchUserConversations(adminId);
    });

    // Listen for user replies
    newSocket.on('user-reply', (data) => {
      console.log('User replied:', data);

      // If viewing this conversation, reload it
      if (selectedConversation && selectedConversation._id === data.conversationId) {
        fetchConversationById(data.conversationId);
      }

      // Refresh conversations list
      fetchUserConversations(adminId);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [selectedConversation]);

  const fetchUserConversations = async (adminId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/user-help/admin/${adminId}`);

      if (response.ok) {
        const data = await response.json();
        setUserConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching user conversations:', error);
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

  const handleAdminReply = async () => {
    if (!replyText.trim() || !selectedConversation) {
      alert("Please enter a reply message!");
      return;
    }

    try {
      const adminId = getAdminId();
      const response = await fetch('http://localhost:3000/api/user-help/admin/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminId,
          conversationId: selectedConversation._id,
          message: replyText
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedConversation(data.conversation);
        setReplyText("");
        alert("Reply sent successfully to user!");

        // Refresh conversations list
        fetchUserConversations(adminId);
      } else {
        alert("Failed to send reply. Please try again.");
      }
    } catch (error) {
      console.error('Error sending admin reply:', error);
      alert("Failed to send reply. Please try again.");
    }
  };

  const handleCloseConversation = async (conversationId) => {
    if (!window.confirm("Are you sure you want to close this conversation?")) {
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/user-help/admin/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ conversationId })
      });

      if (response.ok) {
        alert("Conversation closed successfully!");
        setSelectedConversation(null);

        // Refresh conversations list
        const adminId = getAdminId();
        fetchUserConversations(adminId);
      } else {
        alert("Failed to close conversation. Please try again.");
      }
    } catch (error) {
      console.error('Error closing conversation:', error);
      alert("Failed to close conversation. Please try again.");
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    alert("✅ Message sent successfully to support! You'll get a reply via SMS soon.");
    setShowMessageForm(false);
    setMessage("");
    setPhone("");
  };

  return (
    <div className="help-section">
      <h2 className="section-title">Help & Support</h2>
      <p className="section-subtitle">Manage user help requests and provide assistance</p>

      {/* User Help Requests Section */}
      <div className="help-category">
        <div className="category-header">
          <FiMessageCircle className="category-icon" />
          <h3 className="category-title">User Help Requests</h3>
          <button
            className="btn-refresh"
            onClick={() => {
              const adminId = getAdminId();
              if (adminId) fetchUserConversations(adminId);
            }}
            style={{ marginLeft: 'auto', padding: '5px 10px', fontSize: '12px' }}
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>

        {userConversations.length === 0 ? (
          <div style={{ color: '#666', textAlign: 'center', padding: '40px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            <FiMessageCircle style={{ fontSize: '3rem', marginBottom: '1rem', color: '#ccc' }} />
            <p style={{ margin: 0 }}>No user help requests yet.</p>
            <small>When users send help messages, they will appear here.</small>
          </div>
        ) : (
          <div className="conversations-list">
            {userConversations.map((conv) => (
              <div
                key={conv._id}
                className="conversation-card"
                onClick={() => fetchConversationById(conv._id)}
                style={{ cursor: 'pointer', marginBottom: '10px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0' }}>{conv.subject}</h4>
                    <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                      From: <strong>{conv.userId?.name || 'Unknown User'}</strong> ({conv.userId?.phoneNumber || 'N/A'})
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
        )}
      </div>

      {/* FAQ Section - Consistent with UserHelp */}
      <div className="help-category">
        <div className="category-header">
          <FiHelpCircle className="category-icon" />
          <h3 className="category-title">Admin FAQ</h3>
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

      {/* Conversation Modal */}
      {selectedConversation && (
        <div className="modal-overlay" onClick={() => setSelectedConversation(null)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{selectedConversation.subject}</h3>
                <small style={{ color: '#666' }}>
                  Conversation with user: {selectedConversation.userId?.name || 'Unknown User'} ({selectedConversation.userId?.phoneNumber || 'N/A'})
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
                      backgroundColor: msg.sender === 'admin' ? '#e3f2fd' : '#f5f5f5',
                      marginLeft: msg.sender === 'admin' ? '0' : 'auto',
                      marginRight: msg.sender === 'admin' ? 'auto' : '0',
                      maxWidth: '80%'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <strong style={{ fontSize: '14px' }}>
                        {msg.sender === 'admin' ? '👨‍💼 You' : '👤 ' + (msg.senderName || 'User')}
                      </strong>
                      <small style={{ color: '#999', fontSize: '12px' }}>
                        {new Date(msg.timestamp).toLocaleString()}
                      </small>
                    </div>
                    <p style={{ margin: '0', fontSize: '14px', lineHeight: '1.5' }}>{msg.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply Section */}
              {selectedConversation.status === 'open' && (
                <div className="reply-section">
                  <div className="form-group">
                    <label>Reply to this conversation</label>
                    <textarea
                      rows="4"
                      placeholder="Type your reply to the user..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                  <div className="form-actions">
                    <button className="btn-secondary" onClick={() => setSelectedConversation(null)}>
                      Close
                    </button>
                    <button className="btn-primary" onClick={handleAdminReply}>
                      <FiSend /> Send Reply
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => handleCloseConversation(selectedConversation._id)}
                      style={{ backgroundColor: '#f44336', color: 'white' }}
                    >
                      Close Conversation
                    </button>
                  </div>
                </div>
              )}

              {selectedConversation.status === 'closed' && (
                <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', textAlign: 'center' }}>
                  <p style={{ margin: '0', color: '#856404' }}>
                    This conversation has been closed. No further replies are allowed.
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

export default AdminHelp;
