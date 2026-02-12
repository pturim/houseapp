import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import TaskModal from '../components/TaskModal';

const ROOMS = ['all', 'kitchen', 'bathroom', 'bedroom', 'living room', 'dining room', 'office', 'garage', 'outdoor', 'other'];

const FIELDS = [
  { name: 'title', label: 'Task', required: true, placeholder: 'e.g. Mop kitchen floor' },
  { name: 'room', label: 'Room', type: 'select', default: 'kitchen', options: ROOMS.filter(r => r !== 'all').map(r => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) })) },
  { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Details' },
  { name: 'frequency', label: 'Frequency', type: 'select', default: 'weekly', options: [
    { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Biweekly' }, { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' }, { value: 'once', label: 'One time' },
  ]},
  { name: 'assigned_to', label: 'Assigned To', placeholder: 'Name (optional)' },
  { name: 'next_due', label: 'Next Due', type: 'date' },
];

export default function Cleaning() {
  const [tasks, setTasks] = useState([]);
  const [roomFilter, setRoomFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    const params = {};
    if (roomFilter !== 'all') params.room = roomFilter;
    if (statusFilter !== 'all') params.status = statusFilter === 'active' ? 'pending' : statusFilter;
    api.getAll('cleaning', params).then(setTasks);
  }, [roomFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(data) {
    if (editing) {
      await api.update('cleaning', editing.id, data);
    } else {
      await api.create('cleaning', data);
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
    await api.update('cleaning', task.id, updates);
    load();
  }

  async function handleDelete(id) {
    await api.remove('cleaning', id);
    load();
  }

  // Group tasks by room
  const grouped = {};
  tasks.forEach((t) => {
    const room = t.room || 'other';
    if (!grouped[room]) grouped[room] = [];
    grouped[room].push(t);
  });

  return (
    <div>
      <div className="page-header">
        <h2>Cleaning</h2>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
          + Add Task
        </button>
      </div>

      <div className="filters">
        {ROOMS.map((r) => (
          <button key={r} className={`filter-chip ${roomFilter === r ? 'active' : ''}`} onClick={() => setRoomFilter(r)}>
            {r.charAt(0).toUpperCase() + r.slice(1)}
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

      {tasks.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">{'\u2728'}</div>
            <p>No cleaning tasks found. Add one to get started!</p>
          </div>
        </div>
      ) : (
        Object.entries(grouped).map(([room, roomTasks]) => (
          <div className="card" key={room}>
            <div className="section-title">{room.charAt(0).toUpperCase() + room.slice(1)}</div>
            <ul className="task-list">
              {roomTasks.map((task) => (
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
                      <span>{task.frequency}</span>
                      {task.assigned_to && <span>Assigned: {task.assigned_to}</span>}
                      {task.next_due && <span>Due: {task.next_due}</span>}
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
          </div>
        ))
      )}

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
