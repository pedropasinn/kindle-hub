# Migração de SQLite para Vercel KV

Este documento explica a migração realizada no projeto Kindle Hub.

## Por que migrar?

O Vercel usa **funções serverless** que não suportam SQLite adequadamente porque:
- SQLite armazena dados em arquivo local
- Funções serverless são efêmeras (sem estado)
- Cada requisição pode rodar em um servidor diferente
- Os dados não persistem entre invocações

## Solução: Vercel KV

O **Vercel KV** é um banco de dados Redis gerenciado que:
- ✅ Funciona perfeitamente com serverless
- ✅ Gratuito no plano hobby (256MB)
- ✅ Rápido e confiável
- ✅ Funciona local e em produção

## Arquivos Criados

### 1. `db.js`
Módulo que abstrai a conexão com o banco de dados:
- **No Vercel**: usa Vercel KV real
- **Localmente**: usa um simulador em memória

```javascript
const db = require('./db');
await db.set('chave', 'valor');
const valor = await db.get('chave');
```

### 2. `server.js` (atualizado)
Versão nova do servidor usando Vercel KV ao invés de SQLite

**Mudanças principais:**
- Substituído `better-sqlite3` por `@vercel/kv`
- Funções síncronas → funções assíncronas
- SQL queries → operações key-value

### 3. `migrate-to-kv.js`
Script para migrar dados existentes do SQLite para KV

## Estrutura de Dados no KV

### Tarefas
- **Chave**: `task:{id}` (ex: `task:1`, `task:2`)
- **Valor**: JSON com dados da tarefa
- **Contador**: `task:counter` armazena o próximo ID

```javascript
// Exemplo
{
  "id": 1,
  "title": "Minha tarefa",
  "description": "Descrição",
  "completed": 0,
  "priority": "normal",
  "due_date": "2024-12-31",
  "created_at": "2024-11-10T12:00:00.000Z"
}
```

### Histórico de Hábitos
- **Chave**: `habit_history:{data}:{nome_habito}`
  - Ex: `habit_history:2024-11-10:Santa Missa`
- **Valor**: JSON com dados do registro

```javascript
// Exemplo
{
  "date": "2024-11-10",
  "habitName": "Santa Missa",
  "completed": true,
  "created_at": "2024-11-10T12:00:00.000Z"
}
```

## Como Migrar os Dados Atuais

Se você tem dados no banco SQLite antigo e quer migrá-los:

### Passo 1: Instalar dependências
```bash
npm install
```

### Passo 2: Rodar o script de migração
```bash
node migrate-to-kv.js
```

Isso irá:
1. Ler todas as tarefas do `database.db`
2. Ler todo o histórico de hábitos
3. Copiar tudo para o KV (simulado localmente)

⚠️ **Nota**: Localmente os dados ficam em memória. No Vercel, você precisará recriar os dados ou popular o KV via API.

## Testando Localmente

### 1. Instalar dependências
```bash
npm install
```

### 2. Iniciar servidor
```bash
npm start
```

O servidor irá:
- Detectar que não está no Vercel
- Usar o simulador KV em memória
- Mostrar: `📝 Usando KV local (desenvolvimento)`

### 3. Testar APIs
```bash
# Criar tarefa
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Teste", "description": "Tarefa de teste"}'

# Listar tarefas
curl http://localhost:3000/api/tasks
```

## Configurando Vercel KV (Produção)

### Passo 1: Criar KV Database no Vercel

1. Acesse https://vercel.com/dashboard
2. Vá em **Storage** → **Create Database**
3. Escolha **KV (Redis)**
4. Nomeie como `kindle-hub-kv`
5. Clique em **Create**

### Passo 2: Conectar ao Projeto

1. No painel do KV, clique em **Connect to Project**
2. Escolha seu projeto `kindle-hub`
3. O Vercel irá automaticamente adicionar as variáveis:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### Passo 3: Deploy

```bash
vercel --prod
```

Pronto! O servidor irá detectar as variáveis do KV e usar o banco real.

## Diferenças entre SQLite e KV

| Aspecto | SQLite | Vercel KV |
|---------|--------|-----------|
| Tipo | SQL relacional | Key-Value (Redis) |
| Queries | SQL complexas | Get/Set simples |
| Transações | Suporte nativo | Limitado |
| Armazenamento | Arquivo local | Cloud distribuído |
| Serverless | ❌ Não funciona | ✅ Funciona perfeitamente |
| Custo | Grátis | Grátis (256MB) |

## Limitações do KV

⚠️ **O que NÃO fazer com KV:**

1. **Queries complexas**: KV não suporta JOINs ou buscas complexas
2. **Transações ACID**: Transações são limitadas
3. **Relações**: Não é um banco relacional

**Solução**: Para dados mais complexos, use Vercel Postgres.

## Backup do Código Antigo

O código original com SQLite foi salvo em:
- `server-sqlite-backup.js`

Se precisar reverter:
```bash
cp server-sqlite-backup.js server.js
```

## Troubleshooting

### Erro: "KV_REST_API_URL not found"
**Causa**: Vercel KV não está configurado
**Solução**: Siga o "Passo 1: Criar KV Database no Vercel"

### Dados não persistem localmente
**Causa**: O simulador usa memória RAM
**Solução**: É normal! No Vercel os dados persistem.

### Erro ao migrar dados
**Causa**: `database.db` não existe
**Solução**: Crie dados de teste manualmente via API

## Próximos Passos

1. ✅ Código migrado para KV
2. ✅ Package.json atualizado
3. ✅ Documentação criada
4. ⏳ Deploy no Vercel
5. ⏳ Configurar Vercel KV
6. ⏳ Testar em produção

## Dúvidas?

Consulte a documentação oficial:
- [Vercel KV](https://vercel.com/docs/storage/vercel-kv)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
