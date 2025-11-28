import { useNavigate } from "react-router-dom";
import {
  FiEdit3, FiUpload, FiSave, FiX, FiUser, FiTrash2,
  FiMail, FiPhone, FiMapPin, FiPackage
} from "react-icons/fi";
import React, { useState, useEffect } from "react";
import "../CSS/UserDashboard.css";

const UserSettings = ({ onProfileUpdate }) => {
  const navigate = useNavigate();

  // Default profile placeholder icon
  const defaultProfileIcon =
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [removeProfileImage, setRemoveProfileImage] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      // Get phone number from localStorage (same as UserDashboard)
      const userPhoneNumber = localStorage.getItem("userPhoneNumber");

      if (!userPhoneNumber) {
        setError("Please log in to access settings.");
        navigate("/user-login");
        return;
      }

      const response = await fetch(
        `http://localhost:3000/api/user/phone/${userPhoneNumber}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("user data", data);

      if (data && data.success && data.user) {
        setUserData(data.user);

        setEditData({
          name: data.user.name || "",
          email: data.user.email || "",
          phoneNumber: data.user.phoneNumber || "",
          country: data.user.country || "",
          state: data.user.state || "",
          district: data.user.district || "",
          pincode: data.user.pincode || "",
          address: data.user.address || "",
          seedsCount: data.user.seedsCount || 0,
          bonus: data.user.bonus || 0,
          price: data.user.price || 0,
          seedType: data.user.seedType || 'N/A',
        });
      } else {
        setError("Failed to fetch user data");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Unable to load user data");
    } finally {
      setLoading(false);
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
    const finalUserId = userData?.userId;

    if (!finalUserId) {
      return;
    }

    // Basic validation
    if (!editData.name?.trim()) {
      alert("Name is required");
      return;
    }

    // Pincode validation (if provided)
    if (editData.pincode && !/^\d{6}$/.test(editData.pincode)) {
      alert("Please enter a valid 6-digit pincode");
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
        `http://localhost:3000/api/user/update/${finalUserId}`,
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
        fetchUserProfile();

        // Notify parent to refresh profile data (for header update)
        if (onProfileUpdate) {
          onProfileUpdate();
        }
      } else {
        alert(data.message || "Update failed");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Error updating user");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setImageFile(null);
    setImagePreview(null);
    setRemoveProfileImage(false);
    if (userData) {
      setEditData({
        name: userData.name || "",
        email: userData.email || "",
        phoneNumber: userData.phoneNumber || "",
        country: userData.country || "",
        state: userData.state || "",
        district: userData.district || "",
        pincode: userData.pincode || "",
        address: userData.address || "",
        seedsAvailable: userData.seedsAvailable || 0,
        seedsSold: userData.seedsSold || 0,
        activeBatches: userData.activeBatches || 0,
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
    if (userData?.profileImage?.url) {
      return userData.profileImage.url;
    }
    return defaultProfileIcon;
  };

  const hasCustomProfileImage = userData?.profileImage?.url &&
                               userData.profileImage.url !== defaultProfileIcon;

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
      <p className="section-subtitle">Manage your account preferences and profile information</p>

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
                  <h3>{userData?.name || 'User'}</h3>
                  <p>{userData?.phoneNumber || ''}</p>
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
                  <div className="info-value">{userData?.email || 'Not provided'}</div>
                </div>

                <div className="profile-info-item">
                  <div className="info-label">
                    <FiPhone /> Phone Number
                  </div>
                  <div className="info-value">{userData?.phoneNumber || 'Not provided'}</div>
                </div>

                <div className="profile-info-item">
                  <div className="info-label">
                    <FiMapPin /> Country
                  </div>
                  <div className="info-value">{userData?.country || 'Not provided'}</div>
                </div>

                <div className="profile-info-item">
                  <div className="info-label">
                    <FiMapPin /> State
                  </div>
                  <div className="info-value">{userData?.state || 'Not provided'}</div>
                </div>

                <div className="profile-info-item">
                  <div className="info-label">
                    <FiMapPin /> District
                  </div>
                  <div className="info-value">{userData?.district || 'Not provided'}</div>
                </div>

                <div className="profile-info-item">
                  <div className="info-label">
                    <FiMapPin /> Pincode
                  </div>
                  <div className="info-value">{userData?.pincode || 'Not provided'}</div>
                </div>

                <div className="profile-info-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="info-label">
                    <FiMapPin /> Full Address
                  </div>
                  <div className="info-value">{userData?.address || 'Not provided'}</div>
                </div>
              </div>

              {/* Seeds Info Section - View Mode */}
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
                  <FiPackage /> Seeds Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '0.5rem',
                    border: '1px solid #bbf7d0'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#166534', marginBottom: '0.25rem' }}>
                      Seeds Count
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#15803d' }}>
                      {userData?.seedsCount || 0}
                    </div>
                  </div>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#fef2f2',
                    borderRadius: '0.5rem',
                    border: '1px solid #fecaca'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#991b1b', marginBottom: '0.25rem' }}>
                      Bonus
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626' }}>
                      {userData?.bonus || 0}
                    </div>
                  </div>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#eff6ff',
                    borderRadius: '0.5rem',
                    border: '1px solid #bfdbfe'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#1e40af', marginBottom: '0.25rem' }}>
                      Price
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb' }}>
                      ₹{userData?.price || 0}
                    </div>
                  </div>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#fef3c7',
                    borderRadius: '0.5rem',
                    border: '1px solid #fde047'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#92400e', marginBottom: '0.25rem' }}>
                      Seed Type
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#a16207' }}>
                      {userData?.seedType || 'N/A'}
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
                            <FiUpload /> Take Photo
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
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
                        placeholder="+91"
                        value={editData.phoneNumber}
                        onChange={(e) => handleEditChange("phoneNumber", e.target.value)}
                        disabled
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

                {/* Location Information */}
                <div className="form-section">
                  <h4 className="form-section-title">Location Details</h4>
                  <div className="form-grid">
                    <div className="form-field">
                      <label>
                        <FiMapPin /> Country
                      </label>
                      <input
                        type="text"
                        placeholder="Country"
                        value={editData.country}
                        onChange={(e) => handleEditChange("country", e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label>
                        <FiMapPin /> State
                      </label>
                      <input
                        type="text"
                        placeholder="State"
                        value={editData.state}
                        onChange={(e) => handleEditChange("state", e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label>
                        <FiMapPin /> District
                      </label>
                      <input
                        type="text"
                        placeholder="District"
                        value={editData.district}
                        onChange={(e) => handleEditChange("district", e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label>
                        <FiMapPin /> Pincode
                      </label>
                      <input
                        type="text"
                        placeholder="6-digit pincode"
                        maxLength="6"
                        value={editData.pincode}
                        onChange={(e) => handleEditChange("pincode", e.target.value.replace(/\D/g, '').slice(0, 6))}
                      />
                    </div>

                    <div className="form-field full-width">
                      <label>
                        <FiMapPin /> Full Address
                      </label>
                      <textarea
                        placeholder="Enter your full address"
                        value={editData.address}
                        onChange={(e) => handleEditChange("address", e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Seeds Information - Edit Mode */}
                <div className="form-section">
                  <h4 className="form-section-title">
                    <FiPackage style={{ marginRight: '0.5rem' }} /> Seeds Information
                  </h4>
                  <div className="form-grid">
                    <div className="form-field">
                      <label>Seeds Available</label>
                      <input
                        type="number"
                        min="0"
                        value={editData.seedsAvailable}
                        onChange={(e) => handleEditChange("seedsAvailable", parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div className="form-field">
                      <label>Seeds Sold</label>
                      <input
                        type="number"
                        min="0"
                        value={editData.seedsSold}
                        onChange={(e) => handleEditChange("seedsSold", parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div className="form-field">
                      <label>Active Batches</label>
                      <input
                        type="number"
                        min="0"
                        value={editData.activeBatches}
                        onChange={(e) => handleEditChange("activeBatches", parseInt(e.target.value) || 0)}
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

export default UserSettings;
