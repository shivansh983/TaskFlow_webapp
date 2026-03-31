import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

function ProjectSettings({ project, onClose }) {
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const response = await axios.get(`${API_URL}/projects/${project.id}/members/`, getAuthHeaders());
      setMembers(response.data);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await axios.post(`${API_URL}/projects/${project.id}/invite_user/`, {
        username_or_email: inviteEmail,
        role: inviteRole
      }, getAuthHeaders());
      setMessage('✅ User invited successfully!');
      setInviteEmail('');
      loadMembers();
    } catch (error) {
      // ← fixed: was concatenating wrong due to operator precedence
      setMessage('❌ ' + (error.response?.data?.error || error.message || 'Failed to invite user'));
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`${API_URL}/projects/${project.id}/update_member_role/`, {
        user_id: userId,
        role: newRole
      }, getAuthHeaders());
      loadMembers();
    } catch (error) {
      alert('Error updating role: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleRemoveMember = async (userId) => {
    // ← fixed: was using confirm() without window. which throws in strict mode
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await axios.delete(`${API_URL}/projects/${project.id}/remove_member/`, {
        data: { user_id: userId },
        ...getAuthHeaders()
      });
      loadMembers();
    } catch (error) {
      alert('Error removing member: ' + (error.response?.data?.error || error.message));
    }
  };

  // ← fixed: safely extract username/email/userId regardless of serializer shape
  const getMemberInfo = (member) => {
    const username = member.username || member.user?.username || 'Unknown';
    const email = member.email || member.user?.email || '';
    const userId = member.user_id || member.user?.id || member.user;
    return { username, email, userId };
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '0.75rem',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
        border: '1px solid #e5e7eb'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#111827'
          }}>
            Project Settings: {project.name}
          </h2>
          <button
            onClick={onClose}
            style={{
              fontSize: '1.5rem',
              color: '#6b7280',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '0.25rem',
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.color = '#374151'}
            onMouseOut={(e) => e.target.style.color = '#6b7280'}
          >
            ×
          </button>
        </div>

        {/* Invite Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: '#374151'
          }}>
            Invite New Member
          </h3>
          <form onSubmit={handleInvite} style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <input
              type="text"
              placeholder="Username or Email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              style={{
                flex: 1,
                minWidth: '180px',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              required
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                backgroundColor: 'white',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#2563eb')}
              onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#3b82f6')}
            >
              {loading ? 'Inviting...' : 'Invite'}
            </button>
          </form>
          {/* ← replaced alert() with inline message */}
          {message && (
            <p style={{
              marginTop: '0.6rem',
              fontSize: '0.875rem',
              color: message.startsWith('✅') ? '#10b981' : '#ef4444',
              fontWeight: '500'
            }}>
              {message}
            </p>
          )}
        </div>

        {/* Members List */}
        <div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: '#374151'
          }}>
            Project Members ({members.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {members.length === 0 && (
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
                No members yet
              </p>
            )}
            {members.map((member) => {
              // ← fixed: safely extract fields regardless of serializer shape
              const { username, email, userId } = getMemberInfo(member);

              return (
                <div key={member.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  backgroundColor: '#f9fafb',
                  transition: 'background-color 0.2s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '50%',
                      backgroundColor: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      flexShrink: 0
                    }}>
                      {username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span style={{
                        fontWeight: '500',
                        color: '#111827',
                        fontSize: '0.875rem',
                        display: 'block'
                      }}>
                        {username}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        display: 'block',
                        marginTop: '0.125rem'
                      }}>
                        {email || (member.role === 'admin' ? 'Administrator' : 'Member')}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(userId, e.target.value)}
                      style={{
                        padding: '0.375rem 0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        backgroundColor: 'white',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(userId)}
                      style={{
                        padding: '0.375rem 0.75rem',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #fca5a5',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#fecaca';
                        e.target.style.color = '#b91c1c';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = '#fee2e2';
                        e.target.style.color = '#dc2626';
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

export default ProjectSettings;