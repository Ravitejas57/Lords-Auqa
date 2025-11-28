import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiClock, FiImage, FiX } from 'react-icons/fi';
import { getAdminTransactionHistory } from '../services/adminApi';
import InvoiceCard from './InvoiceCard';
import '../CSS/PurchaseHistory.css';

const AdminPurchaseHistory = () => {
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
      const adminData = JSON.parse(localStorage.getItem('adminData'));
      
      // Try multiple adminId formats (MongoDB ObjectId and profileAdminId string)
      const adminIdMongo = adminData?.profile?._id || adminData?._id || adminData?.id;
      const adminIdString = adminData?.profile?.adminId || adminData?.adminId;
      
      console.log('Trying adminId formats:', { adminIdMongo, adminIdString });
      
      setLoading(true);
      
      // Try querying with MongoDB ObjectId first
      let response = await getAdminTransactionHistory(adminIdMongo);
      console.log('Response with MongoDB ObjectId:', response);
      
      // If no results and we have a different adminId format, try that too
      if (response.success && response.transactions.length === 0 && adminIdString && adminIdString !== adminIdMongo) {
        console.log('No transactions found with MongoDB ObjectId, trying profileAdminId:', adminIdString);
        const response2 = await getAdminTransactionHistory(adminIdString);
        console.log('Response with profileAdminId:', response2);
        if (response2.success && response2.transactions.length > 0) {
          response = response2;
        }
      }
      
      if (response.success) {
        setTransactionHistory(response.transactions || []);
        console.log('Final transactions loaded:', response.transactions.length);
      }
    } catch (error) {
      console.error('Error loading transaction history:', error);
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

  return (
    <div className="purchase-history-container">
      <div className="purchase-history-header">
        <div>
          <h1 className="purchase-history-title">Purchase History</h1>
          <p className="purchase-history-subtitle">
            View all completed hatchery purchases
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
            Completed hatchery approvals will appear here
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

export default AdminPurchaseHistory;

