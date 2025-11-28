import React from 'react';
import { FiCheckCircle, FiUser, FiPhone, FiImage } from 'react-icons/fi';
import '../CSS/InvoiceCard.css';

const InvoiceCard = ({ transaction, onImagePress }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const generateInvoiceNumber = (transactionId) => {
    if (!transactionId || !transaction.approvedAt) return 'N/A';
    const date = new Date(transaction.approvedAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const shortId = transactionId.slice(-6).toUpperCase();
    return `INV-${year}${month}-${shortId}`;
  };

  const handleShare = async () => {
    try {
      // Create a printable version of the invoice
      const printWindow = window.open('', '_blank');
      const invoiceContent = document.getElementById(`invoice-${transaction._id}`).innerHTML;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice ${generateInvoiceNumber(transaction._id)}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .invoice-card { max-width: 800px; margin: 0 auto; }
              .invoice-header { display: flex; justify-content: space-between; padding: 20px; background: #f9fafb; }
              .invoice-title { font-size: 18px; font-weight: 700; }
              .invoice-number { font-size: 12px; color: #6b7280; margin-top: 4px; }
              .status-badge { display: flex; align-items: center; gap: 4px; background: #d1fae5; padding: 6px 12px; border-radius: 20px; }
              .status-text { font-size: 11px; font-weight: 700; color: #10b981; }
              .divider { height: 1px; background: #e5e7eb; }
              .section { padding: 16px; }
              .row { display: flex; justify-content: space-between; gap: 16px; }
              .column { flex: 1; }
              .label { font-size: 11px; color: #6b7280; margin-bottom: 4px; text-transform: uppercase; }
              .value { font-size: 14px; color: #111827; font-weight: 600; }
              .section-title { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 12px; text-transform: uppercase; }
              .info-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
              .info-text { font-size: 14px; color: #111827; }
              .items-table { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
              .table-header { display: flex; background: #f9fafb; padding: 12px; border-bottom: 1px solid #e5e7eb; }
              .table-header-text { font-size: 12px; font-weight: 700; color: #111827; text-transform: uppercase; }
              .table-row { display: flex; padding: 12px; border-bottom: 1px solid #f3f4f6; }
              .table-cell { font-size: 14px; color: #111827; }
              .total-row { background: #f9fafb; border-bottom: 0; }
              .total-label { font-size: 14px; font-weight: 700; color: #111827; }
              .total-value { font-size: 16px; font-weight: 700; color: #5B7C99; }
              .images-grid { display: flex; gap: 8px; flex-wrap: wrap; }
              .image-container { text-align: center; }
              .image-thumb { width: 70px; height: 70px; border-radius: 8px; border: 1px solid #e5e7eb; object-fit: cover; }
              .image-label { font-size: 10px; color: #6b7280; margin-top: 4px; font-weight: 600; }
              .footer { padding: 16px; background: #f9fafb; }
              .footer-text { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
            </style>
          </head>
          <body>
            <div class="invoice-card">
              ${invoiceContent}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error('Error sharing invoice:', error);
      alert('Failed to share invoice. Please try again.');
    }
  };

  return (
    <div className="invoice-card-container">
      <div id={`invoice-${transaction._id}`} className="invoice-card">
        {/* Invoice Header */}
        <div className="invoice-header">
          <div>
            <div className="invoice-title">PURCHASE INVOICE</div>
            <div className="invoice-number">
              {generateInvoiceNumber(transaction._id)}
            </div>
          </div>
          <div className="status-badge">
            <FiCheckCircle style={{ color: '#10b981', fontSize: '16px' }} />
            <span className="status-text">PAID</span>
          </div>
        </div>

        <div className="divider" />

        {/* Invoice Details */}
        <div className="section">
          <div className="row">
            <div className="column">
              <div className="label">Invoice Date</div>
              <div className="value">{formatDateTime(transaction.approvedAt)}</div>
            </div>
            <div className="column">
              <div className="label">Period</div>
              <div className="value">
                {formatDate(transaction.startDate)} - {formatDate(transaction.endDate)}
              </div>
            </div>
          </div>
        </div>

        <div className="divider" />

        {/* Customer Info */}
        <div className="section">
          <div className="section-title">Customer Information</div>
          <div className="info-row">
            <FiUser style={{ fontSize: '16px', color: '#6b7280' }} />
            <span className="info-text">{transaction.userName || 'N/A'}</span>
          </div>
          <div className="info-row">
            <FiPhone style={{ fontSize: '16px', color: '#6b7280' }} />
            <span className="info-text">{transaction.userPhoneNumber || 'N/A'}</span>
          </div>
        </div>

        <div className="divider" />

        {/* Items/Seeds Details */}
        <div className="section">
          <div className="section-title">Purchase Details</div>
          <div className="items-table">
            <div className="table-header">
              <div className="table-header-text" style={{ flex: 2 }}>Description</div>
              <div className="table-header-text" style={{ flex: 1, textAlign: 'right' }}>Value</div>
            </div>

            <div className="table-row">
              <div className="table-cell" style={{ flex: 2 }}>Seeds Count</div>
              <div className="table-cell" style={{ flex: 1, textAlign: 'right' }}>
                {transaction.seedsCount?.toLocaleString() || '0'}
              </div>
            </div>

            <div className="table-row">
              <div className="table-cell" style={{ flex: 2 }}>Seed Type</div>
              <div className="table-cell" style={{ flex: 1, textAlign: 'right' }}>
                {transaction.seedType || 'None'}
              </div>
            </div>

            <div className="table-row">
              <div className="table-cell" style={{ flex: 2 }}>Bonus</div>
              <div className="table-cell" style={{ flex: 1, textAlign: 'right' }}>
                {transaction.bonus?.toLocaleString() || '0'}
              </div>
            </div>

            <div className="table-row total-row">
              <div className="total-label" style={{ flex: 2 }}>Total Price</div>
              <div className="total-value" style={{ flex: 1, textAlign: 'right' }}>
                ₹{transaction.price?.toLocaleString() || '0'}
              </div>
            </div>
          </div>
        </div>

        {/* Approved Images */}
        {transaction.approvedImages && transaction.approvedImages.length > 0 && (
          <>
            <div className="divider" />
            <div className="section">
              <div className="section-title">
                Approved Images ({transaction.approvedImages.length})
              </div>
              <div className="images-grid">
                {transaction.approvedImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="image-container"
                    onClick={() => onImagePress?.(img.url)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img
                      src={img.url}
                      alt={`Image ${idx + 1}`}
                      className="image-thumb"
                    />
                    <div className="image-label">#{idx + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="divider" />
        <div className="footer">
          <div className="footer-text">
            Approved by: {transaction.approvedByName || 'Admin'}
          </div>
          <div className="footer-text">
            Date: {formatDateTime(transaction.approvedAt)}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="actions">
        <button className="action-button" onClick={handleShare}>
          <FiImage style={{ fontSize: '20px', marginRight: '8px' }} />
          Share/Print Invoice
        </button>
      </div>
    </div>
  );
};

export default InvoiceCard;

