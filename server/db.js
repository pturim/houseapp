const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const db = new Database(path.join(__dirname, '..', 'houseapp.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS maintenance_tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    priority TEXT NOT NULL DEFAULT 'medium',
    frequency TEXT,
    last_completed TEXT,
    next_due TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cleaning_tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    room TEXT NOT NULL,
    description TEXT,
    frequency TEXT NOT NULL DEFAULT 'weekly',
    last_completed TEXT,
    next_due TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    assigned_to TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS chores (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    frequency TEXT NOT NULL DEFAULT 'once',
    assigned_to TEXT,
    due_date TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT NOT NULL DEFAULT 'medium',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS security_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT NOT NULL DEFAULT 'high',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS move_in_checklist (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) as c FROM move_in_checklist').get();
  if (count.c > 0) return;

  const insert = db.prepare(
    'INSERT INTO move_in_checklist (id, title, category, description, sort_order) VALUES (?, ?, ?, ?, ?)'
  );

  const checklist = [
    ['Utilities', 'Set up electricity', 'Transfer or set up electrical service', 1],
    ['Utilities', 'Set up water service', 'Transfer or set up water/sewer service', 2],
    ['Utilities', 'Set up gas service', 'Transfer or set up gas if applicable', 3],
    ['Utilities', 'Set up internet/cable', 'Schedule internet and cable installation', 4],
    ['Utilities', 'Set up trash/recycling', 'Register for trash and recycling pickup', 5],
    ['Security', 'Change all locks', 'Replace or rekey all exterior door locks', 6],
    ['Security', 'Test smoke detectors', 'Test all smoke and CO detectors, replace batteries', 7],
    ['Security', 'Check fire extinguishers', 'Ensure fire extinguishers are present and charged', 8],
    ['Security', 'Set up security system', 'Install or transfer security system', 9],
    ['Security', 'Note emergency exits', 'Identify and clear all emergency exit routes', 10],
    ['Maintenance', 'Locate water shut-off valve', 'Find and label the main water shut-off', 11],
    ['Maintenance', 'Locate electrical panel', 'Find panel and label all breakers', 12],
    ['Maintenance', 'Locate gas shut-off', 'Find and label the gas shut-off valve', 13],
    ['Maintenance', 'Check HVAC filters', 'Inspect and replace HVAC filters', 14],
    ['Maintenance', 'Inspect roof and gutters', 'Check roof condition and clean gutters', 15],
    ['Maintenance', 'Test all plumbing', 'Run all faucets and flush all toilets to check for leaks', 16],
    ['Cleaning', 'Deep clean kitchen', 'Clean all appliances, cabinets, counters', 17],
    ['Cleaning', 'Deep clean bathrooms', 'Scrub all bathrooms thoroughly', 18],
    ['Cleaning', 'Clean all floors', 'Vacuum, mop, or steam clean all flooring', 19],
    ['Cleaning', 'Clean windows', 'Clean all windows inside and out', 20],
    ['Cleaning', 'Clean light fixtures', 'Dust and clean all light fixtures and ceiling fans', 21],
    ['Admin', 'Update address with post office', 'File change of address with USPS', 22],
    ['Admin', 'Update address with bank/insurance', 'Notify bank, insurance, and subscriptions', 23],
    ['Admin', 'Register to vote at new address', 'Update voter registration', 24],
    ['Admin', 'Update drivers license', 'Update address on drivers license', 25],
    ['Admin', 'Meet the neighbors', 'Introduce yourself to adjacent neighbors', 26],
    ['Admin', 'Get homeowners/renters insurance', 'Set up appropriate insurance coverage', 27],
  ];

  const insertMany = db.transaction((items) => {
    for (const [category, title, description, order] of items) {
      insert.run(uuidv4(), title, category, description, order);
    }
  });

  insertMany(checklist);

  // Seed maintenance tasks
  const insertMaint = db.prepare(
    'INSERT INTO maintenance_tasks (id, title, description, category, priority, frequency, next_due) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const maintTasks = [
    ['Replace HVAC filters', 'Check and replace air filters for heating/cooling system', 'hvac', 'high', 'monthly', '+30 days'],
    ['Test smoke detectors', 'Test all smoke and carbon monoxide detectors', 'safety', 'high', 'monthly', '+30 days'],
    ['Check water heater', 'Inspect water heater for leaks and sediment', 'plumbing', 'medium', 'quarterly', '+90 days'],
    ['Clean gutters', 'Remove debris from gutters and downspouts', 'exterior', 'medium', 'biannual', '+180 days'],
    ['Inspect roof', 'Check for damaged or missing shingles', 'exterior', 'medium', 'annual', '+365 days'],
    ['Service HVAC system', 'Schedule professional HVAC maintenance', 'hvac', 'high', 'biannual', '+180 days'],
    ['Check caulking and weatherstripping', 'Inspect around windows and doors', 'exterior', 'low', 'annual', '+365 days'],
    ['Flush water heater', 'Drain and flush water heater tank', 'plumbing', 'medium', 'annual', '+365 days'],
    ['Test garage door safety', 'Test auto-reverse and sensors', 'safety', 'high', 'monthly', '+30 days'],
    ['Check foundation', 'Inspect foundation for cracks', 'structural', 'medium', 'annual', '+365 days'],
  ];

  const insertMaintMany = db.transaction((items) => {
    const now = new Date();
    for (const [title, desc, cat, priority, freq, offset] of items) {
      const days = parseInt(offset);
      const due = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      insertMaint.run(uuidv4(), title, desc, cat, priority, freq, due.toISOString().split('T')[0]);
    }
  });

  insertMaintMany(maintTasks);

  // Seed security items
  const insertSec = db.prepare(
    'INSERT INTO security_items (id, title, category, description, priority) VALUES (?, ?, ?, ?, ?)'
  );
  const secItems = [
    ['Change all exterior locks', 'locks', 'Replace or rekey all locks on exterior doors', 'high'],
    ['Install deadbolts', 'locks', 'Ensure all exterior doors have deadbolts', 'high'],
    ['Set up security cameras', 'surveillance', 'Install cameras at entry points and perimeter', 'medium'],
    ['Install motion sensor lights', 'lighting', 'Add motion-activated lights at entry points', 'medium'],
    ['Set up alarm system', 'alarm', 'Install or activate home alarm system', 'high'],
    ['Secure sliding doors', 'locks', 'Add security bars or pins to sliding doors', 'medium'],
    ['Install smart doorbell', 'surveillance', 'Set up video doorbell at front entrance', 'low'],
    ['Create emergency contact list', 'emergency', 'Compile list of emergency numbers and contacts', 'high'],
    ['Set up safe/lockbox', 'storage', 'Install a safe for valuables and important documents', 'medium'],
    ['Check window locks', 'locks', 'Verify all windows have working locks', 'high'],
  ];

  const insertSecMany = db.transaction((items) => {
    for (const [title, cat, desc, priority] of items) {
      insertSec.run(uuidv4(), title, cat, desc, priority);
    }
  });

  insertSecMany(secItems);
}

seedIfEmpty();

module.exports = db;
