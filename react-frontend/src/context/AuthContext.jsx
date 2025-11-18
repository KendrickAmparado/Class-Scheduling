import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { setUser as setSentryUser, clearUser as clearSentryUser } from '../utils/sentry.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserEmail(decoded.email);
        // Set Sentry user context
        setSentryUser({
          email: decoded.email,
          id: decoded.id || decoded.userId,
        });
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    try {
      const decoded = jwtDecode(token);
      setUserEmail(decoded.email);
      // Set Sentry user context
      setSentryUser({
        email: decoded.email,
        id: decoded.id || decoded.userId,
      });
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('instructorToken');
    localStorage.removeItem('instructorData');
    setUserEmail(null);
    // Clear Sentry user context
    clearSentryUser();
  };

  return (
    <AuthContext.Provider value={{ userEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
