import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faCalendarAlt, faUserPlus } from '@fortawesome/free-solid-svg-icons';

const InstructorSignup = () => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: ''
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch('http://localhost:5000/api/instructors/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: formData.email
        })
      });

      const data = await res.json();
      alert(data.message);

      if (res.ok) {
        navigate('/instructor/login');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
    }
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
          }}>Create your account to access the system</p>
          
          <form className="login-form2" onSubmit={handleSubmit} style={{ marginBottom: "30px" }}>
            <div className="input-group2" style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              marginBottom: "30px"
            }}>
              <div className="input-field2" style={{
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
                  icon={faUser} 
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
                  type="text"
                  name="firstname"
                  placeholder="First Name"
                  value={formData.firstname}
                  onChange={handleChange}
                  required
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
              </div>

              <div className="input-field2" style={{
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
                  icon={faUser} 
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
                  type="text"
                  name="lastname"
                  placeholder="Last Name"
                  value={formData.lastname}
                  onChange={handleChange}
                  required
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
              </div>

              <div className="input-field2" style={{
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
                  icon={faEnvelope} 
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
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
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
              </div>
            </div>

            <button 
              type="submit" 
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
                cursor: "pointer",
                transition: "all 0.3s ease",
                textDecoration: "none",
                position: "relative",
                overflow: "hidden",
                background: "linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)",
                color: "white",
                boxShadow: "0 8px 20px rgba(15, 44, 99, 0.3)"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-3px)";
                e.target.style.boxShadow = "0 12px 25px rgba(15, 44, 99, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 8px 20px rgba(15, 44, 99, 0.3)";
              }}
            >
              <FontAwesomeIcon icon={faUserPlus} />
              <span>Sign Up</span>
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
    </div>
  );
};

export default InstructorSignup;