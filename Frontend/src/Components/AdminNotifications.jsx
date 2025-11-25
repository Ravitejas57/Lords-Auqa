import React, { useState, useEffect } from 'react';
import { FiBell, FiAlertCircle, FiCheckCircle, FiSend, FiLoader, FiClock, FiUsers } from 'react-icons/fi';
import { sendBroadcastNotification, getNotificationHistory } from '../services/notificationService';
import { getApprovedUsers } from '../services/adminApi';
import '../CSS/AdminDashboard.css';

const AdminNotifications = () => {
  const [formData, setFormData] = useState({
    target: 'all',
    region: '',
    district: '',
    userIds: [],
    type: 'info',
    priority: 'medium',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset selected users when target changes
    if (name === 'target') {
      setSelectedUserIds([]);
      setFormData(prev => ({ ...prev, userIds: [] }));
    }
  };

  // Handle user selection in dropdown
  const handleUserSelect = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedUserIds(selectedOptions);
    setFormData(prev => ({
      ...prev,
      userIds: selectedOptions
    }));
  };

  // Handle "All Users" checkbox
  const handleSelectAllUsers = (e) => {
    if (e.target.checked) {
      const allUserIds = assignedUsers.map(user => user._id);
      setSelectedUserIds(allUserIds);
      setFormData(prev => ({
        ...prev,
        userIds: allUserIds
      }));
    } else {
      setSelectedUserIds([]);
      setFormData(prev => ({
        ...prev,
        userIds: []
      }));
    }
  };

  // Load assigned users when component mounts or when switching to specific user target
  useEffect(() => {
    const fetchAssignedUsers = async () => {
      try {
        setLoadingUsers(true);
        const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
        // Use consistent adminId access pattern (same as AdminLayout)
        const adminId = adminData.profile?.adminId || adminData.adminId || adminData.id || adminData._id;

        if (adminId) {
          const response = await getApprovedUsers(adminId);
          if (response.success) {
            setAssignedUsers(response.approvedUsers || []);
          }
        }
      } catch (error) {
        console.error('Error fetching assigned users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchAssignedUsers();
  }, []);

  // Load notification history on component mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await getNotificationHistory();
      if (response.success) {
        setHistory(response.history || []);
      }
    } catch (error) {
      console.error('Error loading notification history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.message.trim()) {
      showAlert('error', 'Please enter a message');
      return;
    }

    // Validate that at least one user is selected when target is "users"
    if (formData.target === 'users' && (!formData.userIds || formData.userIds.length === 0)) {
      showAlert('error', 'Please select at least one user');
      return;
    }

    setLoading(true);
    try {
      // Get admin ID from localStorage (use consistent pattern)
      const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
      const adminId = adminData.profile?.adminId || adminData.adminId || adminData.id || adminData._id;

      // Add adminId to formData for filtering users by assigned admin
      const notificationData = {
        ...formData,
        adminId
      };

      const response = await sendBroadcastNotification(notificationData);
      showAlert('success', response.message || `Notification sent to ${response.count} users`);

      // Reset form
      setFormData(prev => ({
        ...prev,
        message: ''
      }));
      setSelectedUserIds([]);

      // Reload history to show the new notification
      loadHistory();
    } catch (error) {
      console.error('Error sending notification:', error);
      showAlert('error', error.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => {
      setAlert({ show: false, type: '', message: '' });
    }, 5000);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="admin-main-content">
      {/* Header */}
      <div className="admin-content-header">
        <div className="admin-header-left">
          <FiBell style={{ fontSize: '1.5rem', color: '#5B7C99' }} />
          <div>
            <h1 className="admin-page-title">Send Announcements</h1>
            <p className="admin-page-subtitle">
              Broadcast notifications to users
            </p>
          </div>
        </div>
      </div>

      {/* Alert */}
      {alert.show && (
        <div className={`admin-alert ${alert.type === 'success' ? 'admin-alert-success' : 'admin-alert-error'}`}>
          <div className="admin-alert-content">
            {alert.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
            <span>{alert.message}</span>
          </div>
          <button className="admin-alert-close" onClick={() => setAlert({ show: false, type: '', message: '' })}>
            �
          </button>
        </div>
      )}

      {/* Form Card */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">
            <h3>Notification Details</h3>
            <p>Configure and send notifications to your users</p>
          </div>
        </div>

        <div className="admin-card-content">
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="admin-form-grid">
              {/* Target Selection */}
              <div className="admin-form-group">
                <label className="admin-form-label">Target Audience</label>
                <select
                  name="target"
                  value={formData.target}
                  onChange={handleChange}
                  className="admin-form-select"
                >
                  <option value="all">All Users</option>
                  <option value="users">Specific User</option>
                </select>
                <span className="admin-form-help">Choose who should receive this notification</span>
              </div>

              {/* User Selection Dropdown - shown when "Specific User" is selected */}
              {formData.target === 'users' && (
                <div className="admin-form-group">
                  <label className="admin-form-label">
                    Select User(s)
                    <input
                      type="checkbox"
                      checked={selectedUserIds.length === assignedUsers.length && assignedUsers.length > 0}
                      onChange={handleSelectAllUsers}
                      style={{ marginLeft: '1rem', cursor: 'pointer' }}
                    />
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      Select All Users
                    </span>
                  </label>
                  <select
                    multiple
                    value={selectedUserIds}
                    onChange={handleUserSelect}
                    className="admin-form-select"
                    style={{ minHeight: '150px' }}
                    disabled={loadingUsers}
                  >
                    {loadingUsers ? (
                      <option disabled>Loading users...</option>
                    ) : assignedUsers.length === 0 ? (
                      <option disabled>No users assigned to you</option>
                    ) : (
                      assignedUsers.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name} - {user.phoneNumber}
                        </option>
                      ))
                    )}
                  </select>
                  <span className="admin-form-help">
                    Hold Ctrl (Cmd on Mac) to select multiple users. {selectedUserIds.length} user(s) selected.
                  </span>
                </div>
              )}

              {/* Priority */}
              <div className="admin-form-group">
                <label className="admin-form-label">Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="admin-form-select"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <span className="admin-form-help">Determines notification urgency</span>
              </div>
            </div>

            {/* Message Field */}
            <div className="admin-form-group">
              <label className="admin-form-label">Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Enter your notification message here..."
                className="admin-form-textarea"
                rows="5"
                required
              />
              <span className="admin-form-help">
                {formData.message.length} characters
              </span>
            </div>

            {/* Submit Button */}
            <div className="admin-form-actions">
              <button
                type="submit"
                disabled={loading}
                className="admin-btn admin-btn-primary"
              >
                {loading ? (
                  <>
                    <FiLoader className="admin-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <FiSend />
                    <span>Send Notification</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Notification History Section */}
      <div className="admin-card" style={{ marginTop: '2rem' }}>
        <div className="admin-card-header">
          <div className="admin-card-title">
            <FiClock style={{ fontSize: '1.25rem', color: '#5B7C99', marginRight: '0.5rem' }} />
            <div>
              <h3>Notification History</h3>
              <p>Previously sent notifications</p>
            </div>
          </div>
        </div>

        <div className="admin-card-content">
          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
              <FiLoader className="admin-spin" style={{ fontSize: '2rem', marginBottom: '0.5rem' }} />
              <p>Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
              <FiBell style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }} />
              <p>No notifications sent yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {history.map((item) => (
                <div
                  key={item._id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1rem',
                    backgroundColor: '#fafafa',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#5B7C99';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fafafa';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor:
                            item.type === 'success' ? '#d1fae5' :
                            item.type === 'warning' ? '#fef3c7' :
                            item.type === 'error' ? '#fee2e2' : '#dbeafe',
                          color:
                            item.type === 'success' ? '#065f46' :
                            item.type === 'warning' ? '#92400e' :
                            item.type === 'error' ? '#991b1b' : '#1e40af'
                        }}
                      >
                        {item.type}
                      </span>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: '#e5e7eb',
                          color: '#4b5563'
                        }}
                      >
                        {item.priority}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FiUsers size={14} />
                        <span>{item.recipientCount} recipients</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FiClock size={14} />
                        <span>{formatDate(item.sentAt)}</span>
                      </div>
                    </div>
                  </div>
                  <p style={{ margin: 0, color: '#374151', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    {item.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;
