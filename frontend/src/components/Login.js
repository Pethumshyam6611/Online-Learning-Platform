import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';


const API_URL = 'http://localhost:5000/api';

function Login({ setToken }) {
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Handle login submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        username,
        password,
      });
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      setError('');
      setSuccess('Login successful! Redirecting...');
      // Fetch user info to determine role
      const userRes = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${res.data.token}` },
      });
      const role = userRes.data.role;
      setTimeout(() => {
        if (role === 'instructor') {
          navigate('/instructor');
        } else {
          navigate('/dashboard');
        }
      }, 1200);
    } catch (error) {
      setError('Login failed. Please check your credentials.');
      setSuccess('');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-title">Welcome to<br/>Online Learning Platform</div>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="username">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </Form.Group>
          <Form.Group controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </Form.Group>
          <Button variant="primary" type="submit" className="login-btn">
            Login
          </Button>
        </Form>
        <div className="login-link text-center">
          <Link to="/register" className="btn btn-link">
            Don't have an account? Register
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;