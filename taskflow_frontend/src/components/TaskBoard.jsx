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

function TaskBoard({ project, onBack }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: '',
    project: project.id,
    assigned_to: null,
  });

  const width = useWindowSize();
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    loadTasks();
    loadProjectMembers();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks/`, getAuthHeaders());
      setTasks(response.data.filter(task => task.project === project.id));
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadProjectMembers = async () => {
    try {
      const response = await axios.get(`${API_URL}/projects/${project.id}/members/`, getAuthHeaders());
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/tasks/`, { ...newTask, due_date: newTask.due_date || null }, getAuthHeaders());
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', status: 'todo', priority: 'medium', due_date: '', project: project.id, assigned_to: null });
      loadTasks();
    } catch (error) {
      alert('Failed to create task.');
      console.error(error);
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/tasks/${editingTask.id}/`, {
        ...editingTask,
        due_date: editingTask.due_date || null,
        assigned_to: editingTask.assigned_to || null,
      }, getAuthHeaders());
      setEditingTask(null);
      loadTasks();
    } catch (error) {
      alert('Failed to update task.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Delete this task?')) {
      try {
        await axios.delete(`${API_URL}/tasks/${taskId}/`, getAuthHeaders());
        loadTasks();
      } catch (error) {
        alert('Failed to delete task.');
      }
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    try {
      await axios.put(`${API_URL}/tasks/${taskId}/`, { ...task, status: newStatus }, getAuthHeaders());
      loadTasks();
    } catch (error) {
      alert('Failed to update task status.');
    }
  };

  const getTasksByStatus = (status) => tasks.filter(task => task.status === status);

  const statuses = [
    { id: 'todo', name: 'To Do', color: '#94a3b8' },
    { id: 'in_progress', name: 'In Progress', color: '#3b82f6' },
    { id: 'done', name: 'Done', color: '#10b981' },
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return { bg: '#fee2e2', text: '#ef4444' };
      case 'medium': return { bg: '#fef3c7', text: '#d97706' };
      case 'low': return { bg: '#dcfce7', text: '#16a34a' };
      default: return { bg: '#f1f5f9', text: '#64748b' };
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.625rem 1rem',
    border: '1px solid #e2e8f0',
    borderRadius: '0.5rem',
    fontSize: '0.9rem',
    backgroundColor: '#f8fafc',
    outline: 'none',
    color: '#0f172a',
    boxSizing: 'border-box',
  };

  const btnStyle = {
    padding: '0.625rem 1.25rem',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease',
  };

  // Mobile: scrollable horizontal tabs. Tablet/desktop: grid columns
  const kanbanGrid = isMobile
    ? { display: 'flex', flexDirection: 'column', gap: '1rem' }
    : isTablet
    ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }
    : { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={onBack}
            style={{ ...btnStyle, backgroundColor: '#f1f5f9', color: '#475569', padding: '0.5rem 0.875rem', fontSize: '0.85rem' }}
          >
            ← Back
          </button>
          <h2 style={{ fontSize: isMobile ? '1rem' : '1.4rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            {project.name}
          </h2>
        </div>
        <button
          onClick={() => setShowTaskModal(true)}
          style={{ ...btnStyle, backgroundColor: '#4f46e5', color: 'white', fontSize: isMobile ? '0.85rem' : '0.9rem' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#4338ca'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#4f46e5'}
        >
          + New Task
        </button>
      </div>

      {/* Kanban board */}
      <div style={{ padding: isMobile ? '1rem' : '1.5rem 2rem' }}>
        <div style={kanbanGrid}>
          {statuses.map(status => (
            <div key={status.id} style={{
              backgroundColor: '#f1f5f9',
              borderRadius: '0.75rem',
              padding: '1rem',
              minHeight: isMobile ? 'auto' : '400px',
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #e2e8f0' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: status.color }} />
                <h3 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  {status.name}
                </h3>
                <span style={{ marginLeft: 'auto', backgroundColor: '#e2e8f0', color: '#475569', fontSize: '0.75rem', fontWeight: '700', padding: '0.1rem 0.5rem', borderRadius: '1rem' }}>
                  {getTasksByStatus(status.id).length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {getTasksByStatus(status.id).map(task => {
                  const pColor = getPriorityColor(task.priority);
                  return (
                    <div
                      key={task.id}
                      style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontWeight: '600', fontSize: '0.95rem', color: '#0f172a', margin: 0, lineHeight: 1.4, flex: 1 }}>{task.title}</h4>
                        <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '1rem', backgroundColor: pColor.bg, color: pColor.text, fontWeight: '700', textTransform: 'uppercase', flexShrink: 0, marginLeft: '0.5rem' }}>
                          {task.priority}
                        </span>
                      </div>

                      {task.description && (
                        <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.5rem', lineHeight: 1.5 }}>{task.description}</p>
                      )}

                      {task.assigned_to_name && (
                        <p style={{ fontSize: '0.75rem', color: '#475569', margin: '0 0 0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 'bold', flexShrink: 0 }}>
                            {task.assigned_to_name.charAt(0).toUpperCase()}
                          </span>
                          {task.assigned_to_name}
                        </p>
                      )}

                      {task.due_date && (
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 0.5rem' }}>
                          📅 {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '0.4rem' }}>
                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', backgroundColor: '#f8fafc', outline: 'none', cursor: 'pointer', color: '#475569' }}
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>

                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => setEditingTask(task)}
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '500' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', backgroundColor: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '500' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {getTasksByStatus(status.id).length === 0 && (
                  <p style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '0.85rem', padding: '1.5rem 0' }}>No tasks</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create / Edit Task Modal */}
      {(showTaskModal || editingTask) && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 0 : '1rem' }}>
          <div style={{ backgroundColor: 'white', padding: '1.75rem', borderRadius: isMobile ? '1rem 1rem 0 0' : '1rem', width: '100%', maxWidth: isMobile ? '100%' : '32rem', maxHeight: isMobile ? '90vh' : '85vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.25rem', color: '#0f172a' }}>
              {showTaskModal ? 'Create New Task' : 'Edit Task'}
            </h3>
            <form onSubmit={showTaskModal ? handleCreateTask : handleUpdateTask}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', fontSize: '0.82rem', color: '#475569' }}>Title *</label>
                  <input type="text" placeholder="Task title"
                    value={showTaskModal ? newTask.title : editingTask.title}
                    onChange={e => showTaskModal ? setNewTask({ ...newTask, title: e.target.value }) : setEditingTask({ ...editingTask, title: e.target.value })}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#4f46e5'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    required />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', fontSize: '0.82rem', color: '#475569' }}>Description</label>
                  <textarea placeholder="Details..."
                    value={showTaskModal ? newTask.description : (editingTask.description || '')}
                    onChange={e => showTaskModal ? setNewTask({ ...newTask, description: e.target.value }) : setEditingTask({ ...editingTask, description: e.target.value })}
                    rows="2" style={{ ...inputStyle, resize: 'vertical' }}
                    onFocus={e => e.target.style.borderColor = '#4f46e5'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', fontSize: '0.82rem', color: '#475569' }}>Assign To</label>
                    <select
                      value={showTaskModal ? (newTask.assigned_to || '') : (editingTask.assigned_to || '')}
                      onChange={e => showTaskModal ? setNewTask({ ...newTask, assigned_to: e.target.value || null }) : setEditingTask({ ...editingTask, assigned_to: e.target.value || null })}
                      style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="">Unassigned</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', fontSize: '0.82rem', color: '#475569' }}>Priority</label>
                    <select
                      value={showTaskModal ? newTask.priority : editingTask.priority}
                      onChange={e => showTaskModal ? setNewTask({ ...newTask, priority: e.target.value }) : setEditingTask({ ...editingTask, priority: e.target.value })}
                      style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', fontSize: '0.82rem', color: '#475569' }}>Status</label>
                    <select
                      value={showTaskModal ? newTask.status : editingTask.status}
                      onChange={e => showTaskModal ? setNewTask({ ...newTask, status: e.target.value }) : setEditingTask({ ...editingTask, status: e.target.value })}
                      style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', fontSize: '0.82rem', color: '#475569' }}>Due Date</label>
                    <input type="date"
                      value={showTaskModal ? newTask.due_date : (editingTask.due_date || '')}
                      onChange={e => showTaskModal ? setNewTask({ ...newTask, due_date: e.target.value }) : setEditingTask({ ...editingTask, due_date: e.target.value })}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      onFocus={e => e.target.style.borderColor = '#4f46e5'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button"
                  onClick={() => { setShowTaskModal(false); setEditingTask(null); }}
                  style={{ ...btnStyle, backgroundColor: '#f1f5f9', color: '#475569' }}>
                  Cancel
                </button>
                <button type="submit" style={{ ...btnStyle, backgroundColor: '#4f46e5', color: 'white' }}>
                  {showTaskModal ? 'Create Task' : 'Update Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskBoard;
