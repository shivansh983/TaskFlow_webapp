import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

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
    assigned_to: null
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  useEffect(() => {
    loadTasks();
    loadProjectMembers();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks/`, getAuthHeaders());
      const projectTasks = response.data.filter(task => task.project === project.id);
      setTasks(projectTasks);
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
      await axios.post(`${API_URL}/tasks/`, newTask, getAuthHeaders());
      setShowTaskModal(false);
      setNewTask({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        due_date: '',
        project: project.id,
        assigned_to: null
      });
      loadTasks();
    } catch (error) {
      alert('Failed to create task. Please try again.');
      console.error(error);
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/tasks/${editingTask.id}/`, editingTask, getAuthHeaders());
      setEditingTask(null);
      loadTasks();
    } catch (error) {
      alert('Failed to update task. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await axios.delete(`${API_URL}/tasks/${taskId}/`, getAuthHeaders());
        loadTasks();
      } catch (error) {
        alert('Failed to delete task. Please try again.');
      }
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    try {
      await axios.put(`${API_URL}/tasks/${taskId}/`, 
        { ...task, status: newStatus }, 
        getAuthHeaders()
      );
      loadTasks();
    } catch (error) {
      alert('Failed to update task status.');
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const statuses = [
    { id: 'todo', name: 'To Do', color: '#94a3b8' },
    { id: 'in_progress', name: 'In Progress', color: '#3b82f6' },
    { id: 'done', name: 'Done', color: '#10b981' }
  ];

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return { bg: '#fee2e2', text: '#ef4444' };
      case 'medium': return { bg: '#fef3c7', text: '#d97706' };
      case 'low': return { bg: '#dcfce7', text: '#16a34a' };
      default: return { bg: '#f1f5f9', text: '#64748b' };
    }
  };

  const getPriorityLabel = (priority) => {
    switch(priority) {
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return priority;
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
    transition: 'border-color 0.2s ease',
    color: '#0f172a'
  };

  const btnStyle = {
    padding: '0.625rem 1.25rem',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease'
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '2rem' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1400px', margin: '0 auto 2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button
            onClick={onBack}
            style={{ ...btnStyle, backgroundColor: '#f1f5f9', color: '#475569' }}
            onMouseEnter={e => e.target.style.backgroundColor = '#e2e8f0'}
            onMouseLeave={e => e.target.style.backgroundColor = '#f1f5f9'}
          >
            ← Back to Projects
          </button>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            {project.name} <span style={{ color: '#94a3b8', fontWeight: '400' }}>| Tasks</span>
          </h2>
        </div>
        <button
          onClick={() => setShowTaskModal(true)}
          style={{ ...btnStyle, backgroundColor: '#4f46e5', color: 'white', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)' }}
          onMouseEnter={e => e.target.style.backgroundColor = '#4338ca'}
          onMouseLeave={e => e.target.style.backgroundColor = '#4f46e5'}
        >
          + New Task
        </button>
      </div>

      {/* Kanban Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
        {statuses.map(status => (
          <div key={status.id} style={{ backgroundColor: '#f1f5f9', borderRadius: '0.75rem', padding: '1.25rem', minHeight: '500px', border: '1px solid #e2e8f0' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', paddingBottom: '0.5rem', borderBottom: '2px solid #e2e8f0' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: status.color }}></div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                {status.name} <span style={{ color: '#64748b', fontSize: '0.85rem' }}>({getTasksByStatus(status.id).length})</span>
              </h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {getTasksByStatus(status.id).map(task => {
                const pColor = getPriorityColor(task.priority);
                return (
                  <div 
                    key={task.id} 
                    style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', transition: 'transform 0.2s', cursor: 'default' }} 
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} 
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                      <h4 style={{ fontWeight: '600', fontSize: '1rem', color: '#0f172a', lineHeight: '1.4', margin: 0 }}>{task.title}</h4>
                      <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.6rem', borderRadius: '1rem', backgroundColor: pColor.bg, color: pColor.text, fontWeight: '700', textTransform: 'uppercase', flexShrink: 0, marginLeft: '0.5rem' }}>
                        {getPriorityLabel(task.priority)}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem', lineHeight: '1.5' }}>{task.description}</p>
                    )}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                      {task.assigned_to_name && (
                        <p style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '500', margin: 0 }}>
                          <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 'bold' }}>
                            {task.assigned_to_name.charAt(0).toUpperCase()}
                          </span>
                          {task.assigned_to_name}
                        </p>
                      )}
                      
                      {task.due_date && (
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          📅 {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', backgroundColor: '#f8fafc', outline: 'none', cursor: 'pointer', color: '#475569', fontWeight: '500' }}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => setEditingTask(task)}
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '500', transition: 'background 0.2s' }}
                          onMouseEnter={e => e.target.style.backgroundColor = '#e2e8f0'}
                          onMouseLeave={e => e.target.style.backgroundColor = '#f1f5f9'}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', backgroundColor: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '500', transition: 'background 0.2s' }}
                          onMouseEnter={e => e.target.style.backgroundColor = '#fee2e2'}
                          onMouseLeave={e => e.target.style.backgroundColor = '#fef2f2'}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      {showTaskModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '32rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#0f172a' }}>Create New Task</h3>
            <form onSubmit={handleCreateTask}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem', color: '#475569' }}>Title *</label>
                  <input
                    type="text"
                    placeholder="Task Title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#4f46e5'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    required
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem', color: '#475569' }}>Description</label>
                  <textarea
                    placeholder="Provide task details..."
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    onFocus={e => e.target.style.borderColor = '#4f46e5'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    rows="3"
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem', color: '#475569' }}>Assign To</label>
                    <select
                      value={newTask.assigned_to || ''}
                      onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value || null })}
                      style={{...inputStyle, backgroundColor: 'white'}}
                    >
                      <option value="">Unassigned</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.username}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem', color: '#475569' }}>Status</label>
                    <select
                      value={newTask.status}
                      onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                      style={{...inputStyle, backgroundColor: 'white'}}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem', color: '#475569' }}>Priority</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                      style={{...inputStyle, backgroundColor: 'white'}}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem', color: '#475569' }}>Due Date</label>
                    <input
                      type="date"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                      style={{...inputStyle, backgroundColor: 'white'}}
                      onFocus={e => e.target.style.borderColor = '#4f46e5'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  style={{ ...btnStyle, backgroundColor: '#f1f5f9', color: '#475569' }}
                  onMouseEnter={e => e.target.style.backgroundColor = '#e2e8f0'}
                  onMouseLeave={e => e.target.style.backgroundColor = '#f1f5f9'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ ...btnStyle, backgroundColor: '#4f46e5', color: 'white' }}
                  onMouseEnter={e => e.target.style.backgroundColor = '#4338ca'}
                  onMouseLeave={e => e.target.style.backgroundColor = '#4f46e5'}
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '32rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#0f172a' }}>Edit Task</h3>
            <form onSubmit={handleUpdateTask}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem', color: '#475569' }}>Title *</label>
                  <input
                    type="text"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#4f46e5'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    required
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem', color: '#475569' }}>Description</label>
                  <textarea
                    value={editingTask.description}
                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    onFocus={e => e.target.style.borderColor = '#4f46e5'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    rows="3"
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem', color: '#475569' }}>Assign To</label>
                    <select
                      value={editingTask.assigned_to || ''}
                      onChange={(e) => setEditingTask({ ...editingTask, assigned_to: e.target.value || null })}
                      style={{...inputStyle, backgroundColor: 'white'}}
                    >
                      <option value="">Unassigned</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.username}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem', color: '#475569' }}>Status</label>
                    <select
                      value={editingTask.status}
                      onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                      style={{...inputStyle, backgroundColor: 'white'}}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem', color: '#475569' }}>Priority</label>
                    <select
                      value={editingTask.priority}
                      onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                      style={{...inputStyle, backgroundColor: 'white'}}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem', color: '#475569' }}>Due Date</label>
                    <input
                      type="date"
                      value={editingTask.due_date}
                      onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                      style={{...inputStyle, backgroundColor: 'white'}}
                      onFocus={e => e.target.style.borderColor = '#4f46e5'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  style={{ ...btnStyle, backgroundColor: '#f1f5f9', color: '#475569' }}
                  onMouseEnter={e => e.target.style.backgroundColor = '#e2e8f0'}
                  onMouseLeave={e => e.target.style.backgroundColor = '#f1f5f9'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ ...btnStyle, backgroundColor: '#4f46e5', color: 'white' }}
                  onMouseEnter={e => e.target.style.backgroundColor = '#4338ca'}
                  onMouseLeave={e => e.target.style.backgroundColor = '#4f46e5'}
                >
                  Update Task
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
