import { useNavigate, useOutletContext } from "react-router-dom";
import {
  FiEdit3, FiUpload, FiSave, FiX, FiUser, FiTrash2,
  FiMail, FiPhone, FiMapPin, FiUsers, FiCalendar
} from "react-icons/fi";
import React, { useState, useEffect } from "react";
import "../CSS/UserDashboard.css";

const AdminSettings = () => {
  const navigate = useNavigate();
  const { onProfileUpdate } = useOutletContext() || {};

  // Default profile placeholder icon
  const defaultProfileIcon =
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const [adminData, setAdminData] = useState(null);
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    approvedRequests: 0,
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [removeProfileImage, setRemoveProfileImage] = useState(false);

  useEffect(() => {
    fetchAdminProfile();
    fetchStatistics();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const storedAdminData = localStorage.getItem('adminData');
      if (!storedAdminData) {
        setError("Please log in to access settings.");
        navigate('/admin-login');
        return;
      }

      const parsedData = JSON.parse(storedAdminData);
      const adminId = parsedData.profile?.adminId || parsedData.adminId;

      if (!adminId) {
        setError('Admin ID not found');
        setLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:3000/api/adminActions/getAdmin/${adminId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.admin) {
        setAdminData(data.admin);
        setEditData({
          name: data.admin.name || "",
          email: data.admin.email || "",
          phoneNumber: data.admin.phoneNumber || "",
          location: data.admin.location || "",
          bio: data.admin.bio || "",
        });
      } else {
        setError(data.message || 'Failed to fetch admin profile');
      }
    } catch (err) {
      console.error('Error fetching admin profile:', err);
      setError('Unable to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const storedAdminData = localStorage.getItem('adminData');
      let adminId = null;

      if (storedAdminData) {
        const parsedData = JSON.parse(storedAdminData);
        adminId = parsedData.profile?.adminId || parsedData.adminId;
      }

      const url = adminId
        ? `http://localhost:3000/api/adminActions/statistics?adminId=${adminId}`
        : 'http://localhost:3000/api/adminActions/statistics';

      const response = await fetch(url);
      const data = await response.json();

      if (data.success && data.statistics) {
        setStatistics(data.statistics);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const handleEditChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Basic file validation
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB');
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setRemoveProfileImage(false);
    }
  };

  const handleRemoveProfileImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveProfileImage(true);
  };

  const handleSave = async () => {
    if (!adminData?.adminId) {
      return;
    }

    // Basic validation
    if (!editData.name?.trim()) {
      alert("Name is required");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      Object.keys(editData).forEach((key) => {
        if (editData[key] !== undefined && editData[key] !== null) {
          formData.append(key, editData[key]);
        }
      });

      if (imageFile) {
        formData.append("profileImage", imageFile);
      }

      if (removeProfileImage) {
        formData.append("removeProfileImage", "true");
      }

      const response = await fetch(
        `http://localhost:3000/api/adminActions/update/${adminData.adminId}`,
        {
          method: "PUT",
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        alert("Profile updated successfully!");
        setEditMode(false);
        setImageFile(null);
        setImagePreview(null);
        setRemoveProfileImage(false);
        fetchAdminProfile();

        // Notify parent to refresh profile data (for header update)
        if (onProfileUpdate) {
          onProfileUpdate();
        }
      } else {
        alert(data.message || "Update failed");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setImageFile(null);
    setImagePreview(null);
    setRemoveProfileImage(false);
    if (adminData) {
      setEditData({
        name: adminData.name || "",
        email: adminData.email || "",
        phoneNumber: adminData.phoneNumber || "",
        location: adminData.location || "",
        bio: adminData.bio || "",
      });
    }
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const getProfileImageSrc = () => {
    if (removeProfileImage) {
      return defaultProfileIcon;
    }
    if (imagePreview) {
      return imagePreview;
    }
    if (adminData?.profileImage?.url) {
      return adminData.profileImage.url;
    }
    return defaultProfileIcon;
  };

  const hasCustomProfileImage = adminData?.profileImage?.url &&
                               adminData.profileImage.url !== defaultProfileIcon;

  // Loading UI
  if (loading) return (
    <div className="settings-section">
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="loading-spinner"></div>
        <p>Loading settings...</p>
      </div>
    </div>
  );

  // Error UI
  if (error) return (
    <div className="settings-section">
      <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
        <p>Error: {error}</p>
      </div>
    </div>
  );

  return (
    <div className="settings-section">
      <h2 className="section-title">Settings</h2>
      <p className="section-subtitle">Manage your admin profile and preferences</p>

      {/* Profile Section */}
      <div className="settings-category">
        <div className="category-header">
          <FiUser className="category-icon" />
          <h3 className="category-title">Profile Information</h3>
        </div>

        <div className="settings-card profile-view-card">
          {!editMode ? (
            /* Profile View Mode */
            <div className="profile-view-mode">
              <div className="profile-view-header">
                <div className="profile-avatar-large">
                  <img
                    src={getProfileImageSrc()}
                    alt="Profile"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '50%'
                    }}
                  />
                </div>

                <div className="profile-header-info">
                  <h3>{adminData?.name || 'Admin'}</h3>
                  <p>{adminData?.username || ''}</p>
                </div>
                <button
                  className="btn-primary"
                  onClick={toggleEditMode}
                >
                  <FiEdit3 /> Edit Profile
                </button>
              </div>

              <div className="profile-info-grid">
                <div className="profile-info-item">
                  <div className="info-label">
                    <FiMail /> Email
                  </div>
                  <div className="info-value">{adminData?.email || 'Not provided'}</div>
                </div>

                <div className="profile-info-item">
                  <div className="info-label">
                    <FiPhone /> Phone Number
                  </div>
                  <div className="info-value">{adminData?.phoneNumber || 'Not provided'}</div>
                </div>

                <div className="profile-info-item">
                  <div className="info-label">
                    <FiMapPin /> Location
                  </div>
                  <div className="info-value">{adminData?.location || 'Not provided'}</div>
                </div>

                <div className="profile-info-item">
                  <div className="info-label">
                    <FiCalendar /> Member Since
                  </div>
                  <div className="info-value">
                    {adminData?.createdAt
                      ? new Date(adminData.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Unknown'}
                  </div>
                </div>

                <div className="profile-info-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="info-label">
                    Bio
                  </div>
                  <div className="info-value">{adminData?.bio || 'No bio added'}</div>
                </div>
              </div>

              {/* Statistics Section - View Mode */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                <h4 style={{
                  marginBottom: '1rem',
                  color: '#5B7C99',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}>
                  <FiUsers /> Statistics
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#eff6ff',
                    borderRadius: '0.5rem',
                    border: '1px solid #bfdbfe'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#1e40af', marginBottom: '0.25rem' }}>
                      Total Users
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb' }}>
                      {statistics.totalUsers}
                    </div>
                  </div>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '0.5rem',
                    border: '1px solid #bbf7d0'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#166534', marginBottom: '0.25rem' }}>
                      Approved
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#15803d' }}>
                      {statistics.approvedRequests}
                    </div>
                  </div>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#fffbeb',
                    borderRadius: '0.5rem',
                    border: '1px solid #fde68a'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#92400e', marginBottom: '0.25rem' }}>
                      Pending
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d97706' }}>
                      {statistics.pendingApprovals}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Profile Edit Mode */
            <div className="profile-edit-mode">
              <div className="profile-edit-header">
                <h3>Edit Profile Information</h3>
                <button
                  className="btn-secondary"
                  onClick={handleCancel}
                >
                  <FiX /> Cancel
                </button>
              </div>

              <form className="profile-edit-form" onSubmit={(e) => e.preventDefault()}>
                {/* Profile Photo Upload */}
                <div className="form-section">
                  <h4 className="form-section-title">Profile Photo</h4>
                  <div className="profile-photo-upload">
                    <div className="photo-preview-container">
                      <div className="photo-preview">
                        <img
                          src={getProfileImageSrc()}
                          alt="Profile Preview"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '50%'
                          }}
                        />
                      </div>
                      <div className="photo-upload-info">
                        <h5>Profile Picture</h5>
                        <p>Upload a profile photo. Max size: 5MB</p>
                        <div className="photo-actions">
                          <label className="btn-upload">
                            <FiUpload /> Choose Photo
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={handleImageChange}
                            />
                          </label>
                          {(hasCustomProfileImage || imagePreview) && !removeProfileImage && (
                            <button
                              type="button"
                              className="btn-remove-photo"
                              onClick={handleRemoveProfileImage}
                            >
                              <FiTrash2 /> Remove
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-save-photo"
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                              backgroundColor: '#5B7C99',
                              color: 'white',
                              border: 'none',
                              padding: '0.5rem 1rem',
                              borderRadius: '0.5rem',
                              cursor: saving ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.875rem',
                              fontWeight: '500'
                            }}
                          >
                            <FiSave /> {saving ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                        {removeProfileImage && (
                          <p style={{ color: '#059669', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                            Profile image will be removed on save
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="form-section">
                  <h4 className="form-section-title">Basic Information</h4>
                  <div className="form-grid">
                    <div className="form-field full-width">
                      <label>
                        <FiUser /> Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={editData.name}
                        onChange={(e) => handleEditChange("name", e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label>
                        <FiPhone /> Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={editData.phoneNumber}
                        onChange={(e) => handleEditChange("phoneNumber", e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label>
                        <FiMail /> Email
                      </label>
                      <input
                        type="email"
                        placeholder="email@example.com"
                        value={editData.email}
                        onChange={(e) => handleEditChange("email", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Location & Bio */}
                <div className="form-section">
                  <h4 className="form-section-title">Additional Details</h4>
                  <div className="form-grid">
                    <div className="form-field full-width">
                      <label>
                        <FiMapPin /> Location
                      </label>
                      <input
                        type="text"
                        placeholder="Your location"
                        value={editData.location}
                        onChange={(e) => handleEditChange("location", e.target.value)}
                      />
                    </div>

                    <div className="form-field full-width">
                      <label>
                        Bio
                      </label>
                      <textarea
                        placeholder="Tell us about yourself..."
                        value={editData.bio}
                        onChange={(e) => handleEditChange("bio", e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
