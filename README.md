# 📚 Kindle Hub

Hub minimalista para Kindle com agenda, hábitos, tarefas e orações.

## 🚀 Deploy Rápido

### Local
```bash
npm install
npm start
```

### Railway
1. Faça push para o GitHub:
   ```bash
   git push origin master
   ```

2. Configure as variáveis de ambiente no Railway:
   - `GOOGLE_CREDENTIALS` - conteúdo de `credentials.json`
   - `GOOGLE_TOKEN` - conteúdo de `token.json`
   - `NOTION_TOKEN` - token da integração do Notion
   - `NOTION_DATABASE_ID` - ID do database do Notion
   - `PORT` - 8080 (opcional)

3. Deploy automático acontecerá

## 📖 Documentação Completa

- [CONFIG.md](CONFIG.md) - Configuração geral do projeto
- [RAILWAY_SETUP.md](RAILWAY_SETUP.md) - Como configurar no Railway
- [GOOGLE_TASKS_SETUP.md](GOOGLE_TASKS_SETUP.md) - Como configurar Google Tasks

## 🔑 Gerar Token do Google

```bash
node generate-token.js
```

Ou, se já tem o código de autorização:
```bash
node generate-token-auto.js "SEU_CODIGO_AQUI"
```

## ✅ Features

- ✅ Google Calendar - visualizar eventos
- ✅ Google Tasks - listar e marcar tarefas como concluídas
- ✅ Notion - gerenciar hábitos diários e semanais
- ✅ Reset automático de hábitos à meia-noite
- ✅ Interface otimizada para e-ink (Kindle)

## 📦 Tecnologias

- Node.js + Express
- Google APIs (Calendar + Tasks)
- Notion API
- SQLite (para dados locais)
- Vanilla JS (frontend)

## 🐛 Troubleshooting

### Google Tasks não funciona
- Verifique se o token tem os scopes corretos
- Rode `node generate-token.js` para gerar um novo token

### Notion não salva
- Verifique se `habitName` está sendo enviado no body
- Confira se o DATABASE_ID está correto

### Erro de UUID do Notion
- Já foi corrigido na versão atual
- O pageId agora é extraído corretamente (5 partes do UUID)

## 📝 Licença

MIT
