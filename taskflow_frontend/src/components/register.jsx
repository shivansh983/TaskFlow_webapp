import { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

function Register({ onSwitch }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.password2) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/register/`, formData);
      setSuccess('Account created! You can now sign in.');
      setFormData({ username: '', email: '', password: '', password2: '' });
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const firstError = Object.values(data)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError('Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    marginBottom: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.25rem'
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', width: '24rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem', textAlign: 'center' }}>TaskFlow</h1>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Create a new account</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            style={inputStyle}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            style={inputStyle}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            style={inputStyle}
            required
          />
          <input
            type="password"
            name="password2"
            placeholder="Confirm Password"
            value={formData.password2}
            onChange={handleChange}
            style={inputStyle}
            required
          />
          {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '0.75rem', textAlign: 'center' }}>{error}</p>}
          {success && <p style={{ color: '#10b981', fontSize: '0.875rem', marginBottom: '0.75rem', textAlign: 'center' }}>{success}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', backgroundColor: '#3b82f6', color: 'white', padding: '0.5rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: '#6b7280' }}>
          Already have an account?{' '}
          <span
            onClick={onSwitch}
            style={{ color: '#3b82f6', fontWeight: '600', cursor: 'pointer' }}
          >
            Sign In
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;