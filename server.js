const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Inicializar banco de dados
const db = new Database('database.db');

// Criar tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    completed INTEGER DEFAULT 0,
    priority TEXT DEFAULT 'normal',
    due_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS prayers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    text TEXT NOT NULL,
    category TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS daily_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// ============= ROTAS DE HÁBITOS =============
app.get('/api/habits', (req, res) => {
  const habits = db.prepare('SELECT * FROM habits ORDER BY date DESC, name').all();
  res.json(habits);
});

app.get('/api/habits/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const habits = db.prepare('SELECT * FROM habits WHERE date = ?').all(today);
  res.json(habits);
});

app.post('/api/habits', (req, res) => {
  const { name, date } = req.body;
  const result = db.prepare('INSERT INTO habits (name, date) VALUES (?, ?)').run(name, date || new Date().toISOString().split('T')[0]);
  res.json({ id: result.lastInsertRowid, name, date });
});

app.put('/api/habits/:id', (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  db.prepare('UPDATE habits SET completed = ? WHERE id = ?').run(completed, id);
  res.json({ success: true });
});

app.delete('/api/habits/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM habits WHERE id = ?').run(id);
  res.json({ success: true });
});

// ============= ROTAS DE TAREFAS =============
app.get('/api/tasks', (req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY completed, priority DESC, created_at DESC').all();
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const { title, description, priority, due_date } = req.body;
  const result = db.prepare('INSERT INTO tasks (title, description, priority, due_date) VALUES (?, ?, ?, ?)').run(title, description, priority || 'normal', due_date);
  res.json({ id: result.lastInsertRowid, title });
});

app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { completed, title, description, priority, due_date } = req.body;
  
  if (completed !== undefined) {
    db.prepare('UPDATE tasks SET completed = ? WHERE id = ?').run(completed, id);
  } else {
    db.prepare('UPDATE tasks SET title = ?, description = ?, priority = ?, due_date = ? WHERE id = ?')
      .run(title, description, priority, due_date, id);
  }
  
  res.json({ success: true });
});

app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  res.json({ success: true });
});

// ============= ROTAS DE ORAÇÕES =============
app.get('/api/prayers', (req, res) => {
  const prayers = db.prepare('SELECT * FROM prayers ORDER BY category, name').all();
  res.json(prayers);
});

app.post('/api/prayers', (req, res) => {
  const { name, text, category } = req.body;
  const result = db.prepare('INSERT INTO prayers (name, text, category) VALUES (?, ?, ?)').run(name, text, category);
  res.json({ id: result.lastInsertRowid, name });
});

app.delete('/api/prayers/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM prayers WHERE id = ?').run(id);
  res.json({ success: true });
});

// ============= ROTAS DE ATUALIZAÇÕES DIÁRIAS =============
app.get('/api/updates', (req, res) => {
  const updates = db.prepare('SELECT * FROM daily_updates ORDER BY date DESC LIMIT 30').all();
  res.json(updates);
});

app.post('/api/updates', (req, res) => {
  const { title, content, date } = req.body;
  const result = db.prepare('INSERT INTO daily_updates (title, content, date) VALUES (?, ?, ?)').run(title, content, date || new Date().toISOString().split('T')[0]);
  res.json({ id: result.lastInsertRowid, title });
});

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando em:`);
  console.log(`   - Local: http://localhost:${PORT}`);
  console.log(`   - Rede: http://172.26.197.166:${PORT}`);
  console.log(`\n📱 Para acessar no Kindle, use: http://172.26.197.166:${PORT}`);
});
