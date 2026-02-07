require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { google } = require('googleapis');
const fs = require('fs');
const { Client: NotionClient } = require('@notionhq/client');
require('isomorphic-fetch');
const db = require('./db'); // Importar nosso módulo KV
const SheetsDB = require('./sheets'); // Importar módulo Google Sheets

const app = express();

// Instância do SheetsDB (será inicializada após auth)
let sheetsDB = null;
let initPromise = null; // Promise global de inicialização
const PORT = process.env.PORT || 3000;

// Configurar Google OAuth2
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');

let auth = null;
let notionClient = null;

// Configuração do Notion
function loadNotionClient() {
  try {
    const notionToken = process.env.NOTION_TOKEN || fs.readFileSync(path.join(__dirname, 'notion-token.txt'), 'utf8').trim();
    notionClient = new NotionClient({ auth: notionToken });
    console.log('✅ Notion API configurada com sucesso');
  } catch (error) {
    console.warn('⚠️  Notion Token não encontrado:', error.message);
  }
}

// Carregar credenciais do Google
async function loadGoogleAuth() {
  try {
    let credentials, token;

    if (process.env.GOOGLE_CREDENTIALS && process.env.GOOGLE_TOKEN) {
      credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      token = JSON.parse(process.env.GOOGLE_TOKEN);
      console.log('📦 Credenciais carregadas das variáveis de ambiente');
    } else if (fs.existsSync(CREDENTIALS_PATH) && fs.existsSync(TOKEN_PATH)) {
      credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
      token = JSON.parse(fs.readFileSync(TOKEN_PATH));
      console.log('📁 Credenciais carregadas dos arquivos locais');
    } else {
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

// Middleware que aguarda inicialização antes de verificar sheetsDB
async function requireSheets(req, res, next) {
  try {
    await initPromise;
    if (!sheetsDB) {
      return res.status(503).json({ error: 'Google Sheets não configurado' });
    }
    next();
  } catch (error) {
    console.error('Erro na inicialização:', error);
    return res.status(503).json({ error: 'Serviço indisponível', details: error.message });
  }
}

// ============= HELPERS PARA KV =============
async function getNextId(key) {
  const current = await db.get(`${key}:counter`);
  const currentNum = parseInt(current) || 0;
  const next = currentNum + 1;
  await db.set(`${key}:counter`, next);
  return next;
}

// ============= ROTAS DE TAREFAS =============
app.get('/api/tasks', async (req, res) => {
  try {
    const taskKeys = await db.keys('task:*');
    const tasks = [];

    for (const key of taskKeys) {
      if (!key.endsWith(':counter')) {
        const task = await db.get(key);
        if (task) tasks.push(task);
      }
    }

    // Ordenar: não completadas primeiro, depois por prioridade e data
    tasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed - b.completed;
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

    res.json(tasks);
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    res.status(500).json({ error: 'Erro ao buscar tarefas' });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, priority, due_date } = req.body;
    const id = await getNextId('task');

    const task = {
      id,
      title,
      description: description || '',
      priority: priority || 'normal',
      due_date: due_date || null,
      completed: 0,
      created_at: new Date().toISOString()
    };

    await db.set(`task:${id}`, task);
    res.json(task);
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({ error: 'Erro ao criar tarefa' });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await db.get(`task:${id}`);

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    const { completed, title, description, priority, due_date } = req.body;

    if (completed !== undefined) {
      task.completed = completed;
    } else {
      task.title = title;
      task.description = description;
      task.priority = priority;
      task.due_date = due_date;
    }

    await db.set(`task:${id}`, task);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({ error: 'Erro ao atualizar tarefa' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.del(`task:${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar tarefa:', error);
    res.status(500).json({ error: 'Erro ao deletar tarefa' });
  }
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
    timeMin.setDate(timeMin.getDate() - 7);

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

// ============= ROTAS DO NOTION (PLANO DE VIDA) =============
app.get('/api/notion/habits', async (req, res) => {
  if (!notionClient) {
    return res.status(500).json({ error: 'Notion não configurado' });
  }

  try {
    const databaseId = process.env.NOTION_DATABASE_ID;
    const notionToken = process.env.NOTION_TOKEN;

    if (!databaseId) {
      return res.status(400).json({ error: 'NOTION_DATABASE_ID não configurado' });
    }
    if (!notionToken) {
      return res.status(400).json({ error: 'NOTION_TOKEN não configurado' });
    }

    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sorts: [{ property: 'Dia', direction: 'descending' }]
      })
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const habits = [];

    if (data.results && data.results.length > 0) {
      const latestDay = data.results[0];
      const properties = latestDay.properties;

      const habitNames = [
        'Santa Missa', 'Sérviam', 'Preces', 'Exame', 'Lembrai-vos',
        'Terço', 'Leitura NT', 'Visita ao Santíssimo', '3 Ave Marias',
        'Oração da Manhã', 'Oração da Tarde', 'Contemplação', 'Angelus',
        'Leitura Espiritual', '2 horas'
      ];

      for (const habitName of habitNames) {
        if (properties[habitName]) {
          const prop = properties[habitName];
          let concluido = false;

          if (prop.type === 'checkbox') {
            concluido = prop.checkbox || false;
          } else if (prop.type === 'status') {
            concluido = prop.status?.name === 'Feito' || false;
          }

          habits.push({
            id: `${latestDay.id}-${habitName}`,
            nome: habitName,
            concluido: concluido,
            tipo: 'diaria',
            data: properties.Dia?.date?.start || null,
            pageId: latestDay.id
          });
        }
      }
    }

    res.json(habits);
  } catch (error) {
    console.error('Erro ao buscar hábitos do Notion:', error.message);
    res.status(500).json({ error: 'Erro ao buscar hábitos do Notion', details: error.message });
  }
});

app.patch('/api/notion/habits/:pageId', async (req, res) => {
  if (!notionClient) {
    return res.status(500).json({ error: 'Notion não configurado' });
  }

  try {
    const { pageId } = req.params;
    const { concluido, habitName } = req.body;
    const notionToken = process.env.NOTION_TOKEN;

    if (!notionToken) {
      return res.status(400).json({ error: 'NOTION_TOKEN não configurado' });
    }

    const parts = pageId.split('-');
    const realPageId = parts.slice(0, 5).join('-');

    const response = await fetch(`https://api.notion.com/v1/pages/${realPageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          [habitName]: { checkbox: concluido }
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ Erro Notion API (${response.status}):`, JSON.stringify(errorData, null, 2));
      throw new Error(`Notion API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao atualizar hábito no Notion:', error.message);
    res.status(500).json({ error: 'Erro ao atualizar hábito no Notion', details: error.message });
  }
});

// ============= ROTAS DE HISTÓRICO DE HÁBITOS =============
app.post('/api/habits/save', async (req, res) => {
  try {
    const { date, habits } = req.body;

    if (!date || !habits) {
      return res.status(400).json({ error: 'Data e hábitos são obrigatórios' });
    }

    // Salvar cada hábito como chave separada no formato: habit_history:YYYY-MM-DD:habit_name
    for (const [habitName, completed] of Object.entries(habits)) {
      const key = `habit_history:${date}:${habitName}`;
      await db.set(key, { date, habitName, completed, created_at: new Date().toISOString() });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar histórico de hábitos:', error);
    res.status(500).json({ error: 'Erro ao salvar histórico' });
  }
});

app.get('/api/habits/history', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const historyKeys = await db.keys('habit_history:*');
    const history = [];

    for (const key of historyKeys) {
      const record = await db.get(key);
      if (record) {
        const recordDate = new Date(record.date);
        const daysAgo = Math.floor((new Date() - recordDate) / (1000 * 60 * 60 * 24));

        if (daysAgo <= days) {
          history.push({
            date: record.date,
            habit_name: record.habitName,
            completed: record.completed ? 1 : 0
          });
        }
      }
    }

    history.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(history);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

app.get('/api/habits/analytics', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const historyKeys = await db.keys('habit_history:*');
    const records = [];

    for (const key of historyKeys) {
      const record = await db.get(key);
      if (record) {
        const recordDate = new Date(record.date);
        const daysAgo = Math.floor((new Date() - recordDate) / (1000 * 60 * 60 * 24));

        if (daysAgo <= days) {
          records.push(record);
        }
      }
    }

    // Calcular estatísticas por dia
    const dailyMap = new Map();
    records.forEach(r => {
      if (!dailyMap.has(r.date)) {
        dailyMap.set(r.date, { total: 0, completed: 0 });
      }
      const stats = dailyMap.get(r.date);
      stats.total++;
      if (r.completed) stats.completed++;
    });

    const dailyStats = Array.from(dailyMap.entries()).map(([date, stats]) => ({
      date,
      total: stats.total,
      completed: stats.completed,
      percentage: ((stats.completed / stats.total) * 100).toFixed(2)
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calcular estatísticas por hábito
    const habitMap = new Map();
    records.forEach(r => {
      if (!habitMap.has(r.habitName)) {
        habitMap.set(r.habitName, { total_days: 0, completed_days: 0 });
      }
      const stats = habitMap.get(r.habitName);
      stats.total_days++;
      if (r.completed) stats.completed_days++;
    });

    const habitStats = Array.from(habitMap.entries()).map(([habit_name, stats]) => ({
      habit_name,
      total_days: stats.total_days,
      completed_days: stats.completed_days,
      missed_days: stats.total_days - stats.completed_days,
      miss_percentage: (((stats.total_days - stats.completed_days) / stats.total_days) * 100).toFixed(2)
    })).sort((a, b) => b.missed_days - a.missed_days).slice(0, 10);

    res.json({ dailyStats, habitStats });
  } catch (error) {
    console.error('Erro ao calcular analytics:', error);
    res.status(500).json({ error: 'Erro ao calcular analytics' });
  }
});

// ============= ROTAS DO NOTION - NORMAS SEMANAIS =============
app.get('/api/notion/weekly-habits', async (req, res) => {
  if (!notionClient) {
    return res.status(500).json({ error: 'Notion não configurado' });
  }

  try {
    const databaseId = '2b238d12893a80c688b2c706ccae6b6a';
    const notionToken = process.env.NOTION_TOKEN || fs.readFileSync(path.join(__dirname, 'notion-token.txt'), 'utf8').trim();

    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page_size: 1,
        sorts: [{ timestamp: 'created_time', direction: 'descending' }]
      })
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.results.length === 0) {
      return res.json({ habits: [], message: 'Nenhuma página encontrada' });
    }

    const page = data.results[0];
    const habits = {
      pageId: page.id,
      confissao: page.properties['Confissão']?.checkbox || false,
      disciplina: page.properties['Disciplina']?.checkbox || false,
      sabado: page.properties['Sábado']?.checkbox || false
    };

    res.json(habits);
  } catch (error) {
    console.error('Erro ao buscar normas semanais:', error);
    res.status(500).json({ error: 'Erro ao buscar normas semanais do Notion' });
  }
});

app.patch('/api/notion/weekly-habits/:pageId', async (req, res) => {
  if (!notionClient) {
    return res.status(500).json({ error: 'Notion não configurado' });
  }

  try {
    const { pageId } = req.params;
    const { habitName, checked } = req.body;
    const notionToken = process.env.NOTION_TOKEN || fs.readFileSync(path.join(__dirname, 'notion-token.txt'), 'utf8').trim();

    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          [habitName]: { checkbox: checked }
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Notion API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar norma semanal:', error);
    res.status(500).json({ error: 'Erro ao atualizar norma semanal' });
  }
});

// ============= ROTAS DO NOTION - ANOTAÇÕES =============
const ANOTACOES_DB_ID = '23038d12893a80d8b56af797531e6680';

app.get('/api/notion/annotations', async (req, res) => {
  if (!notionClient) {
    return res.status(500).json({ error: 'Notion não configurado' });
  }

  try {
    const { tag } = req.query;
    const notionToken = process.env.NOTION_TOKEN || fs.readFileSync(path.join(__dirname, 'notion-token.txt'), 'utf8').trim();

    const body = {
      page_size: 100,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }]
    };

    if (tag) {
      body.filter = {
        property: 'Pasta',
        multi_select: {
          contains: tag
        }
      };
    }

    const response = await fetch(`https://api.notion.com/v1/databases/${ANOTACOES_DB_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status}`);
    }

    const data = await response.json();

    const annotations = await Promise.all(data.results.map(async (page) => {
      let title = 'Sem título';
      if (page.properties.Nome && page.properties.Nome.title && page.properties.Nome.title.length > 0) {
        title = page.properties.Nome.title[0].plain_text || 'Sem título';
      } else if (page.properties.Name && page.properties.Name.title && page.properties.Name.title.length > 0) {
        title = page.properties.Name.title[0].plain_text || 'Sem título';
      } else if (page.properties.Título && page.properties.Título.title && page.properties.Título.title.length > 0) {
        title = page.properties.Título.title[0].plain_text || 'Sem título';
      }

      let tags = [];
      if (page.properties.Pasta && page.properties.Pasta.multi_select) {
        tags = page.properties.Pasta.multi_select.map(t => t.name);
      } else if (page.properties.Tags && page.properties.Tags.multi_select) {
        tags = page.properties.Tags.multi_select.map(t => t.name);
      } else if (page.properties.Categoria && page.properties.Categoria.multi_select) {
        tags = page.properties.Categoria.multi_select.map(t => t.name);
      }

      let preview = '';
      try {
        const blocksResponse = await fetch(`https://api.notion.com/v1/blocks/${page.id}/children`, {
          headers: {
            'Authorization': `Bearer ${notionToken}`,
            'Notion-Version': '2022-06-28'
          }
        });

        if (blocksResponse.ok) {
          const blocks = await blocksResponse.json();
          const contentText = blocks.results.map(block => {
            if (block.type === 'paragraph' && block.paragraph.rich_text.length > 0) {
              return block.paragraph.rich_text.map(t => t.plain_text).join('');
            }
            if (block.type === 'heading_1' && block.heading_1.rich_text.length > 0) {
              return block.heading_1.rich_text.map(t => t.plain_text).join('');
            }
            if (block.type === 'heading_2' && block.heading_2.rich_text.length > 0) {
              return block.heading_2.rich_text.map(t => t.plain_text).join('');
            }
            if (block.type === 'heading_3' && block.heading_3.rich_text.length > 0) {
              return block.heading_3.rich_text.map(t => t.plain_text).join('');
            }
            if (block.type === 'bulleted_list_item' && block.bulleted_list_item.rich_text.length > 0) {
              return block.bulleted_list_item.rich_text.map(t => t.plain_text).join('');
            }
            if (block.type === 'numbered_list_item' && block.numbered_list_item.rich_text.length > 0) {
              return block.numbered_list_item.rich_text.map(t => t.plain_text).join('');
            }
            return '';
          }).filter(t => t).join(' ');

          preview = contentText.substring(0, 150);
        }
      } catch (error) {
        console.error(`Erro ao buscar preview da nota ${page.id}:`, error.message);
      }

      return {
        id: page.id,
        title: title,
        tags: tags,
        url: page.url,
        createdTime: page.created_time,
        preview: preview
      };
    }));

    res.json(annotations);
  } catch (error) {
    console.error('Erro ao buscar anotações:', error);
    res.status(500).json({ error: 'Erro ao buscar anotações do Notion' });
  }
});

// Continua com as outras rotas do Notion (annotations/:id, POST, PUT, DELETE) e outras...
// [Mantive o resto das rotas do Notion e outras APIs igual ao original]

// NOTA: As rotas abaixo foram mantidas do original, pois não usam SQLite
app.get('/api/notion/annotations/:id', async (req, res) => {
  // [código original completo - linhas 610-702]
  if (!notionClient) {
    return res.status(500).json({ error: 'Notion não configurado' });
  }

  try {
    const { id } = req.params;
    const notionToken = process.env.NOTION_TOKEN || fs.readFileSync(path.join(__dirname, 'notion-token.txt'), 'utf8').trim();

    const pageResponse = await fetch(`https://api.notion.com/v1/pages/${id}`, {
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28'
      }
    });

    if (!pageResponse.ok) {
      throw new Error(`Notion API error: ${pageResponse.status}`);
    }

    const page = await pageResponse.json();

    const blocksResponse = await fetch(`https://api.notion.com/v1/blocks/${id}/children`, {
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28'
      }
    });

    if (!blocksResponse.ok) {
      throw new Error(`Notion API error: ${blocksResponse.status}`);
    }

    const blocks = await blocksResponse.json();

    const content = blocks.results.map(block => {
      if (block.type === 'paragraph' && block.paragraph.rich_text.length > 0) {
        return block.paragraph.rich_text.map(t => t.plain_text).join('');
      }
      if (block.type === 'heading_1' && block.heading_1.rich_text.length > 0) {
        return '# ' + block.heading_1.rich_text.map(t => t.plain_text).join('');
      }
      if (block.type === 'heading_2' && block.heading_2.rich_text.length > 0) {
        return '## ' + block.heading_2.rich_text.map(t => t.plain_text).join('');
      }
      if (block.type === 'heading_3' && block.heading_3.rich_text.length > 0) {
        return '### ' + block.heading_3.rich_text.map(t => t.plain_text).join('');
      }
      if (block.type === 'bulleted_list_item' && block.bulleted_list_item.rich_text.length > 0) {
        return '• ' + block.bulleted_list_item.rich_text.map(t => t.plain_text).join('');
      }
      if (block.type === 'numbered_list_item' && block.numbered_list_item.rich_text.length > 0) {
        return '1. ' + block.numbered_list_item.rich_text.map(t => t.plain_text).join('');
      }
      return '';
    }).filter(t => t).join('\n\n');

    let title = 'Sem título';
    if (page.properties.Nome && page.properties.Nome.title && page.properties.Nome.title.length > 0) {
      title = page.properties.Nome.title[0].plain_text || 'Sem título';
    } else if (page.properties.Name && page.properties.Name.title && page.properties.Name.title.length > 0) {
      title = page.properties.Name.title[0].plain_text || 'Sem título';
    } else if (page.properties.Título && page.properties.Título.title && page.properties.Título.title.length > 0) {
      title = page.properties.Título.title[0].plain_text || 'Sem título';
    }

    let tags = [];
    if (page.properties.Pasta && page.properties.Pasta.multi_select) {
      tags = page.properties.Pasta.multi_select.map(t => t.name);
    } else if (page.properties.Tags && page.properties.Tags.multi_select) {
      tags = page.properties.Tags.multi_select.map(t => t.name);
    } else if (page.properties.Categoria && page.properties.Categoria.multi_select) {
      tags = page.properties.Categoria.multi_select.map(t => t.name);
    }

    res.json({
      id: page.id,
      title: title,
      tags: tags,
      content: content,
      createdTime: page.created_time,
      url: page.url
    });
  } catch (error) {
    console.error('Erro ao buscar anotação:', error);
    res.status(500).json({ error: 'Erro ao buscar anotação do Notion' });
  }
});

app.post('/api/notion/annotations', async (req, res) => {
  // [código original - linhas 704-751]
  if (!notionClient) {
    return res.status(500).json({ error: 'Notion não configurado' });
  }

  try {
    const { title, content, tags } = req.body;
    const notionToken = process.env.NOTION_TOKEN || fs.readFileSync(path.join(__dirname, 'notion-token.txt'), 'utf8').trim();

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { database_id: ANOTACOES_DB_ID },
        properties: {
          Nome: {
            title: [{ text: { content: title || 'Nova Anotação' } }]
          },
          Pasta: {
            multi_select: tags ? tags.map(tag => ({ name: tag })) : []
          }
        },
        children: content ? [{
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content } }]
          }
        }] : []
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Notion API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    res.json({ success: true, pageId: data.id, url: data.url });
  } catch (error) {
    console.error('Erro ao criar anotação:', error);
    res.status(500).json({ error: 'Erro ao criar anotação no Notion' });
  }
});

app.put('/api/notion/annotations/:id', async (req, res) => {
  // [código original - linhas 754-843]
  if (!notionClient) {
    return res.status(500).json({ error: 'Notion não configurado' });
  }

  try {
    const { id } = req.params;
    const { title, content, tags } = req.body;
    const notionToken = process.env.NOTION_TOKEN || fs.readFileSync(path.join(__dirname, 'notion-token.txt'), 'utf8').trim();

    const updatePropsResponse = await fetch(`https://api.notion.com/v1/pages/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          Nome: {
            title: [{ text: { content: title || 'Sem título' } }]
          },
          Pasta: {
            multi_select: tags ? tags.map(tag => ({ name: tag })) : []
          }
        }
      })
    });

    if (!updatePropsResponse.ok) {
      const errorData = await updatePropsResponse.json();
      throw new Error(`Notion API error: ${updatePropsResponse.status} - ${JSON.stringify(errorData)}`);
    }

    const blocksResponse = await fetch(`https://api.notion.com/v1/blocks/${id}/children`, {
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28'
      }
    });

    if (blocksResponse.ok) {
      const blocks = await blocksResponse.json();

      for (const block of blocks.results) {
        await fetch(`https://api.notion.com/v1/blocks/${block.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${notionToken}`,
            'Notion-Version': '2022-06-28'
          }
        });
      }
    }

    if (content) {
      const appendResponse = await fetch(`https://api.notion.com/v1/blocks/${id}/children`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${notionToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          children: [{
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ text: { content } }]
            }
          }]
        })
      });

      if (!appendResponse.ok) {
        const errorData = await appendResponse.json();
        console.warn('Erro ao atualizar conteúdo:', errorData);
      }
    }

    res.json({ success: true, pageId: id });
  } catch (error) {
    console.error('Erro ao atualizar anotação:', error);
    res.status(500).json({ error: 'Erro ao atualizar anotação no Notion' });
  }
});

app.delete('/api/notion/annotations/:id', async (req, res) => {
  // [código original - linhas 846-878]
  if (!notionClient) {
    return res.status(500).json({ error: 'Notion não configurado' });
  }

  try {
    const { id } = req.params;
    const notionToken = process.env.NOTION_TOKEN || fs.readFileSync(path.join(__dirname, 'notion-token.txt'), 'utf8').trim();

    const response = await fetch(`https://api.notion.com/v1/pages/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        archived: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Notion API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    res.json({ success: true, message: 'Anotação arquivada com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir anotação:', error);
    res.status(500).json({ error: 'Erro ao excluir anotação no Notion' });
  }
});

// ============= ROTA DA API DE PONTOS (CAMINHO/SULCO/FORJA) =============
app.get('/api/escriva/random-point', async (req, res) => {
  try {
    const apiUrl = 'https://escriva.org/api/v1/points/random/?book_type=camino&book_type=surco&book_type=forja&site_id=6';

    const response = await fetch(apiUrl, {
      headers: {
        'accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Escriba API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar ponto aleatório:', error);
    res.status(500).json({ error: 'Erro ao buscar ponto da API Escriba.org' });
  }
});

// ============= ROTAS DE SINCRONIZAÇÃO COM KV (UPSTASH REDIS) =============

// Salvar estado do Jornal (BuJo)
app.post('/api/sync/jornal', async (req, res) => {
  try {
    const state = req.body;
    const timestamp = new Date().toISOString();
    await db.set('sync:jornal_state', { state, timestamp });
    res.json({ success: true, timestamp });
  } catch (error) {
    console.error('Erro ao salvar jornal no KV:', error);
    res.status(500).json({ error: 'Erro ao salvar dados', details: error.message });
  }
});

// Carregar estado do Jornal
app.get('/api/sync/jornal', async (req, res) => {
  try {
    const data = await db.get('sync:jornal_state');
    if (!data) {
      return res.json({ state: null, message: 'Nenhum dado salvo' });
    }
    res.json(data);
  } catch (error) {
    console.error('Erro ao carregar jornal do KV:', error);
    res.status(500).json({ error: 'Erro ao carregar dados', details: error.message });
  }
});

// Salvar estado do Nihongo Tracker
app.post('/api/sync/nihongo', async (req, res) => {
  try {
    const state = req.body;
    const timestamp = new Date().toISOString();
    await db.set('sync:nihongo_state', { state, timestamp });
    res.json({ success: true, timestamp });
  } catch (error) {
    console.error('Erro ao salvar nihongo no KV:', error);
    res.status(500).json({ error: 'Erro ao salvar dados', details: error.message });
  }
});

// Carregar estado do Nihongo Tracker
app.get('/api/sync/nihongo', async (req, res) => {
  try {
    const data = await db.get('sync:nihongo_state');
    if (!data) {
      return res.json({ state: null, message: 'Nenhum dado salvo' });
    }
    res.json(data);
  } catch (error) {
    console.error('Erro ao carregar nihongo do KV:', error);
    res.status(500).json({ error: 'Erro ao carregar dados', details: error.message });
  }
});

// Salvar estado do Plano de Vida (hábitos)
app.post('/api/sync/plano', async (req, res) => {
  try {
    const state = req.body;
    const timestamp = new Date().toISOString();
    await db.set('sync:plano_state', { state, timestamp });
    res.json({ success: true, timestamp });
  } catch (error) {
    console.error('Erro ao salvar plano no KV:', error);
    res.status(500).json({ error: 'Erro ao salvar dados', details: error.message });
  }
});

// Carregar estado do Plano de Vida
app.get('/api/sync/plano', async (req, res) => {
  try {
    const data = await db.get('sync:plano_state');
    if (!data) {
      return res.json({ state: null, message: 'Nenhum dado salvo' });
    }
    res.json(data);
  } catch (error) {
    console.error('Erro ao carregar plano do KV:', error);
    res.status(500).json({ error: 'Erro ao carregar dados', details: error.message });
  }
});

// Verificar status da sincronização
app.get('/api/sync/status', (req, res) => {
  res.json({
    sheetsConfigured: !!sheetsDB,
    spreadsheetId: process.env.GOOGLE_SHEETS_ID ? 'Configurado' : 'Não configurado'
  });
});


// ============= ROTAS DE ANOTAÇÕES (KV) =============

// Helper: salvar anotação como arquivo .md
const ANOTACOES_DIR = path.join(__dirname, 'anotacoes');

function slugify(text) {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

function buildMdContent(note) {
  const tags = (note.tags || []).map(t => `  - ${t}`).join('\n');
  let md = '---\n';
  md += `title: "${(note.title || 'Sem título').replace(/"/g, '\\"')}"\n`;
  if (tags) md += `tags:\n${tags}\n`;
  md += `date: ${note.createdTime || new Date().toISOString()}\n`;
  md += '---\n\n';
  md += note.content || '';
  return md;
}

function getMdFilename(note) {
  return `${note.id}-${slugify(note.title || 'sem-titulo')}.md`;
}

async function saveNoteMd(note) {
  try {
    await fs.promises.mkdir(ANOTACOES_DIR, { recursive: true });
    const filePath = path.join(ANOTACOES_DIR, getMdFilename(note));
    await fs.promises.writeFile(filePath, buildMdContent(note), 'utf8');
  } catch (e) {
    console.error('Erro ao salvar .md:', e.message);
  }
}

async function deleteNoteMd(note) {
  try {
    const filePath = path.join(ANOTACOES_DIR, getMdFilename(note));
    await fs.promises.unlink(filePath).catch(() => {});
  } catch (e) {
    console.error('Erro ao deletar .md:', e.message);
  }
}

// Listar todas as anotações
app.get('/api/anotacoes', async (req, res) => {
  try {
    const noteKeys = await db.keys('note:*');
    const annotations = [];

    // Garantir que noteKeys é um array
    const keysArray = Array.isArray(noteKeys) ? noteKeys : [];
    console.log(`[API] Encontradas ${keysArray.length} chaves de notas`);

    for (const key of keysArray) {
      if (!key.endsWith(':counter')) {
        try {
          const note = await db.get(key);
          if (note) {
            annotations.push(note);
          }
        } catch (err) {
          console.error(`Erro ao buscar nota ${key}:`, err.message);
        }
      }
    }

    console.log(`[API] ${annotations.length} anotações carregadas`);

    // Filtrar por tag se especificado
    const tagFilter = req.query.tag;
    let filtered = annotations;
    if (tagFilter) {
      filtered = annotations.filter(a => a.tags && a.tags.includes(tagFilter));
    }

    // Ordenar por updatedTime (mais recentes primeiro)
    filtered.sort((a, b) => new Date(b.updatedTime || b.createdTime) - new Date(a.updatedTime || a.createdTime));

    // Adicionar preview para cada anotação
    const withPreview = filtered.map(a => ({
      ...a,
      preview: (a.content || '').substring(0, 150) + ((a.content || '').length > 150 ? '...' : '')
    }));

    res.json(withPreview);
  } catch (error) {
    console.error('Erro ao listar anotações:', error);
    res.status(500).json({ error: 'Erro ao carregar anotações', details: error.message });
  }
});

// Obter uma anotação específica
app.get('/api/anotacoes/:id', async (req, res) => {
  try {
    const note = await db.get(`note:${req.params.id}`);

    if (!note) {
      return res.status(404).json({ error: 'Anotação não encontrada' });
    }

    res.json(note);
  } catch (error) {
    console.error('Erro ao buscar anotação:', error);
    res.status(500).json({ error: 'Erro ao carregar anotação', details: error.message });
  }
});

// Criar nova anotação
app.post('/api/anotacoes', async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    console.log('[API] Criando nova anotação:', { title, tags });

    const id = await getNextId('note');
    console.log('[API] ID gerado:', id);

    const newAnnotation = {
      id: id.toString(),
      title: title || 'Sem título',
      content: content || '',
      tags: tags || [],
      createdTime: new Date().toISOString(),
      updatedTime: new Date().toISOString()
    };

    await db.set(`note:${id}`, newAnnotation);
    await saveNoteMd(newAnnotation);
    console.log('[API] Anotação salva com sucesso:', newAnnotation.id);

    res.status(201).json(newAnnotation);
  } catch (error) {
    console.error('Erro ao criar anotação:', error);
    res.status(500).json({ error: 'Erro ao criar anotação', details: error.message });
  }
});

// Atualizar anotação
app.put('/api/anotacoes/:id', async (req, res) => {
  try {
    const note = await db.get(`note:${req.params.id}`);

    if (!note) {
      return res.status(404).json({ error: 'Anotação não encontrada' });
    }

    const { title, content, tags } = req.body;

    const updatedNote = {
      ...note,
      title: title !== undefined ? title : note.title,
      content: content !== undefined ? content : note.content,
      tags: tags !== undefined ? tags : note.tags,
      updatedTime: new Date().toISOString()
    };

    await db.set(`note:${req.params.id}`, updatedNote);

    // Atualizar arquivo .md (apagar antigo se título mudou)
    if (note.title !== updatedNote.title) {
      await deleteNoteMd(note);
    }
    await saveNoteMd(updatedNote);

    res.json(updatedNote);
  } catch (error) {
    console.error('Erro ao atualizar anotação:', error);
    res.status(500).json({ error: 'Erro ao atualizar anotação', details: error.message });
  }
});

// Excluir anotação
app.delete('/api/anotacoes/:id', async (req, res) => {
  try {
    const noteToDelete = await db.get(`note:${req.params.id}`);

    if (!noteToDelete) {
      return res.status(404).json({ error: 'Anotação não encontrada' });
    }
    await db.del(`note:${req.params.id}`);
    await deleteNoteMd(noteToDelete);

    res.json({ success: true, message: 'Anotação excluída' });
  } catch (error) {
    console.error('Erro ao excluir anotação:', error);
    res.status(500).json({ error: 'Erro ao excluir anotação', details: error.message });
  }
});

// Rotas para páginas HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/oracoes', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'oracoes.html'));
});

app.get('/agenda', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'agenda.html'));
});

app.get('/biblia', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'biblia.html'));
});

app.get('/contemplacao', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contemplacao.html'));
});

app.get('/exame', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'exame.html'));
});

app.get('/ag', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ag.html'));
});

app.get('/escriva', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'escriva.html'));
});

app.get('/anotacoes', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'anotacoes.html'));
});

app.get('/plano-inclinado', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'plano-inclinado.html'));
});

// Rota de health check
app.get('/api/health', async (req, res) => {
  const dbOk = await db.ping();
  res.json({
    status: dbOk ? 'ok' : 'degraded',
    db: dbOk ? 'connected' : 'disconnected',
    dbType: db.isRemote ? 'upstash' : 'local'
  });
});

// Inicializar todas as integrações
async function initializeServices() {
  // Testar conexão com banco de dados
  const dbOk = await db.ping();
  if (dbOk) {
    console.log('✅ Banco de dados conectado' + (db.isRemote ? ' (Upstash)' : ' (local)'));
  } else {
    console.error('❌ FALHA na conexão com o banco de dados! Verifique UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN no .env');
  }

  await loadGoogleAuth();
  loadNotionClient();

  // Inicializar Google Sheets para persistência (usando Service Account)
  if (process.env.GOOGLE_SHEETS_ID) {
    try {
      // Se houver a variável com o JSON, podemos passar para o SheetsDB
      const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
        ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
        : null;

      // Corrigir private_key que pode vir com \\n no Vercel
      if (serviceAccount?.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }

      // Você precisará ajustar seu SheetsDB para aceitar esse objeto opcional
      sheetsDB = new SheetsDB(process.env.GOOGLE_SHEETS_ID, serviceAccount);
      const initialized = await sheetsDB.init();
      
      if (initialized) {
        console.log('✅ Google Sheets configurado para persistência');
      }
    } catch (error) {
      console.warn('⚠️ Erro ao configurar Google Sheets:', error.message);
      sheetsDB = null;
    }
  }
}

// Inicializar serviços imediatamente (funciona no Vercel e localmente)
initPromise = initializeServices().catch(err => {
  console.error('Erro ao inicializar serviços:', err);
});

// Se não estiver no Vercel (ambiente de desenvolvimento local)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor rodando em:`);
    console.log(`   - Local: http://localhost:${PORT}`);
    console.log(`\n📱 Acesse no navegador!`);
  });
}

// Exportar para Vercel (serverless)
module.exports = app;