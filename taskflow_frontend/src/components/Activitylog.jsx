import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

function ActivityLog({ projectId, refresh, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    loadLogs();
  }, [projectId, refresh]);

  const loadLogs = async () => {
    setLoading(true);
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
    switch (action) {
      case 'CREATE': return { bg: '#dcfce7', text: '#16a34a' };
      case 'UPDATE': return { bg: '#fef3c7', text: '#d97706' };
      case 'DELETE': return { bg: '#fee2e2', text: '#dc2626' };
      case 'COMMENT': return { bg: '#e0e7ff', text: '#4f46e5' };
      default: return { bg: '#f1f5f9', text: '#64748b' };
    }
  };

  const getActionLabel = (log) => {
    switch (log.action) {
      case 'CREATE': return `created ${log.object_type}`;
      case 'UPDATE': return `updated ${log.object_type}`;
      case 'DELETE': return `deleted ${log.object_type}`;
      case 'COMMENT': return `commented on ${log.object_type}`;
      default: return `${log.action} ${log.object_type}`;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '100%',
      maxWidth: '420px',
      height: '100vh',
      backgroundColor: 'white',
      boxShadow: '-10px 0 25px rgba(0,0,0,0.1)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '1px solid #e2e8f0',
    }}>

      {/* Header */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Activity Log</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem', margin: '0.25rem 0 0' }}>Recent project events</p>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'white', border: '1px solid #e2e8f0', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '1rem' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
        >
          ✕
        </button>
      </div>

      {/* Log list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem', fontSize: '0.9rem' }}>
            Loading activity...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem', fontSize: '0.9rem' }}>
            No activity recorded yet. Create or update a task to see logs here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {logs.map(log => {
              const styles = getActionColor(log.action);
              return (
                <div key={log.id} style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ marginTop: '0.25rem', flexShrink: 0 }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: styles.text, border: `3px solid ${styles.bg}` }} />
                  </div>
                  <div style={{ flex: 1, paddingBottom: '1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#0f172a' }}>
                        {log.username || 'System'}
                      </span>
                      <span style={{ fontSize: '0.65rem', fontWeight: '700', backgroundColor: styles.bg, color: styles.text, padding: '0.15rem 0.5rem', borderRadius: '1rem', letterSpacing: '0.05em' }}>
                        {log.action}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#475569', margin: '0 0 0.4rem', lineHeight: '1.4' }}>
                      {getActionLabel(log)}
                    </p>
                    {log.changes && Object.keys(log.changes).length > 0 && (
                      <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {JSON.stringify(log.changes, null, 2)}
                      </div>
                    )}
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.4rem 0 0' }}>
                      {formatTime(log.timestamp)}
                    </p>
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
