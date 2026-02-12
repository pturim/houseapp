import { useState, useEffect } from 'react';
import { api } from '../api';

const CATEGORY_ORDER = ['Security', 'Utilities', 'Maintenance', 'Cleaning', 'Admin'];

export default function MoveInChecklist() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');

  function load() {
    api.getAll('checklist').then((data) => {
      data.sort((a, b) => a.sort_order - b.sort_order);
      setItems(data);
    });
  }

  useEffect(() => { load(); }, []);

  async function toggleItem(item) {
    const newStatus = item.status === 'completed' ? 'pending' : 'completed';
    await api.update('checklist', item.id, { status: newStatus });
    load();
  }

  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter);

  // Group by category
  const grouped = {};
  filtered.forEach((item) => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  const totalItems = items.length;
  const completedItems = items.filter((i) => i.status === 'completed').length;
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => (CATEGORY_ORDER.indexOf(a) === -1 ? 99 : CATEGORY_ORDER.indexOf(a)) - (CATEGORY_ORDER.indexOf(b) === -1 ? 99 : CATEGORY_ORDER.indexOf(b))
  );

  const categoryIcons = {
    Security: '\u26A0',
    Utilities: '\u26A1',
    Maintenance: '\u2699',
    Cleaning: '\u2728',
    Admin: '\u270D',
  };

  return (
    <div>
      <div className="page-header">
        <h2>Move-in Checklist</h2>
      </div>

      {/* Progress overview */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontWeight: 600, fontSize: 16 }}>{progress}% Complete</span>
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            {completedItems} of {totalItems} tasks done
          </span>
        </div>
        <div className="progress-bar" style={{ marginTop: 12 }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="filters">
        <button className={`filter-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          All
        </button>
        {CATEGORY_ORDER.map((c) => (
          <button key={c} className={`filter-chip ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>
            {categoryIcons[c] || ''} {c}
          </button>
        ))}
      </div>

      {sortedCategories.map((cat) => {
        const catItems = grouped[cat];
        const catDone = catItems.filter((i) => i.status === 'completed').length;

        return (
          <div className="card" key={cat}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div className="section-title">
                {categoryIcons[cat] || ''} {cat}
              </div>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                {catDone}/{catItems.length}
              </span>
            </div>
            <ul className="task-list">
              {catItems.map((item) => (
                <li className="task-item" key={item.id}>
                  <div
                    className={`task-check ${item.status === 'completed' ? 'checked' : ''}`}
                    onClick={() => toggleItem(item)}
                  >
                    {item.status === 'completed' && '\u2713'}
                  </div>
                  <div className="task-info">
                    <div className={`task-title ${item.status === 'completed' ? 'done' : ''}`}>{item.title}</div>
                    {item.description && (
                      <div className="task-meta"><span>{item.description}</span></div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
