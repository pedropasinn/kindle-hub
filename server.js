require('dotenv').config(); // Carregar variáveis de ambiente do .env

const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const { google } = require('googleapis');
const fs = require('fs');
const { Client: NotionClient } = require('@notionhq/client');
require('isomorphic-fetch');

const app = express();
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

  CREATE TABLE IF NOT EXISTS daily_habits_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    habit_name TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, habit_name)
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

    // Usar fetch diretamente pois o SDK antigo não tem databases.query
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

    // A estrutura do database: cada linha é um dia, cada coluna é um hábito
    // Pegar a linha mais recente (primeira após sort descendente)
    const habits = [];

    if (data.results && data.results.length > 0) {
      const latestDay = data.results[0];
      const properties = latestDay.properties;

      // Lista de hábitos diários (baseado nas colunas encontradas)
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

          // Verificar tipo da propriedade (pode ser checkbox ou outro tipo)
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

    console.log(`📝 Atualizando hábito: '${habitName}' = ${concluido}`);

    if (!notionToken) {
      return res.status(400).json({ error: 'NOTION_TOKEN não configurado' });
    }

    // Extrair o pageId real (remover o sufixo do habitName se existir)
    // O pageId vem no formato: "uuid-uuid-uuid-uuid-uuid-habitName"
    // Precisamos remover apenas a última parte (habitName)
    const parts = pageId.split('-');
    // UUID do Notion tem 5 partes (8-4-4-4-12 caracteres), então pegamos as primeiras 5 partes
    const realPageId = parts.slice(0, 5).join('-');

    console.log(`🔑 PageId original: ${pageId}`);
    console.log(`🔑 PageId processado: ${realPageId}`);

    // Usar fetch para atualizar a propriedade específica do hábito
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

    console.log(`✅ Hábito '${habitName}' atualizado com sucesso`);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao atualizar hábito no Notion:', error.message);
    res.status(500).json({ error: 'Erro ao atualizar hábito no Notion', details: error.message });
  }
});

// ============= ROTAS DE HISTÓRICO DE HÁBITOS =============
// Salvar estado diário completo
app.post('/api/habits/save', (req, res) => {
  try {
    const { date, habits } = req.body;

    if (!date || !habits) {
      return res.status(400).json({ error: 'Data e hábitos são obrigatórios' });
    }

    const stmt = db.prepare(`
      INSERT INTO daily_habits_history (date, habit_name, completed)
      VALUES (?, ?, ?)
      ON CONFLICT(date, habit_name)
      DO UPDATE SET completed = excluded.completed
    `);

    const insert = db.transaction((habitsList) => {
      for (const [habitName, completed] of Object.entries(habitsList)) {
        stmt.run(date, habitName, completed ? 1 : 0);
      }
    });

    insert(habits);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar histórico de hábitos:', error);
    res.status(500).json({ error: 'Erro ao salvar histórico' });
  }
});

// Buscar histórico
app.get('/api/habits/history', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const history = db.prepare(`
      SELECT date, habit_name, completed
      FROM daily_habits_history
      WHERE date >= date(?)
      ORDER BY date DESC, habit_name
    `).all(startDate.toISOString().split('T')[0]);

    res.json(history);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// Analytics - Estatísticas
app.get('/api/habits/analytics', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Porcentagem por dia
    const dailyStats = db.prepare(`
      SELECT
        date,
        COUNT(*) as total,
        SUM(completed) as completed,
        ROUND(CAST(SUM(completed) AS FLOAT) / COUNT(*) * 100, 2) as percentage
      FROM daily_habits_history
      WHERE date >= date(?)
      GROUP BY date
      ORDER BY date ASC
    `).all(startDate.toISOString().split('T')[0]);

    // Hábitos mais faltosos
    const habitStats = db.prepare(`
      SELECT
        habit_name,
        COUNT(*) as total_days,
        SUM(completed) as completed_days,
        COUNT(*) - SUM(completed) as missed_days,
        ROUND((COUNT(*) - SUM(completed)) * 100.0 / COUNT(*), 2) as miss_percentage
      FROM daily_habits_history
      WHERE date >= date(?)
      GROUP BY habit_name
      ORDER BY missed_days DESC
      LIMIT 10
    `).all(startDate.toISOString().split('T')[0]);

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
    const databaseId = '2b238d12893a80c688b2c706ccae6b6a'; // ID da database de normas semanais
    const notionToken = process.env.NOTION_TOKEN || fs.readFileSync(path.join(__dirname, 'notion-token.txt'), 'utf8').trim();

    // Buscar a página da semana atual
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
const ANOTACOES_DB_ID = '23038d12893a80d8b56af797531e6680'; // ID da database de anotações

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

    // Filtrar por tag se fornecida
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
    console.log(`📝 Notion retornou ${data.results.length} anotações`);

    const annotations = await Promise.all(data.results.map(async (page) => {
      // Debug: mostrar propriedades disponíveis
      if (data.results.indexOf(page) === 0) {
        console.log('🔍 Propriedades disponíveis na primeira página:', Object.keys(page.properties));
      }

      // Extrair título com validação robusta
      let title = 'Sem título';
      if (page.properties.Nome && page.properties.Nome.title && page.properties.Nome.title.length > 0) {
        title = page.properties.Nome.title[0].plain_text || 'Sem título';
      } else if (page.properties.Name && page.properties.Name.title && page.properties.Name.title.length > 0) {
        title = page.properties.Name.title[0].plain_text || 'Sem título';
      } else if (page.properties.Título && page.properties.Título.title && page.properties.Título.title.length > 0) {
        title = page.properties.Título.title[0].plain_text || 'Sem título';
      }

      // Extrair tags com validação robusta
      let tags = [];
      if (page.properties.Pasta && page.properties.Pasta.multi_select) {
        tags = page.properties.Pasta.multi_select.map(t => t.name);
      } else if (page.properties.Tags && page.properties.Tags.multi_select) {
        tags = page.properties.Tags.multi_select.map(t => t.name);
      } else if (page.properties.Categoria && page.properties.Categoria.multi_select) {
        tags = page.properties.Categoria.multi_select.map(t => t.name);
      }

      // Buscar blocos de conteúdo para criar preview
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

          // Extrair texto dos blocos para criar preview
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

          // Limitar preview a ~150 caracteres
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

// Buscar conteúdo completo de uma anotação
app.get('/api/notion/annotations/:id', async (req, res) => {
  if (!notionClient) {
    return res.status(500).json({ error: 'Notion não configurado' });
  }

  try {
    const { id } = req.params;
    const notionToken = process.env.NOTION_TOKEN || fs.readFileSync(path.join(__dirname, 'notion-token.txt'), 'utf8').trim();

    // Buscar página
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

    // Buscar blocos de conteúdo
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

    // Extrair texto dos blocos
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

    // Extrair título com validação robusta
    let title = 'Sem título';
    if (page.properties.Nome && page.properties.Nome.title && page.properties.Nome.title.length > 0) {
      title = page.properties.Nome.title[0].plain_text || 'Sem título';
    } else if (page.properties.Name && page.properties.Name.title && page.properties.Name.title.length > 0) {
      title = page.properties.Name.title[0].plain_text || 'Sem título';
    } else if (page.properties.Título && page.properties.Título.title && page.properties.Título.title.length > 0) {
      title = page.properties.Título.title[0].plain_text || 'Sem título';
    }

    // Extrair tags com validação robusta
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

// Endpoint PUT para atualizar anotação existente
app.put('/api/notion/annotations/:id', async (req, res) => {
  if (!notionClient) {
    return res.status(500).json({ error: 'Notion não configurado' });
  }

  try {
    const { id } = req.params;
    const { title, content, tags } = req.body;
    const notionToken = process.env.NOTION_TOKEN || fs.readFileSync(path.join(__dirname, 'notion-token.txt'), 'utf8').trim();

    // 1. Atualizar propriedades da página (título e tags)
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

    // 2. Buscar blocos existentes para deletar
    const blocksResponse = await fetch(`https://api.notion.com/v1/blocks/${id}/children`, {
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28'
      }
    });

    if (blocksResponse.ok) {
      const blocks = await blocksResponse.json();

      // 3. Deletar blocos antigos
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

    // 4. Adicionar novo conteúdo
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

// Endpoint DELETE para excluir (arquivar) anotação
app.delete('/api/notion/annotations/:id', async (req, res) => {
  if (!notionClient) {
    return res.status(500).json({ error: 'Notion não configurado' });
  }

  try {
    const { id } = req.params;
    const notionToken = process.env.NOTION_TOKEN || fs.readFileSync(path.join(__dirname, 'notion-token.txt'), 'utf8').trim();

    // Arquivar a página no Notion (não deleta permanentemente)
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

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicializar todas as integrações e depois iniciar servidor
async function initializeServices() {
  await loadGoogleAuth();
  loadNotionClient();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor rodando em:`);
    console.log(`   - Local: http://localhost:${PORT}`);
    console.log(`   - Rede: http://172.26.197.166:${PORT}`);
    console.log(`\n📱 Para acessar no Kindle, use: http://172.26.197.166:${PORT}`);
  });
}

initializeServices();
