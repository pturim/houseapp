import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import TaskModal from '../components/TaskModal';

const CATEGORIES = ['all', 'locks', 'surveillance', 'alarm', 'lighting', 'emergency', 'storage', 'general'];

const FIELDS = [
  { name: 'title', label: 'Title', required: true, placeholder: 'e.g. Install deadbolt on back door' },
  { name: 'category', label: 'Category', type: 'select', default: 'general', options: CATEGORIES.filter(c => c !== 'all').map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) })) },
  { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Details about this security item' },
  { name: 'priority', label: 'Priority', type: 'select', default: 'high', options: [
    { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' },
  ]},
  { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes, codes, contacts, etc.' },
];

export default function Security() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    const params = {};
    if (filter !== 'all') params.category = filter;
    if (statusFilter !== 'all') params.status = statusFilter === 'active' ? 'pending' : statusFilter;
    api.getAll('security', params).then(setItems);
  }, [filter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(data) {
    if (editing) {
      await api.update('security', editing.id, data);
    } else {
      await api.create('security', data);
    }
    setModalOpen(false);
    setEditing(null);
    load();
  }

  async function toggleComplete(item) {
    const newStatus = item.status === 'completed' ? 'pending' : 'completed';
    await api.update('security', item.id, { status: newStatus });
    load();
  }

  async function handleDelete(id) {
    await api.remove('security', id);
    load();
  }

  // Group by category
  const grouped = {};
  items.forEach((item) => {
    const cat = item.category || 'general';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  const categoryIcons = {
    locks: '\uD83D\uDD12',
    surveillance: '\uD83D\uDCF7',
    alarm: '\uD83D\uDEA8',
    lighting: '\uD83D\uDCA1',
    emergency: '\uD83D\uDCDE',
    storage: '\uD83D\uDD10',
    general: '\uD83D\uDEE1',
  };

  return (
    <div>
      <div className="page-header">
        <h2>Security</h2>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
          + Add Item
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

      {items.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">{'\u26A0'}</div>
            <p>No security items found. Add one to get started!</p>
          </div>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, catItems]) => (
          <div className="card" key={cat}>
            <div className="section-title">
              {categoryIcons[cat] || ''} {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </div>
            <ul className="task-list">
              {catItems.map((item) => (
                <li className="task-item" key={item.id}>
                  <div
                    className={`task-check ${item.status === 'completed' ? 'checked' : ''}`}
                    onClick={() => toggleComplete(item)}
                  >
                    {item.status === 'completed' && '\u2713'}
                  </div>
                  <div className="task-info">
                    <div className={`task-title ${item.status === 'completed' ? 'done' : ''}`}>{item.title}</div>
                    <div className="task-meta">
                      <span className={`badge badge-${item.priority}`}>{item.priority}</span>
                      {item.description && <span>{item.description}</span>}
                    </div>
                  </div>
                  <div className="task-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(item); setModalOpen(true); }}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>
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
