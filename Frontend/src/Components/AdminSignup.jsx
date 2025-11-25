import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiUser, FiPhone, FiLock, FiEye, FiEyeOff, FiCheckCircle, FiX } from "react-icons/fi";
import axios from "axios";
import "../CSS/SharedAuth.css";

const AdminSignup = () => {
  const [formData, setFormData] = useState({
    username: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  // Ensure light mode is always applied
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("auth-dark");
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      username: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    });
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setMessage("Error: Passwords do not match");
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setMessage("Error: Password must be at least 6 characters");
      return;
    }

    try {
      const { confirmPassword, ...dataToSend } = formData;
      const res = await axios.post(
        "http://localhost:3000/api/adminActions/admin-signup",
        dataToSend
      );
      
      // Show success pop-up modal
      setSuccessMessage(res.data.message || "Admin registered successfully!");
      setShowSuccessModal(true);
      
      // Clear form fields after successful signup
      resetForm();
    } catch (error) {
      setMessage(error.response?.data?.message || "Error occurred during signup");
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessMessage("");
  };

  return (
    <div className="auth-container">
      {/* Back to Home */}
      <Link to="/" className="auth-back-btn">
        <FiArrowLeft /> Back to Home
      </Link>


      {/* Left Side */}
      <div className="auth-left">
        <div className="auth-left-content">
          <img
            src="/logo.png"
            alt="Lords Aqua Hatcheries"
            className="auth-left-logo"
          />
          <h1>Lords Aqua Hatcheries</h1>
          <h3>Administrator Portal</h3>
          <p>
            Create your administrator account to manage hatcheries, approve
            users, and oversee aquaculture operations efficiently.
          </p>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="auth-right">
        <div className="auth-box">
          <h2>Administrator Signup</h2>
          <p className="auth-subtext">
            Register your administrator account securely
          </p>

          <form onSubmit={handleSubmit}>
            <div className="auth-input-group">
              {/* Username */}
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: "2.75rem" }}
                />
                <FiUser
                  style={{
                    position: "absolute",
                    left: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--auth-text-light)",
                    fontSize: "1.2rem",
                  }}
                />
              </div>

              {/* Phone */}
              <div style={{ position: "relative" }}>
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder="Phone Number"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: "2.75rem" }}
                />
                <FiPhone
                  style={{
                    position: "absolute",
                    left: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--auth-text-light)",
                    fontSize: "1.2rem",
                  }}
                />
              </div>

              {/* Password */}
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password (min 6 characters)"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  style={{ paddingLeft: "2.75rem", paddingRight: "2.75rem" }}
                />
                <FiLock
                  style={{
                    position: "absolute",
                    left: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--auth-text-light)",
                    fontSize: "1.2rem",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <FiEye style={{ color: "var(--auth-primary)", fontSize: "1.1rem" }} />
                  ) : (
                    <FiEyeOff style={{ color: "var(--auth-text-light)", fontSize: "1.1rem" }} />
                  )}
                </button>
              </div>

              {/* Confirm Password */}
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  style={{ paddingLeft: "2.75rem", paddingRight: "2.75rem" }}
                />
                <FiLock
                  style={{
                    position: "absolute",
                    left: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--auth-text-light)",
                    fontSize: "1.2rem",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <FiEye style={{ color: "var(--auth-primary)", fontSize: "1.1rem" }} />
                  ) : (
                    <FiEyeOff style={{ color: "var(--auth-text-light)", fontSize: "1.1rem" }} />
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-btn">
              Create Admin Account
            </button>
          </form>

          {message && (
            <p
              className="auth-subtext"
              style={{
                color: message.includes("Error") ? "#EF4444" : "green",
                marginTop: "1rem",
              }}
            >
              {message}
            </p>
          )}

          <p className="switch-text" style={{ marginTop: "1.5rem" }}>
            Already have an account?{" "}
            <Link to="/admin-login" className="signup-link">
              Login here
            </Link>
          </p>
        </div>
      </div>

      {/* Success Pop-up Modal */}
      {showSuccessModal && (
        <div
          className="success-modal-overlay"
          onClick={closeSuccessModal}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            animation: "fadeIn 0.3s ease-in-out",
          }}
        >
          <div
            className="success-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "2rem",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              position: "relative",
              animation: "slideUp 0.3s ease-out",
            }}
          >
            <button
              onClick={closeSuccessModal}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: "#64748B",
                padding: "0.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#1E293B")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#64748B")}
            >
              <FiX />
            </button>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: "#10B981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.5rem",
                }}
              >
                <FiCheckCircle
                  style={{
                    fontSize: "2rem",
                    color: "#ffffff",
                  }}
                />
              </div>

              <h2
                style={{
                  margin: "0 0 0.75rem 0",
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  color: "#1E293B",
                }}
              >
                Success!
              </h2>

              <p
                style={{
                  margin: "0 0 1.5rem 0",
                  fontSize: "1rem",
                  color: "#475569",
                  lineHeight: "1.5",
                }}
              >
                {successMessage}
              </p>

              <button
                onClick={closeSuccessModal}
                className="auth-btn"
                style={{
                  width: "100%",
                  marginTop: "0.5rem",
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminSignup;
