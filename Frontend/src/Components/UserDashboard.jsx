import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBell, FiUpload, FiMenu, FiX, FiHome,  FiSettings, FiHelpCircle,
  FiCheckCircle, FiClock,  FiEye, FiCamera, FiUser, FiLogOut,
  FiTrendingUp, FiPackage, FiActivity,  FiChevronDown,
  FiTrash2, FiDownload,  FiAlertCircle, FiXCircle,
  FiGlobe, FiLock, FiMail, FiPhone,  FiRefreshCw,  FiSave,
 FiEdit3, FiMapPin, FiSmartphone, FiMaximize, FiMinimize
} from "react-icons/fi";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  getUserHatcheries,
  createHatchery,
  uploadHatcheryImage,
  deleteHatcheryImage,
} from "../services/api";

import "../CSS/UserDashboard.css";
import { Navigate } from 'react-router-dom';
import UserNotifications from "./UserNotifications";
import UserHelp from "./UserHelp";
import UserSettings from "./UserSettings";
import { getUserNotifications, markAllAsRead } from "../services/notificationService";

// ImageDetailsWithMap Component for User Dashboard
const ImageDetailsWithMap = ({ selectedImageData }) => {
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  const toggleMapFullscreen = () => {
    setIsMapFullscreen(!isMapFullscreen);
  };

  useEffect(() => {
    if (!selectedImageData) return;

    const lat = selectedImageData?.location?.latitude;
    const lng = selectedImageData?.location?.longitude;

    if (!lat || !lng) return;

    // Initialize map
    const mapId = isMapFullscreen ? 'fullscreenMap' : 'imageMap';
    const map = L.map(mapId).setView([lat, lng], 15); // Zoom level 15 for more precise location

    // Add OSM tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Add precise marker for image location
    L.marker([lat, lng])
      .addTo(map)
      .bindPopup(`
        <div style="text-align: center;">
          <b>📍 Image Location</b><br>
          <small>Lat: ${parseFloat(lat).toFixed(6)}<br>Lng: ${parseFloat(lng).toFixed(6)}</small>
        </div>
      `)
      .openPopup();

    // Cleanup previous map instance on re-render
    return () => {
      map.remove();
    };
  }, [selectedImageData, isMapFullscreen]);

  if (!selectedImageData) return null;

  const lat = selectedImageData?.location?.latitude;
  const lng = selectedImageData?.location?.longitude;

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
                {selectedImageData?.uploadedAt ? 
                  new Date(selectedImageData.uploadedAt).toLocaleDateString('en-US', { 
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
                {selectedImageData?.uploadedAt ? 
                  new Date(selectedImageData.uploadedAt).toLocaleTimeString('en-US', { 
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

// Fullscreen Image Modal Component for User Dashboard
const FullscreenImageModal = ({ imageUrl, imageData, onClose }) => {
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

// Image Preview Modal Component for User Dashboard
const ImagePreviewModal = ({ imageData, onClose }) => {
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);

  if (!imageData) return null;

  return (
    <>
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
            maxWidth: '1200px',
            width: '100%',
            height: '90vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            margin: 'auto'
          }}
        >
          <button 
            className="modal-close-btn" 
            onClick={onClose}
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
            {/* Image Viewer Section - Full Width */}
            <div 
              className="image-viewer-section"
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#f9fafb',
                height: '60%',
                overflow: 'hidden'
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
                  overflow: 'hidden',
                  position: 'relative'
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
                    src={imageData.url}
                    alt="Uploaded hatchery image"
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
                  
                  {/* Fullscreen Button - Bottom Center */}
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
              </div>
            </div>

            {/* Image Details with Map Section */}
            <div 
              className="image-details-section"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#ffffff',
                overflow: 'hidden',
                borderTop: '1px solid #e5e7eb'
              }}
            >
              <div
                className="details-header"
                style={{
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                  flexShrink: 0
                }}
              >
                <h3 style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FiMapPin style={{ color: '#5B7C99' }} />
                  Image Location & Details
                </h3>
              </div>
              <div
                className="details-content"
                style={{
                  flex: 1,
                  padding: '1rem',
                  overflowY: 'auto'
                }}
              >
                <ImageDetailsWithMap
                  selectedImageData={imageData}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {showFullscreenImage && (
        <FullscreenImageModal
          imageUrl={imageData.url}
          imageData={imageData}
          onClose={() => setShowFullscreenImage(false)}
        />
      )}
    </>
  );
};

// Inner component that uses the NotificationsContext
function UserDashboardInner() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem("activeUserSection") || "overview";
  });
  const [loading, setLoading] = useState(true);

  // Get phone number from localStorage (set during login)
  const userPhoneNumber = localStorage.getItem("userPhoneNumber") || "+919876543210";

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadHelpCount, setUnreadHelpCount] = useState(0);

  // User profile state
  const [userProfile, setUserProfile] = useState({
    mongoId: localStorage.getItem("userMongoId") || "", // MongoDB _id for notifications
    userId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: userPhoneNumber || "", // store the phone number here
    profileImage: null,
    country: "",
    state: "",
    district: "",
    pincode: "",
    hatcheryName: "",
    totalseeds:0,
    seedsUsed: 0,
    seedsAvailable: 0,
    seedsSold: 0,
    activeBatches: 0,
    createdAt: "", // ✅ optional: store user created date
  });
  
  useEffect(() => {
    if (!userProfile) return;
  
    setProfileEditData(prev => ({
      ...prev,
      ...userProfile,
      profileImage: userProfile.profileImage || null, // ensure it's set
    }));
  }, [userProfile]);
  
  // ✅ Step 3: Fetch user profile using phone number (only if phone exists)
  const fetchUserProfileData = async () => {
    if (!userPhoneNumber) return;

    try {
      const response = await fetch(`http://localhost:3000/api/user/phone/${userPhoneNumber}`);
      const data = await response.json();

      if (response.ok && data.success && data.user) {
        const user = data.user;
        setUserProfile(prev => ({
          ...prev,
          ...user,
          mongoId: user._id || prev.mongoId, // Ensure mongoId is set
        }));

        // Store mongoId in localStorage for notifications
        if (user._id) {
          localStorage.setItem("userMongoId", user._id);
        }
      } else {
        console.error("Error fetching profile:", data.message);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    fetchUserProfileData();
  }, [userPhoneNumber]);

  // Refetch profile when leaving settings section (to get updated profile image, etc.)
  const [previousSection, setPreviousSection] = useState(activeSection);

  useEffect(() => {
    // Save active section to localStorage for persistence on reload
    localStorage.setItem("activeUserSection", activeSection);

    // If we're coming FROM settings TO another section, refetch profile
    if (previousSection === 'settings' && activeSection !== 'settings') {
      console.log('📸 Refetching profile after leaving settings');
      fetchUserProfileData();
    }
    setPreviousSection(activeSection);
  }, [activeSection]);

  // First-time login detection state
  const [isFirstTimeLogin, setIsFirstTimeLogin] = useState(() => {
    const hasVisited = localStorage.getItem(`user_visited_${userPhoneNumber}`);
    return !hasVisited;
  });

  // Install app prompt state (shows again on re-login)
  const [showInstallPrompt, setShowInstallPrompt] = useState(() => {
    const dismissed = sessionStorage.getItem('install_prompt_dismissed');
    return !dismissed;
  });

  // Profile edit modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileEditData, setProfileEditData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    profileImage: null,
    country: "",
    state: "",
    district: "",
    pincode: "",
    hatcheryName: "",
    isEditing: false
  });

  // Location dropdown states
  const [pincodeError, setPincodeError] = useState("");

  // Custom district input when "Other" is selected
  const [customDistrict, setCustomDistrict] = useState("");
  const [customDistrictError, setCustomDistrictError] = useState("");

  // Overview stats - now derived from userProfile
  const stats = {
    totalseeds: userProfile?.totalseeds || 0,
    seedsUsed: userProfile?.seedsUsed || 0,
    seedsAvailable: userProfile?.seedsAvailable || 0,
    seedsSold: userProfile?.seedsSold || 0,
    activeBatches: userProfile?.activeBatches || 0,
  };

  const UPLOAD_UNLOCK_DELAY_MS = 5 * 60 * 1000; // 5 minutes per slot

  const formatTimeRemaining = (milliseconds) => {
    if (milliseconds <= 0) {
      return 'Ready';
    }

    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
    }

    return `${seconds}s`;
  };

  const getSlotUnlockInfo = (imageIndex, now) => {
    // First image is always unlocked
    if (imageIndex === 0) {
      return { unlocked: true };
    }

    // For other images, check if previous image exists
    const previousImage = userImages[imageIndex - 1];
    if (!previousImage || !previousImage.url) {
      return {
        unlocked: false,
        reason: 'Upload the previous image to unlock',
      };
    }

    const previousUploadTime = previousImage.uploadedAt ? new Date(previousImage.uploadedAt).getTime() : NaN;
    const previousDeleteLockTime = previousUploadTime + 60 * 1000;
    const baseUnlockTime = Math.max(previousUploadTime, previousDeleteLockTime);

    if (Number.isNaN(previousUploadTime)) {
      return {
        unlocked: false,
        reason: 'Awaiting previous image upload timestamp',
      };
    }

    const unlockTimestamp = baseUnlockTime + UPLOAD_UNLOCK_DELAY_MS;
    const timeUntilUnlock = unlockTimestamp - now;

    if (timeUntilUnlock <= 0) {
      return {
        unlocked: true,
        unlockTimestamp,
      };
    }

    return {
      unlocked: false,
      unlockTimestamp,
      timeUntilUnlock,
      reason: `Unlocks in ${formatTimeRemaining(timeUntilUnlock)}`,
    };
  };

  // User images state - 4 default slots
  const [userImages, setUserImages] = useState([null, null, null, null]);

  // Load images from userProfile when it's fetched (on page load/reload)
  useEffect(() => {
    if (userProfile?.images && Array.isArray(userProfile.images)) {
      console.log('Loading images from userProfile:', userProfile.images);

      // Map the fetched images to the 4 slots
      const loadedImages = [null, null, null, null];

      // Sort images by uploadedAt to maintain order
      const sortedImages = [...userProfile.images].sort((a, b) =>
        new Date(a.uploadedAt) - new Date(b.uploadedAt)
      );

      // Fill the slots with existing images (max 4)
      sortedImages.slice(0, 4).forEach((img, index) => {
        loadedImages[index] = {
          url: img.url,
          public_id: img.public_id,
          uploadedAt: img.uploadedAt,
          location: img.location || null,
          hatcheryId: img.hatcheryId,
          hatcheryName: img.hatcheryName,
          status: img.status || 'pending',
          adminFeedback: img.adminFeedback || null
        };
      });

      setUserImages(loadedImages);
      console.log('User images loaded:', loadedImages);
    }
  }, [userProfile?.images]);

  // Fetch unread notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      const mongoId = userProfile.mongoId || localStorage.getItem("userMongoId");
      if (!mongoId) return;

      try {
        const response = await getUserNotifications(mongoId);
        if (response.success && response.notifications) {
          const unreadCount = response.notifications.filter(n => !n.read).length;
          setUnreadNotificationCount(unreadCount);
        }
      } catch (error) {
        console.error("Error fetching notification count:", error);
      }
    };

    fetchNotificationCount();

    // Refresh count every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, [userProfile.mongoId]);

  // Fetch unread help message count
  useEffect(() => {
    const fetchHelpUnreadCount = async () => {
      const mongoId = userProfile.mongoId || localStorage.getItem("userMongoId");
      if (!mongoId) return;

      try {
        const response = await fetch(`http://localhost:3000/api/user-help/unread-count/${mongoId}`);
        const data = await response.json();
        if (data.success) {
          setUnreadHelpCount(data.unreadCount);
        }
      } catch (error) {
        console.error("Error fetching help unread count:", error);
      }
    };

    fetchHelpUnreadCount();

    // Refresh count every 30 seconds
    const interval = setInterval(fetchHelpUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [userProfile.mongoId]);

  // Image upload modal states
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [currentUploadSlot, setCurrentUploadSlot] = useState(null); // imageIndex
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showConfirmUploadDialog, setShowConfirmUploadDialog] = useState(false);
  const [uploadingToCloud, setUploadingToCloud] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Camera capture states
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Image preview modal state
  const [showImagePreviewModal, setShowImagePreviewModal] = useState(false);
  const [selectedImageData, setSelectedImageData] = useState(null);

  // Reports state
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showBatchDetailModal, setShowBatchDetailModal] = useState(false);

  // Settings state
  const [settings, setSettings] = useState(() => {
    return {
      language: "en",
    };
  });
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showChangePhoneModal, setShowChangePhoneModal] = useState(false);
  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneData, setPhoneData] = useState({
    newPhone: "",
  });
  const [emailData, setEmailData] = useState({
    newEmail: "",
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // Function to refresh user data
  const refreshUserData = async () => {
    try {
      setLoading(true);
      
      // Always try to fetch by phone number first for most up-to-date data
      if (userPhoneNumber) {
        console.log("Refreshing user data by phone number:", userPhoneNumber);
        const cleanPhone = userPhoneNumber.replace(/\+/g, '');
        const response = await fetch(`http://localhost:3000/api/user/phone/${cleanPhone}`);
        const data = await response.json();
        console.log("user refresh data",data);
        if (response.ok && data.success && data.user) {
          const user = data.user;
          setUserProfile({
            mongoId: user._id || "",  // Store MongoDB _id for notifications
            userId: user.userId || "",
            firstName: user.name?.split(' ')[0] || "",
            lastName: user.name?.split(' ').slice(1).join(' ') || "",
            email: user.email || "",
            phone: user.phoneNumber || userPhoneNumber,
            profileImage: user.profileImage || user.userImage || null,
            country: user.country || "",
            state: user.state || "",
            district: user.district || "",
            pincode: user.pincode || "",
            address: user.address || "",
            bio: user.bio || "",
            hatcheryName: user.hatcheryName || "",
            totalseeds: user.totalseeds || 0,
            seedsUsed: user.seedsUsed|| 0,
            seedsAvailable: user.seedsAvailable || 0,
            seedsSold: user.seedsSold || 0,
            activeBatches: user.activeBatches || 0,
          });

          // Store mongoId in localStorage for notifications
          if (user._id) {
            localStorage.setItem("userMongoId", user._id);
          }

          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === "overview") {
      setProfileEditData(prev => ({ ...prev, isEditing: false }));
    }
  }, [activeSection]);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setProfileEditData({ ...profileEditData, isEditing: false })
        // ✅ 1. Try to get userId from localStorage first
        const storedUserId = localStorage.getItem("userId");
        const storedUserName = localStorage.getItem("userName");
        const storedUserEmail = localStorage.getItem("userEmail");

        // ✅ 2. If userId exists in localStorage, use it directly
        if (storedUserId) {
          console.log("Using userId from localStorage:", storedUserId);

          // Fetch user profile using userId
          const response = await fetch(`http://localhost:3000/api/user/user/${storedUserId}`);
          const data = await response.json();

          if (response.ok && data) {
            // Note: BY ID endpoint returns user data directly (not wrapped in success/user object)
            console.log("Loaded user data by ID:", data);
            setUserProfile({
              mongoId: data._id || "",  // Store MongoDB _id for notifications
              userId: data.userId || storedUserId,
              firstName: data.name?.split(' ')[0] || storedUserName?.split(' ')[0] || "",
              lastName: data.name?.split(' ').slice(1).join(' ') || storedUserName?.split(' ').slice(1).join(' ') || "",
              email: data.email || storedUserEmail || "",
              phone: data.phoneNumber || userPhoneNumber,
              profileImage: data.profileImage || data.userImage || null,
              country: data.country || "",
              state: data.state || "",
              district: data.district || "",
              pincode: data.pincode || "",
              address: data.address || "",
              bio: data.bio || "",
              hatcheryName: data.hatcheryName || "",
              totalseeds: data.totalseeds || 0,
              seedsUsed: data.seedsUsed || 0,
              seedsAvailable: data.seedsAvailable || 0,
              seedsSold: data.seedsSold || 0,
              activeBatches: data.activeBatches || 0,
            });

            if (data._id) {
              localStorage.setItem("userMongoId", data._id);
            }

            setLoading(false);
            return;
          }
        }

        // ✅ 3. Fallback: Try to fetch by phone number
        if (userPhoneNumber) {
          console.log("Fetching user by phone number:", userPhoneNumber);
          const cleanPhone = userPhoneNumber.replace(/\+/g, '');
          const response = await fetch(`http://localhost:3000/api/user/phone/${cleanPhone}`);
          const data = await response.json();

          if (response.ok && data.success && data.user) {
            // Note: BY PHONE endpoint returns {success: true, user: {...}}
            const user = data.user;
            console.log("Loaded user data by phone:", user);
            setUserProfile({
              mongoId: user._id || "",  // Store MongoDB _id
              userId: user.userId || "",
              firstName: user.name?.split(' ')[0] || "",
              lastName: user.name?.split(' ').slice(1).join(' ') || "",
              email: user.email || "",
              phone: user.phoneNumber || userPhoneNumber,
              profileImage: user.profileImage || user.userImage || null,
              country: user.country || "",
              state: user.state || "",
              district: user.district || "",
              pincode: user.pincode || "",
              address: user.address || "",
              bio: user.bio || "",
              hatcheryName: user.hatcheryName || "",
              totalseeds: user.totalseeds || 0,
              seedsUsed: user.seedsUsed || 0,
              seedsAvailable: user.seedsAvailable || 0,
              seedsSold: user.seedsSold || 0,
              activeBatches: user.activeBatches || 0,
            });

            // ✅ Store userId and mongoId in localStorage for future use
            if (user.userId) {
              localStorage.setItem("userId", user.userId);
              localStorage.setItem("userName", user.name || '');
              localStorage.setItem("userEmail", user.email || '');
            }
            if (user._id) {
              localStorage.setItem("userMongoId", user._id);
            }
          } else {
            console.log("User not found in database, using default values");
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Keep default values if fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userPhoneNumber]);

  // Refresh data when user returns to the dashboard (e.g., after editing profile)
  useEffect(() => {
    const handleFocus = () => {
      console.log("Dashboard focused - refreshing user data");
      refreshUserData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [userPhoneNumber]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  // Validate pincode
  const validatePincode = (pincode) => {
    if (!pincode || pincode.trim() === "") {
      setPincodeError("Pincode is required");
      return false;
    }

    // Check if numeric
    if (!/^\d+$/.test(pincode)) {
      setPincodeError("Pincode must contain only numbers");
      return false;
    }

    // Check length (4-6 digits)
    if (pincode.length < 4 || pincode.length > 6) {
      setPincodeError("Pincode must be 4-6 digits");
      return false;
    }

    setPincodeError("");
    return true;
  };

  // Handle pincode change
  const handlePincodeChange = (pincode) => {
    setProfileEditData({
      ...profileEditData,
      pincode: pincode
    });
    if (pincode.trim()) {
      validatePincode(pincode);
    } else {
      setPincodeError("");
    }
  };

  // Handle navigation
  const handleNavigation = async (section) => {
    console.log("Navigating to:", section);
    setProfileEditData({ ...profileEditData, isEditing: false })
    setActiveSection(section);
    setSidebarOpen(false);
    setProfileDropdownOpen(false);
    setNotificationsOpen(false);

    const mongoId = userProfile.mongoId || localStorage.getItem("userMongoId");

    // Mark all notifications as read when opening notifications section
    if (section === "notifications" && mongoId && unreadNotificationCount > 0) {
      try {
        await markAllAsRead(mongoId);
        setUnreadNotificationCount(0);
      } catch (error) {
        console.error("Error marking notifications as read:", error);
      }
    }

    // Mark all help messages as read when opening help section
    if (section === "help" && mongoId && unreadHelpCount > 0) {
      try {
        await fetch(`http://localhost:3000/api/user-help/mark-all-read/${mongoId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        setUnreadHelpCount(0);
      } catch (error) {
        console.error("Error marking help messages as read:", error);
      }
    }
  };

  const handleDismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    sessionStorage.setItem('install_prompt_dismissed', 'true');
  };

  const isDeleteDisabled = (image) => {
    if (!image || !image.uploadedAt) {
      return false;
    }

    // Allow deletion if image is rejected by admin
    const isRejected = image.status === 'rejected' ||
                       (image.adminFeedback && image.adminFeedback.action === 'decline');
    if (isRejected) {
      return false; // Enable delete for rejected images
    }

    const uploadedTime = new Date(image.uploadedAt).getTime();
    if (Number.isNaN(uploadedTime)) {
      return false;
    }

    return currentTime - uploadedTime > 60 * 1000;
  };

  // Helper function to get image status info
  const getImageStatusInfo = (image) => {
    if (!image) return null;

    const isRejected = image.status === 'rejected' ||
                       (image.adminFeedback && image.adminFeedback.action === 'decline');
    const isApproved = image.status === 'approved' ||
                       (image.adminFeedback && image.adminFeedback.action === 'approve');

    if (isRejected) {
      return {
        status: 'rejected',
        color: '#ef4444',
        bgColor: '#fef2f2',
        icon: 'FiXCircle',
        text: 'Rejected',
        message: image.adminFeedback?.message || 'Image rejected by admin'
      };
    } else if (isApproved) {
      return {
        status: 'approved',
        color: '#10b981',
        bgColor: '#ecfdf5',
        icon: 'FiCheckCircle',
        text: 'Approved',
        message: image.adminFeedback?.message || 'Image approved by admin'
      };
    } else {
      return {
        status: 'pending',
        color: '#f59e0b',
        bgColor: '#fffbeb',
        icon: 'FiClock',
        text: 'Pending Review',
        message: 'Waiting for admin review'
      };
    }
  };

  // Handle image view with geolocation
  const handleViewImage = (imageData) => {
    if (!imageData) return;
    setSelectedImageData(imageData);
    setShowImagePreviewModal(true);
  };

  // Open camera for image capture
  const handleOpenImageUpload = async (imageIndex) => {
    setCurrentUploadSlot(imageIndex);
    setCameraError(null);
    setSelectedImageFile(null);
    setImagePreview(null);

    try {
      // Request camera permission and access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      setCameraStream(stream);
      setShowCameraModal(true);
      setIsCameraActive(true);

      // Wait for video element to be available and attach stream
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);

    } catch (error) {
      console.error('Camera access error:', error);
      let errorMessage = 'Unable to access camera. ';

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Camera permission was denied. Please allow camera access in your browser settings.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera device found on this device.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'Camera is already in use by another application.';
      } else {
        errorMessage += 'Please check your camera settings and try again.';
      }

      setCameraError(errorMessage);
      setShowCameraModal(true);
      setIsCameraActive(false);
    }
  };

  // Capture photo from camera stream
  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      alert('Camera not ready. Please try again.');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob and then to file
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedImageFile(file);

        // Create preview from canvas
        const previewUrl = canvas.toDataURL('image/jpeg');
        setImagePreview(previewUrl);

        // Stop camera and close modal
        handleCloseCamera();
        setShowImageUploadModal(true);
      }
    }, 'image/jpeg', 0.95);
  };

  // Close camera and stop stream
  const handleCloseCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
    setIsCameraActive(false);
    setCameraError(null);
  };

  // Open file picker as fallback

  // Handle file selection (fallback method)
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select a valid image file');
    }
  };

  // Handle retake (clear current selection)
  const handleRetake = () => {
    setSelectedImageFile(null);
    setImagePreview(null);
    setShowImageUploadModal(false);

    if (currentUploadSlot !== null) {
      handleOpenImageUpload(currentUploadSlot);
    } else {
      setShowCameraModal(true);
    }
  };

  // Open confirmation dialog
  const handleOpenConfirmDialog = () => {
    if (!selectedImageFile) {
      alert('Please select an image first');
      return;
    }
    setShowConfirmUploadDialog(true);
  };

  // Confirm and upload to Cloudinary
  const handleConfirmUpload = async () => {
    if (!selectedImageFile || currentUploadSlot === null) return;

    setUploadingToCloud(true);

    try {
      // ✅ Try multiple methods to get userId
      let userId = userProfile.userId;
      console.log("Initial userId from userProfile state:", userId);

      // If not in userProfile, try localStorage
      if (!userId) {
        userId = localStorage.getItem("userId");
        console.log("Retrieved userId from localStorage:", userId);
      }

      // If still no userId, try fetching by phone
      if (!userId && userPhoneNumber) {
        console.warn("No userId found, attempting to fetch by phone number");
        try {
          const cleanPhone = userPhoneNumber.replace(/\+/g, '');
          const userResponse = await fetch(`http://localhost:3000/api/user/phone/${cleanPhone}`);
          const userData = await userResponse.json();

          if (userResponse.ok && userData && userData.userId) {
            userId = userData.userId;
            // Update userProfile state
            setUserProfile(prev => ({ ...prev, userId: userId }));
            // Store in localStorage for future use
            localStorage.setItem("userId", userId);
            console.log("Retrieved userId from API:", userId);
          }
        } catch (fetchError) {
          console.error("Error fetching userId:", fetchError);
        }
      }

      // Final check for userId
      if (!userId) {
        setUploadingToCloud(false);
        return;
      }

      console.log("Uploading image with userId:", userId);

      // ✅ Get JWT token from localStorage
      const authToken = localStorage.getItem("authToken");

      if (!authToken) {
        alert('Authentication token not found. Please log in again.');
        setUploadingToCloud(false);
        // Redirect to login
        navigate('/user-login');
        return;
      }

      // Create FormData
      const formData = new FormData();
      formData.append('images', selectedImageFile);

      // ✅ Capture geolocation before uploading image
      let latitude = null;
      let longitude = null;
      let accuracy = null;

      if (navigator.geolocation) {
        try {
          console.log('📍 Capturing geolocation...');

          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000, // Reduced timeout for faster upload
              maximumAge: 60000 // Allow cached position up to 1 minute old
            });
          });

          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          accuracy = position.coords.accuracy;

          console.log(`📍 Location captured: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
        } catch (geoError) {
          console.warn('⚠️ Geolocation error:', geoError.message);
          // Continue upload without location data
        }
      }

      // Add location data and slot index to formData
      if (latitude !== null) formData.append('latitude', latitude);
      if (longitude !== null) formData.append('longitude', longitude);
      if (accuracy !== null) formData.append('accuracy', accuracy);
      formData.append('slotIndex', currentUploadSlot);

      // ✅ Upload to user image API endpoint with location data
      const response = await fetch(`http://localhost:3000/api/user/upload-image/${userId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`
        },
        body: formData
      });

      const data = await response.json();
      console.log("Image upload response:", data);

      if (data.success && data.images) {
        const uploadedAt = data.images[0].uploadedAt || new Date().toISOString();

        // Update the user images state with all fields including status
        const newImage = {
          url: data.images[0].url,
          public_id: data.images[0].public_id,
          uploadedAt,
          location: data.images[0].location || null,
          status: 'pending', // New upload is pending review
          adminFeedback: null // Reset admin feedback for new upload
        };

        setUserImages(prev => {
          const updatedImages = [...prev];
          updatedImages[currentUploadSlot] = newImage;
          return updatedImages;
        });

        alert('Image uploaded successfully! It will be reviewed by admin.');
        setShowImageUploadModal(false);
        setSelectedImageFile(null);
        setImagePreview(null);
      } else {
        alert(data.message || 'Failed to upload image. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please check your connection and try again.');
    } finally {
      setUploadingToCloud(false);
    }
  };

  // Delete uploaded image from Cloudinary and database
  const handleDeleteImage = async (imageIndex) => {
    const image = userImages[imageIndex];

    if (!image || !image.url) {
      return;
    }

    if (isDeleteDisabled(image)) {
      alert('The delete option is disabled 1 minute after upload.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this image? This will also remove it from cloud storage.')) {
      return;
    }

    try {
      const userId = userProfile.userId;
      if (!userId) {
        return;
      }

      // Get public_id from the image data or extract from URL
      let publicId = image.public_id;

      // If public_id is missing, try to extract it from the Cloudinary URL
      if (!publicId && image.url) {
        // Cloudinary URLs format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
        const urlParts = image.url.split('/');
        const filename = urlParts[urlParts.length - 1];
        // Remove file extension and get public_id
        publicId = filename.split('.')[0];

        // If there's a folder structure, include it
        const uploadIndex = urlParts.indexOf('upload');
        if (uploadIndex !== -1 && uploadIndex < urlParts.length - 2) {
          // Skip the version (v123456789) if present
          const pathParts = urlParts.slice(uploadIndex + 1, -1);
          const nonVersionParts = pathParts.filter(part => !part.startsWith('v') || !/^\d+$/.test(part.substring(1)));
          if (nonVersionParts.length > 0) {
            publicId = [...nonVersionParts, filename.split('.')[0]].join('/');
          }
        }
        console.log('Extracted public_id from URL:', publicId);
      }

      if (!publicId) {
        return;
      }

      const authToken = localStorage.getItem("authToken");
      const response = await fetch(`http://localhost:3000/api/user/delete-hatchery-image/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ public_id: publicId })
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setUserImages(prev => {
          const updatedImages = [...prev];
          updatedImages[imageIndex] = null;
          return updatedImages;
        });

      } else {
        alert(data.message || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete image. Please try again.');
    }
  };

  // Ensure light mode is always applied
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.classList.remove("user-dark");
  }, []);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords don't match!");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert("Password must be at least 6 characters!");
      return;
    }

    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        alert("Please login again");
        return;
      }

      const response = await fetch("http://localhost:3000/api/user/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        alert("Password changed successfully!");
        setShowChangePasswordModal(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        alert(data.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      alert("An error occurred. Please try again.");
    }
  };

  // Handle phone change
  const handleChangePhone = async () => {
    if (!phoneData.newPhone || phoneData.newPhone.length < 10) {
      alert("Please enter a valid phone number!");
      return;
    }

    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        alert("Please login again");
        return;
      }

      const response = await fetch("http://localhost:3000/api/user/update-phone-number", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          newPhoneNumber: phoneData.newPhone
        })
      });

      const data = await response.json();

      if (data.success) {
        alert("Phone number updated successfully!");
        setShowChangePhoneModal(false);
        setPhoneData({ newPhone: "", otp: "" });
        // Optionally refresh user data
      } else {
        alert(data.message || "Failed to update phone number");
      }
    } catch (error) {
      console.error("Error updating phone number:", error);
      alert("An error occurred. Please try again.");
    }
  };

  // Handle email change
  const handleChangeEmail = async () => {
    if (!emailData.newEmail || !emailData.newEmail.includes("@")) {
      alert("Please enter a valid email address!");
      return;
    }

    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        alert("Please login again");
        return;
      }

      const response = await fetch("http://localhost:3000/api/user/update-email", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          newEmail: emailData.newEmail
        })
      });

      const data = await response.json();

      if (data.success) {
        alert("Email updated successfully!");
        setShowChangeEmailModal(false);
        setEmailData({ newEmail: "", otp: "" });
        // Optionally refresh user data
      } else {
        alert(data.message || "Failed to update email");
      }
    } catch (error) {
      console.error("Error updating email:", error);
      alert("An error occurred. Please try again.");
    }
  };

  // Handle confirm action
  const handleConfirmAction = (action) => {
    setConfirmAction(action);
    setShowConfirmDialog(true);
  };

  const executeConfirmedAction = () => {
    if (confirmAction === "clearCache") {
      alert("Cache cleared successfully!");
    } else if (confirmAction === "deleteAllData") {
      alert("All data has been deleted!");
    } else if (confirmAction === "downloadData") {
      alert("Downloading your data... This would trigger a download in production.");
    }
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  // Profile handlers
  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileEditData({ ...profileEditData, profileImage: reader.result });
    };
    reader.readAsDataURL(file);

    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        alert("Please login again");
        return;
      }

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await fetch("http://localhost:3000/api/user/update-my-profile-picture", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${authToken}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert("Profile picture updated successfully!");
        // Update both the edit modal and main profile with the Cloudinary URL
        // Store as object with url property for consistency
        const newProfileImage = {
          url: data.userImage.url,
          public_id: data.userImage.public_id
        };
        setProfileEditData({ ...profileEditData, profileImage: newProfileImage });
        setUserProfile(prev => ({ ...prev, profileImage: newProfileImage }));
      } else {
        alert(data.message || "Failed to update profile picture");
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert("An error occurred while uploading. Please try again.");
    }
  };

  const handleProfileSave = async () => {
    // Validate required fields - only name is required according to our spec
    const fullName = `${profileEditData.firstName || ""} ${profileEditData.lastName || ""}`.trim();
    if (!fullName) {
      alert("Please enter your name!");
      return;
    }
    setProfileEditData({ ...profileEditData, isEditing: false })
    // Email validation (only if provided)
    if (profileEditData.email && profileEditData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileEditData.email.trim())) {
        alert("Please enter a valid email address!");
        return;
      }
    }

    // Location validation - all location fields are required if any one is provided
    const hasAnyLocationField = profileEditData.country || profileEditData.state || profileEditData.district || profileEditData.pincode;

    if (hasAnyLocationField) {
      if (!profileEditData.country || !profileEditData.country.trim()) {
        alert("Please select a country!");
        return;
      }

      if (!profileEditData.state || !profileEditData.state.trim()) {
        alert("Please select a state!");
        return;
      }

      if (!profileEditData.district || !profileEditData.district.trim()) {
        alert("Please select a district!");
        return;
      }

      // If "Other" is selected, validate custom district input
      if (profileEditData.district === 'Other') {
        if (!customDistrict || !customDistrict.trim()) {
          alert("Please enter your district name!");
          return;
        }
        if (customDistrictError) {
          alert(customDistrictError);
          return;
        }
      }

      if (!profileEditData.pincode || !profileEditData.pincode.trim()) {
        alert("Please enter a pincode!");
        return;
      }

      // Validate pincode format
      if (!validatePincode(profileEditData.pincode.trim())) {
        alert(pincodeError || "Please enter a valid pincode (4-6 digits)!");
        return;
      }
    }

    try {
      // Determine the district value to save
      // If "Other" is selected, save as "Other - <custom input>"
      let districtToSave = profileEditData.district && profileEditData.district.trim() ? profileEditData.district.trim() : null;
      if (districtToSave === 'Other' && customDistrict && customDistrict.trim()) {
        districtToSave = `Other - ${customDistrict.trim()}`;
      }

      // Prepare data in the format expected by the API
      const formData = new FormData();

      const fullName = `${profileEditData.firstName || ""} ${profileEditData.lastName || ""}`.trim();

      // ✅ Append all fields
      formData.append("name", fullName);
      formData.append("email", profileEditData.email || "");
      formData.append("country", profileEditData.country || "");
      formData.append("state", profileEditData.state || "");
      formData.append("district", profileEditData.district || "");
      formData.append("pincode", profileEditData.pincode || "");
      if (profileEditData.profileImage) {
        formData.append("profileImage", profileEditData.profileImage);
      }

      // Remove + from phone number for API call
      const cleanPhone = userPhoneNumber.replace(/\+/g, '');

      // Save to backend
      // Send request — don't set Content-Type manually!
      const response = await fetch(`http://localhost:3000/api/user/update-phone/${cleanPhone}`, {
        method: "PUT",
        body: formData, // automatically sets correct headers for multipart
      }); 

      const data = await response.json();
      console.log("Profile update response1:", data);

      if (response.ok && data.success) {  
        // Update local state with the actual response data from API
        const updatedUser = data.user;
        setUserProfile({
          ...userProfile,
          firstName: updatedUser.name?.split(' ')[0] || "",
          lastName: updatedUser.name?.split(' ').slice(1).join(' ') || "",
          email: updatedUser.email || "",
          phone: updatedUser.phoneNumber || userPhoneNumber,
          country: updatedUser.country || "",
          state: updatedUser.state || "",
          district: updatedUser.district || "",
          pincode: updatedUser.pincode || "",
          address: updatedUser.address || "",
          bio: updatedUser.bio || ""
        });
        alert("Profile updated successfully!");
        setShowProfileModal(false);
      } else {
        alert(data.message || "Failed to update profile. Please try again.");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("An error occurred while saving your profile. Please try again.");
    }
  };

  const handleMobileRedirect = () => {
    setShowProfileModal(false);
    setProfileDropdownOpen(false);
    setActiveSection("settings");
    // Scroll to account security section (optional)
  };

  const handleLogout = () => {
    console.log("Logging out...");
    // Clear all user data from localStorage
    localStorage.removeItem("userPhoneNumber");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userMongoId");

    // Clear active section so user starts at overview on next login
    localStorage.removeItem("activeUserSection");

    // Ensure light mode on logout
    document.documentElement.classList.remove("user-dark");
    document.documentElement.classList.remove("dark");

    // Clear install prompt dismissal so banner reappears on next login
    sessionStorage.removeItem('install_prompt_dismissed');
    console.log('Cleared install prompt dismissal on logout');

    // Navigate to home page
    navigate("/");
  };

  const openProfileModal = () => {
    console.log("Opening profile modal...");

    // Sync current profile data to edit modal
    const profileData = { ...userProfile };

    // Check if district is saved as "Other - <custom value>"
    if (profileData.district && profileData.district.startsWith('Other - ')) {
      const customDistrictValue = profileData.district.substring(8); // Remove "Other - " prefix
      setCustomDistrict(customDistrictValue);
      profileData.district = 'Other'; // Set dropdown to "Other"
      console.log(`📍 Loaded "Other" district with custom value: ${customDistrictValue}`);
    } else {
      setCustomDistrict("");
    }

    setProfileEditData(profileData);
    setShowProfileModal(true);
    setProfileDropdownOpen(false);
  };

  // Render Overview Section
  const renderOverview = () => (
    <div className="overview-section">
      <h2 className="section-title">Overview</h2>
      <p className="section-subtitle" style={{ fontWeight: 600 }}>
        {isFirstTimeLogin
          ? `Welcome, ${userProfile.firstName || userProfile.name}!`
          : `Welcome back, ${userProfile.firstName || userProfile.name}!`} Manage your hatchery images.
      </p>

      {/* Install App Prompt */}
      {showInstallPrompt && (
        <div className="install-app-banner">
          <div className="install-banner-content">
            <div className="install-banner-icon">
              <FiSmartphone />
            </div>
            <div className="install-banner-text">
              <h4>Get the Mobile App</h4>
              <p>Install our app for a better experience with offline access and notifications</p>
            </div>
          </div>
          <div className="install-banner-actions">
            <button className="btn-install" onClick={() => alert('App installation feature coming soon!')}>
              <FiDownload /> Install App
            </button>
            <button className="btn-dismiss" onClick={handleDismissInstallPrompt} title="Dismiss">
              <FiX className="dismiss-icon" />
            </button>
          </div>
        </div>
      )}

      <div className="stats-grid stats-grid-three">
        <div className="stat-card seeds-available">
          <div className="stat-icon">
            <FiPackage />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.seedsAvailable.toLocaleString()}</div>
            <div className="stat-label">Seeds Available</div>
          </div>
        </div>

        <div className="stat-card seeds-purchased">
          <div className="stat-icon">
            <FiTrendingUp />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.seedsSold.toLocaleString()}</div>
            <div className="stat-label">Seeds Sold</div>
          </div>
        </div>

        <div className="stat-card active-batches">
          <div className="stat-icon">
            <FiActivity />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.activeBatches}</div>
            <div className="stat-label">Active Batches</div>
          </div>
        </div>
      </div>

      {/* Image Upload Section - 4 Default Slots */}
      <div className="image-upload-section" style={{
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: '#ffffff',
        borderRadius: '1rem',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FiCamera style={{ color: '#5B7C99' }} />
              Hatchery Progress Images
            </h3>
            <p style={{
              margin: '0.5rem 0 0 0',
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              Upload your hatchery progress images - slots unlock sequentially
            </p>
          </div>
        </div>

        <div className="images-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem'
        }}>
          {[0, 1, 2, 3].map((index) => {
            // First image is always unlocked, others are locked initially
            const isLocked = index > 0 && !userImages[index - 1]?.url;
            const hasImage = userImages[index]?.url;
            const slotInfo = getSlotUnlockInfo(index, currentTime);
            const deleteDisabled = isDeleteDisabled(userImages[index]);
            const imageStatus = getImageStatusInfo(userImages[index]);
            const isRejected = imageStatus?.status === 'rejected';

            return (
              <div key={index} className="image-upload-slot" style={{
                position: 'relative',
                backgroundColor: '#f9fafb',
                borderRadius: '0.75rem',
                overflow: 'hidden',
                border: '2px dashed #d1d5db',
                transition: 'all 0.3s ease'
              }}>
                <div className="image-preview" style={{
                  aspectRatio: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  backgroundColor: isLocked ? '#f3f4f6' : '#ffffff'
                }}>
                  {hasImage ? (
                    <>
                      <img
                        src={userImages[index].url}
                        alt={`Upload ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '0.5rem'
                        }}
                      />
                      {/* Overlay gradient for better icon visibility */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '50px',
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)',
                        borderRadius: '0.5rem 0.5rem 0 0',
                        pointerEvents: 'none'
                      }} />
                      <div className="image-actions" style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        display: 'flex',
                        gap: '6px',
                        backgroundColor: 'transparent',
                        borderRadius: '6px',
                        padding: '0'
                      }}>
                        <button
                          className="image-action-btn view-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewImage(userImages[index]);
                          }}
                          title="View Image with Location"
                          style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            border: 'none',
                            padding: '8px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            color: '#5B7C99',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                            transition: 'all 0.2s ease',
                            width: '32px',
                            height: '32px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1)';
                            e.currentTarget.style.background = '#5B7C99';
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                            e.currentTarget.style.color = '#5B7C99';
                          }}
                        >
                          <FiEye size={16} />
                        </button>
                        <button
                          className={`image-action-btn delete-btn ${deleteDisabled ? 'disabled' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            !deleteDisabled && handleDeleteImage(index);
                          }}
                          title={deleteDisabled ? 'Delete disabled after 1 minute' : (isRejected ? 'Delete rejected image to re-upload' : 'Delete Image')}
                          disabled={deleteDisabled}
                          style={{
                            background: deleteDisabled ? 'rgba(200, 200, 200, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                            border: 'none',
                            padding: '8px',
                            borderRadius: '50%',
                            cursor: deleteDisabled ? 'not-allowed' : 'pointer',
                            color: deleteDisabled ? '#9ca3af' : '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                            transition: 'all 0.2s ease',
                            opacity: deleteDisabled ? 0.6 : 1,
                            width: '32px',
                            height: '32px'
                          }}
                          onMouseEnter={(e) => {
                            if (!deleteDisabled) {
                              e.currentTarget.style.transform = 'scale(1.1)';
                              e.currentTarget.style.background = '#ef4444';
                              e.currentTarget.style.color = '#ffffff';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!deleteDisabled) {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                              e.currentTarget.style.color = '#ef4444';
                            }
                          }}
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div
                      className={`upload-placeholder ${slotInfo.unlocked ? '' : 'locked'}`}
                      onClick={() => {
                        if (slotInfo.unlocked) {
                          handleOpenImageUpload(index);
                        }
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '2rem',
                        textAlign: 'center',
                        cursor: slotInfo.unlocked ? 'pointer' : 'not-allowed',
                        opacity: slotInfo.unlocked ? 1 : 0.6,
                        width: '100%',
                        height: '100%'
                      }}
                      title={slotInfo.unlocked ? 'Upload image' : slotInfo.reason || 'Locked'}
                    >
                      {slotInfo.unlocked ? (
                        <>
                          <FiCamera style={{
                            fontSize: '2.5rem',
                            color: '#5B7C99'
                          }} />
                          <div>
                            <div style={{
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: '#374151'
                            }}>
                              Upload Image {index + 1}
                            </div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#6b7280'
                            }}>
                              Click to upload
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <FiLock style={{
                            fontSize: '2.5rem',
                            color: '#9ca3af'
                          }} />
                          <div>
                            <div style={{
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: '#4b5563',
                              marginBottom: '0.25rem'
                            }}>
                              Slot {index + 1} Locked
                            </div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#6b7280'
                            }}>
                              {slotInfo.reason || 'Complete previous upload'}
                            </div>
                            {slotInfo.timeUntilUnlock !== undefined && slotInfo.timeUntilUnlock > 0 && (
                              <small style={{
                                fontSize: '0.7rem',
                                color: '#5B7C99',
                                marginTop: '0.25rem',
                                display: 'block'
                              }}>
                                Available in {formatTimeRemaining(slotInfo.timeUntilUnlock)}
                              </small>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Slot Label */}
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#ffffff',
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Image Slot {index + 1}
                  </span>
                  {hasImage && (
                    <FiCheckCircle style={{
                      color: '#10b981',
                      fontSize: '1.25rem'
                    }} />
                  )}
                  {!slotInfo.unlocked && !hasImage && (
                    <FiLock style={{
                      color: '#9ca3af',
                      fontSize: '1rem'
                    }} />
                  )}
                </div>

                {/* Rejection message - displayed below slot label */}
                {isRejected && (
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#fef2f2',
                    borderTop: '1px solid #fecaca',
                    fontSize: '0.75rem',
                    color: '#dc2626'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FiAlertCircle size={12} />
                      Admin Feedback
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#991b1b', marginBottom: '4px' }}>
                      {imageStatus?.message || 'Image rejected'}
                    </div>
                    <div style={{ fontSize: '0.65rem', fontStyle: 'italic', color: '#b91c1c' }}>
                      Please delete and re-upload
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Upload Status */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                Upload Status
              </h4>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                {userImages.filter(img => img?.url).length} / 4 images uploaded
              </p>
            </div>
            {userImages.filter(img => img?.url).length === 4 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#10b981',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                <FiCheckCircle />
                All images uploaded
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container" data-theme="light">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <FiMenu />
          </button>
          <img src="/logo.png" alt="Logo" className="header-logo" />
          <h1 className="header-title">Lords Aqua Hatcheries</h1>
        </div>

        <div className="header-right">
          {/* Notifications */}
          <div className="notifications-dropdown-container">
            <button
              className="header-icon-btn notification-icon"
              onClick={() => handleNavigation("notifications")}
              style={{ position: 'relative' }}
            >
              <FiBell />
              {unreadNotificationCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  fontSize: '0.6rem',
                  fontWeight: '700',
                  padding: '2px 5px',
                  borderRadius: '10px',
                  minWidth: '16px',
                  textAlign: 'center',
                  lineHeight: '1.2'
                }}>
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </span>
              )}
            </button>
          </div>


          {/* Profile Dropdown */}
          <div className="profile-wrapper">
            <button
              className="profile-btn"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            >
              <div className="profile-avatar">
                {(userProfile.profileImage?.url || (typeof userProfile.profileImage === 'string' && userProfile.profileImage)) ? (
                  <img src={userProfile.profileImage?.url || userProfile.profileImage} alt="Profile" />
                ) : (
                  <FiUser />
                )}
              </div>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                {userProfile.name || `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || 'User'}
              </span>
              <p>User</p>
              <FiChevronDown className={`dropdown-arrow ${profileDropdownOpen ? 'open' : ''}`} />
            </button>

            {profileDropdownOpen && (
              <div className="profile-dropdown">
                <div className="dropdown-item" onClick={() => handleNavigation('settings')}>
                  <FiSettings />
                  <span>Settings</span>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item logout" onClick={handleLogout}>
                  <FiLogOut />
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="dashboard-body">
        {/* Sidebar */}
        <aside className={`dashboard-sidebar ${sidebarOpen ? "open" : ""} ${sidebarCollapsed ? "collapsed" : ""}`}>
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

            <button
              className={`sidebar-item ${activeSection === "overview" ? "active" : ""}`}
              onClick={() => handleNavigation("overview")}
            >
              <FiHome />
              {!sidebarCollapsed && <span>Overview</span>}
            </button>

            <button
              className={`sidebar-item ${activeSection === "notifications" ? "active" : ""}`}
              onClick={() => handleNavigation("notifications")}
              style={{ position: 'relative' }}
            >
              <FiBell />
              {!sidebarCollapsed && <span>Notifications</span>}
              {unreadNotificationCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: sidebarCollapsed ? '4px' : '50%',
                  right: sidebarCollapsed ? '4px' : '12px',
                  transform: sidebarCollapsed ? 'none' : 'translateY(-50%)',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  fontSize: '0.65rem',
                  fontWeight: '700',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  minWidth: '18px',
                  textAlign: 'center',
                  lineHeight: '1.2'
                }}>
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </span>
              )}
            </button>
            <button
              className={`sidebar-item ${activeSection === "settings" ? "active" : ""}`}
              onClick={() => handleNavigation("settings")}
            >
              <FiSettings />
              {!sidebarCollapsed && <span>Settings</span>}
            </button>
            <button
              className={`sidebar-item ${activeSection === "help" ? "active" : ""}`}
              onClick={() => handleNavigation("help")}
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
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {activeSection === "overview" && renderOverview()}
          {activeSection === "notifications" && <UserNotifications mongoIdProp={userProfile.mongoId} />}
          {activeSection === "settings" && <UserSettings onProfileUpdate={fetchUserProfileData} />}
          {activeSection === "help" && <UserHelp />}
        </main>
      </div>

      {/* Image Preview Modal */}
      {showImagePreviewModal && (
        <ImagePreviewModal
          imageData={selectedImageData}
          onClose={() => {
            setShowImagePreviewModal(false);
            setSelectedImageData(null);
          }}
        />
      )}

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button className="modal-close" onClick={() => setShowProfileModal(false)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              {/* Profile Picture */}
              <div className="profile-picture-section">
                <div className="profile-picture-container">
                  <div className="profile-picture-large">
                    {(profileEditData.profileImage?.url || (typeof profileEditData.profileImage === 'string' && profileEditData.profileImage)) ? (
                      <img src={profileEditData.profileImage?.url || profileEditData.profileImage} alt="Profile" />
                    ) : (
                      <FiUser />
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                    <label className="profile-picture-upload">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleProfileImageUpload}
                        style={{ display: 'none' }}
                      />
                      <FiCamera />
                      <span>Change Photo</span>
                    </label>
                    <button
                      className="btn-primary"
                      onClick={handleProfileSave}
                      style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <FiSave /> Save
                    </button>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="profile-edit-section">
                <h4 className="profile-section-title">
                  <FiUser /> Basic Information
                </h4>
                <div className="profile-form-grid">
                  <div className="form-group">
                    <label>First Name <span className="required">*</span></label>
                    <input
                      type="text"
                      placeholder="Enter first name"
                      value={profileEditData.firstName}
                      onChange={(e) => setProfileEditData({ ...profileEditData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name <span className="required">*</span></label>
                    <input
                      type="text"
                      placeholder="Enter last name"
                      value={profileEditData.lastName}
                      onChange={(e) => setProfileEditData({ ...profileEditData, lastName: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="profile-edit-section">
                <h4 className="profile-section-title">
                  <FiMail /> Contact Information
                </h4>
                <div className="profile-form-grid">
                  <div className="form-group">
                    <label>Email Address <span className="required">*</span></label>
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={profileEditData.email}
                      onChange={(e) => setProfileEditData({ ...profileEditData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number</label>
                    <div className="input-with-action">
                      <input
                        type="tel"
                        value={profileEditData.phone}
                        disabled
                        style={{ cursor: 'not-allowed', background: '#f5f5f5' }}
                      />
                      <button
                        className="btn-link-inline"
                        onClick={handleMobileRedirect}
                        type="button"
                      >
                        <FiSettings /> Change in Settings
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="profile-edit-section">
                <h4 className="profile-section-title">
                  <FiMapPin /> Address
                </h4>
                <div className="profile-form-grid">
                  <div className="form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      placeholder="Enter country"
                      value={profileEditData.country}
                      onChange={(e) => setProfileEditData({ ...profileEditData, country: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      placeholder="Enter state"
                      value={profileEditData.state}
                      onChange={(e) => setProfileEditData({ ...profileEditData, state: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>District</label>
                    <input
                      type="text"
                      placeholder="Enter district"
                      value={profileEditData.district}
                      onChange={(e) => setProfileEditData({ ...profileEditData, district: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input
                      type="text"
                      placeholder="Enter 6-digit pincode"
                      value={profileEditData.pincode}
                      maxLength="6"
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setProfileEditData({ ...profileEditData, pincode: value });
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Hatchery Information */}
              <div className="profile-edit-section">
                <h4 className="profile-section-title">
                  <FiHome /> Hatchery Information
                </h4>
                <div className="form-group">
                  <label>Hatchery Name</label>
                  <input
                    type="text"
                    placeholder="Enter hatchery name"
                    value={profileEditData.hatcheryName}
                    onChange={(e) => setProfileEditData({ ...profileEditData, hatcheryName: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-secondary" onClick={() => setShowProfileModal(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleProfileSave}>
                  <FiSave /> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="modal-overlay" onClick={handleCloseCamera}>
          <div className="camera-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <FiCamera /> Capture Image
              </h3>
              <button className="modal-close-btn" onClick={handleCloseCamera}>
                <FiX />
              </button>
            </div>

            <div className="modal-body camera-body">
              {cameraError ? (
                <div className="camera-error">
                  <FiAlertCircle size={64} className="error-icon" />
                  <h4>Camera Access Error</h4>
                  <p>{cameraError}</p>
                  <div className="error-actions">
                    <button className="btn-secondary" onClick={handleCloseCamera}>
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="camera-container">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="camera-preview"
                    ></video>
                    <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                  </div>

                  <div className="camera-controls">
                    <button className="btn-capture" onClick={handleCapturePhoto}>
                      <FiCamera size={32} />
                    </button>
                    <button className="btn-secondary" onClick={handleCloseCamera}>
                      <FiX /> Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Upload Modal */}
      {showImageUploadModal && (
        <div className="modal-overlay" onClick={() => setShowImageUploadModal(false)}>
          <div className="image-upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Image</h3>
              <button className="modal-close-btn" onClick={() => setShowImageUploadModal(false)}>
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              {!imagePreview ? (
                <div className="file-input-section" />
              ) : (
                <div className="preview-section">
                  <div className="image-preview-container">
                    <img src={imagePreview} alt="Preview" className="preview-image" />
                  </div>
                  <div className="preview-actions">
                    <button className="btn-secondary" onClick={handleRetake} disabled={uploadingToCloud}>
                      <FiRefreshCw /> Retake
                    </button>
                    <button className="btn-primary" onClick={handleConfirmUpload} disabled={uploadingToCloud}>
                      {uploadingToCloud ? (
                        <>
                          <FiRefreshCw className="spinning" /> Uploading...
                        </>
                      ) : (
                        <>
                          <FiCheckCircle /> Confirm Upload
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Wrapper component that provides NotificationsContext
export default function UserDashboard() {
  return <UserDashboardInner />;
}