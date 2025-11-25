import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPhone, FiMail, FiCalendar, FiCheckCircle, FiXCircle, FiX, FiAlertCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import '../CSS/AdminPending.css';

const AdminPending = () => {
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingUserId, setRejectingUserId] = useState(null);
  const [rejectingUserName, setRejectingUserName] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Rejection history modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedUserHistory, setSelectedUserHistory] = useState(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      // Get admin ID from localStorage
      const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
      const adminId = adminData.id || adminData._id;

      // Build URL with adminId query parameter if available
      const url = adminId
        ? `http://localhost:3000/api/adminActions/pending?adminId=${adminId}`
        : 'http://localhost:3000/api/adminActions/pending';

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch pending users');
      }
      const data = await response.json();
      if (data.success) {
        setPendingUsers(data.pendingUsers);
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
      setFeedback({ message: 'Failed to load pending users', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePendingUser = async (userId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/adminActions/approve/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setFeedback({
          message: 'User approved successfully!',
          type: 'success'
        });
        fetchPendingUsers(); // Refresh the list
      } else {
        throw new Error(data.message || 'Failed to approve user');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      setFeedback({ 
        message: 'Failed to approve user: ' + error.message, 
        type: 'error' 
      });
    }
  };

  const openRejectModal = (user) => {
    setRejectingUserId(user._id);
    setRejectingUserName(user.name);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectingUserId(null);
    setRejectingUserName('');
    setRejectionReason('');
  };

  const handleRejectPendingUser = async () => {
    setIsRejecting(true);
    try {
      const response = await fetch(`http://localhost:3000/api/adminActions/reject/${rejectingUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectionReason.trim() || 'No reason provided' })
      });
      const data = await response.json();

      if (data.success) {
        setFeedback({
          message: 'User rejected successfully!',
          type: 'success'
        });
        closeRejectModal();
        fetchPendingUsers(); // Refresh the list
      } else {
        throw new Error(data.message || 'Failed to reject user');
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      setFeedback({
        message: 'Failed to reject user: ' + error.message,
        type: 'error'
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const filteredUsers = pendingUsers.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phoneNumber?.includes(searchQuery) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const openHistoryModal = (user) => {
    setSelectedUserHistory(user);
    setShowHistoryModal(true);
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedUserHistory(null);
  };

  return (
    <div className="admin-main-content">
      <div className="admin-header">
        <h1>Pending Users</h1>
        <p>Review and manage new user registration requests</p>
      </div>

      {feedback.message && (
        <div className={`feedback-message ${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      {/* Search and Filters */}
      <div className="filters-row">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading">Loading pending users...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Contact Info</th>
                <th>Request Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-data">
                    No pending users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="member-cell">
                        <div className="member-avatar">
                          {user.name?.charAt(0) || 'U'}
                        </div>
                        <div className="member-info">
                          <div className="member-name">
                            {user.name}
                            {user.previousRejection && user.previousRejection.rejectedAt && (
                              <button
                                className="rejection-warning-badge"
                                onClick={() => openHistoryModal(user)}
                                title="Previously rejected - Click for details"
                              >
                                <FiAlertTriangle /> Previously Rejected
                              </button>
                            )}
                          </div>
                          <div className="member-id">ID: {user.userId || user._id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div className="phone-cell">
                          <FiPhone className="icon" />
                          {user.phoneNumber}
                        </div>
                        {user.email && (
                          <div className="email-cell">
                            <FiMail className="icon" />
                            {user.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">
                        <FiCalendar className="icon" />
                        {formatDate(user.requestedAt || user.createdAt)}
                      </div>
                    </td>
                    <td>
                      <span className="status-badge pending">
                        Pending Review
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                          <button
                            className="action-btn approve"
                            onClick={() => handleApprovePendingUser(user._id)}
                            title="Approve User"
                          >
                            <FiCheckCircle /> Approve
                          </button>
                          <button
                            className="action-btn reject"
                            onClick={() => openRejectModal(user)}
                            title="Reject User"
                          >
                            <FiXCircle /> Reject
                          </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={closeRejectModal}>
          <div className="reject-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <FiAlertCircle className="modal-icon" />
                Reject User
              </h3>
              <button className="close-btn" onClick={closeRejectModal}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <p className="reject-warning">
                Are you sure you want to reject <strong>{rejectingUserName}</strong>?
              </p>
              <div className="reason-input-group">
                <label htmlFor="rejectionReason">
                  Reason for Rejection (Optional)
                </label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter the reason for rejecting this user (optional)..."
                  rows="4"
                  className="reason-textarea"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeRejectModal} disabled={isRejecting}>
                Cancel
              </button>
              <button
                className="btn-reject"
                onClick={handleRejectPendingUser}
                disabled={isRejecting}
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection History Modal */}
      {showHistoryModal && selectedUserHistory && (
        <div className="modal-overlay" onClick={closeHistoryModal}>
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header history-header">
              <h3>
                <FiInfo className="modal-icon info-icon" />
                Previous Rejection History
              </h3>
              <button className="close-btn" onClick={closeHistoryModal}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="history-user-info">
                <strong>{selectedUserHistory.name}</strong>
                <span className="history-phone">{selectedUserHistory.phoneNumber}</span>
              </div>
              <div className="history-details">
                <div className="history-item">
                  <label>Previous Rejection Date:</label>
                  <span>{formatDate(selectedUserHistory.previousRejection.rejectedAt)}</span>
                </div>
                <div className="history-item">
                  <label>Rejection Reason:</label>
                  <p className="rejection-reason-text">
                    {selectedUserHistory.previousRejection.reason || 'No reason provided'}
                  </p>
                </div>
              </div>
              <div className="history-warning">
                <FiAlertTriangle className="warning-icon" />
                <p>This user was previously rejected and has signed up again. Please review carefully before making a decision.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-close-history" onClick={closeHistoryModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPending;