import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

function ActivityLog({ projectId, refresh, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    // This will print to your browser console when the button is clicked!
    console.log("Activity Log Sidebar Opened for Project:", projectId);
    loadLogs();
  }, [projectId, refresh]);

  const loadLogs = async () => {
    try {
      const response = await axios.get(`${API_URL}/activity-logs/`, {
        ...getAuthHeaders(),
        params: { project_id: projectId }
      });
      setLogs(response.data);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getActionColor = (action) => {
    switch(action) {
      case 'CREATE': return { bg: '#dcfce7', text: '#16a34a' }; // Green
      case 'UPDATE': return { bg: '#fef3c7', text: '#d97706' }; // Amber
      case 'DELETE': return { bg: '#fee2e2', text: '#dc2626' }; // Red
      default: return { bg: '#f1f5f9', text: '#64748b' };
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      right: 0, 
      width: '100%', 
      maxWidth: '400px', 
      height: '100vh', 
      backgroundColor: 'white', 
      boxShadow: '-10px 0 25px rgba(0,0,0,0.1)', 
      zIndex: 9999, /* Boosted to 9999 to guarantee it sits on top */
      display: 'flex', 
      flexDirection: 'column', 
      borderLeft: '1px solid #e2e8f0',
      transition: 'transform 0.3s ease-in-out'
    }}>
      
      <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>Activity Log</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>Recent project events</p>
        </div>
        <button 
          onClick={onClose} 
          style={{ background: 'white', border: '1px solid #e2e8f0', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'background 0.2s' }} 
          onMouseEnter={e => e.target.style.backgroundColor = '#f1f5f9'} 
          onMouseLeave={e => e.target.style.backgroundColor = 'white'}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', backgroundColor: 'white' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem', fontSize: '0.9rem' }}>Loading activity...</div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem', fontSize: '0.9rem' }}>No activity recorded yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {logs.map(log => {
              const styles = getActionColor(log.action);
              return (
                <div key={log.id} style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ marginTop: '0.2rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: styles.text, border: `3px solid ${styles.bg}` }}></div>
                  </div>
                  <div style={{ flex: 1, paddingBottom: '1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#0f172a' }}>{log.username || 'System'}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: '700', backgroundColor: styles.bg, color: styles.text, padding: '0.15rem 0.5rem', borderRadius: '1rem', letterSpacing: '0.05em' }}>
                        {log.action}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.4' }}>
                      {log.object_type} {log.object_id} updated.
                      {log.changes && Object.keys(log.changes).length > 0 && (
                        <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {JSON.stringify(log.changes, null, 2)}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                      {formatTime(log.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityLog;