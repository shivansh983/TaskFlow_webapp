import { useEffect, useState } from 'react';
import axios from 'axios';
import ProjectBoard from './ProjectBoard';
import InviteModal from './invitemodel';
import NotificationBell from './NotificationBell';

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

function Dashboard({ onLogout }) {
  const [projects, setProjects] = useState([]);
  const [projectTaskTitles, setProjectTaskTitles] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [inviteProject, setInviteProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const width = useWindowSize();
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    onLogout();
  };

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    try {
      const projectResponse = await axios.get(`${API_URL}/projects/`, getAuthHeaders());
      const activeProjects = projectResponse.data;
      setProjects(activeProjects);

      const tasksResponse = await axios.get(`${API_URL}/tasks/`, getAuthHeaders());
      const tasks = tasksResponse.data;
      const taskTitleMap = {};
      tasks.forEach((task) => {
        if (!taskTitleMap[task.project]) taskTitleMap[task.project] = [];
        if (task.title) taskTitleMap[task.project].push(task.title.toLowerCase());
      });
      setProjectTaskTitles(taskTitleMap);
    } catch (error) {
      console.error('Error loading projects:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const name = project.name?.toLowerCase() || '';
    const description = project.description?.toLowerCase() || '';
    const taskTitles = projectTaskTitles[project.id] || [];
    return name.includes(query) || description.includes(query) || taskTitles.some(t => t.includes(query));
  });

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/projects/`, newProject, getAuthHeaders());
      setShowModal(false);
      setNewProject({ name: '', description: '' });
      loadProjects();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to create project.');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Delete this project? All tasks will be deleted too.')) {
      try {
        await axios.delete(`${API_URL}/projects/${projectId}/`, getAuthHeaders());
        loadProjects();
      } catch (error) {
        alert('Failed to delete project. You must be a project admin.');
      }
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowEditModal(true);
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API_URL}/projects/${editingProject.id}/`,
        { name: editingProject.name, description: editingProject.description },
        getAuthHeaders()
      );
      setShowEditModal(false);
      setEditingProject(null);
      loadProjects();
    } catch (error) {
      alert('Failed to update project.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f8fafc', color: '#64748b' }}>
        Loading projects...
      </div>
    );
  }

  if (selectedProject) {
    return (
      <ProjectBoard
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        onLogout={handleLogout}
        userRole={selectedProject.user_role}
      />
    );
  }

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #e2e8f0',
    borderRadius: '0.5rem',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const btnStyle = {
    padding: '0.625rem 1.25rem',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.9rem',
    transition: 'all 0.2s',
  };

  // Grid: 1 col mobile, 2 col tablet, auto-fill desktop
  const gridCols = isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(auto-fill, minmax(320px, 1fr))';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>

      {/* Navbar */}
      <nav style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: isMobile ? '0.75rem 1rem' : '1rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <NotificationBell />
            <h1 style={{ fontSize: isMobile ? '1rem' : '1.25rem', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.025em' }}>
              TaskFlow
            </h1>
          </div>
          <button
            onClick={handleLogout}
            style={{ ...btnStyle, backgroundColor: '#f1f5f9', color: '#64748b', padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1.25rem', fontSize: isMobile ? '0.8rem' : '0.9rem' }}
          >
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '1.25rem 1rem' : '2.5rem 2rem' }}>

        {/* Page header */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          marginBottom: '1.5rem',
          gap: '1rem',
        }}>
          <h2 style={{ fontSize: isMobile ? '1.4rem' : '1.75rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            My Projects
          </h2>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.9rem' }}>🔍</span>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '2.25rem', borderRadius: '2rem', fontSize: '0.875rem' }}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{ ...btnStyle, backgroundColor: '#4f46e5', color: 'white', whiteSpace: 'nowrap', flexShrink: 0, padding: isMobile ? '0.625rem 1rem' : '0.625rem 1.25rem' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#4338ca'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#4f46e5'}
            >
              {isMobile ? '+ New' : '+ New Project'}
            </button>
          </div>
        </div>

        {/* Project grid */}
        {filteredProjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', backgroundColor: 'white', borderRadius: '1rem', border: '1px dashed #cbd5e1' }}>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>
              {projects.length === 0 ? 'No projects yet. Create your first project!' : 'No projects match your search.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: isMobile ? '1rem' : '1.5rem' }}>
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                style={{
                  backgroundColor: 'white',
                  padding: isMobile ? '1.25rem' : '1.5rem',
                  borderRadius: '1rem',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 15px -3px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.5rem' }}>
                    {project.name}
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '1.25rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #f1f5f9',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500' }}>
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditProject(project); }}
                      style={{ ...btnStyle, padding: '0.35rem 0.75rem', fontSize: '0.8rem', backgroundColor: '#f1f5f9', color: '#475569' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                      style={{ ...btnStyle, padding: '0.35rem 0.75rem', fontSize: '0.8rem', backgroundColor: '#fef2f2', color: '#ef4444' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {(showModal || showEditModal) && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 0 : '1rem' }}>

          {showModal && (
            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: isMobile ? '1rem 1rem 0 0' : '1rem', width: '100%', maxWidth: isMobile ? '100%' : '28rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.5rem' }}>Create New Project</h3>
              <form onSubmit={handleCreateProject}>
                <input type="text" placeholder="Project Name" value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  style={{ ...inputStyle, marginBottom: '1rem' }} required />
                <textarea placeholder="Description" value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  style={{ ...inputStyle, marginBottom: '1.5rem', resize: 'vertical', minHeight: '80px' }} rows="3" />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ ...btnStyle, backgroundColor: '#f1f5f9', color: '#475569' }}>Cancel</button>
                  <button type="submit" style={{ ...btnStyle, backgroundColor: '#4f46e5', color: 'white' }}>Create</button>
                </div>
              </form>
            </div>
          )}

          {showEditModal && editingProject && (
            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: isMobile ? '1rem 1rem 0 0' : '1rem', width: '100%', maxWidth: isMobile ? '100%' : '28rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.5rem' }}>Edit Project</h3>
              <form onSubmit={handleUpdateProject}>
                <input type="text" placeholder="Project Name" value={editingProject.name}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                  style={{ ...inputStyle, marginBottom: '1rem' }} required />
                <textarea placeholder="Description" value={editingProject.description}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  style={{ ...inputStyle, marginBottom: '1.5rem', resize: 'vertical', minHeight: '80px' }} rows="3" />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setShowEditModal(false)} style={{ ...btnStyle, backgroundColor: '#f1f5f9', color: '#475569' }}>Cancel</button>
                  <button type="submit" style={{ ...btnStyle, backgroundColor: '#4f46e5', color: 'white' }}>Update</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {inviteProject && (
        <InviteModal project={inviteProject} onClose={() => setInviteProject(null)} />
      )}
    </div>
  );
}

export default Dashboard;
