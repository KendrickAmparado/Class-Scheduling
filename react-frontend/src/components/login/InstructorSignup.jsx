import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faCalendarAlt, faUserPlus, faLock, faPhone, faBuilding, faCheckCircle, faTimes } from '@fortawesome/free-solid-svg-icons';

const InstructorSignup = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    contact: '',
    department: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();

  // Auto-populate email and department from URL query parameters
  useEffect(() => {
    const emailFromUrl = searchParams.get('email');
    const departmentFromUrl = searchParams.get('department');
    
    if (emailFromUrl) {
      setFormData(prev => ({
        ...prev,
        email: decodeURIComponent(emailFromUrl),
        department: departmentFromUrl ? decodeURIComponent(departmentFromUrl) : ''
      }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      const res = await fetch('http://localhost:5000/api/instructors/complete-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: formData.email,
          contact: formData.contact,
          department: formData.department,
          password: formData.password
        }),
      });
  
      const data = await res.json();
  
      if (res.ok) {
        setShowSuccessModal(true);
  
        // Auto redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/instructor/login');
        }, 3000);
      } else {
        // Display backend validation or error messages gracefully
        alert(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Error during registration:', err);
      alert('Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };
  
  

  const handleModalClose = () => {
    setShowSuccessModal(false);
    navigate('/instructor/login');
  };

  const inputFieldStyle = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    background: "white",
    border: "2px solid #ddd",
    borderRadius: "12px",
    padding: 0,
    transition: "all 0.3s ease",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
  };

  const iconStyle = {
    padding: "0 15px",
    color: "#666",
    fontSize: "16px",
    minWidth: "50px",
    display: "flex",
    justifyContent: "center"
  };

  const inputStyle = {
    flex: 1,
    border: "none",
    outline: "none",
    padding: "18px 15px 18px 0",
    fontSize: "16px",
    background: "transparent",
    color: "#333"
  };

  return (
    <div style={{ 
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: "linear-gradient(135deg, #0f2c63 30%, #f97316 100%)",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column"
    }}>
      <div className="header2" style={{
        width: "100%",
        height: "80px",
        background: "linear-gradient(135deg, #0f2c63 30%, #f97316 100%)",
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative"
      }}>
        <h1 style={{
          color: "white",
          fontSize: "24px",
          fontWeight: "600",
          letterSpacing: "1px",
          margin: 0
        }}>
          <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: "10px" }} />
          Class Scheduling System
        </h1>
      </div>

      <div className="main-container2" style={{
        flex: 1,
        display: "flex",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}>
        <div className="login-card2" style={{
          background: "#d4d6dc",
          padding: "50px 40px",
          borderRadius: "20px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
          textAlign: "center",
          maxWidth: "500px",
          width: "100%",
          position: "relative",
          overflow: "hidden",
          transition: "all 0.3s ease"
        }}>
          <div style={{
            content: "''",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "5px",
            background: "linear-gradient(90deg, #f97316, #ea580c)"
          }}></div>

          <img 
            src="/images/buksuu.png" 
            alt="System Logo" 
            className="logo2"
            style={{
              width: "200px",
              height: "auto",
              marginBottom: "30px",
              borderRadius: "10px",
              boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
              border: "none"
            }}
          />
          
          <h2 className="welcome-text2" style={{
            marginBottom: "10px",
            color: "#333",
            fontSize: "28px",
            fontWeight: "700"
          }}>Instructor Sign Up</h2>
          
          <p className="subtitle2" style={{
            marginBottom: "30px",
            color: "#666",
            fontSize: "14px",
            lineHeight: "1.5"
          }}>Complete your registration to access the system</p>
          
          <form className="login-form2" onSubmit={handleSubmit} style={{ marginBottom: "30px" }}>
            <div className="input-group2" style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              marginBottom: "30px"
            }}>
              {/* First Name */}
              <div className="input-field2" style={inputFieldStyle}>
                <FontAwesomeIcon icon={faUser} style={iconStyle} />
                <input
                  type="text"
                  name="firstname"
                  placeholder="First Name"
                  value={formData.firstname}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  style={inputStyle}
                />
              </div>

              {/* Last Name */}
              <div className="input-field2" style={inputFieldStyle}>
                <FontAwesomeIcon icon={faUser} style={iconStyle} />
                <input
                  type="text"
                  name="lastname"
                  placeholder="Last Name"
                  value={formData.lastname}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  style={inputStyle}
                />
              </div>

              {/* Email (Read-only) */}
              <div className="input-field2" style={inputFieldStyle}>
                <FontAwesomeIcon icon={faEnvelope} style={iconStyle} />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  readOnly
                  style={{
                    ...inputStyle,
                    cursor: "not-allowed",
                    backgroundColor: "transparent"
                  }}
                />
              </div>

              {/* Contact Number */}
              <div className="input-field2" style={inputFieldStyle}>
                <FontAwesomeIcon icon={faPhone} style={iconStyle} />
                <input
                  type="tel"
                  name="contact"
                  placeholder="Contact Number (e.g., +63 XXX XXX XXXX)"
                  value={formData.contact}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  style={inputStyle}
                />
              </div>

              {/* Department (Read-only - set by admin) */}
              <div className="input-field2" style={inputFieldStyle}>
                <FontAwesomeIcon icon={faBuilding} style={iconStyle} />
                <input
                  type="text"
                  name="department"
                  placeholder="Department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  readOnly
                  style={{
                    ...inputStyle,
                    cursor: "not-allowed",
                    backgroundColor: "transparent"
                  }}
                />
              </div>

              {/* Password */}
              <div className="input-field2" style={inputFieldStyle}>
                <FontAwesomeIcon icon={faLock} style={iconStyle} />
                <input
                  type="password"
                  name="password"
                  placeholder="Password (min. 6 characters)"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                  disabled={loading}
                  style={inputStyle}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="login-btn2 instructor-btn2"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                gap: "15px",
                padding: "18px 30px",
                border: "none",
                borderRadius: "15px",
                fontSize: "18px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                textDecoration: "none",
                position: "relative",
                overflow: "hidden",
                background: loading ? "#6b7280" : "linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)",
                color: "white",
                boxShadow: "0 8px 20px rgba(15, 44, 99, 0.3)",
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = "translateY(-3px)";
                  e.target.style.boxShadow = "0 12px 25px rgba(15, 44, 99, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 8px 20px rgba(15, 44, 99, 0.3)";
                }
              }}
            >
              <FontAwesomeIcon icon={faUserPlus} />
              <span>{loading ? "Creating Account..." : "Complete Registration"}</span>
            </button>
          </form>

          <p className="signup-text2" style={{
            color: "#666",
            fontSize: "14px"
          }}>
            Already have an account? <Link to="/instructor/login" style={{ color: "#f97316", textDecoration: "none", fontWeight: "600" }}>Login here!</Link>
          </p>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          animation: "fadeIn 0.3s ease"
        }}>
          <div style={{
            background: "white",
            borderRadius: "20px",
            padding: "40px",
            maxWidth: "500px",
            width: "90%",
            textAlign: "center",
            position: "relative",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            animation: "slideUp 0.4s ease"
          }}>
            <button
              onClick={handleModalClose}
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                background: "transparent",
                border: "none",
                fontSize: "24px",
                color: "#999",
                cursor: "pointer",
                transition: "color 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.color = "#333"}
              onMouseLeave={(e) => e.target.style.color = "#999"}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>

            <div style={{
              width: "80px",
              height: "80px",
              background: "linear-gradient(135deg, #10b981, #059669)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 30px",
              animation: "scaleIn 0.5s ease"
            }}>
              <FontAwesomeIcon 
                icon={faCheckCircle} 
                style={{ fontSize: "50px", color: "white" }}
              />
            </div>

            <h2 style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#1e293b",
              marginBottom: "15px"
            }}>
              Account Created Successfully!
            </h2>

            <p style={{
              fontSize: "16px",
              color: "#64748b",
              lineHeight: "1.6",
              marginBottom: "10px"
            }}>
              Welcome to the Class Scheduling System, <strong>{formData.firstname} {formData.lastname}</strong>!
            </p>

            <p style={{
              fontSize: "14px",
              color: "#94a3b8",
              marginBottom: "30px"
            }}>
              You will be redirected to the login page in a moment...
            </p>

            <button
              onClick={handleModalClose}
              style={{
                padding: "14px 32px",
                background: "linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(15, 44, 99, 0.3)"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 16px rgba(15, 44, 99, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(15, 44, 99, 0.3)";
              }}
            >
              Go to Login
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { 
            transform: translateY(50px);
            opacity: 0;
          }
          to { 
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from { 
            transform: scale(0);
            opacity: 0;
          }
          to { 
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default InstructorSignup;
