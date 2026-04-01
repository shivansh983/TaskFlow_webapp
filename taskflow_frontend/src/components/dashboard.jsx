import { useEffect, useState } from 'react';
import axios from 'axios';
import ProjectBoard from './ProjectBoard';
import InviteModal from './invitemodel';
import NotificationBell from './NotificationBell';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

function Dashboard({ onLogout, globalUserRole }) {
  console.log('Dashboard rendered with globalUserRole:', globalUserRole);
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

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const projectResponse = await axios.get(`${API_URL}/projects/`, getAuthHeaders());
      const activeProjects = projectResponse.data;
      console.log('Loaded projects:', activeProjects);
      setProjects(activeProjects);

      const tasksResponse = await axios.get(`${API_URL}/tasks/`, getAuthHeaders());
      const tasks = tasksResponse.data;
      const taskTitleMap = {};

      tasks.forEach((task) => {
        if (!taskTitleMap[task.project]) {
          taskTitleMap[task.project] = [];
        }
        if (task.title) {
          taskTitleMap[task.project].push(task.title.toLowerCase());
        }
      });

      setProjectTaskTitles(taskTitleMap);
    } catch (error) {
      console.error('Error loading projects:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
        window.location.reload();
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

    const projectMatch = name.includes(query) || description.includes(query);
    const taskTitleMatch = taskTitles.some((title) => title.includes(query));

    return projectMatch || taskTitleMatch;
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
    if (window.confirm('Are you sure you want to delete this project? All tasks will be deleted too.')) {
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
      await axios.put(`${API_URL}/projects/${editingProject.id}/`,
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

  const handleProjectClick = (project) => {
    console.log('Project clicked:', project);
    setSelectedProject(project);
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f8fafc', color: '#64748b' }}>Loading projects...</div>;
  }

  if (selectedProject) {
    console.log('Rendering ProjectBoard for project:', selectedProject);
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }}>
          <ProjectBoard
            project={selectedProject}
            onBack={() => setSelectedProject(null)}
            userRole={selectedProject.user_role}
          />
        </div>
      </div>
    );
  }

  const inputStyle = { width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' };
  const btnStyle = { padding: '0.625rem 1.25rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem', transition: 'all 0.2s' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <nav style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '1rem 2rem', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <NotificationBell />
            <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.025em', marginLeft: '0.5rem' }}>TaskFlow</h1>
          </div>
          
          <button
            onClick={onLogout}
            style={{ ...btnStyle, backgroundColor: '#f1f5f9', color: '#64748b' }}
            onMouseEnter={e => e.target.style.backgroundColor = '#e2e8f0'}
            onMouseLeave={e => e.target.style.backgroundColor = '#f1f5f9'}
          >
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a' }}>My Projects</h2>
          <div style={{ display: 'flex', flex: '1', maxWidth: '500px', gap: '1rem', justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '2.5rem', borderRadius: '2rem' }}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
            {globalUserRole && (
              <button
                onClick={() => setShowModal(true)}
                style={{ ...btnStyle, backgroundColor: '#4f46e5', color: 'white', borderRadius: '2rem', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)' }}
                onMouseEnter={e => e.target.style.backgroundColor = '#4338ca'}
                onMouseLeave={e => e.target.style.backgroundColor = '#4f46e5'}
              >
                + New Project
              </button>
            )}
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'white', borderRadius: '1rem', border: '1px dashed #cbd5e1' }}>
            <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
              {projects.length === 0
                ? globalUserRole === 'admin'
                  ? 'No projects yet. Create your first project!'
                  : 'No projects yet. You have not been invited to any project yet.'
                : 'No projects match your search criteria.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project)}
                style={{
                  backgroundColor: 'white',
                  padding: '1.5rem',
                  borderRadius: '1rem',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.5rem' }}>{project.name}</h3>
                  <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {project.description || 'No description provided.'}
                  </p>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '500' }}>
                    Created: {new Date(project.created_at).toLocaleDateString()}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditProject(project); }}
                      style={{ ...btnStyle, padding: '0.35rem 0.75rem', fontSize: '0.8rem', backgroundColor: '#f1f5f9', color: '#475569' }}
                      onMouseEnter={e => e.target.style.backgroundColor = '#e2e8f0'}
                      onMouseLeave={e => e.target.style.backgroundColor = '#f1f5f9'}
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                      style={{ ...btnStyle, padding: '0.35rem 0.75rem', fontSize: '0.8rem', backgroundColor: '#fef2f2', color: '#ef4444' }}
                      onMouseEnter={e => e.target.style.backgroundColor = '#fee2e2'}
                      onMouseLeave={e => e.target.style.backgroundColor = '#fef2f2'}
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

      {/* Modals Overlay */}
      {(showModal || showEditModal) && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          
          {/* Create Modal */}
          {showModal && (
            <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '1rem', width: '100%', maxWidth: '28rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.5rem' }}>Create New Project</h3>
              <form onSubmit={handleCreateProject}>
                <input
                  type="text"
                  placeholder="Project Name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  style={{...inputStyle, marginBottom: '1rem'}}
                  required
                />
                <textarea
                  placeholder="Description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  style={{...inputStyle, marginBottom: '1.5rem', resize: 'vertical', minHeight: '100px'}}
                  rows="3"
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ ...btnStyle, backgroundColor: '#f1f5f9', color: '#475569' }}>Cancel</button>
                  <button type="submit" style={{ ...btnStyle, backgroundColor: '#4f46e5', color: 'white' }}>Create Project</button>
                </div>
              </form>
            </div>
          )}

          {/* Edit Modal */}
          {showEditModal && editingProject && (
            <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '1rem', width: '100%', maxWidth: '28rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.5rem' }}>Edit Project</h3>
              <form onSubmit={handleUpdateProject}>
                <input
                  type="text"
                  placeholder="Project Name"
                  value={editingProject.name}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                  style={{...inputStyle, marginBottom: '1rem'}}
                  required
                />
                <textarea
                  placeholder="Description"
                  value={editingProject.description}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  style={{...inputStyle, marginBottom: '1.5rem', resize: 'vertical', minHeight: '100px'}}
                  rows="3"
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setShowEditModal(false)} style={{ ...btnStyle, backgroundColor: '#f1f5f9', color: '#475569' }}>Cancel</button>
                  <button type="submit" style={{ ...btnStyle, backgroundColor: '#4f46e5', color: 'white' }}>Update Project</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
