const express = require('express');
const cors = require('cors');
const db = require('./db');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── Helper ──────────────────────────────────────────────
function crudRoutes(tableName, allowedFields) {
  const router = express.Router();

  router.get('/', (req, res) => {
    const { status, category, room, priority } = req.query;
    let sql = `SELECT * FROM ${tableName} WHERE 1=1`;
    const params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (category) { sql += ' AND category = ?'; params.push(category); }
    if (room) { sql += ' AND room = ?'; params.push(room); }
    if (priority) { sql += ' AND priority = ?'; params.push(priority); }
    sql += ' ORDER BY created_at DESC';
    res.json(db.prepare(sql).all(...params));
  });

  router.get('/:id', (req, res) => {
    const row = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });

  router.post('/', (req, res) => {
    const id = uuidv4();
    const fields = Object.keys(req.body).filter((k) => allowedFields.includes(k));
    const cols = ['id', ...fields, 'created_at', 'updated_at'];
    const placeholders = cols.map(() => '?');
    const now = new Date().toISOString();
    const values = [id, ...fields.map((f) => req.body[f]), now, now];
    db.prepare(`INSERT INTO ${tableName} (${cols.join(',')}) VALUES (${placeholders.join(',')})`).run(...values);
    const row = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(id);
    res.status(201).json(row);
  });

  router.put('/:id', (req, res) => {
    const existing = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const fields = Object.keys(req.body).filter((k) => allowedFields.includes(k));
    if (fields.length === 0) return res.status(400).json({ error: 'No valid fields to update' });
    const sets = fields.map((f) => `${f} = ?`).concat('updated_at = ?');
    const now = new Date().toISOString();
    const values = [...fields.map((f) => req.body[f]), now, req.params.id];
    db.prepare(`UPDATE ${tableName} SET ${sets.join(',')} WHERE id = ?`).run(...values);
    const row = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(req.params.id);
    res.json(row);
  });

  router.delete('/:id', (req, res) => {
    const result = db.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  });

  return router;
}

// ─── Routes ──────────────────────────────────────────────
app.use('/api/maintenance', crudRoutes('maintenance_tasks', [
  'title', 'description', 'category', 'priority', 'frequency', 'last_completed', 'next_due', 'status', 'notes',
]));

app.use('/api/cleaning', crudRoutes('cleaning_tasks', [
  'title', 'room', 'description', 'frequency', 'last_completed', 'next_due', 'status', 'assigned_to',
]));

app.use('/api/chores', crudRoutes('chores', [
  'title', 'description', 'category', 'frequency', 'assigned_to', 'due_date', 'status', 'priority',
]));

app.use('/api/security', crudRoutes('security_items', [
  'title', 'category', 'description', 'status', 'priority', 'notes',
]));

app.use('/api/checklist', crudRoutes('move_in_checklist', [
  'title', 'category', 'description', 'status', 'sort_order',
]));

// ─── Dashboard summary ──────────────────────────────────
app.get('/api/dashboard', (_req, res) => {
  const maintenancePending = db.prepare("SELECT COUNT(*) as c FROM maintenance_tasks WHERE status != 'completed'").get().c;
  const maintenanceOverdue = db.prepare("SELECT COUNT(*) as c FROM maintenance_tasks WHERE status != 'completed' AND next_due < date('now')").get().c;
  const cleaningPending = db.prepare("SELECT COUNT(*) as c FROM cleaning_tasks WHERE status != 'completed'").get().c;
  const choresPending = db.prepare("SELECT COUNT(*) as c FROM chores WHERE status != 'completed'").get().c;
  const securityPending = db.prepare("SELECT COUNT(*) as c FROM security_items WHERE status != 'completed'").get().c;
  const checklistTotal = db.prepare("SELECT COUNT(*) as c FROM move_in_checklist").get().c;
  const checklistDone = db.prepare("SELECT COUNT(*) as c FROM move_in_checklist WHERE status = 'completed'").get().c;

  const upcomingMaintenance = db.prepare(
    "SELECT * FROM maintenance_tasks WHERE status != 'completed' ORDER BY next_due ASC LIMIT 5"
  ).all();

  const recentActivity = db.prepare(`
    SELECT title, 'maintenance' as source, updated_at FROM maintenance_tasks WHERE status = 'completed'
    UNION ALL
    SELECT title, 'cleaning' as source, updated_at FROM cleaning_tasks WHERE status = 'completed'
    UNION ALL
    SELECT title, 'chore' as source, updated_at FROM chores WHERE status = 'completed'
    UNION ALL
    SELECT title, 'security' as source, updated_at FROM security_items WHERE status = 'completed'
    ORDER BY updated_at DESC LIMIT 10
  `).all();

  res.json({
    summary: {
      maintenance: { pending: maintenancePending, overdue: maintenanceOverdue },
      cleaning: { pending: cleaningPending },
      chores: { pending: choresPending },
      security: { pending: securityPending },
      moveIn: { total: checklistTotal, completed: checklistDone, progress: checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0 },
    },
    upcomingMaintenance,
    recentActivity,
  });
});

app.listen(PORT, () => {
  console.log(`HomeBase API running on http://localhost:${PORT}`);
});
