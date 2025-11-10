const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const { google } = require('googleapis');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar Google OAuth2
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');

let auth = null;

// Carregar credenciais do Google
async function loadGoogleAuth() {
  try {
    let credentials, token;

    // Tentar ler das variáveis de ambiente primeiro (Railway)
    if (process.env.GOOGLE_CREDENTIALS && process.env.GOOGLE_TOKEN) {
      credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      token = JSON.parse(process.env.GOOGLE_TOKEN);
      console.log('📦 Credenciais carregadas das variáveis de ambiente');
    }
    // Se não encontrar, ler dos arquivos locais
    else if (fs.existsSync(CREDENTIALS_PATH) && fs.existsSync(TOKEN_PATH)) {
      credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
      token = JSON.parse(fs.readFileSync(TOKEN_PATH));
      console.log('📁 Credenciais carregadas dos arquivos locais');
    }
    else {
      throw new Error('Credenciais não encontradas');
    }

    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    oAuth2Client.setCredentials(token);
    auth = oAuth2Client;
    console.log('✅ Google API autenticada com sucesso');
  } catch (error) {
    console.warn('⚠️  Credenciais do Google não encontradas ou inválidas:', error.message);
  }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Inicializar banco de dados
const db = new Database('database.db');

// Criar tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    completed INTEGER DEFAULT 0,
    priority TEXT DEFAULT 'normal',
    due_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

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

// ============= ROTAS DO GOOGLE CALENDAR =============
app.get('/api/calendar/events', async (req, res) => {
  if (!auth) {
    return res.status(500).json({ error: 'Google API não autenticada' });
  }

  try {
    const calendar = google.calendar({ version: 'v3', auth });
    const { days = 7 } = req.query;

    const timeMin = new Date();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + parseInt(days));

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    res.json(response.data.items || []);
  } catch (error) {
    console.error('Erro ao buscar eventos:', error.message);
    res.status(500).json({ error: 'Erro ao buscar eventos do Google Calendar' });
  }
});

// ============= ROTAS DO GOOGLE TASKS =============
app.get('/api/google-tasks', async (req, res) => {
  if (!auth) {
    return res.status(500).json({ error: 'Google API não autenticada' });
  }

  try {
    const tasks = google.tasks({ version: 'v1', auth });
    const response = await tasks.tasks.list({
      tasklist: '@default',
      maxResults: 100,
    });

    res.json(response.data.items || []);
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error.message);
    res.status(500).json({ error: 'Erro ao buscar tarefas do Google Tasks' });
  }
});

app.put('/api/google-tasks/:taskId', async (req, res) => {
  if (!auth) {
    return res.status(500).json({ error: 'Google API não autenticada' });
  }

  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const tasks = google.tasks({ version: 'v1', auth });
    await tasks.tasks.update({
      tasklist: '@default',
      task: taskId,
      requestBody: { status },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error.message);
    res.status(500).json({ error: 'Erro ao atualizar tarefa do Google Tasks' });
  }
});

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicializar Google Auth e depois iniciar servidor
loadGoogleAuth().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor rodando em:`);
    console.log(`   - Local: http://localhost:${PORT}`);
    console.log(`   - Rede: http://172.26.197.166:${PORT}`);
    console.log(`\n📱 Para acessar no Kindle, use: http://172.26.197.166:${PORT}`);
  });
});
