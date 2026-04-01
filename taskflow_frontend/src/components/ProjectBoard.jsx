// src/components/ProjectBoard.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimation,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ActivityLog from './Activitylog';
import NotificationBell from './NotificationBell';
import ProjectSettings from './ProjectSettings';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const COLUMNS = [
  { id: 'todo', label: 'To Do', color: '#94a3b8' },
  { id: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { id: 'done', label: 'Done', color: '#10b981' },
];

// ─── TaskItem ────────────────────────────────────────────────────────────────
function TaskItem({ task, isAdmin, onDelete, priorityColor, onUpdate, currentUser, onEdit, members }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  const canEdit = isAdmin || (currentUser && task.assigned_to === currentUser.id);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    padding: '1.25rem',
    boxShadow: isDragging
      ? '0 20px 25px -5px rgba(0,0,0,0.1)'
      : '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
    marginBottom: '1rem',
    position: 'relative',
    // ← do NOT set cursor here; handle it per-zone below
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setCommenting(true);
    try {
      await axios.patch(
        `${API_URL}/tasks/${task.id}/add-comment/`,
        { comment: newComment },
        getAuthHeaders()
      );
      setNewComment('');
      onUpdate && onUpdate();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setCommenting(false);
    }
  };

  const pColor =
    typeof priorityColor === 'function'
      ? priorityColor(task.priority)
      : task.priority === 'high'
      ? { bg: '#fee2e2', text: '#ef4444' }
      : task.priority === 'medium'
      ? { bg: '#fef3c7', text: '#d97706' }
      : { bg: '#dcfce7', text: '#16a34a' };

  // Parse stored comments into individual lines
  const commentLines = (task.comments || '')
    .split('\n')
    .filter(l => l.trim() !== '');

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {/* ── Drag handle — only this area starts a drag ── */}
      <div
        {...listeners}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          marginBottom: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontWeight: '600', fontSize: '1rem', color: '#0f172a', lineHeight: '1.4' }}>
            {task.title}
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: '700',
              color: pColor.text || 'white',
              backgroundColor: pColor.bg || pColor,
              padding: '0.2rem 0.6rem',
              borderRadius: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              flexShrink: 0,
              marginLeft: '0.5rem',
            }}
          >
            {task.priority}
          </span>
        </div>

        {task.description && (
          <p
            style={{
              fontSize: '0.85rem',
              color: '#64748b',
              marginTop: '0.4rem',
              marginBottom: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {task.description}
          </p>
        )}
      </div>

      {/* ── Meta info (not draggable) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.75rem' }}>
        {task.assigned_to_name && (
          <p style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '500', margin: 0 }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 'bold' }}>
              {task.assigned_to_name.charAt(0).toUpperCase()}
            </span>
            {task.assigned_to_name}
          </p>
        )}
        {task.due_date && (
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
            📅 Due: {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        )}
        {commentLines.length > 0 && (
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0 }}>
            💬 {commentLines.length} comment{commentLines.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ── Action buttons — pointer events fully independent from drag ── */}
      <div
        style={{ paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}
        onPointerDown={e => e.stopPropagation()} // ← prevents drag from starting on button clicks
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          {/* Comments toggle — visible to everyone */}
          <button
            onClick={() => setShowComments(v => !v)}
            style={{
              fontSize: '0.75rem',
              color: '#64748b',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '0.3rem 0.6rem',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            💬 {showComments ? 'Hide' : 'Comments'}
          </button>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {/* Update button — admin OR assigned member */}
            {canEdit && (
              <button
                onClick={() => onEdit(task)}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                }}
              >
                ✏️ Update
              </button>
            )}
            {/* Delete button — admin only */}
            {isAdmin && (
              <button
                onClick={() => onDelete(task.id)}
                style={{
                  backgroundColor: '#fef2f2',
                  color: '#ef4444',
                  border: 'none',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                }}
              >
                🗑️ Delete
              </button>
            )}
          </div>
        </div>

        {/* Comments panel */}
        {showComments && (
          <div style={{ marginTop: '0.75rem', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            {/* Existing comments */}
            <div style={{ marginBottom: '0.75rem', maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {commentLines.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No comments yet</p>
              ) : (
                commentLines.map((line, i) => {
                  const match = line.match(/^\[(.+?)\]: (.+)$/);
                  const author = match ? match[1] : '';
                  const text = match ? match[2] : line;
                  return (
                    <div key={i} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.375rem', padding: '0.4rem 0.6rem' }}>
                      {author && <p style={{ fontSize: '0.68rem', color: '#6b7280', margin: '0 0 0.2rem', fontWeight: '600' }}>{author}</p>}
                      <p style={{ fontSize: '0.82rem', color: '#111827', margin: 0 }}>{text}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add comment input — everyone can comment */}
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                style={{
                  flex: 1,
                  padding: '0.4rem 0.6rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.375rem',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleAddComment}
                disabled={commenting || !newComment.trim()}
                style={{
                  padding: '0.4rem 0.75rem',
                  backgroundColor: commenting ? '#9ca3af' : '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: commenting ? 'not-allowed' : 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                }}
              >
                {commenting ? '...' : 'Post'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DroppableColumn ─────────────────────────────────────────────────────────
function DroppableColumn({ col, tasks, isAdmin, onDelete, priorityColor, onUpdate, currentUser, onEdit, members }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        backgroundColor: isOver ? '#f1f5f9' : '#f8fafc',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        minHeight: '500px',
        border: isOver ? `2px dashed ${col.color || '#3b82f6'}` : '2px solid transparent',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '2px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: col.color || '#94a3b8' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            {col.label}
          </h3>
        </div>
        <span style={{ backgroundColor: '#e2e8f0', color: '#475569', fontSize: '0.75rem', fontWeight: '700', padding: '0.15rem 0.6rem', borderRadius: '1rem' }}>
          {tasks.length}
        </span>
      </div>

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              isAdmin={isAdmin}
              onDelete={onDelete}
              priorityColor={priorityColor}
              onUpdate={onUpdate}
              currentUser={currentUser}
              onEdit={onEdit}
              members={members}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── ProjectBoard ─────────────────────────────────────────────────────────────
function ProjectBoard({ project, onBack, onLogout, userRole }) {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showLog, setShowLog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    status: 'todo',
    project: project.id,
    assigned_to: null,
  });

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [activityRefresh, setActivityRefresh] = useState(0);

  // ← KEY FIX: require 8px movement before drag starts so clicks still fire
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    loadTasks();
    loadMembers();
  }, [search, filterStatus, filterPriority]);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadTasks = async () => {
    try {
      const params = { project: project.id };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      const response = await axios.get(`${API_URL}/tasks/`, { ...getAuthHeaders(), params });
      setTasks(response.data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadMembers = async () => {
    try {
      const response = await axios.get(`${API_URL}/projects/${project.id}/members/`, getAuthHeaders());
      setMembers(response.data);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/me/`, getAuthHeaders());
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const taskData = { ...newTask, due_date: newTask.due_date || null };
      await axios.post(`${API_URL}/tasks/`, taskData, getAuthHeaders());
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', priority: 'medium', due_date: '', status: 'todo', project: project.id, assigned_to: null });
      loadTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task: ' + (error.response?.data?.detail || JSON.stringify(error.response?.data)));
    }
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    try {
      const taskData = {
        title: editingTask.title,
        description: editingTask.description || '',
        status: editingTask.status,
        priority: editingTask.priority,
        due_date: editingTask.due_date || null,
        assigned_to: editingTask.assigned_to || null,
        project: project.id,
      };
      await axios.patch(`${API_URL}/tasks/${editingTask.id}/`, taskData, getAuthHeaders());
      setShowEditTaskModal(false);
      setEditingTask(null);
      loadTasks();
    } catch (error) {
      console.error('Error updating task:', error.response?.data);
      alert('Failed to update task: ' + JSON.stringify(error.response?.data));
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await axios.delete(`${API_URL}/tasks/${taskId}/`, getAuthHeaders());
      loadTasks();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete task');
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    const validStatuses = ['todo', 'in_progress', 'done'];
    const newStatus = validStatuses.includes(over.id) ? over.id : null;
    if (!newStatus || activeTask.status === newStatus) return;

    setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, status: newStatus } : t));

    try {
      await axios.patch(`${API_URL}/tasks/${activeTask.id}/`, { status: newStatus }, getAuthHeaders());
      loadTasks();
    } catch (error) {
      console.error('Drag update failed', error.response?.data);
      loadTasks();
    }
  };

  const clearFilters = () => { setSearch(''); setFilterStatus(''); setFilterPriority(''); };

  const getTasksByStatus = (s) => tasks.filter(t => t.status === s);

  const priorityColor = (priority) => {
    if (priority === 'high') return { bg: '#fee2e2', text: '#ef4444' };
    if (priority === 'medium') return { bg: '#fef3c7', text: '#d97706' };
    return { bg: '#dcfce7', text: '#16a34a' };
  };

  const inputStyle = {
    padding: '0.625rem 1rem',
    border: '1px solid #e2e8f0',
    borderRadius: '0.5rem',
    fontSize: '0.9rem',
    backgroundColor: 'white',
    outline: 'none',
    color: '#0f172a',
    width: '100%',
    boxSizing: 'border-box',
  };

  const btnStyle = {
    padding: '0.625rem 1.25rem',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
  };

  const hasFilters = search || filterStatus || filterPriority;
  const isAdmin = userRole === 'admin';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>

      {/* Navbar */}
      <nav style={{ backgroundColor: 'white', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button onClick={onBack} style={{ ...btnStyle, backgroundColor: '#f1f5f9', color: '#475569' }}>← Back</button>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>{project.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <NotificationBell />
          <button onClick={onLogout} style={{ ...btnStyle, backgroundColor: '#fef2f2', color: '#ef4444' }}>Logout</button>
        </div>
      </nav>

      <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Task Board</h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {isAdmin && (
              <button onClick={() => setShowSettings(true)} style={{ ...btnStyle, backgroundColor: '#f1f5f9', color: '#475569' }}>
                ⚙️ Settings & Invites
              </button>
            )}
            <button onClick={() => setShowLog(true)} style={{ ...btnStyle, backgroundColor: '#f8fafc', color: '#4f46e5', border: '1px solid #e0e7ff' }}>
              📋 Activity
            </button>
            <button onClick={() => setShowTaskModal(true)} style={{ ...btnStyle, backgroundColor: '#4f46e5', color: 'white' }}>
              + Add Task
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
            <input type="text" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '2.5rem' }}
              onFocus={e => e.target.style.borderColor = '#4f46e5'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}>
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}>
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          {hasFilters && (
            <button onClick={clearFilters} style={{ ...btnStyle, backgroundColor: '#fef2f2', color: '#ef4444' }}>✕ Clear</button>
          )}
          {hasFilters && (
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500', marginLeft: 'auto' }}>
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} found
            </span>
          )}
        </div>

        {/* Kanban */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={({ active }) => setActiveId(active.id)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
            {COLUMNS.map(col => (
              <DroppableColumn
                key={col.id}
                col={col}
                tasks={getTasksByStatus(col.id)}
                isAdmin={isAdmin}
                onDelete={handleDeleteTask}
                priorityColor={priorityColor}
                onUpdate={loadTasks}
                currentUser={currentUser}
                members={members}
                onEdit={task => { setEditingTask(task); setShowEditTaskModal(true); }}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={defaultDropAnimation}>
            {activeId ? (() => {
              const t = tasks.find(x => x.id === activeId);
              if (!t) return null;
              const pc = priorityColor(t.priority);
              return (
                <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #4f46e5', transform: 'rotate(2deg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: '600', fontSize: '1rem', color: '#0f172a' }}>{t.title}</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: '700', color: pc.text, backgroundColor: pc.bg, padding: '0.2rem 0.6rem', borderRadius: '1rem', textTransform: 'uppercase' }}>{t.priority}</span>
                  </div>
                  {t.description && <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.4rem' }}>{t.description}</p>}
                </div>
              );
            })() : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Create / Edit Task Modal */}
      {(showTaskModal || (showEditTaskModal && editingTask)) && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '1rem', width: '100%', maxWidth: '36rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#0f172a' }}>
              {showTaskModal ? 'Add New Task' : 'Update Task'}
            </h3>

            <form onSubmit={showTaskModal ? handleCreateTask : handleEditTask}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem', color: '#475569' }}>Title *</label>
                  <input type="text" placeholder="Task Title"
                    value={showTaskModal ? newTask.title : editingTask.title}
                    onChange={e => showTaskModal ? setNewTask({ ...newTask, title: e.target.value }) : setEditingTask({ ...editingTask, title: e.target.value })}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#4f46e5'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    required />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem', color: '#475569' }}>Description (optional)</label>
                  <textarea placeholder="Task Details..."
                    value={showTaskModal ? newTask.description : (editingTask.description || '')}
                    onChange={e => showTaskModal ? setNewTask({ ...newTask, description: e.target.value }) : setEditingTask({ ...editingTask, description: e.target.value })}
                    rows="3" style={{ ...inputStyle, resize: 'vertical' }}
                    onFocus={e => e.target.style.borderColor = '#4f46e5'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {(!showEditTaskModal || isAdmin) && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem', color: '#475569' }}>Assign To</label>
                      <select
                        value={showTaskModal ? (newTask.assigned_to || '') : (editingTask.assigned_to || '')}
                        onChange={e => showTaskModal ? setNewTask({ ...newTask, assigned_to: e.target.value || null }) : setEditingTask({ ...editingTask, assigned_to: e.target.value || null })}
                        style={{ ...inputStyle, cursor: 'pointer' }}>
                        <option value="">Unassigned</option>
                        {members.map(m => (
                          <option key={m.id} value={m.user}>{m.username}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem', color: '#475569' }}>Priority</label>
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
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem', color: '#475569' }}>Status</label>
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
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem', color: '#475569' }}>Due Date</label>
                    <input type="date"
                      value={showTaskModal ? newTask.due_date : (editingTask.due_date || '')}
                      onChange={e => showTaskModal ? setNewTask({ ...newTask, due_date: e.target.value }) : setEditingTask({ ...editingTask, due_date: e.target.value })}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      onFocus={e => e.target.style.borderColor = '#4f46e5'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
                <button type="button"
                  onClick={() => { setShowTaskModal(false); setShowEditTaskModal(false); setEditingTask(null); }}
                  style={{ ...btnStyle, backgroundColor: '#f1f5f9', color: '#475569' }}>
                  Cancel
                </button>
                <button type="submit" style={{ ...btnStyle, backgroundColor: '#4f46e5', color: 'white' }}>
                  {showTaskModal ? 'Add Task' : 'Update Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Settings */}
      {showSettings && <ProjectSettings project={project} onClose={() => setShowSettings(false)} />}

      {/* Activity Log */}
      {showLog && <ActivityLog projectId={project.id} refresh={activityRefresh} onClose={() => setShowLog(false)} />}
    </div>
  );
}

export default ProjectBoard;
