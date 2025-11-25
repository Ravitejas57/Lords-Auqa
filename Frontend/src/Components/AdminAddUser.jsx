import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiPhone,
  FiMail,
  FiGlobe,
  FiMapPin,
  FiSave,
  FiHome,
  FiPackage,
  FiLock,
  FiCopy,
  FiCheck,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "../CSS/AdminAddUser.css";

const AdminAddUser = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // Profile Information
    fullName: "",
    mobileNumber: "",
    email: "",
    country: "",
    state: "",
    district: "",
    fullAddress: "",
    pincode: "",

    // Seeds Information
    seedsAvailable: "",
    seedsSold: "",
    activeBatches: "",

    // Security
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const copyToClipboard = () => {
    if (formData.password) {
      navigator.clipboard.writeText(formData.password)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy password: ', err);
        });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const validateForm = () => {
    const newErrors = {};

    // Profile Information validations
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.mobileNumber || formData.mobileNumber.length < 10)
      newErrors.mobileNumber = "Please enter a valid phone number";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.country.trim()) newErrors.country = "Country is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.district.trim()) newErrors.district = "District is required";
    if (!formData.fullAddress.trim()) newErrors.fullAddress = "Full address is required";
    if (!formData.pincode.trim()) newErrors.pincode = "Pincode is required";

    // Seeds Information validations
    if (!formData.seedsAvailable && formData.seedsAvailable !== 0) {
      newErrors.seedsAvailable = "Seeds available is required";
    } else if (isNaN(formData.seedsAvailable)) {
      newErrors.seedsAvailable = "Seeds available must be a number";
    }

    if (formData.seedsSold && isNaN(formData.seedsSold)) {
      newErrors.seedsSold = "Seeds sold must be a number";
    }

    if (formData.activeBatches && isNaN(formData.activeBatches)) {
      newErrors.activeBatches = "Active batches must be a number";
    }

    // Password validation
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddUser = async () => {
    if (!validateForm()) return;

    // Get admin data from localStorage
    const storedAdminData = localStorage.getItem('adminData');
    
    if (!storedAdminData) {
      alert("Admin session not found. Please log in again.");
      navigate("/admin-login");
      return;
    }
    
    let adminData;
    try {
      adminData = JSON.parse(storedAdminData);
    } catch (error) {
      console.error("Error parsing admin data:", error);
      alert("Invalid admin session data. Please log in again.");
      navigate("/admin-login");
      return;
    }
    console.log("storeAdminID",adminData);

    // Check if admin data has the required id field (can be id, _id, or profile._id)
    const adminId = adminData.id || adminData._id || adminData.profile?._id;
    if (!adminId) {
      alert("Admin ID not found in session. Please log in again.");
      navigate("/admin-login");
      return;
    }

    setLoading(true);
    try {
      const cleanPhoneNumber = formData.mobileNumber.replace(/\D/g, "");
      const last10Digits = cleanPhoneNumber.slice(-10);

      const payload = {
        name: formData.fullName,
        phoneNumber: last10Digits,
        email: formData.email || undefined,
        password: formData.password,
        country: formData.country || "",
        state: formData.state || "",
        district: formData.district || "",
        fullAddress: formData.fullAddress || "",
        pincode: formData.pincode || "",
        seedsAvailable: formData.seedsAvailable ? parseInt(formData.seedsAvailable) : 0,
        seedsSold: formData.seedsSold ? parseInt(formData.seedsSold) : 0,
        activeBatches: formData.activeBatches ? parseInt(formData.activeBatches) : 0,
        assignedAdmin: adminId, // Use the retrieved admin ID
      };

      console.log("Sending payload to admin add user endpoint:", payload);

      const response = await fetch(
        "http://localhost:3000/api/adminActions/add-user",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      console.log("Response from server:", data);

      if (data.success) {
        setShowSuccess(true);
        setTimeout(() => navigate("/admin-dashboard"), 2000);
      } else {
        alert(`❌ ${data.message || "Failed to create user"}`);
      }
    } catch (err) {
      console.error("Error creating user:", err);
      alert("Error creating user. Please check console for details.");
    }
    setLoading(false);
  };

  return (
    <div className="admin-add-user-page">
      <div className="add-user-header">
        <div className="header-left">
          <h1>Add New User</h1>
          <p>Enter user details and create account</p>
        </div>
      </div>

      {showSuccess ? (
        <div className="success-banner">
          <FiHome style={{ fontSize: "2rem", color: "#10b981" }} />
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: "0 0 0.5rem 0", color: "#10b981" }}>
              User Created Successfully!
            </h3>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>
              The user can now log in using their phone number and password.
            </p>
          </div>
          <button
            className="btn-success"
            style={{ marginLeft: "1rem" }}
            onClick={() => navigate("/admin-dashboard")}
          >
            <FiHome /> Go to Dashboard
          </button>
        </div>
      ) : (
        <div className="add-user-container">
          <form className="add-user-form">
            {/* Profile Information Section */}
            <section className="form-section">
              <h2>
                <FiUser className="section-icon" />
                Profile Information
              </h2>
              <div className="form-grid">
                <div className="form-field">
                  <label>
                    <FiUser /> Full Name *
                  </label>
                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    className={errors.fullName ? "error-input" : ""}
                  />
                  {errors.fullName && (
                    <small className="error">{errors.fullName}</small>
                  )}
                </div>

                <div className="form-field">
                  <label>
                    <FiPhone /> Phone Number *
                  </label>
                  <PhoneInput
                    country={"in"}
                    value={formData.mobileNumber}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        mobileNumber: value,
                      }))
                    }
                    inputStyle={{
                      width: "100%",
                      height: "40px",
                      fontSize: "15px",
                      borderRadius: "6px",
                    }}
                    buttonStyle={{ borderRadius: "6px 0 0 6px" }}
                  />
                  {errors.mobileNumber && (
                    <small className="error">{errors.mobileNumber}</small>
                  )}
                </div>

                <div className="form-field">
                  <label>
                    <FiMail /> Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    className={errors.email ? "error-input" : ""}
                  />
                  {errors.email && (
                    <small className="error">{errors.email}</small>
                  )}
                </div>

                <div className="form-field">
                  <label>
                    <FiGlobe /> Country *
                  </label>
                  <input
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="Enter country"
                    className={errors.country ? "error-input" : ""}
                  />
                  {errors.country && (
                    <small className="error">{errors.country}</small>
                  )}
                </div>

                <div className="form-field">
                  <label>
                    <FiMapPin /> State *
                  </label>
                  <input
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Enter state"
                    className={errors.state ? "error-input" : ""}
                  />
                  {errors.state && (
                    <small className="error">{errors.state}</small>
                  )}
                </div>

                <div className="form-field">
                  <label>
                    <FiMapPin /> District *
                  </label>
                  <input
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="Enter district"
                    className={errors.district ? "error-input" : ""}
                  />
                  {errors.district && (
                    <small className="error">{errors.district}</small>
                  )}
                </div>

                <div className="form-field full-width">
                  <label>
                    <FiMapPin /> Full Address *
                  </label>
                  <textarea
                    name="fullAddress"
                    value={formData.fullAddress}
                    onChange={handleChange}
                    placeholder="Enter complete address"
                    rows="3"
                    className={errors.fullAddress ? "error-input" : ""}
                  />
                  {errors.fullAddress && (
                    <small className="error">{errors.fullAddress}</small>
                  )}
                </div>

                <div className="form-field">
                  <label>
                    <FiMapPin /> Pincode *
                  </label>
                  <input
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="Enter pincode"
                    className={errors.pincode ? "error-input" : ""}
                  />
                  {errors.pincode && (
                    <small className="error">{errors.pincode}</small>
                  )}
                </div>
              </div>
            </section>

            {/* Seeds Information Section */}
            <section className="form-section">
              <h2>
                <FiPackage className="section-icon" />
                Seeds Information
              </h2>
              <div className="form-grid">
                <div className="form-field">
                  <label>
                    <FiPackage /> Seeds Available *
                  </label>
                  <input
                    name="seedsAvailable"
                    type="number"
                    value={formData.seedsAvailable}
                    onChange={handleChange}
                    placeholder="Enter seeds available"
                    className={errors.seedsAvailable ? "error-input" : ""}
                  />
                  {errors.seedsAvailable && (
                    <small className="error">{errors.seedsAvailable}</small>
                  )}
                </div>

                <div className="form-field">
                  <label>
                    <FiPackage /> Seeds Sold
                  </label>
                  <input
                    name="seedsSold"
                    type="number"
                    value={formData.seedsSold}
                    onChange={handleChange}
                    placeholder="Enter seeds sold"
                    className={errors.seedsSold ? "error-input" : ""}
                  />
                  {errors.seedsSold && (
                    <small className="error">{errors.seedsSold}</small>
                  )}
                </div>

                <div className="form-field">
                  <label>
                    <FiPackage /> Active Batches
                  </label>
                  <input
                    name="activeBatches"
                    type="number"
                    value={formData.activeBatches}
                    onChange={handleChange}
                    placeholder="Enter active batches"
                    className={errors.activeBatches ? "error-input" : ""}
                  />
                  {errors.activeBatches && (
                    <small className="error">{errors.activeBatches}</small>
                  )}
                </div>
              </div>
            </section>

            {/* Security Section */}
            <section className="form-section">
              <h2>
                <FiLock className="section-icon" />
                Security
              </h2>
              <div className="form-grid">
                <div className="form-field">
                  <label>Create Password *</label>
                  <div className="password-field-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password (min. 6 characters)"
                      className={errors.password ? "error-input" : ""}
                    />
                    <div className="password-actions">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={togglePasswordVisibility}
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <FiEye /> : <FiEyeOff />}
                      </button>
                      {formData.password && (
                        <button
                          type="button"
                          className={`icon-btn ${copied ? 'copied' : ''}`}
                          onClick={copyToClipboard}
                          title="Copy password"
                        >
                          {copied ? <FiCheck /> : <FiCopy />}
                        </button>
                      )}
                    </div>
                  </div>
                  {errors.password && (
                    <small className="error">{errors.password}</small>
                  )}
                </div>

                <div className="form-field">
                  <label>Confirm Password *</label>
                  <div className="password-field-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      className={errors.confirmPassword ? "error-input" : ""}
                    />
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={toggleConfirmPasswordVisibility}
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <FiEye /> : <FiEyeOff />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <small className="error">{errors.confirmPassword}</small>
                  )}
                </div>

                {copied && (
                  <div className="form-field full-width">
                    <div className="copy-success-message">
                      <FiCheck className="success-icon" />
                      Password copied to clipboard!
                    </div>
                  </div>
                )}
              </div>
            </section>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate("/admin-dashboard")}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleAddUser}
                disabled={loading}
              >
                {loading ? (
                  "Creating User..."
                ) : (
                  <>
                    <FiSave /> Add User
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminAddUser;