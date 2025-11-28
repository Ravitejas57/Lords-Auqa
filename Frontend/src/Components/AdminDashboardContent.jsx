import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import {
  FiUsers, FiClock, FiCheckCircle, FiXCircle, FiMessageSquare,
  FiBarChart2, FiTrendingUp, FiTrendingDown, FiActivity, FiPhone,
  FiX, FiZoomOut, FiZoomIn, FiRotateCcw, FiMaximize, FiMinimize,
  FiEye, FiUser, FiHome, FiMail, FiCopy, FiRefreshCw, FiKey, FiPackage, FiMapPin, FiImage, FiTrash2
} from "react-icons/fi";
import L from "leaflet";
import { getAllUsers, getPendingUsers, getApprovedUsers, getRejectedUsers, updateUserSeeds, getUserHatcheries, approveHatchery, deleteAndResetHatchery } from "../services/adminApi";
import { getAdminStories, deleteAdminStory } from "../services/notificationService";
import Stories from './Stories';
import StoryViewer from './StoryViewer';

// Import CSS for Leaflet
import 'leaflet/dist/leaflet.css';

// ImageDetailsWithMap Component - Moved outside main component
const ImageDetailsWithMap = ({ selectedSeller, selectedImage }) => {
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  const toggleMapFullscreen = () => {
    setIsMapFullscreen(!isMapFullscreen);
  };

  useEffect(() => {
    if (!selectedSeller) return;

    const currentImage = selectedSeller.images?.find(img => img.url === selectedImage);
    const lat = currentImage?.location?.latitude;
    const lng = currentImage?.location?.longitude;

    if (!lat || !lng) return;

    // Initialize map
    const mapId = isMapFullscreen ? 'fullscreenMap' : 'imageMap';
    const map = L.map(mapId).setView([lat, lng], 13);

    // Add OSM tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Add marker for image location
    L.marker([lat, lng])
      .addTo(map)
      .bindPopup(`<b>${currentImage?.name || "Image Location"}</b>`)
      .openPopup();

    // Cleanup previous map instance on re-render
    return () => {
      map.remove();
    };
  }, [selectedSeller, selectedImage, isMapFullscreen]);

  if (!selectedSeller) return null;

  const currentImage = selectedSeller.images?.find(img => img.url === selectedImage);
  const lat = currentImage?.location?.latitude;
  const lng = currentImage?.location?.longitude;

  return (
    <>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 2fr', 
        gap: '1.5rem', 
        marginTop: '1rem',
        alignItems: 'stretch'
      }}>
        {/* Left: Image Details - Compact and Clean */}
        <div style={{ 
          padding: '1.25rem',
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          border: '1px solid #e1e5e9',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <h4 style={{ 
            margin: 0,
            fontSize: '0.875rem',
            fontWeight: '700',
            color: '#1f2937',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            paddingBottom: '0.5rem',
            borderBottom: '2px solid #5B7C99'
          }}>
            📍 Image Details
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Location - Single Line */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start',
              gap: '0.5rem'
            }}>
              <span style={{ 
                fontWeight: '600', 
                color: '#374151',
                fontSize: '0.875rem',
                minWidth: '70px'
              }}>
                Location:
              </span>
              <span style={{ 
                fontSize: '0.875rem',
                color: '#6b7280',
                fontFamily: 'monospace',
                backgroundColor: '#f8f9fa',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid #e5e7eb',
                flex: 1
              }}>
                {lat && lng ? (
                  <>
                    <span style={{ color: '#059669' }}>Lat</span>: {parseFloat(lat).toFixed(6)} | 
                    <span style={{ color: '#dc2626' }}> Lng</span>: {parseFloat(lng).toFixed(6)}
                  </>
                ) : (
                  <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No location data</span>
                )}
              </span>
            </div>

            {/* Date - Separate Line */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ 
                fontWeight: '600', 
                color: '#374151',
                fontSize: '0.875rem',
                minWidth: '70px'
              }}>
                Date:
              </span>
              <span style={{ 
                fontSize: '0.875rem',
                color: '#4b5563',
                backgroundColor: '#f0f9ff',
                padding: '0.25rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #bae6fd'
              }}>
                {currentImage?.uploadedAt ? 
                  new Date(currentImage.uploadedAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  }) : 
                  <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>N/A</span>
                }
              </span>
            </div>

            {/* Time - Separate Line */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ 
                fontWeight: '600', 
                color: '#374151',
                fontSize: '0.875rem',
                minWidth: '70px'
              }}>
                Time:
              </span>
              <span style={{ 
                fontSize: '0.875rem',
                color: '#4b5563',
                backgroundColor: '#f0fdf4',
                padding: '0.25rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #bbf7d0'
              }}>
                {currentImage?.uploadedAt ? 
                  new Date(currentImage.uploadedAt).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                  }) : 
                  <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>N/A</span>
                }
              </span>
            </div>
          </div>
        </div>

        {/* Right: Map Container */}
        <div style={{ 
          position: 'relative',
          borderRadius: '0.75rem',
          overflow: 'hidden',
          border: '1px solid #e1e5e9',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          backgroundColor: '#f8f9fa'
        }}>
          <div 
            id="imageMap" 
            style={{ 
              width: '100%',
              height: '220px',
              cursor: 'grab'
            }}
          ></div>
          
          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleMapFullscreen}
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #d1d5db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#374151',
              fontSize: '1rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.2s ease',
              zIndex: 1000
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#5B7C99';
              e.target.style.color = 'white';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
              e.target.style.color = '#374151';
              e.target.style.transform = 'scale(1)';
            }}
            title={isMapFullscreen ? "Exit Fullscreen" : "View Fullscreen"}
          >
            {isMapFullscreen ? <FiMinimize /> : <FiMaximize />}
          </button>
        </div>
      </div>

      {/* Fullscreen Map Modal */}
      {isMapFullscreen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            padding: '2rem'
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            color: 'white'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
              📍 Location Map - Full Screen
            </h3>
            <button
              onClick={toggleMapFullscreen}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#ef4444';
              }}
            >
              <FiMinimize />
              Exit Fullscreen
            </button>
          </div>

          {/* Map Container */}
          <div style={{
            flex: 1,
            borderRadius: '0.75rem',
            overflow: 'hidden',
            border: '2px solid #374151',
            backgroundColor: '#f8f9fa'
          }}>
            <div 
              id="fullscreenMap" 
              style={{ 
                width: '100%',
                height: '100%'
              }}
            ></div>
          </div>

          {/* Coordinates Info */}
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '0.5rem',
            color: 'white',
            fontSize: '0.875rem'
          }}>
            <strong>Coordinates:</strong> {lat && lng ? 
              `Latitude: ${parseFloat(lat).toFixed(6)}, Longitude: ${parseFloat(lng).toFixed(6)}` : 
              'No location data available'
            }
          </div>
        </div>
      )}
    </>
  );
};

// Profile View Modal Component
const ProfileViewModal = ({ user, onClose, onPasswordReset, onSeedsUpdate }) => {
  const [resetPassword, setResetPassword] = useState({
    newPassword: '',
    confirmPassword: '',
    showPassword: false
  });
  const [isResetting, setIsResetting] = useState(false);
  const [seedsData, setSeedsData] = useState({
    seedsCount: user.seedsCount || 0,
    bonus: user.bonus || 0,
    price: user.price || 0,
    seedType: user.seedType || 'Hardyline'
  });
  const [isSavingSeeds, setIsSavingSeeds] = useState(false);
  
  // Hatchery states
  const [hatchery, setHatchery] = useState(null);
  const [loadingHatchery, setLoadingHatchery] = useState(false);
  const [approvingHatchery, setApprovingHatchery] = useState(false);
  const [deletingHatchery, setDeletingHatchery] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [showImageViewer, setShowImageViewer] = useState(false);

  // Fetch hatchery data when modal opens
  useEffect(() => {
    if (user?.userId || user?._id) {
      loadHatchery();
    }
  }, [user]);

  const loadHatchery = async () => {
    const userId = user?.userId || user?._id;
    if (!userId) return;
    
    setLoadingHatchery(true);
    try {
      const response = await getUserHatcheries(userId, true);
      if (response.success && response.hatcheries && response.hatcheries.length > 0) {
        // Get the most recent hatchery (first one)
        setHatchery(response.hatcheries[0]);
      } else {
        setHatchery(null);
      }
    } catch (error) {
      console.error('Error loading hatchery:', error);
      setHatchery(null);
    } finally {
      setLoadingHatchery(false);
    }
  };

  // Check if all 4 images are uploaded
  const allImagesApproved = hatchery?.images?.length === 4;

  const handleApproveHatchery = async () => {
    if (!hatchery || !user) return;

    if (!window.confirm('Are you sure you want to approve this hatchery? This will complete the transaction and reset all image slots for the user.')) {
      return;
    }

    setApprovingHatchery(true);
    try {
      // Get admin data from localStorage
      const adminData = localStorage.getItem('adminData');
      const admin = adminData ? JSON.parse(adminData) : null;

      const response = await approveHatchery({
        hatcheryId: hatchery._id,
        userId: user.userId || user._id,
        adminId: admin?.profile?._id || admin?._id || admin?.id,
        adminName: admin?.name || 'Admin',
      });

      if (response.success) {
        alert('Hatchery approved successfully! Image slots have been reset.');
        loadHatchery(); // Reload to show reset state
      } else {
        alert(response.message || 'Failed to approve hatchery');
      }
    } catch (error) {
      console.error('Error approving hatchery:', error);
      alert(error.message || 'Failed to approve hatchery');
    } finally {
      setApprovingHatchery(false);
    }
  };

  const handleDeleteHatchery = async () => {
    if (!hatchery || !user) return;

    if (!window.confirm('Are you sure you want to delete this hatchery? This will reset all image slots WITHOUT creating a purchase history entry. The slots will remain locked until you update the seeds count.')) {
      return;
    }

    setDeletingHatchery(true);
    try {
      // Get admin data from localStorage
      const adminData = localStorage.getItem('adminData');
      const admin = adminData ? JSON.parse(adminData) : null;

      const response = await deleteAndResetHatchery({
        hatcheryId: hatchery._id,
        userId: user.userId || user._id,
        adminId: admin?.profile?._id || admin?._id || admin?.id,
        adminName: admin?.name || 'Admin',
      });

      if (response.success) {
        alert('Hatchery deleted successfully! Image slots have been reset and are now locked.');
        loadHatchery(); // Reload to show reset state
      } else {
        alert(response.message || 'Failed to delete hatchery');
      }
    } catch (error) {
      console.error('Error deleting hatchery:', error);
      alert(error.message || 'Failed to delete hatchery');
    } finally {
      setDeletingHatchery(false);
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImageUrl(imageUrl);
    setShowImageViewer(true);
  };

  const handleSeedsUpdate = async () => {
    setIsSavingSeeds(true);
    try {
      await onSeedsUpdate(user._id, seedsData);
      alert('Seeds information updated successfully!');
    } catch (error) {
      console.error('Seeds update error:', error);
      alert('Failed to update seeds information');
    } finally {
      setIsSavingSeeds(false);
    }
  };

  const generateRandomPassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleGeneratePassword = () => {
    const newPass = generateRandomPassword();
    setResetPassword(prev => ({
      ...prev,
      newPassword: newPass,
      confirmPassword: newPass
    }));
  };

  const handleCopyPassword = () => {
    if (resetPassword.newPassword) {
      navigator.clipboard.writeText(resetPassword.newPassword);
      alert('Password copied to clipboard!');
    }
  };

  const handlePasswordReset = async () => {
    if (!resetPassword.newPassword || !resetPassword.confirmPassword) {
      alert('Please fill in both password fields');
      return;
    }

    if (resetPassword.newPassword !== resetPassword.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (resetPassword.newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

  setIsResetting(true);
  try {
    // 🔍 DEBUG: Check which ID we're using
    console.log('🔍 ProfileViewModal - Using user._id:', user._id);
    console.log('🔍 ProfileViewModal - Using user.userId:', user.userId);
    
    // Try using _id first (MongoDB ObjectId)
    await onPasswordReset(user._id, resetPassword.newPassword);
    setResetPassword({ newPassword: '', confirmPassword: '', showPassword: false });
  } catch (error) {
    console.error('Password reset error:', error);
  } finally {
    setIsResetting(false);
  }
};

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          position: 'relative'
        }}
      >
        <div 
          className="modal-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            borderRadius: '1rem 1rem 0 0'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>User Profile</h2>
          <button 
            className="modal-close-btn" 
            onClick={onClose}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#dc2626';
              e.target.style.transform = 'rotate(90deg)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#ef4444';
              e.target.style.transform = 'rotate(0deg)';
            }}
          >
            <FiX />
          </button>
        </div>

        <div className="modal-content" style={{ padding: '2rem' }}>
          {/* User Profile Avatar Section */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '2rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div style={{
              width: '130px',
              height: '130px',
              borderRadius: '50%',
              backgroundColor: '#e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              fontWeight: '700',
              color: '#6b7280',
              overflow: 'hidden',
              marginBottom: '1rem',
              border: '4px solid #5B7C99'
            }}>
              {user.profileImage?.url ? (
                <img
                  src={user.profileImage.url}
                  alt={user.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                user.name?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#111827' }}>
              {user.name || 'Unknown User'}
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
              {user.phoneNumber || 'No phone'}
            </p>
          </div>

          {/* User Profile Section */}
          <div className="profile-section" style={{ marginBottom: '2rem' }}>
            <div
              className="section-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1.25rem',
                paddingBottom: '0.75rem',
                borderBottom: '2px solid #5B7C99'
              }}
            >
              <FiUser className="section-icon" style={{ color: '#5B7C99', fontSize: '1.25rem' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#111827' }}>Personal Information</h3>
            </div>

            <div
              className="profile-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}
            >
              <div className="profile-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.8rem' }}>Full Name</label>
                <div
                  className="field-value"
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    color: '#4b5563',
                    fontSize: '0.9rem'
                  }}
                >
                  {user.name || 'N/A'}
                </div>
              </div>

              <div className="profile-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.8rem' }}>Phone Number</label>
                <div
                  className="field-value"
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    color: '#4b5563',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <FiPhone style={{ marginRight: '8px', opacity: 0.7, fontSize: '0.9rem' }} />
                  {user.phoneNumber || 'N/A'}
                </div>
              </div>

              <div className="profile-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
                <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.8rem' }}>Email</label>
                <div
                  className="field-value"
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    color: '#4b5563',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <FiMail style={{ marginRight: '8px', opacity: 0.7, fontSize: '0.9rem' }} />
                  {user.email || 'N/A'}
                </div>
              </div>

              <div className="profile-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.8rem' }}>Country</label>
                <div
                  className="field-value"
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    color: '#4b5563',
                    fontSize: '0.9rem'
                  }}
                >
                  {user.country || 'N/A'}
                </div>
              </div>

              <div className="profile-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.8rem' }}>State</label>
                <div
                  className="field-value"
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    color: '#4b5563',
                    fontSize: '0.9rem'
                  }}
                >
                  {user.state || 'N/A'}
                </div>
              </div>

              <div className="profile-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.8rem' }}>District</label>
                <div
                  className="field-value"
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    color: '#4b5563',
                    fontSize: '0.9rem'
                  }}
                >
                  {user.district || 'N/A'}
                </div>
              </div>

              <div className="profile-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.8rem' }}>Pincode</label>
                <div
                  className="field-value"
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    color: '#4b5563',
                    fontSize: '0.9rem'
                  }}
                >
                  {user.pincode || 'N/A'}
                </div>
              </div>

              <div
                className="profile-field"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  gridColumn: '1 / -1'
                }}
              >
                <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.75rem' }}>Full Address</label>
                <div
                  className="field-value"
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    color: '#4b5563',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <FiHome style={{ marginRight: '6px', opacity: 0.7, fontSize: '0.875rem', flexShrink: 0 }} />
                  {user.fullAddress || user.address || 'N/A'}
                </div>
              </div>

              <div className="profile-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.8rem' }}>Registration Date</label>
                <div
                  className="field-value"
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    color: '#4b5563',
                    fontSize: '0.9rem'
                  }}
                >
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Seeds Information Section */}
          <div className="seeds-section" style={{ marginBottom: '2rem' }}>
            <div
              className="section-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1.25rem',
                paddingBottom: '0.75rem',
                borderBottom: '2px solid #5B7C99'
              }}
            >
              <FiPackage className="section-icon" style={{ color: '#5B7C99', fontSize: '1.25rem' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#111827' }}>Seeds Information</h3>
            </div>

            <div
              className="seeds-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}
            >
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}
              >
                <input
                  type="number"
                  value={seedsData.seedsCount}
                  onChange={(e) => setSeedsData(prev => ({ ...prev, seedsCount: parseInt(e.target.value) || 0 }))}
                  style={{
                    width: '100%',
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#0369a1',
                    textAlign: 'center',
                    border: '1px solid #bae6fd',
                    borderRadius: '0.375rem',
                    padding: '0.25rem',
                    backgroundColor: 'white'
                  }}
                />
                <div style={{ fontSize: '0.75rem', color: '#0c4a6e', fontWeight: '500', marginTop: '0.25rem' }}>Seeds Count</div>
              </div>

              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}
              >
                <input
                  type="number"
                  value={seedsData.bonus}
                  onChange={(e) => setSeedsData(prev => ({ ...prev, bonus: parseInt(e.target.value) || 0 }))}
                  style={{
                    width: '100%',
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#15803d',
                    textAlign: 'center',
                    border: '1px solid #bbf7d0',
                    borderRadius: '0.375rem',
                    padding: '0.25rem',
                    backgroundColor: 'white'
                  }}
                />
                <div style={{ fontSize: '0.75rem', color: '#14532d', fontWeight: '500', marginTop: '0.25rem' }}>Bonus</div>
              </div>

              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#fefce8',
                  border: '1px solid #fde047',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}
              >
                <input
                  type="number"
                  step="0.01"
                  value={seedsData.price}
                  onChange={(e) => setSeedsData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  style={{
                    width: '100%',
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#a16207',
                    textAlign: 'center',
                    border: '1px solid #fde047',
                    borderRadius: '0.375rem',
                    padding: '0.25rem',
                    backgroundColor: 'white'
                  }}
                />
                <div style={{ fontSize: '0.75rem', color: '#713f12', fontWeight: '500', marginTop: '0.25rem' }}>Price</div>
              </div>

              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#fce7f3',
                  border: '1px solid #fbcfe8',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}
              >
                <input
                  type="text"
                  value={seedsData.seedType}
                  onChange={(e) => setSeedsData(prev => ({ ...prev, seedType: e.target.value }))}
                  placeholder="Enter seed type"
                  style={{
                    width: '100%',
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#9f1239',
                    textAlign: 'center',
                    border: '1px solid #fbcfe8',
                    borderRadius: '0.375rem',
                    padding: '0.25rem',
                    backgroundColor: 'white'
                  }}
                />
                <div style={{ fontSize: '0.75rem', color: '#881337', fontWeight: '500', marginTop: '0.25rem' }}>Seed Type</div>
              </div>
            </div>

            <button
              onClick={handleSeedsUpdate}
              disabled={isSavingSeeds}
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                backgroundColor: isSavingSeeds ? '#9ca3af' : '#5B7C99',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: isSavingSeeds ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {isSavingSeeds ? (
                <>
                  <FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} />
                  Saving...
                </>
              ) : (
                <>
                  <FiCheckCircle />
                  Update Seeds Information
                </>
              )}
            </button>
          </div>

          {/* Hatchery Images Section */}
          <div className="hatchery-images-section" style={{ marginBottom: '2rem' }}>
            <div
              className="section-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1.25rem',
                paddingBottom: '0.75rem',
                borderBottom: '2px solid #5B7C99'
              }}
            >
              <FiImage className="section-icon" style={{ color: '#5B7C99', fontSize: '1.25rem' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#111827' }}>
                Hatchery Images {hatchery?.images?.length ? `(${hatchery.images.length}/4)` : '(0/4)'}
              </h3>
            </div>

            {loadingHatchery ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <FiRefreshCw style={{ fontSize: '2rem', color: '#5B7C99', animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>Loading hatchery images...</p>
              </div>
            ) : hatchery?.images && hatchery.images.length > 0 ? (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  {[0, 1, 2, 3].map((index) => {
                    const image = hatchery.images[index];
                    return (
                      <div
                        key={index}
                        style={{
                          position: 'relative',
                          aspectRatio: '1',
                          borderRadius: '0.5rem',
                          overflow: 'hidden',
                          backgroundColor: '#f3f4f6',
                          border: '1px solid #e5e7eb',
                          cursor: image?.url ? 'pointer' : 'default'
                        }}
                        onClick={() => image?.url && handleImageClick(image.url)}
                      >
                        {image?.url ? (
                          <>
                            <img
                              src={image.url}
                              alt={`Hatchery image ${index + 1}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                            {image.location && (
                              <div style={{
                                position: 'absolute',
                                top: '0.5rem',
                                right: '0.5rem',
                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                borderRadius: '0.5rem',
                                padding: '0.25rem 0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}>
                                <FiMapPin style={{ fontSize: '0.75rem', color: 'white' }} />
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#9ca3af',
                            border: '2px dashed #d1d5db'
                          }}>
                            <FiImage style={{ fontSize: '2rem', marginBottom: '0.5rem' }} />
                            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Slot {index + 1}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Delete Hatchery Button - Always enabled if hatchery exists */}
                <button
                  onClick={handleDeleteHatchery}
                  disabled={deletingHatchery}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: deletingHatchery ? '#9ca3af' : '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: deletingHatchery ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!deletingHatchery) {
                      e.target.style.backgroundColor = '#dc2626';
                      e.target.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!deletingHatchery) {
                      e.target.style.backgroundColor = '#ef4444';
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {deletingHatchery ? (
                    <>
                      <FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FiTrash2 />
                      Delete Hatchery
                    </>
                  )}
                </button>
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb'
              }}>
                <FiImage style={{ fontSize: '3rem', color: '#9ca3af', marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, color: '#6b7280', fontWeight: '500' }}>No hatchery images uploaded yet</p>
              </div>
            )}
          </div>

          {/* Password Reset Section */}
          <div className="password-reset-section" style={{ marginBottom: '1rem' }}>
            <div
              className="section-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
                paddingBottom: '0.5rem',
                borderBottom: '2px solid #5B7C99'
              }}
            >
              <FiKey className="section-icon" style={{ color: '#5B7C99', fontSize: '1.25rem' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#111827' }}>Reset Password</h3>
            </div>

            <div 
              className="password-form"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>New Password (min 6 characters)</label>
                <div
                  className="password-input-group"
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <input
                    type={resetPassword.showPassword ? "text" : "password"}
                    value={resetPassword.newPassword}
                    onChange={(e) => setResetPassword(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                    minLength={6}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      paddingRight: '5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                  {/* Copy Password Icon */}
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={handleCopyPassword}
                    title="Copy password"
                    style={{
                      position: 'absolute',
                      right: '2.75rem',
                      background: 'none',
                      border: 'none',
                      color: resetPassword.newPassword ? '#6b7280' : '#d1d5db',
                      cursor: resetPassword.newPassword ? 'pointer' : 'not-allowed',
                      padding: '0.25rem',
                      borderRadius: '0.25rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (resetPassword.newPassword) {
                        e.currentTarget.style.color = '#10b981';
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = resetPassword.newPassword ? '#6b7280' : '#d1d5db';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    disabled={!resetPassword.newPassword}
                  >
                    <FiCopy />
                  </button>
                  {/* Show/Hide Password Icon */}
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setResetPassword(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                    title={resetPassword.showPassword ? "Hide password" : "Show password"}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      borderRadius: '0.25rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#374151';
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#6b7280';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <FiEye />
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Confirm Password</label>
                <input
                  type={resetPassword.showPassword ? "text" : "password"}
                  value={resetPassword.confirmPassword}
                  onChange={(e) => setResetPassword(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>


              <button
                type="button"
                className="btn-reset"
                onClick={handlePasswordReset}
                disabled={isResetting || !resetPassword.newPassword || !resetPassword.confirmPassword}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: isResetting || !resetPassword.newPassword || !resetPassword.confirmPassword ? '#9ca3af' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: isResetting || !resetPassword.newPassword || !resetPassword.confirmPassword ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  marginTop: '1rem'
                }}
                onMouseEnter={(e) => {
                  if (!isResetting && resetPassword.newPassword && resetPassword.confirmPassword) {
                    e.target.style.backgroundColor = '#dc2626';
                    e.target.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isResetting && resetPassword.newPassword && resetPassword.confirmPassword) {
                    e.target.style.backgroundColor = '#ef4444';
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                {isResetting ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal for hatchery images */}
      {showImageViewer && selectedImageUrl && (
        <FullscreenImageModal
          imageUrl={selectedImageUrl}
          onClose={() => {
            setShowImageViewer(false);
            setSelectedImageUrl(null);
          }}
        />
      )}
    </div>
  );
};

// Fullscreen Image Modal Component
const FullscreenImageModal = ({ imageUrl, onClose }) => {
  return (
    <div
      className="fullscreen-image-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}
    >
      <button
        className="fullscreen-close-btn"
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '2rem',
          right: '2rem',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          cursor: 'pointer',
          zIndex: 10,
          transition: 'all 0.2s',
          boxShadow: '0 4px 8px rgba(239, 68, 68, 0.3)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#dc2626';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#ef4444';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <FiX />
      </button>

      <div
        className="fullscreen-image-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <img
          src={imageUrl}
          alt="Fullscreen view"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
            borderRadius: '0.5rem',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            objectFit: 'contain'
          }}
        />
      </div>
    </div>
  );
};

const AdminDashboardContent = () => {
  const navigate = useNavigate();

  // User management states
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [rejectedUsers, setRejectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Image modal states
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);

  // Profile modal state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Stories state
  const [stories, setStories] = useState([]);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [loadingStories, setLoadingStories] = useState(false);

  useEffect(() => {
    fetchAllUserData();
    loadAdminStories();
  }, []);

  const fetchAllUserData = async () => {
    try {
      // Get admin ID from localStorage
      let adminId = null;
      const storedAdminData = localStorage.getItem('adminData');
      if (storedAdminData) {
        try {
          const adminData = JSON.parse(storedAdminData);
          adminId = adminData.profile?._id || adminData._id || adminData.id;
        } catch (error) {
          console.error('Error parsing admin data:', error);
        }
      }

      // Fetch pending users (filtered by admin)
      const pendingResponse = await getPendingUsers(adminId);
      if (pendingResponse.success) {
        setPendingUsers(pendingResponse.pendingUsers);
      }

      // Fetch approved users (filtered by admin)
      const approvedResponse = await getApprovedUsers(adminId);
      if (approvedResponse.success) {
        setApprovedUsers(approvedResponse.approvedUsers);
      }

      // Fetch rejected users (filtered by admin)
      const rejectedResponse = await getRejectedUsers(adminId);
      if (rejectedResponse.success) {
        setRejectedUsers(rejectedResponse.rejectedUsers);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load admin stories
  const loadAdminStories = async () => {
    try {
      setLoadingStories(true);
      const response = await getAdminStories();
      if (response.success) {
        setStories(response.stories || []);
      }
    } catch (error) {
      console.error('Error loading admin stories:', error);
    } finally {
      setLoadingStories(false);
    }
  };

  // Handle story press
  const handleStoryPress = (index) => {
    setSelectedStoryIndex(index);
    setShowStoryViewer(true);
  };

  // Handle delete story
  const handleDeleteStory = async (storyId) => {
    if (!window.confirm('Are you sure you want to delete this story? It will be removed from all users.')) {
      return;
    }

    try {
      const response = await deleteAdminStory(storyId);
      if (response.success) {
        // Reload stories
        loadAdminStories();
        alert('Story deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Failed to delete story');
    }
  };

  // Calculate stats
  const totalUsers = approvedUsers?.length || 0;
  const pendingCount = pendingUsers?.length || 0;
  const approvedCount = approvedUsers?.length || 0;
  const declinedCount = rejectedUsers?.length || 0;

  // ✅ Handle status change
  const handleStatusChange = async (userId, newStatus) => {
    try {
      console.log(`Changing status for user ${userId} to ${newStatus}`);
      // TODO: Implement API call to update user status
      // const response = await updateUserStatus(userId, newStatus);
      
      // Update local state
      setApprovedUsers(prev => 
        prev.map(user => 
          user.userId === userId ? { ...user, status: newStatus } : user
        )
      );
      
      alert(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  // ✅ Handle view profile
  const handleViewProfile = (user) => {
  console.log('👤 DEBUG - Full user object:', user);
  console.log('🆔 DEBUG - User _id:', user._id);
  console.log('🆔 DEBUG - User userId:', user.userId);
  console.log('📞 DEBUG - User phoneNumber:', user.phoneNumber);
  setSelectedUser(user);
  setProfileModalOpen(true);
  };

  // ✅ Handle password reset
// ✅ Handle password reset - UPDATED VERSION
const handlePasswordReset = async (userId, newPassword) => {
  try {
    console.log('🔍 DEBUG - User object in handlePasswordReset:', selectedUser);
    console.log('🔍 DEBUG - User ID being passed:', userId);
    console.log('🔍 DEBUG - User ID type:', typeof userId);
    console.log('🔍 DEBUG - Is valid ObjectId?', /^[0-9a-fA-F]{24}$/.test(userId));
    
    const response = await fetch('http://localhost:3000/api/user/password-reset/user', { // ✅ FIXED ENDPOINT
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        newPassword: newPassword,
        adminId: 'admin123'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to reset password');
    }

    if (data.success) {
      alert('Password reset successfully!');
      
      // Close modal after successful reset
      setProfileModalOpen(false);
      setSelectedUser(null);
      
      return data;
    } else {
      throw new Error(data.message || 'Failed to reset password');
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    alert(`Failed to reset password: ${error.message}`);
    throw error;
  }
};

  // ✅ Handle seeds update
  const handleSeedsUpdate = async (userId, seedsData) => {
    try {
      const response = await updateUserSeeds(userId, seedsData);

      if (response.success) {
        // Update the local state to reflect the changes
        setApprovedUsers(prev =>
          prev.map(user =>
            user._id === userId
              ? { ...user, ...seedsData }
              : user
          )
        );

        // Update selected user if modal is open
        if (selectedUser && selectedUser._id === userId) {
          setSelectedUser(prev => ({ ...prev, ...seedsData }));
        }

        return response;
      } else {
        throw new Error(response.message || 'Failed to update seeds');
      }
    } catch (error) {
      console.error('Error updating seeds:', error);
      throw error;
    }
  };

  // ✅ Handle image click (view full size)
  const handleImageClick = (seller, imageUrl) => {
    setSelectedSeller(seller);
    setSelectedImage(imageUrl);
    setImageModalOpen(true);
    setImageZoom(1);
  };

  // ✅ Handle zoom in
  const handleZoomIn = () => {
    setImageZoom(prev => Math.min(prev + 0.25, 3)); // Max zoom 300%
  };

  // ✅ Handle zoom out
  const handleZoomOut = () => {
    setImageZoom(prev => Math.max(prev - 0.25, 0.5)); // Min zoom 50%
  };

  // ✅ Handle modal close
  const handleCloseModal = () => {
    setImageModalOpen(false);
    setSelectedSeller(null);
    setSelectedImage('');
  };


  // ✅ Loading state
  if (loading) {
    return (
      <div className="admin-main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <FiActivity style={{ fontSize: '3rem', color: '#5B7C99', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '1rem', color: '#666' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-main-content">
      {/* Header */}
      <div className="admin-content-header">
        <h1 className="admin-page-title">Dashboard Overview</h1>
        <p className="admin-page-subtitle">
          Welcome back! Here's what's happening with your platform.
        </p>
      </div>

      {/* My Status - Admin Stories */}
      {stories.length > 0 && (
        <div className="admin-card" style={{ marginBottom: '2rem' }}>
          <div className="admin-card-header">
            <div className="admin-card-title">
              <h3>My Status</h3>
              <p>Your active stories visible to all users</p>
            </div>
          </div>
          <div className="admin-card-content">
            <Stories
              stories={stories}
              onStoryPress={handleStoryPress}
              showDelete={true}
              onDelete={handleDeleteStory}
            />
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        {/* Total Users Card */}
        <div className="admin-stat-card" onClick={() => navigate('/admin/sellers')}>
          <div className="admin-stat-icon admin-stat-info">
            <FiUsers />
          </div>
          <div className="admin-stat-content">
            <h3>{totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>

        {/* Pending Card */}
        <div className="admin-stat-card" onClick={() => navigate('/admin/pending')}>
          <div className="admin-stat-icon admin-stat-warning">
            <FiClock />
          </div>
          <div className="admin-stat-content">
            <h3>{pendingCount}</h3>
            <p>Pending Approval</p>
          </div>
        </div>

        {/* Approved Card */}
        <div className="admin-stat-card" onClick={() => navigate('/admin/sellers')}>
          <div className="admin-stat-icon admin-stat-success">
            <FiCheckCircle />
          </div>
          <div className="admin-stat-content">
            <h3>{approvedCount}</h3>
            <p>Approved Users</p>
          </div>
        </div>

        {/* Declined Card */}
        <div className="admin-stat-card" onClick={() => navigate('/admin/declined')}>
          <div className="admin-stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
            <FiXCircle />
          </div>
          <div className="admin-stat-content">
            <h3>{declinedCount}</h3>
            <p>Declined Users</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}



      {/* ✅ Approved Users Table - Separate Section */}
      <div className="admin-card" style={{ marginTop: '2rem' }}>
        <div className="admin-card-header">
          <div className="admin-card-title">
            <FiUsers style={{ fontSize: '1.25rem', color: '#5B7C99' }} />
            <div>
              <h3>Approved Users</h3>
              <p>View and manage approved user accounts</p>
            </div>
          </div>
          <button 
            className="admin-btn-primary"
            onClick={() => navigate('/admin/sellers')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          >
            View All Users
          </button>
        </div>

        <div className="admin-card-content">
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone Number</th>
                  <th>Date</th>
                  <th>Seeds</th>
                  <th>Images</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                      <FiUsers style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }} />
                      <p>No approved users found</p>
                    </td>
                  </tr>
                ) : (
                  approvedUsers.slice(0, 10).map(user => (
                    <tr key={user._id}>
                      <td>
                        <div className="member-cell">
                          <div className="member-avatar">
                            {user.profileImage?.url ? (
                              <img
                                src={user.profileImage.url}
                                alt={user.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                              />
                            ) : (
                              user.name?.charAt(0)?.toUpperCase() || 'U'
                            )}
                          </div>
                          <div className="member-info">
                            <div className="member-name">{user.name || 'Unknown'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="phone-cell">
                          <FiPhone style={{ fontSize: "0.875rem", opacity: 0.6, marginRight: '0.25rem' }} />
                          {user.phoneNumber || 'N/A'}
                        </div>
                      </td>
                      <td>
                        {user.images && user.images.length > 0
                          ? new Date(user.images[0].uploadedAt || user.images[0].createdAt).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td>
                        <span className="seeds-badge">{user.seedsAvailable?.toLocaleString() || 0}</span>
                      </td>
                      <td>
                        <div className="images-cell" style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {user.images && user.images.length > 0 ? (
                            user.images.slice(0, 4).map((img, idx) => (
                              <img
                                key={idx}
                                src={img.url}
                                alt={`User image ${idx + 1}`}
                                className="table-image-thumb"
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  objectFit: 'cover',
                                  borderRadius: '0.25rem',
                                  cursor: 'pointer',
                                  border: '1px solid #e5e7eb'
                                }}
                                onClick={() => handleImageClick(user, img.url)}
                                title="Click to view full size"
                              />
                            ))
                          ) : (
                            <span className="no-images-text" style={{ fontSize: '0.75rem', color: '#999' }}>No images</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn-view-profile"
                          onClick={() => handleViewProfile(user)}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#5B7C99',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#4a6b85';
                            e.target.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#5B7C99';
                            e.target.style.transform = 'translateY(0)';
                          }}
                        >
                          <FiEye size={14} />
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Profile View Modal */}
          {profileModalOpen && selectedUser && (
            <ProfileViewModal
              user={selectedUser}
              onClose={() => {
                setProfileModalOpen(false);
                setSelectedUser(null);
              }}
              onPasswordReset={handlePasswordReset}
              onSeedsUpdate={handleSeedsUpdate}
            />
          )}

          {/* Image Zoom Modal - Scrollable */}
          {imageModalOpen && (
            <div 
              className="image-modal-overlay" 
              onClick={() => setImageModalOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                overflowY: 'auto'
              }}
            >
              <div 
                className="image-modal-container" 
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'relative',
                  backgroundColor: '#ffffff',
                  borderRadius: '1rem',
                  maxWidth: '1400px',
                  width: '100%',
                  maxHeight: '95vh',
                  overflow: 'hidden',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  margin: 'auto'
                }}
              >
                <button 
                  className="modal-close-btn" 
                  onClick={() => setImageModalOpen(false)}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    zIndex: 10,
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                    e.currentTarget.style.transform = 'rotate(90deg)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                    e.currentTarget.style.transform = 'rotate(0deg)';
                  }}
                >
                  <FiX />
                </button>

                <div 
                  className="image-modal-content"
                  style={{
                    display: 'grid',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '95vh',
                    overflow: 'hidden'
                  }}
                >
                  {/* Left Side - Image Viewer */}
                  <div
                    className="image-viewer-section"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      borderRight: '1px solid #e5e7eb',
                      backgroundColor: '#f9fafb',
                      maxHeight: '95vh',
                      overflowY: 'auto'
                    }}
                  >
                    <div 
                      className="image-viewer-header"
                      style={{
                        padding: '1rem 1.5rem',
                        borderBottom: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#ffffff',
                        flexShrink: 0
                      }}
                    >
                      <h3 style={{
                        margin: 0,
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#374151'
                      }}>Image Preview</h3>
                      <div 
                        className="zoom-controls"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          backgroundColor: '#f3f4f6',
                          padding: '0.5rem',
                          borderRadius: '0.5rem'
                        }}
                      >
                        <button 
                          onClick={handleZoomOut} 
                          title="Zoom Out"
                          style={{
                            width: '36px',
                            height: '36px',
                            border: '1px solid #d1d5db',
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#6b7280',
                            fontSize: '16px',
                            fontWeight: '500',
                            transition: 'all 0.15s ease-in-out',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                            position: 'relative'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#5B7C99';
                            e.target.style.borderColor = '#5B7C99';
                            e.target.style.color = '#ffffff';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 8px rgba(91, 124, 153, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#ffffff';
                            e.target.style.borderColor = '#d1d5db';
                            e.target.style.color = '#6b7280';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                          }}
                          onMouseDown={(e) => {
                            e.target.style.transform = 'scale(0.95)';
                          }}
                          onMouseUp={(e) => {
                            e.target.style.transform = 'translateY(-1px)';
                          }}
                        >
                          <FiZoomOut />
                        </button>
                        <span style={{
                          minWidth: '50px',
                          textAlign: 'center',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#111827'
                        }}>{Math.round(imageZoom * 100)}%</span>
                        <button 
                          onClick={handleZoomIn} 
                          title="Zoom In"
                          style={{
                            width: '36px',
                            height: '36px',
                            border: '1px solid #d1d5db',
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#6b7280',
                            fontSize: '16px',
                            fontWeight: '500',
                            transition: 'all 0.15s ease-in-out',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                            position: 'relative'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#5B7C99';
                            e.target.style.borderColor = '#5B7C99';
                            e.target.style.color = '#ffffff';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 8px rgba(91, 124, 153, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#ffffff';
                            e.target.style.borderColor = '#d1d5db';
                            e.target.style.color = '#6b7280';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                          }}
                          onMouseDown={(e) => {
                            e.target.style.transform = 'scale(0.95)';
                          }}
                          onMouseUp={(e) => {
                            e.target.style.transform = 'translateY(-1px)';
                          }}
                        >
                          <FiZoomIn />
                        </button>
                        <button 
                          onClick={() => setImageZoom(1)} 
                          title="Reset Zoom"
                          style={{
                            width: '36px',
                            height: '36px',
                            border: '1px solid #d1d5db',
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#6b7280',
                            fontSize: '16px',
                            fontWeight: '500',
                            transition: 'all 0.15s ease-in-out',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                            position: 'relative'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#5B7C99';
                            e.target.style.borderColor = '#5B7C99';
                            e.target.style.color = '#ffffff';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 8px rgba(91, 124, 153, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#ffffff';
                            e.target.style.borderColor = '#d1d5db';
                            e.target.style.color = '#6b7280';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                          }}
                          onMouseDown={(e) => {
                            e.target.style.transform = 'scale(0.95)';
                          }}
                          onMouseUp={(e) => {
                            e.target.style.transform = 'translateY(-1px)';
                          }}
                        >
                          <FiRotateCcw />
                        </button>
                      </div>
                    </div>
                    <div 
                      className="image-viewer-container"
                      style={{
                        flex: 1,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '1rem',
                        gap: '1.5rem'
                      }}
                    >
                      {/* Image Container - Full image visible without scrolling */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        flexShrink: 0,
                        position: 'relative'
                      }}>
                        <img
                          src={selectedImage}
                          alt="Seller submission"
                          style={{
                            transform: `scale(${imageZoom})`,
                            transformOrigin: 'center',
                            maxWidth: '100%',
                            width: 'auto',
                            height: 'auto',
                            borderRadius: '0.5rem',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                            transition: 'transform 0.2s',
                            display: 'block'
                          }}
                        />

                        {/* Fullscreen Button */}
                        <button
                          onClick={() => setShowFullscreenImage(true)}
                          style={{
                            position: 'absolute',
                            bottom: '1rem',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: 'rgba(91, 124, 153, 0.9)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '2rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                            backdropFilter: 'blur(10px)',
                            zIndex: 5
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(74, 107, 133, 0.95)';
                            e.target.style.transform = 'translateX(-50%) scale(1.05)';
                            e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'rgba(91, 124, 153, 0.9)';
                            e.target.style.transform = 'translateX(-50%) scale(1)';
                            e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                          }}
                        >
                          <FiMaximize size={16} />
                          View Fullscreen
                        </button>
                      </div>
                      
                      {/* Image Details with Map */}
                      <ImageDetailsWithMap 
                        selectedSeller={selectedSeller} 
                        selectedImage={selectedImage} 
                      />
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {showFullscreenImage && selectedImage && (
        <FullscreenImageModal
          imageUrl={selectedImage}
          onClose={() => setShowFullscreenImage(false)}
        />
      )}

      {/* Story Viewer Modal */}
      <StoryViewer
        visible={showStoryViewer}
        stories={stories}
        initialIndex={selectedStoryIndex}
        onClose={() => setShowStoryViewer(false)}
        onStoryViewed={() => {}} // Admin doesn't need to mark as viewed
      />
    </div>
  );
};

export default AdminDashboardContent;