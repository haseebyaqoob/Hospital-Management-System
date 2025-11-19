    import React, { useState } from 'react';
    import { Link } from 'react-router-dom';
    import axios from 'axios';
    import '../Auth.css';

    const API_URL = 'http://localhost:8080/api';

    function Register({ onRegister }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'patient'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
        ...formData,
        [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
        }

        setLoading(true);

        try {
        const { confirmPassword, ...registerData } = formData;
        
        console.log('Sending registration request:', registerData);
        
        const response = await axios.post(`${API_URL}/register`, registerData, {
            headers: {
            'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log('Registration successful:', response.data);
        onRegister(response.data);
        
        } catch (err) {
        console.error('Registration error:', err);
        
        if (err.code === 'ECONNABORTED') {
            setError('Request timeout. Please check if the server is running.');
        } else if (err.code === 'ERR_NETWORK') {
            setError('Network error. Is the server running on port 8080?');
        } else if (err.response) {
            const errorMsg = err.response.data?.error || err.response.data || 'Registration failed';
            setError(errorMsg);
        } else {
            setError('An unexpected error occurred. Please try again.');
        }
        
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="auth-container">
        <div className="auth-card">
            <h1>Hospital Management System</h1>
            <h2>Register</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label>Full Name</label>
                <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
                />
            </div>
            <div className="form-group">
                <label>Email</label>
                <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                />
            </div>
            <div className="form-group">
                <label>Password</label>
                <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter password"
                minLength="6"
                />
            </div>
            <div className="form-group">
                <label>Confirm Password</label>
                <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm password"
                />
            </div>
            <div className="form-group">
                <label>Role</label>
                <select name="role" value={formData.role} onChange={handleChange}>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
                <option value="receptionist">Receptionist</option>
                </select>
            </div>
            <button type="submit" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
            </button>
            </form>
            <p className="auth-link">
            Already have an account? <Link to="/login">Login here</Link>
            </p>
        </div>
        </div>
    );
    }

    export default Register;