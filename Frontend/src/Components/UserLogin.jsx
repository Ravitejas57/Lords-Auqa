import React, { useState, useEffect } from "react";
import "../CSS/SharedAuth.css";
import { useNavigate, Link } from "react-router-dom";
import { FiArrowLeft, FiUser, FiMail, FiLock, FiSmartphone, FiEye, FiEyeOff } from "react-icons/fi";

const UserLogin = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Admin selection states
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Terms and Conditions state
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [checkboxEnabled, setCheckboxEnabled] = useState(false);

  // Loading states
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [isLoadingSignup, setIsLoadingSignup] = useState(false);

  // Ensure light mode is always applied
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("auth-dark");
  }, []);

  // Fetch admins when signup mode is activated
  useEffect(() => {
    const fetchAdmins = async () => {
      if (isSignUp && admins.length === 0) {
        setLoadingAdmins(true);
        try {
          const response = await fetch('http://localhost:3000/api/Auth/admins');
          const data = await response.json();
          if (data.success) {
            setAdmins(data.admins);
          } else {
            console.error('Failed to fetch admins');
          }
        } catch (error) {
          console.error('Error fetching admins:', error);
        } finally {
          setLoadingAdmins(false);
        }
      }
    };
    fetchAdmins();
  }, [isSignUp]);

  // Validation logic for enabling Terms checkbox (only for signup)
  useEffect(() => {
    if (isSignUp) {
      const isNameValid = name.trim().length > 0;
      const isPhoneValid = phoneNumber.length === 10;
      const isEmailValid = email.trim().length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const isPasswordValid = password.length >= 6; // Password is now mandatory
      const isConfirmPasswordValid = confirmPassword.length >= 6; // Just check if confirm password is long enough
      const isAdminSelected = selectedAdmin !== ""; // Check if admin is selected

      // Enable checkbox if basic fields are filled (don't require passwords to match yet)
      const allFieldsValid = isNameValid && isPhoneValid && isEmailValid && isPasswordValid && isConfirmPasswordValid && isAdminSelected;

      setCheckboxEnabled(allFieldsValid);

      // If checkbox becomes disabled, uncheck it
      if (!allFieldsValid && agreedToTerms) {
        setAgreedToTerms(false);
      }
    }
  }, [isSignUp, name, phoneNumber, email, password, confirmPassword, selectedAdmin, agreedToTerms]);

  const handleSignup = async (e) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      alert("Please enter your full name");
      return;
    }
    if (phoneNumber.length !== 10) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!selectedAdmin) {
      alert("Please select an admin");
      return;
    }
    if (!password || password.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    // Check Terms and Conditions agreement
    if (!agreedToTerms) {
      setShowTermsError(true);
      return;
    }

    setIsLoadingSignup(true);

    try {
      const phoneNumberWithCode = `${phoneNumber}`;

      const response = await fetch('http://localhost:3000/api/Auth/User-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email: email || undefined,
          phoneNumber: phoneNumberWithCode,
          password,
          confirmPassword,
          assignedAdmin: selectedAdmin
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message || 'Account created successfully! Please wait for admin approval.');
        navigate("/pending-approval");
        resetForm();
      } else {
        // Handle case where user already signed up and is pending approval
        if (data.pendingApproval || data.alreadySignedUp) {
          alert(data.message || 'You have already signed up. Please wait for admin approval.');
          navigate("/pending-approval");
          resetForm(); // Clear the form so user doesn't try to submit again
        } else {
          alert(data.message || 'Failed to create account. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error during signup:', error);
      alert('Failed to create account. Please check your connection and try again.');
    } finally {
      setIsLoadingSignup(false);
    }
  };

  // Terms and Conditions Modal Handlers
  const handleOpenTermsModal = (e) => {
    e.preventDefault();
    setShowTermsModal(true);
  };

  const handleCloseTermsModal = () => {
    setShowTermsModal(false);
  };

  const handleAgreeToTerms = () => {
    setAgreedToTerms(true);
    setShowTermsError(false);
    setShowTermsModal(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!phoneNumber || !password) {
      alert("Please enter mobile number and password");
      return;
    }

    setIsLoadingLogin(true);

    try {
      const phoneNumberWithCode = `${phoneNumber}`;

      const response = await fetch('http://localhost:3000/api/Auth/User-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: phoneNumberWithCode, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Save phone number for dashboard to use
        localStorage.setItem("userPhoneNumber", phoneNumberWithCode);

        // ✅ Store JWT token (most important for authentication)
        if (data.token) {
          localStorage.setItem("authToken", data.token);
          console.log("✅ JWT token stored successfully");
        }

        // ✅ Store userId and user info if returned from backend
        if (data.user && data.user.userId) {
          localStorage.setItem("userId", data.user.userId);
          localStorage.setItem("userName", data.user.name || '');
          localStorage.setItem("userEmail", data.user.email || '');
        }
        // ✅ Store MongoDB _id for notifications (this is the actual database ID)
        if (data.user && data.user._id) {
          localStorage.setItem("userMongoId", data.user._id);
        }

        navigate("/user-dashboard");
        resetForm();
      } else {
        // Handle specific error cases
        if (data.notRegistered) {
          alert(data.message || 'This mobile number is not registered. Please sign up first.');
        } else if (data.pendingApproval) {
          // Navigate to pending approval page
          navigate("/pending-approval");
        } else {
          alert(data.message || 'Login failed. Please check your credentials.');
        }
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert('Failed to login. Please check your connection and try again.');
    } finally {
      setIsLoadingLogin(false);
    }
  };

  const resetForm = () => {
    setPhoneNumber("");
    setPassword("");
    setConfirmPassword("");
    if (isSignUp) {
      setName("");
      setEmail("");
      setSelectedAdmin("");
      setIsSignUp(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Back to Home Button */}
      <Link to="/" className="auth-back-btn">
        <FiArrowLeft /> Back to Home
      </Link>


      {/* Left Side - Image */}
      <div className="auth-left">
        <div className="auth-left-content">
          <img src="/logo.png" alt="Lords Aqua Hatcheries" className="auth-left-logo" />
          <h1>Welcome Back</h1>
          <h3>Lords Aqua Hatcheries</h3>
          <p>
            Track your fish hatchery operations, monitor daily growth, and get expert feedback
            from our administrators. Join our community of successful aquaculture professionals.
          </p>
        </div>
      </div>

      {/* Right Side - Login/Signup Form */}
      <div className="auth-right">
        <div className="auth-box">
          {!isSignUp ? (
            <>
              <h2>User Login</h2>
              <p className="auth-subtext">
                Login with your mobile number and password
              </p>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="password-login">
                {/* Phone Number Input */}
                <div className="auth-input-group">
                  <div style={{ position: "relative" }}>
                    <span
                      style={{
                        position: "absolute",
                        left: "2.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--auth-text)",
                        fontWeight: "500",
                        pointerEvents: "none",
                        zIndex: 1
                      }}
                    >
                      +91
                    </span>
                    <input
                      type="tel"
                      placeholder="Enter Mobile Number"
                      maxLength="10"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      style={{ paddingLeft: "5rem" }}
                      required
                    />
                    <FiSmartphone
                      style={{
                        position: "absolute",
                        left: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--auth-text-light)"
                      }}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="auth-input-group">
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoadingLogin}
                      style={{ paddingLeft: "2.75rem", paddingRight: "3.5rem" }}
                    />
                    <FiLock
                      style={{
                        position: "absolute",
                        left: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--auth-text-light)"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "transparent",
                        border: "none",
                        color: "var(--auth-primary)",
                        cursor: "pointer",
                        fontSize: "1.2rem",
                        padding: "0.25rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FiEye /> : <FiEyeOff />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="verify-btn" disabled={isLoadingLogin}>
                  {isLoadingLogin ? "Logging in..." : "Login to Dashboard"}
                </button>
              </form>

              <p className="signup-text">
                Don't have an account?{" "}
                <span className="signup-link" onClick={() => setIsSignUp(true)}>
                  Sign up now
                </span>
              </p>
            </>
          ) : (
            <>
              <h2>Create Account</h2>
              <p className="auth-subtext">Join Lords Aqua Hatcheries today</p>

              <form onSubmit={handleSignup}>
                <div className="auth-input-group">
                  {/* Full Name - Mandatory */}
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      style={{ paddingLeft: "2.75rem" }}
                    />
                    <FiUser
                      style={{
                        position: "absolute",
                        left: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--auth-text-light)"
                      }}
                    />
                  </div>

                  {/* Mobile Number - Mandatory */}
                  <div style={{ position: "relative" }}>
                    <span
                      style={{
                        position: "absolute",
                        left: "2.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--auth-text)",
                        fontWeight: "500",
                        pointerEvents: "none",
                        zIndex: 1
                      }}
                    >
                      +91
                    </span>
                    <input
                      type="tel"
                      placeholder="Mobile Number *"
                      maxLength="10"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      style={{ paddingLeft: "5rem" }}
                    />
                    <FiSmartphone
                      style={{
                        position: "absolute",
                        left: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--auth-text-light)"
                      }}
                    />
                  </div>

                  {/* Email - Optional */}
                  <div style={{ position: "relative" }}>
                    <input
                      type="email"
                      placeholder="Email Address (Optional)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ paddingLeft: "2.75rem" }}
                    />
                    <FiMail
                      style={{
                        position: "absolute",
                        left: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--auth-text-light)"
                      }}
                    />
                  </div>

                  {/* Admin Selection - Mandatory */}
                  <div style={{ position: "relative" }}>
                    <select
                      value={selectedAdmin}
                      onChange={(e) => setSelectedAdmin(e.target.value)}
                      required
                      style={{
                        paddingLeft: "2.75rem",
                        width: "100%",
                        height: "3rem",
                        border: "1px solid var(--auth-border)",
                        borderRadius: "0.5rem",
                        backgroundColor: "var(--auth-input-bg)",
                        color: selectedAdmin ? "var(--auth-text)" : "var(--auth-text-light)",
                        fontSize: "1rem",
                        cursor: "pointer"
                      }}
                      disabled={loadingAdmins}
                    >
                      <option value="" style={{ color: "var(--auth-text-light)" }}>
                        {loadingAdmins ? "Loading admins..." : "Select Your Admin *"}
                      </option>
                      {admins.map((admin) => (
                        <option key={admin._id} value={admin._id} style={{ color: "var(--auth-text)" }}>
                          {admin.name}
                        </option>
                      ))}
                    </select>
                    <FiUser
                      style={{
                        position: "absolute",
                        left: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--auth-text-light)",
                        pointerEvents: "none"
                      }}
                    />
                  </div>

                  {/* Password - Mandatory */}
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password (min 6 characters) *"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{
                        paddingLeft: "2.75rem",
                        paddingRight: "3.5rem",
                        borderColor: password.length > 0 && password.length < 8 ? "#ef4444" : undefined
                      }}
                    />
                    <FiLock
                      style={{
                        position: "absolute",
                        left: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--auth-text-light)"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "transparent",
                        border: "none",
                        color: "var(--auth-primary)",
                        cursor: "pointer",
                        fontSize: "1.2rem",
                        padding: "0.25rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FiEye /> : <FiEyeOff />}
                    </button>
                  </div>
                  {password.length > 0 && password.length < 8 && (
                    <p style={{
                      color: "#ef4444",
                      fontSize: "0.875rem",
                      marginTop: "0.25rem",
                      marginBottom: "0.5rem"
                    }}>
                      Password must be at least 6 characters long
                    </p>
                  )}

                  {/* Confirm Password - Mandatory */}
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password *"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      style={{
                        paddingLeft: "2.75rem",
                        paddingRight: "3.5rem",
                        borderColor: confirmPassword.length > 0 && password !== confirmPassword ? "#ef4444" : undefined
                      }}
                    />
                    <FiLock
                      style={{
                        position: "absolute",
                        left: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--auth-text-light)"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: "absolute",
                        right: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "transparent",
                        border: "none",
                        color: "var(--auth-primary)",
                        cursor: "pointer",
                        fontSize: "1.2rem",
                        padding: "0.25rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <FiEye /> : <FiEyeOff />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <p style={{
                      color: "#ef4444",
                      fontSize: "0.875rem",
                      marginTop: "0.25rem",
                      marginBottom: "0.5rem"
                    }}>
                      Passwords do not match
                    </p>
                  )}
                  {confirmPassword.length > 0 && password === confirmPassword && password.length >= 6 && (
                    <p style={{
                      color: "#10b981",
                      fontSize: "0.875rem",
                      marginTop: "0.25rem",
                      marginBottom: "0.5rem"
                    }}>
                      Passwords match ✓
                    </p>
                  )}
                </div>

                {/* Terms and Conditions Checkbox */}
                <div className={`terms-container ${!checkboxEnabled ? 'disabled' : ''}`}>
                  <label className="terms-checkbox-label">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      disabled={!checkboxEnabled}
                      onChange={(e) => {
                        if (checkboxEnabled) {
                          setAgreedToTerms(e.target.checked);
                          setShowTermsError(false);
                        }
                      }}
                      className="terms-checkbox"
                    />
                    <span className="terms-text">
                      I agree to the{" "}
                      <button
                        type="button"
                        onClick={handleOpenTermsModal}
                        className="terms-link-button"
                      >
                        Terms and Conditions
                      </button>
                    </span>
                  </label>
                  {showTermsError && checkboxEnabled && (
                    <p className="terms-error">
                      Please agree to the Terms and Conditions to continue
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="send-btn"
                  disabled={!name.trim() || !phoneNumber || phoneNumber.length < 10 || !password || !confirmPassword || !agreedToTerms || isLoadingSignup}
                  style={{ marginTop: "0.5rem" }}
                >
                  {isLoadingSignup ? "Creating Account..." : "Create Account"}
                </button>
              </form>

              <p className="signup-text">
                Already have an account?{" "}
                <span className="signup-link" onClick={() => setIsSignUp(false)}>
                  Login here
                </span>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div
          className="terms-modal-overlay"
          onClick={handleCloseTermsModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="terms-modal-title"
        >
          <div
            className="terms-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="terms-modal-header">
              <h2 id="terms-modal-title">Terms and Conditions</h2>
              <button
                className="terms-modal-close"
                onClick={handleCloseTermsModal}
                aria-label="Close Terms and Conditions"
              >
                ×
              </button>
            </div>
            <div className="terms-modal-body">
              <p className="terms-date">Last Updated: January 15, 2025</p>

              <p>
                Welcome to <strong>Lords Aqua Hatcheries</strong> ("we," "our," "us").
                By creating an account or using our website, you agree to the following Terms and Conditions. Please read them carefully.
              </p>

              <h3>1. Acceptance of Terms</h3>
              <p>
                By signing up or using our services, you agree to comply with these Terms. If you do not agree, please do not use the website.
              </p>

              <h3>2. User Responsibilities</h3>
              <ul>
                <li>You must provide accurate and up-to-date information during signup.</li>
                <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
                <li>You agree not to misuse or interfere with the website's functionality or security.</li>
              </ul>

              <h3>3. Use of Services</h3>
              <p>
                Our platform is intended for hatchery management and aquaculture operations. You agree not to use it for unlawful or fraudulent purposes.
              </p>

              <h3>4. Intellectual Property</h3>
              <p>
                All content, design, and logos on this website are owned by Lords Aqua Hatcheries and protected under copyright laws. You may not copy, distribute, or modify our content without permission.
              </p>

              <h3>5. Privacy and Data Collection</h3>
              <p>
                We respect your privacy. Any personal information you share will be handled according to our Privacy Policy. We collect this data only to provide and improve our services.
              </p>

              <h3>6. Account Termination</h3>
              <p>
                We reserve the right to suspend or terminate accounts that violate these Terms, cause harm, or misuse the website.
              </p>

              <h3>7. Limitation of Liability</h3>
              <p>
                We are not responsible for any losses, damages, or issues that arise from using our platform, except where required by law.
              </p>

              <h3>8. Changes to Terms</h3>
              <p>
                We may update these Terms occasionally. Updates will be posted on this page with the revised date.
              </p>

              <h3>9. Contact Us</h3>
              <p>
                If you have any questions about these Terms, contact us at:{" "}
                <a href="mailto:support@lordsaqua.com">support@lordsaqua.com</a>
              </p>
            </div>
            <div className="terms-modal-footer">
              <button
                className="btn-secondary"
                onClick={handleCloseTermsModal}
              >
                Close
              </button>
              <button
                className="btn-primary"
                onClick={handleAgreeToTerms}
                disabled={!checkboxEnabled}
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLogin;
