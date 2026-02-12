import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Maintenance from './pages/Maintenance';
import Cleaning from './pages/Cleaning';
import Chores from './pages/Chores';
import Security from './pages/Security';
import MoveInChecklist from './pages/MoveInChecklist';

const navItems = [
  { to: '/', icon: '\u2302', label: 'Dashboard' },
  { to: '/checklist', icon: '\u2611', label: 'Move-in Checklist' },
  { to: '/maintenance', icon: '\u2699', label: 'Maintenance' },
  { to: '/cleaning', icon: '\u2728', label: 'Cleaning' },
  { to: '/chores', icon: '\u270D', label: 'Chores' },
  { to: '/security', icon: '\u26A0', label: 'Security' },
];

export default function App() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>HomeBase</h1>
          <p>House Management</p>
        </div>
        <nav>
          {navItems.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => isActive ? 'active' : ''}>
              <span className="nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/checklist" element={<MoveInChecklist />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/cleaning" element={<Cleaning />} />
          <Route path="/chores" element={<Chores />} />
          <Route path="/security" element={<Security />} />
        </Routes>
      </main>
    </div>
  );
}
