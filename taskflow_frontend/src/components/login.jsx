import { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

function Login({ onLogin, onSwitch }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_URL}/token/`, { username, password });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      onLogin();
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    marginBottom: '1rem',
    border: '1px solid #e2e8f0',
    borderRadius: '0.5rem',
    backgroundColor: '#f8fafc',
    fontSize: '0.95rem',
    color: '#0f172a',
    outline: 'none',
    transition: 'all 0.2s ease'
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
      <div style={{ backgroundColor: 'white', padding: '3rem 2.5rem', borderRadius: '1rem', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', width: '100%', maxWidth: '26rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>TaskFlow</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = '#4f46e5'; e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = '#4f46e5'; e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
            required
          />
          
          {error && <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center', border: '1px solid #fecaca' }}>{error}</div>}
          
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', backgroundColor: '#4f46e5', color: 'white', padding: '0.875rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)', transition: 'background-color 0.2s ease', marginTop: '0.5rem' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#4338ca'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#4f46e5'}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#64748b' }}>
          Don't have an account?{' '}
          <span onClick={onSwitch} style={{ color: '#4f46e5', fontWeight: '600', cursor: 'pointer', transition: 'color 0.2s ease' }} onMouseEnter={(e) => e.target.style.color = '#4338ca'} onMouseLeave={(e) => e.target.style.color = '#4f46e5'}>
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;