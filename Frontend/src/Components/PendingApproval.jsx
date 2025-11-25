import React, { useEffect, useState } from "react";
import "../CSS/PendingApproval.css";
import { useNavigate } from "react-router-dom";
import { FiClock, FiCheckCircle, FiArrowLeft } from "react-icons/fi";

const PendingApproval = () => {
  const navigate = useNavigate();
  // Ensure light mode is always applied
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("auth-dark");
  }, []);

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <div className="pending-approval-container">
      <div className="pending-approval-card">
        <div className="pending-icon-wrapper">
          <FiClock className="pending-icon" />
        </div>

        <h1 className="pending-title">Pending Approval</h1>

        <div className="pending-message">
          <p className="pending-main-text">
            Your mobile number has been verified successfully!
          </p>
          <p className="pending-sub-text">
            Kindly wait for the organization's approval to access the system.
          </p>
        </div>

        <div className="pending-status-box">
          <div className="status-item">
            <FiCheckCircle className="status-icon success" />
            <span className="status-text">Mobile Number Verified</span>
          </div>
          <div className="status-item">
            <FiClock className="status-icon pending" />
            <span className="status-text">Awaiting Admin Approval</span>
          </div>
        </div>

        <div className="pending-info-box">
          <p className="info-text">
            You will receive access once an administrator approves your request.
            This typically takes 24-48 hours.
          </p>
          <p className="info-text">
            If you have any questions, please contact support.
          </p>
        </div>

        <button className="back-to-home-btn" onClick={handleBackToHome}>
          <FiArrowLeft />
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default PendingApproval;
