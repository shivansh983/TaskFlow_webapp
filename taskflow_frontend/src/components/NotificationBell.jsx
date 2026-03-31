import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
      // silently fail — notifications are non-critical
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

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', position: 'relative', padding: '0.25rem' }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, backgroundColor: '#ef4444', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div style={{ position: 'absolute', top: '2.5rem', right: 0, backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', width: 320, zIndex: 1000, maxHeight: 400, overflowY: 'auto' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
              No notifications yet
            </div>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', backgroundColor: notification.is_read ? 'white' : '#eff6ff', cursor: 'pointer', transition: 'background 0.2s' }}
              >
                <p style={{ fontSize: '0.85rem', color: '#374151', margin: 0 }}>{notification.message}</p>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.25rem 0 0' }}>
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {showDropdown && (
        <div onClick={() => setShowDropdown(false)} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />
      )}
    </div>
  );
}

export default NotificationBell;