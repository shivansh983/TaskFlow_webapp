import { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

function InviteModal({ project, onClose }) {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [members, setMembers] = useState(project.members_list || []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/projects/${project.id}/invite_user/`,
        { username_or_email: usernameOrEmail, role },
        getAuthHeaders()
      );
      setSuccess(response.data.message);
      setUsernameOrEmail('');
      // Refresh members list
      const membersRes = await axios.get(
        `${API_URL}/projects/${project.id}/members/`,
        getAuthHeaders()
      );
      setMembers(membersRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to invite user.');
    }
    setLoading(false);
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      await axios.delete(
        `${API_URL}/projects/${project.id}/remove_member/`,
        { ...getAuthHeaders(), data: { user_id: userId } }
      );
      setMembers(members.filter(m => m.user !== userId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove member.');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    marginBottom: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.25rem',
    fontSize: '0.9rem',
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', width: '30rem', maxHeight: '90vh', overflow: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Manage Members — {project.name}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>

        {/* Invite Form */}
        <form onSubmit={handleInvite}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.9rem' }}>
            Username or Email
          </label>
          <input
            type="text"
            placeholder="Enter username or email"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            style={inputStyle}
            required
          />
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.9rem' }}>
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={inputStyle}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>

          {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}
          {success && <p style={{ color: '#10b981', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{success}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '0.5rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: '600' }}
          >
            {loading ? 'Inviting...' : '+ Invite User'}
          </button>
        </form>

        {/* Current Members */}
        <div style={{ marginTop: '1.5rem' }}>
          <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '0.95rem', color: '#374151' }}>
            Current Members ({members.length})
          </h4>
          {members.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>No members yet.</p>
          ) : (
            members.map((member) => (
              <div
                key={member.id}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.25rem', marginBottom: '0.5rem', border: '1px solid #e5e7eb' }}
              >
                <div>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{member.username}</span>
                  <span style={{ color: '#6b7280', fontSize: '0.8rem', marginLeft: '0.5rem' }}>{member.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                    backgroundColor: member.role === 'admin' ? '#dbeafe' : '#f3f4f6',
                    color: member.role === 'admin' ? '#1d4ed8' : '#6b7280',
                  }}>
                    {member.role}
                  </span>
                  <button
                    onClick={() => handleRemoveMember(member.user)}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '0.25rem', cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          style={{ marginTop: '1rem', width: '100%', padding: '0.5rem', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default InviteModal;