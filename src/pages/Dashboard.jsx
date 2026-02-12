import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty-state"><p>Loading dashboard...</p></div>;
  if (!data) return <div className="empty-state"><p>Failed to load dashboard</p></div>;

  const { summary, upcomingMaintenance, recentActivity } = data;

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
      </div>

      {/* Move-in progress */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="section-title">Move-in Progress</div>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              {summary.moveIn.completed} of {summary.moveIn.total} tasks completed
            </p>
          </div>
          <Link to="/checklist" className="btn btn-primary btn-sm">View Checklist</Link>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${summary.moveIn.progress}%` }} />
        </div>
      </div>

      {/* Summary cards */}
      <div className="card-grid">
        <Link to="/maintenance" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="stat-card">
            <span className="stat-icon">{'\u2699'}</span>
            <span className="stat-value">{summary.maintenance.pending}</span>
            <span className="stat-label">Maintenance Tasks</span>
            {summary.maintenance.overdue > 0 && (
              <span className="stat-sub" style={{ color: 'var(--color-danger)' }}>
                {summary.maintenance.overdue} overdue
              </span>
            )}
          </div>
        </Link>

        <Link to="/cleaning" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="stat-card">
            <span className="stat-icon">{'\u2728'}</span>
            <span className="stat-value">{summary.cleaning.pending}</span>
            <span className="stat-label">Cleaning Tasks</span>
          </div>
        </Link>

        <Link to="/chores" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="stat-card">
            <span className="stat-icon">{'\u270D'}</span>
            <span className="stat-value">{summary.chores.pending}</span>
            <span className="stat-label">Pending Chores</span>
          </div>
        </Link>

        <Link to="/security" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="stat-card">
            <span className="stat-icon">{'\u26A0'}</span>
            <span className="stat-value">{summary.security.pending}</span>
            <span className="stat-label">Security Items</span>
          </div>
        </Link>
      </div>

      {/* Upcoming maintenance */}
      <div className="card">
        <div className="section-title">{'\u2699'} Upcoming Maintenance</div>
        {upcomingMaintenance.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>No upcoming maintenance tasks</p>
        ) : (
          <ul className="task-list">
            {upcomingMaintenance.map((task) => (
              <li className="task-item" key={task.id}>
                <div className="task-info">
                  <div className="task-title">{task.title}</div>
                  <div className="task-meta">
                    <span>Due: {task.next_due || 'Not set'}</span>
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    <span>{task.category}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="section-title">{'\u2713'} Recently Completed</div>
          <ul className="task-list">
            {recentActivity.map((item, i) => (
              <li className="task-item" key={i}>
                <div className="task-check checked">{'\u2713'}</div>
                <div className="task-info">
                  <div className="task-title done">{item.title}</div>
                  <div className="task-meta">
                    <span>{item.source}</span>
                    <span>{new Date(item.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
