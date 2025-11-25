import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiAlertTriangle } from 'react-icons/fi';

const AdminPlaceholder = ({ title, description, icon: Icon }) => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F7FA',
      padding: '2rem',
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif"
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <button
          onClick={() => navigate('/admin-dashboard')}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#1F2937'
          }}
        >
          <FiX />
        </button>
        <div>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: 700,
            color: '#1F2937',
            marginBottom: '0.25rem'
          }}>
            {title}
          </h1>
          <p style={{
            fontSize: '0.9375rem',
            color: '#6B7280'
          }}>
            {description}
          </p>
        </div>
      </div>

      <div style={{
        maxWidth: '600px',
        margin: '4rem auto',
        textAlign: 'center',
        background: '#FFFFFF',
        padding: '3rem 2rem',
        borderRadius: '12px',
        border: '1px solid #E5E7EB'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #5B7C99 0%, #4A6478 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          color: 'white',
          fontSize: '2rem'
        }}>
          {Icon ? <Icon /> : <FiConstruction />}
        </div>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#1F2937',
          marginBottom: '0.75rem'
        }}>
          {title}
        </h2>
        <p style={{
          fontSize: '1rem',
          color: '#6B7280',
          lineHeight: 1.6
        }}>
          {description}
        </p>
        <button
          onClick={() => navigate('/admin-dashboard')}
          style={{
            marginTop: '2rem',
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #5B7C99 0%, #4A6478 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '0.9375rem',
            cursor: 'pointer'
          }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default AdminPlaceholder;
