import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import TaskModal from '../components/TaskModal';

const CATEGORIES = ['all', 'hvac', 'plumbing', 'exterior', 'safety', 'structural', 'general'];

const FIELDS = [
  { name: 'title', label: 'Title', required: true, placeholder: 'e.g. Replace HVAC filter' },
  { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Details about this task' },
  { name: 'category', label: 'Category', type: 'select', default: 'general', options: [
    { value: 'general', label: 'General' }, { value: 'hvac', label: 'HVAC' },
    { value: 'plumbing', label: 'Plumbing' }, { value: 'exterior', label: 'Exterior' },
    { value: 'safety', label: 'Safety' }, { value: 'structural', label: 'Structural' },
  ]},
  { name: 'priority', label: 'Priority', type: 'select', default: 'medium', options: [
    { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' },
  ]},
  { name: 'frequency', label: 'Frequency', type: 'select', default: 'once', options: [
    { value: 'once', label: 'One time' }, { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' }, { value: 'biannual', label: 'Biannual' },
    { value: 'annual', label: 'Annual' },
  ]},
  { name: 'next_due', label: 'Next Due', type: 'date' },
  { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes' },
];

export default function Maintenance() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    const params = {};
    if (filter !== 'all') params.category = filter;
    if (statusFilter !== 'all') params.status = statusFilter === 'active' ? 'pending' : statusFilter;
    api.getAll('maintenance', params).then(setTasks);
  }, [filter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(data) {
    if (editing) {
      await api.update('maintenance', editing.id, data);
    } else {
      await api.create('maintenance', data);
    }
    setModalOpen(false);
    setEditing(null);
    load();
  }

  async function toggleComplete(task) {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const updates = { status: newStatus };
    if (newStatus === 'completed') {
      updates.last_completed = new Date().toISOString().split('T')[0];
    }
    await api.update('maintenance', task.id, updates);
    load();
  }

  async function handleDelete(id) {
    await api.remove('maintenance', id);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <h2>Maintenance</h2>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
          + Add Task
        </button>
      </div>

      <div className="filters">
        {CATEGORIES.map((c) => (
          <button key={c} className={`filter-chip ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      <div className="filters">
        {['active', 'completed', 'all'].map((s) => (
          <button key={s} className={`filter-chip ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="card">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{'\u2699'}</div>
            <p>No maintenance tasks found</p>
          </div>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li className="task-item" key={task.id}>
                <div
                  className={`task-check ${task.status === 'completed' ? 'checked' : ''}`}
                  onClick={() => toggleComplete(task)}
                >
                  {task.status === 'completed' && '\u2713'}
                </div>
                <div className="task-info">
                  <div className={`task-title ${task.status === 'completed' ? 'done' : ''}`}>{task.title}</div>
                  <div className="task-meta">
                    {task.next_due && <span>Due: {task.next_due}</span>}
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    <span>{task.category}</span>
                    {task.frequency && task.frequency !== 'once' && <span>Repeats: {task.frequency}</span>}
                  </div>
                </div>
                <div className="task-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(task); setModalOpen(true); }}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(task.id)}>
                    Del
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <TaskModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        fields={FIELDS}
        initial={editing}
      />
    </div>
  );
}
