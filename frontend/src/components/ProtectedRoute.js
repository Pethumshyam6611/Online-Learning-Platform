import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function ProtectedRoute({ token, children, role }) {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(!!role);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (role && token) {
      const fetchRole = async () => {
        try {
          const res = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserRole(res.data.role);
        } catch {
          setError(true);
        } finally {
          setLoading(false);
        }
      };
      fetchRole();
    }
  }, [role, token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (error) {
    return <Navigate to="/login" replace />;
  }
  if (role) {
    if (loading) return null; // or a spinner
    if (userRole !== role) {
      // Redirect to correct dashboard if role mismatch
      if (userRole === 'instructor') return <Navigate to="/instructor" replace />;
      if (userRole === 'student') return <Navigate to="/dashboard" replace />;
      return <Navigate to="/login" replace />;
    }
  }
  return children;
}

export default ProtectedRoute;
