import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiEye, FiPhone, FiMapPin, FiUsers, FiActivity,
  FiX, FiZoomOut, FiZoomIn, FiRotateCw, FiMessageSquare,
  FiCheckCircle, FiXCircle, FiMaximize, FiMinimize,
  FiUser, FiHome, FiMail, FiCopy, FiRefreshCw, FiKey, FiPackage
} from 'react-icons/fi';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../CSS/AdminSellers.css';
import { getApprovedUsers, updateUserSeeds, resetUserPassword } from "../services/adminApi";

// ImageDetailsWithMap Component
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
    seedsAvailable: user.seedsAvailable || 0,
    seedsSold: user.seedsSold || 0,
    activeBatches: user.activeBatches || 0
  });
  const [isSavingSeeds, setIsSavingSeeds] = useState(false);

  const handleSeedsUpdate = async () => {
    setIsSavingSeeds(true);
    try {
      await onSeedsUpdate(user._id, seedsData);
    } catch (error) {
      console.error('Seeds update error:', error);
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
    // Trim passwords to remove whitespace
    const trimmedPassword = resetPassword.newPassword.trim();
    const trimmedConfirmPassword = resetPassword.confirmPassword.trim();

    if (!trimmedPassword || !trimmedConfirmPassword) {
      alert('Please fill in both password fields');
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (trimmedPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    setIsResetting(true);
    try {
      await onPasswordReset(user.userId || user._id, trimmedPassword);
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
                  style={{ width: '130%', height: '130%', objectFit: 'cover' }}
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
                  gap: '0.5rem',
                  gridColumn: '1 / -1'
                }}
              >
                <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.8rem' }}>Full Address</label>
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
                  <FiHome style={{ marginRight: '8px', opacity: 0.7, fontSize: '0.9rem', flexShrink: 0 }} />
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
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '1rem',
                marginBottom: '1.25rem'
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
                  value={seedsData.seedsAvailable}
                  onChange={(e) => setSeedsData(prev => ({ ...prev, seedsAvailable: parseInt(e.target.value) || 0 }))}
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
                <div style={{ fontSize: '0.75rem', color: '#0c4a6e', fontWeight: '500', marginTop: '0.25rem' }}>Seeds Available</div>
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
                  value={seedsData.seedsSold}
                  onChange={(e) => setSeedsData(prev => ({ ...prev, seedsSold: parseInt(e.target.value) || 0 }))}
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
                <div style={{ fontSize: '0.75rem', color: '#14532d', fontWeight: '500', marginTop: '0.25rem' }}>Seeds Sold</div>
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
                  value={seedsData.activeBatches}
                  onChange={(e) => setSeedsData(prev => ({ ...prev, activeBatches: parseInt(e.target.value) || 0 }))}
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
                <div style={{ fontSize: '0.75rem', color: '#713f12', fontWeight: '500', marginTop: '0.25rem' }}>Active Batches</div>
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

          {/* Password Reset Section */}
          <div className="password-reset-section" style={{ marginBottom: '2rem' }}>
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
              <FiKey className="section-icon" style={{ color: '#5B7C99', fontSize: '1.25rem' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#111827' }}>Reset Password</h3>
            </div>

            <div
              className="password-form"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem'
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

const AdminSellers = () => {
  const navigate = useNavigate();
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Image modal states
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Profile modal state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fullscreen image modal state
  const [fullscreenImageOpen, setFullscreenImageOpen] = useState(false);
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState('');

  useEffect(() => {
    fetchApprovedUsers();
  }, []);

  const fetchApprovedUsers = async () => {
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

      // Fetch approved users filtered by admin ID
      const approvedResponse = await getApprovedUsers(adminId);
      if (approvedResponse.success) {
        setApprovedUsers(approvedResponse.approvedUsers);
      }
    } catch (error) {
      console.error('Error fetching approved users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSellers = approvedUsers.filter(seller => 
    seller.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seller.phoneNumber?.includes(searchQuery) ||
    seller.region?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle status change
  const handleStatusChange = async (userId, newStatus) => {
    try {
      console.log(`Changing status for user ${userId} to ${newStatus}`);
      // TODO: Implement API call to update user status
      
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

  // Handle view profile
  const handleViewProfile = (user) => {
    setSelectedUser(user);
    setProfileModalOpen(true);
  };

  // Handle password reset
  const handlePasswordReset = async (userId, newPassword) => {
    try {
      console.log(`Resetting password for user ${userId}`);

      // Call the API to reset password
      const response = await resetUserPassword(userId, newPassword);

      if (response.success) {
        alert('Password reset successfully!');

        // Close modal after successful reset
        setProfileModalOpen(false);
        setSelectedUser(null);
      } else {
        throw new Error(response.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Failed to reset password: ' + (error.message || 'Unknown error'));
      throw error;
    }
  };

  // Handle seeds update
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

  // Handle image click (view full size)
  const handleImageClick = (seller, imageUrl) => {
    setSelectedSeller(seller);
    setSelectedImage(imageUrl);
    setImageModalOpen(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setImageModalOpen(false);
    setSelectedSeller(null);
    setSelectedImage('');
  };

  // Handle fullscreen image view
  const handleFullscreenImage = (imageUrl) => {
    setFullscreenImageUrl(imageUrl);
    setFullscreenImageOpen(true);
  };


  // Loading state
  if (loading) {
    return (
      <div className="admin-main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <FiActivity style={{ fontSize: '3rem', color: '#5B7C99', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '1rem', color: '#666' }}>Loading approved users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-main-content">
      <div className="admin-header">
        <h1>Approved Users</h1>
        <p>View and manage all approved user accounts</p>
      </div>

      {/* Search and Filters */}
      <div className="filters-row">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, phone, or region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Approved Users Table */}
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
            {filteredSellers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  <FiUsers style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }} />
                  <p>No approved users found</p>
                </td>
              </tr>
            ) : (
              filteredSellers.map(user => (
                <tr key={user._id}>
                  <td>
                    <div className="member-cell">
                      <div className="member-avatar" style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#6b7280',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}>
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

      {/* Fullscreen Image Modal */}
      {fullscreenImageOpen && (
        <FullscreenImageModal
          imageUrl={fullscreenImageUrl}
          onClose={() => {
            setFullscreenImageOpen(false);
            setFullscreenImageUrl('');
          }}
        />
      )}

      {/* Image Zoom Modal - No Scroll */}
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
            padding: '1rem'
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
              height: '90vh',
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
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
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
                  height: '100%',
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
                </div>
                <div
                  className="image-viewer-container"
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '1rem',
                    gap: '1rem',
                    overflow: 'hidden'
                  }}
                >
                  {/* Image Container - Perfectly Fitted */}
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: 0
                  }}>
                    <img
                      src={selectedImage}
                      alt="Seller submission"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        borderRadius: '0.5rem',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                        display: 'block',
                        objectFit: 'contain'
                      }}
                    />
                  </div>

                  {/* Fullscreen Button */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <button
                      onClick={() => handleFullscreenImage(selectedImage)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#5B7C99',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#4a6b85';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#5B7C99';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                      }}
                    >
                      <FiMaximize />
                      View Fullscreen
                    </button>
                  </div>

                  {/* Image Details with Map - Fixed Height */}
                  <div style={{
                    height: '200px',
                    overflow: 'hidden'
                  }}>
                    <ImageDetailsWithMap
                      selectedSeller={selectedSeller}
                      selectedImage={selectedImage}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSellers;