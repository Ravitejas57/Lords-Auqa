import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet, NavLink } from 'react-router-dom';
import {
  FiHome, FiUsers, FiClock, FiXCircle, FiMessageSquare, FiUserPlus,
  FiBarChart2, FiSettings, FiHelpCircle, FiMenu, FiX,
  FiUser, FiChevronDown, FiLogOut, FiPlus
} from 'react-icons/fi';
import '../CSS/AdminDashboard.css';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  
  const [adminData, setAdminData] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  const [unreadHelpCount, setUnreadHelpCount] = useState(0);

  // No need for manual active section tracking - NavLink handles this

  // Fetch admin profile data from API
  const fetchAdminProfile = async (adminId) => {
    if (!adminId) return;

    try {
      const response = await fetch(`http://localhost:3000/api/adminActions/getAdmin/${adminId}`);
      const data = await response.json();

      if (data.success && data.admin) {
        setAdminProfile(data.admin);
      }
    } catch (err) {
      console.error('Error fetching admin profile:', err);
    }
  };

  useEffect(() => {
    // Get admin data from localStorage
    const storedAdminData = localStorage.getItem('adminData');
    if (!storedAdminData) {
      navigate('/admin-login');
      return;
    }
    const parsedData = JSON.parse(storedAdminData);
    setAdminData(parsedData);

    // Fetch full profile data including profile image
    const adminId = parsedData.profile?.adminId || parsedData.adminId;
    if (adminId) {
      fetchAdminProfile(adminId);
    }
  }, [navigate]);

  // Fetch unread help message count for admin
  useEffect(() => {
    const fetchHelpUnreadCount = async () => {
      if (!adminData) return;

      const adminId = adminData.profile?.adminId || adminData.adminId || adminData._id;
      if (!adminId) return;

      try {
        // The endpoint expects the admin's string adminId (e.g., "ADM1761907518119")
        const response = await fetch(`http://localhost:3000/api/user-help/admin/unread-count/${adminId}`);
        const data = await response.json();
        if (data.success) {
          setUnreadHelpCount(data.unreadCount);
          console.log('Admin help unread count:', data.unreadCount);
        }
      } catch (error) {
        console.error("Error fetching admin help unread count:", error);
      }
    };

    fetchHelpUnreadCount();

    // Refresh count every 30 seconds
    const interval = setInterval(fetchHelpUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [adminData]);

  // Mark help messages as read when navigating to help page
  useEffect(() => {
    const markHelpAsRead = async () => {
      if (location.pathname === '/admin/help' && adminData && unreadHelpCount > 0) {
        const adminId = adminData.profile?.adminId || adminData.adminId || adminData._id;
        if (!adminId) return;

        try {
          // Get admin's MongoDB _id if we only have adminId string
          let adminMongoId = adminId;

          if (typeof adminId === 'string' && adminId.startsWith('ADM')) {
            const adminResponse = await fetch(`http://localhost:3000/api/adminActions/getAdmin/${adminId}`);
            const data = await adminResponse.json();
            if (data.success && data.admin) {
              adminMongoId = data.admin._id;
            }
          }

          await fetch(`http://localhost:3000/api/user-help/admin/mark-all-read/${adminMongoId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          setUnreadHelpCount(0);
        } catch (error) {
          console.error("Error marking admin help messages as read:", error);
        }
      }
    };

    markHelpAsRead();
  }, [location.pathname, adminData, unreadHelpCount]);

  // Navigation is now handled by NavLink components

  // Ensure light mode is always applied
  useEffect(() => {
    document.documentElement.setAttribute("data-admin-theme", "light");
    document.documentElement.classList.remove("dark");
  }, []);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('adminData');
    localStorage.removeItem('adminToken');
    navigate('/admin-login');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setProfileDropdownOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="admin-dashboard" data-admin-theme="light">
      {/* TOP NAVBAR */}
      <nav className="admin-navbar">
        <div className="admin-navbar-left">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
          <div className="admin-logo">
            <img src="/logo.png" alt="Lords Aqua Hatcheries" className="admin-logo-img" />
            <div className="admin-brand-text">
              <span className="admin-brand-title">Lords Aqua Hatcheries</span>
              <span className="admin-brand-subtitle">Admin Panel</span>
            </div>
          </div>
        </div>

        <div className="admin-navbar-center">
          {/* Search bar moved to filters section */}
        </div>

        <div className="admin-navbar-right">
          {/* Quick Actions */}
          <NavLink to="/admin/add-user" className="quick-action-btn">
            <FiPlus />
            <span>Add User</span>
          </NavLink>


          {/* Profile Dropdown */}
          <div className="profile-wrapper">
            <button
              className="profile-btn"
              onClick={(e) => {
                e.stopPropagation();
                setProfileDropdownOpen(!profileDropdownOpen);
              }}
            >
              <div className="profile-avatar">
                {adminProfile?.profileImage?.url ? (
                  <img src={adminProfile.profileImage.url} alt="Profile" />
                ) : (
                  <FiUser />
                )}
              </div>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                {adminProfile?.name || adminData?.username || 'Admin User'}
              </span>
              <p>Admin</p>
              <FiChevronDown className={`dropdown-arrow ${profileDropdownOpen ? 'open' : ''}`} />
            </button>

            {profileDropdownOpen && (
              <div className="profile-dropdown">
                <NavLink to="/admin/profile" className="dropdown-item">
                  <FiUser />
                  <span>Profile</span>
                </NavLink>
                <NavLink to="/admin/settings" className="dropdown-item">
                  <FiSettings />
                  <span>Settings</span>
                </NavLink>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item logout" onClick={handleLogout}>
                  <FiLogOut />
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}
        <nav className="sidebar-nav">
          {/* Menu Toggle Button */}
          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand Menu" : "Collapse Menu"}
          >
            <FiMenu />
            {!sidebarCollapsed && <span>Menu</span>}
          </button>

          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <FiHome />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </NavLink>

          <NavLink
            to="/admin/sellers"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <FiUsers />
            {!sidebarCollapsed && <span>Sellers</span>}
          </NavLink>

          <NavLink
            to="/admin/pending"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <FiClock />
            {!sidebarCollapsed && <span>Pending Users</span>}
          </NavLink>

          <NavLink
            to="/admin/declined"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <FiXCircle />
            {!sidebarCollapsed && <span>Declined Users</span>}
          </NavLink>

          <NavLink
            to="/admin/notifications"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <FiMessageSquare />
            {!sidebarCollapsed && <span>Notifications</span>}
          </NavLink>

          <NavLink
            to="/admin/add-user"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <FiUserPlus />
            {!sidebarCollapsed && <span>Add User</span>}
          </NavLink>



          <NavLink
            to="/admin/settings"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <FiSettings />
            {!sidebarCollapsed && <span>Settings</span>}
          </NavLink>

          <NavLink
            to="/admin/help"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
            style={{ position: 'relative' }}
          >
            <FiHelpCircle />
            {!sidebarCollapsed && <span>Help</span>}
            {unreadHelpCount > 0 && (
              <span style={{
                position: 'absolute',
                top: sidebarCollapsed ? '4px' : '50%',
                right: sidebarCollapsed ? '4px' : '12px',
                transform: sidebarCollapsed ? 'none' : 'translateY(-50%)',
                backgroundColor: '#f59e0b',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '10px',
                minWidth: '18px',
                textAlign: 'center',
                lineHeight: '1.2'
              }}>
                {unreadHelpCount > 99 ? '99+' : unreadHelpCount}
              </span>
            )}
          </NavLink>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="admin-main">
        <Outlet context={{
          onProfileUpdate: () => {
            const storedAdminData = localStorage.getItem('adminData');
            if (storedAdminData) {
              const parsedData = JSON.parse(storedAdminData);
              const adminId = parsedData.profile?.adminId || parsedData.adminId;
              if (adminId) {
                fetchAdminProfile(adminId);
              }
            }
          }
        }} />
      </main>
    </div>
  );
};

export default AdminLayout;