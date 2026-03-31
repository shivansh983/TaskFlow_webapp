import { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './components/login';
import Register from './components/register';
import Dashboard from './components/dashboard';
import './index.css';

const API_URL = 'http://127.0.0.1:8000/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(true);
  const [globalUserRole, setGlobalUserRole] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchUserRole = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/me/`, getAuthHeaders());
      console.log('User role from API:', response.data.role);
      setGlobalUserRole(response.data.role);
    } catch (err) {
      console.error('Failed to fetch user role', err);
      setGlobalUserRole('admin'); // Temporarily set as admin for testing
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    console.log('App loaded, token:', !!token);
    if (token) {
      console.log('Setting authenticated to true');
      setIsAuthenticated(true);
      fetchUserRole();
    } else {
      console.log('No token found, showing login');
    }
    setLoading(false);
  }, []);

  if (loading) {
    console.log('Showing loading screen');
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '1.1rem', fontWeight: '500' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ width: '24px', height: '24px', border: '3px solid #e2e8f0', borderTop: '3px solid #4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          Loading TaskFlow...
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  console.log('App render - isAuthenticated:', isAuthenticated, 'showRegister:', showRegister);

  if (isAuthenticated) {
    console.log('Rendering Dashboard');
    return (
      <Dashboard
        onLogout={() => setIsAuthenticated(false)}
        globalUserRole={globalUserRole}
      />
    );
  }

  if (showRegister) {
    console.log('Rendering Register');
    return <Register onSwitch={() => setShowRegister(false)} />;
  }

  console.log('Rendering Login');
  return (
    <Login
      onLogin={() => {
        setIsAuthenticated(true);
        fetchUserRole();
      }}
      onSwitch={() => setShowRegister(true)}
    />
  );
}

export default App;