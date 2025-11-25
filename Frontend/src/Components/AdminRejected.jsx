import React, { useState, useEffect } from 'react';
import { FiSearch, FiPhone, FiCalendar, FiMail } from 'react-icons/fi';
import '../CSS/AdminDashboard.css';

const AdminRejected = () => {
  const [rejectedUsers, setRejectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRejectedUsers();
  }, []);

  const fetchRejectedUsers = async () => {
    try {
      // Get admin ID from localStorage
      const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
      const adminId = adminData.id || adminData._id;

      // Build URL with adminId filter
      let url = 'http://localhost:3000/api/adminActions/rejected';
      if (adminId) {
        url += `?adminId=${adminId}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch rejected users');
      }
      const data = await response.json();
      if (data.success) {
        setRejectedUsers(data.rejectedUsers);
      }
      console.log(data);
    } catch (error) {
      console.error('Error fetching rejected users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = rejectedUsers.filter(user => 
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

  return (
    <div className="admin-main-content">
      <div className="admin-header">
        <h1>Rejected Users</h1>
        <p>View all rejected user submissions and their details</p>
      </div>

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
          <div className="loading">Loading rejected users...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Contact Info</th>
                <th>Rejection Date</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="no-data">
                    No rejected users found
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
                          <div className="member-name">{user.name}</div>
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
                        {formatDate(user.rejectedAt || user.updatedAt)}
                      </div>
                    </td>
                    <td>
                      <div className="rejection-reason">
                        {user.reason || user.rejectionReason || 'No reason provided'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminRejected;