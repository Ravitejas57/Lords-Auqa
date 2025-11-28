import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiClock, FiImage, FiX } from 'react-icons/fi';
import { getUserTransactionHistory } from '../services/api';
import InvoiceCard from './InvoiceCard';
import '../CSS/PurchaseHistory.css';

const UserPurchaseHistory = () => {
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [showImageViewer, setShowImageViewer] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      // Get userId from localStorage (same way as UserDashboard.jsx)
      const userId = localStorage.getItem("userId");
      
      if (!userId) {
        console.error('User ID not found in localStorage');
        setLoading(false);
        return;
      }

      console.log('Loading transaction history for userId:', userId);
      setLoading(true);
      const response = await getUserTransactionHistory(userId);
      
      console.log('Transaction history response:', response);
      
      if (response.success) {
        setTransactionHistory(response.transactions || []);
        console.log('Loaded transactions:', response.transactions?.length || 0);
      } else {
        console.error('Failed to load transaction history:', response);
        setTransactionHistory([]);
      }
    } catch (error) {
      console.error('Error loading transaction history:', error);
      setTransactionHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleImagePress = (imageUrl) => {
    setSelectedImageUrl(imageUrl);
    setShowImageViewer(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="purchase-history-container">
      <div className="purchase-history-header">
        <div>
          <h1 className="purchase-history-title">Purchase History</h1>
          <p className="purchase-history-subtitle">
            Your completed hatchery approvals will appear here
          </p>
        </div>
        <button
          className="refresh-button"
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh"
        >
          <FiRefreshCw
            className={refreshing ? 'spinning' : ''}
            style={{ fontSize: '1.25rem' }}
          />
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <FiRefreshCw className="spinning" style={{ fontSize: '3rem', color: '#5B7C99' }} />
          <p className="loading-text">Loading history...</p>
        </div>
      ) : transactionHistory.length === 0 ? (
        <div className="empty-container">
          <FiClock style={{ fontSize: '4rem', color: '#9ca3af', marginBottom: '1rem' }} />
          <p className="empty-text">No transactions yet</p>
          <p className="empty-subtext">
            Your completed hatchery approvals will appear here
          </p>
        </div>
      ) : (
        <div className="history-list">
          {transactionHistory.map((transaction) => (
            <InvoiceCard
              key={transaction._id}
              transaction={transaction}
              onImagePress={handleImagePress}
            />
          ))}
        </div>
      )}

      {/* Fullscreen Image Viewer Modal */}
      {showImageViewer && selectedImageUrl && (
        <div className="image-viewer-overlay" onClick={() => setShowImageViewer(false)}>
          <div className="image-viewer-container" onClick={(e) => e.stopPropagation()}>
            <button
              className="image-viewer-close"
              onClick={() => setShowImageViewer(false)}
            >
              <FiX />
            </button>
            <img
              src={selectedImageUrl}
              alt="Fullscreen view"
              className="image-viewer-image"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPurchaseHistory;

