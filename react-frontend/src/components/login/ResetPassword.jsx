import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faCalendarAlt, faArrowLeft, faCheckCircle, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const userType = searchParams.get('type') || 'instructor';
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Verify token on component mount
    const verifyToken = async () => {
      if (!token || !email || !userType) {
        setTokenValid(false);
        setError('Invalid reset link. Please request a new password reset.');
        setVerifying(false);
        return;
      }

      try {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/password-reset/verify`, {
          params: { token, email, userType }
        });

        if (res.data.success && res.data.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setError(res.data.message || 'Invalid or expired reset token. Please request a new password reset.');
        }
      } catch (err) {
        console.error('Token verification error:', err);
        setTokenValid(false);
        setError('Error verifying reset token. Please try again.');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token, email, userType]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/password-reset/reset`, {
        token,
        email,
        userType,
        newPassword: formData.newPassword
      });

      if (res.data.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate(userType === 'admin' ? '/admin/login' : '/instructor/login');
        }, 3000);
      } else {
        setError(res.data.message || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div style={{ 
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        background: "linear-gradient(135deg, #0f2c63 30%, #f97316 100%)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{
          background: "#d4d6dc",
          padding: "40px",
          borderRadius: "20px",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>⏳</div>
          <p style={{ color: "#333", fontSize: "16px" }}>Verifying reset token...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div style={{ 
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        background: "linear-gradient(135deg, #0f2c63 30%, #f97316 100%)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column"
      }}>
        <div className="header" style={{
          width: "100%",
          height: "80px",
          background: "linear-gradient(135deg, #0f2c63 30%, #f97316 100%)",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
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

        <div className="main-container" style={{
          flex: 1,
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div className="login-card" style={{
            background: "#d4d6dc",
            padding: "50px 40px",
            borderRadius: "20px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
            textAlign: "center",
            maxWidth: "400px",
            width: "100%"
          }}>
            <div style={{
              background: "#fee2e2",
              color: "#dc2626",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "30px",
              border: "2px solid #f87171"
            }}>
              <p style={{ margin: 0, fontWeight: "600", marginBottom: "10px" }}>
                Invalid Reset Link
              </p>
              <p style={{ margin: 0, fontSize: "14px" }}>
                {error || 'This password reset link is invalid or has expired. Please request a new one.'}
              </p>
            </div>

            <Link 
              to={`/forgot-password?type=${userType}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                padding: "12px 24px",
                background: "linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)",
                color: "white",
                textDecoration: "none",
                borderRadius: "12px",
                fontWeight: "600",
                marginBottom: "15px",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 8px 20px rgba(15, 44, 99, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "";
                e.target.style.boxShadow = "";
              }}
            >
              Request New Reset Link
            </Link>

            <Link 
              to={userType === 'admin' ? '/admin/login' : '/instructor/login'}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                color: "#0f2c63",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "600"
              }}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: "linear-gradient(135deg, #0f2c63 30%, #f97316 100%)",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column"
    }}>
      <div className="header" style={{
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

      <div className="main-container" style={{
        flex: 1,
        display: "flex",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}>
        <div className="login-card" style={{
          background: "#d4d6dc",
          padding: "50px 40px",
          borderRadius: "20px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
          textAlign: "center",
          maxWidth: "400px",
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
            className="logo"
            style={{
              width: "200px",
              height: "auto",
              marginBottom: "30px",
              borderRadius: "10px",
              boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
              border: "none"
            }}
          />
          
          <h2 className="welcome-text" style={{
            marginBottom: "10px",
            color: "#333",
            fontSize: "28px",
            fontWeight: "700"
          }}>
            Reset Password
          </h2>
          
          <p className="subtitle" style={{
            marginBottom: "30px",
            color: "#666",
            fontSize: "14px",
            lineHeight: "1.5"
          }}>
            Enter your new password below.
          </p>

          {success ? (
            <div style={{
              background: "#d1fae5",
              color: "#065f46",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "30px",
              border: "2px solid #10b981"
            }}>
              <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: "24px", marginBottom: "10px", display: "block" }} />
              <p style={{ margin: 0, fontWeight: "600" }}>
                Password reset successfully!
              </p>
              <p style={{ margin: "10px 0 0 0", fontSize: "14px" }}>
                Redirecting to login page...
              </p>
            </div>
          ) : (
            <>
              {/* Error Message */}
              {error && (
                <div style={{
                  background: "#fee2e2",
                  color: "#dc2626",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  fontSize: "14px",
                  fontWeight: "500",
                  border: "1px solid #fecaca"
                }}>
                  {error}
                </div>
              )}
              
              <form className="login-form" onSubmit={handleSubmit} style={{ marginBottom: "30px" }}>
                <div className="input-group" style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                  marginBottom: "30px"
                }}>
                  <div className="input-field" style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    background: "white",
                    border: "2px solid #ddd",
                    borderRadius: "12px",
                    padding: 0,
                    transition: "all 0.3s ease",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
                  }}>
                    <FontAwesomeIcon 
                      icon={faLock} 
                      style={{
                        padding: "0 15px",
                        color: "#666",
                        fontSize: "16px",
                        minWidth: "50px",
                        display: "flex",
                        justifyContent: "center"
                      }}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="newPassword"
                      name="newPassword"
                      placeholder="New Password (min. 6 characters)"
                      value={formData.newPassword}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      minLength={6}
                      style={{
                        flex: 1,
                        border: "none",
                        outline: "none",
                        padding: "18px 15px 18px 0",
                        fontSize: "16px",
                        background: "transparent",
                        color: "#333"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: "0 15px",
                        cursor: "pointer",
                        color: "#666"
                      }}
                    >
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                    </button>
                  </div>

                  <div className="input-field" style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    background: "white",
                    border: "2px solid #ddd",
                    borderRadius: "12px",
                    padding: 0,
                    transition: "all 0.3s ease",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
                  }}>
                    <FontAwesomeIcon 
                      icon={faLock} 
                      style={{
                        padding: "0 15px",
                        color: "#666",
                        fontSize: "16px",
                        minWidth: "50px",
                        display: "flex",
                        justifyContent: "center"
                      }}
                    />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="Confirm New Password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      style={{
                        flex: 1,
                        border: "none",
                        outline: "none",
                        padding: "18px 15px 18px 0",
                        fontSize: "16px",
                        background: "transparent",
                        color: "#333"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: "0 15px",
                        cursor: "pointer",
                        color: "#666"
                      }}
                    >
                      <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="login-btn"
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
                    background: loading ? "#9ca3af" : "linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)",
                    color: "white",
                    boxShadow: "0 8px 20px rgba(15, 44, 99, 0.3)",
                    marginBottom: "10px",
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
                  <FontAwesomeIcon icon={faLock} />
                  <span>{loading ? 'Resetting...' : 'Reset Password'}</span>
                </button>
              </form>
            </>
          )}

          <Link 
            to={userType === 'admin' ? '/admin/login' : '/instructor/login'}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              color: "#0f2c63",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.target.style.color = "#f97316";
              e.target.style.transform = "translateX(-5px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.color = "#0f2c63";
              e.target.style.transform = "translateX(0)";
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

