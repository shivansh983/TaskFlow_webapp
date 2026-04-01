import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

function useWindowSize() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);
  return width;
}

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const width = useWindowSize();
  const isMobile = width < 640;

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications/`, getAuthHeaders());
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.is_read).length);
    } catch (error) {
      // silently fail
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.patch(`${API_URL}/notifications/${id}/`, { is_read: true }, getAuthHeaders());
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllRead = async () => {
    try {
      await Promise.all(
        notifications
          .filter(n => !n.is_read)
          .map(n => axios.patch(`${API_URL}/notifications/${n.id}/`, { is_read: true }, getAuthHeaders()))
      );
      loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // On mobile: full-screen overlay. On desktop: dropdown panel.
  const dropdownStyle = isMobile
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'white',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }
    : {
        position: 'absolute',
        top: '2.5rem',
        right: 0,
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
        width: 340,
        zIndex: 1000,
        maxHeight: 420,
        overflowY: 'auto',
      };

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: isMobile ? '1.4rem' : '1.2rem',
          position: 'relative',
          padding: isMobile ? '0.5rem' : '0.25rem',
          minWidth: 44,
          minHeight: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 0,
            right: 0,
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: 20,
            height: 20,
            fontSize: '0.7rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          {/* Backdrop — on mobile covers full screen, on desktop closes on click */}
          <div
            onClick={() => setShowDropdown(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: isMobile ? 9999 : 999,
              backgroundColor: isMobile ? 'rgba(0,0,0,0.3)' : 'transparent',
            }}
          />

          {/* Dropdown / full-screen panel */}
          <div style={{ ...dropdownStyle, zIndex: isMobile ? 10000 : 1000 }}>

            {/* Header */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              flexShrink: 0,
            }}>
              <div>
                <span style={{ fontWeight: '700', fontSize: '1rem', color: '#0f172a' }}>Notifications</span>
                {unreadCount > 0 && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', backgroundColor: '#ef4444', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontWeight: '600' }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{ fontSize: '0.8rem', color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                  >
                    Mark all read
                  </button>
                )}
                {/* Close button — especially important on mobile */}
                <button
                  onClick={() => setShowDropdown(false)}
                  style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    color: '#64748b',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.95rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔔</div>
                  No notifications yet
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    style={{
                      padding: '1rem 1.25rem',
                      borderBottom: '1px solid #f3f4f6',
                      backgroundColor: notification.is_read ? 'white' : '#eff6ff',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: notification.is_read ? '#e2e8f0' : '#4f46e5',
                      flexShrink: 0,
                      marginTop: '0.35rem',
                    }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0, lineHeight: 1.5 }}>
                        {notification.message}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.3rem 0 0' }}>
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;
