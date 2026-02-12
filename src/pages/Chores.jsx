import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import TaskModal from '../components/TaskModal';

const CATEGORIES = ['all', 'general', 'yard', 'laundry', 'cooking', 'shopping', 'pets', 'kids', 'organization'];

const FIELDS = [
  { name: 'title', label: 'Chore', required: true, placeholder: 'e.g. Mow the lawn' },
  { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Details' },
  { name: 'category', label: 'Category', type: 'select', default: 'general', options: CATEGORIES.filter(c => c !== 'all').map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) })) },
  { name: 'priority', label: 'Priority', type: 'select', default: 'medium', options: [
    { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' },
  ]},
  { name: 'frequency', label: 'Frequency', type: 'select', default: 'once', options: [
    { value: 'once', label: 'One time' }, { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' }, { value: 'biweekly', label: 'Biweekly' },
    { value: 'monthly', label: 'Monthly' },
  ]},
  { name: 'assigned_to', label: 'Assigned To', placeholder: 'Name (optional)' },
  { name: 'due_date', label: 'Due Date', type: 'date' },
];

export default function Chores() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    const params = {};
    if (filter !== 'all') params.category = filter;
    if (statusFilter !== 'all') params.status = statusFilter === 'active' ? 'pending' : statusFilter;
    api.getAll('chores', params).then(setTasks);
  }, [filter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(data) {
    if (editing) {
      await api.update('chores', editing.id, data);
    } else {
      await api.create('chores', data);
    }
    setModalOpen(false);
    setEditing(null);
    load();
  }

  async function toggleComplete(task) {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await api.update('chores', task.id, { status: newStatus });
    load();
  }

  async function handleDelete(id) {
    await api.remove('chores', id);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <h2>Chores</h2>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
          + Add Chore
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
            <div className="empty-icon">{'\u270D'}</div>
            <p>No chores found. Add one to get started!</p>
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
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    <span>{task.category}</span>
                    {task.frequency && task.frequency !== 'once' && <span>Repeats: {task.frequency}</span>}
                    {task.assigned_to && <span>Assigned: {task.assigned_to}</span>}
                    {task.due_date && <span>Due: {task.due_date}</span>}
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
