# Kindle Hub

Hub minimalista para Kindle com relógio, agenda, tarefas, hábitos e orações.

## 🚀 Instalação Local

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar o servidor
npm start

# 3. Acessar no navegador
# http://localhost:3000
```

## 📱 Como Acessar no Kindle

### Opção 1: Rede Local (em casa)
1. Descubra seu IP local:
   - Windows: `ipconfig` no CMD
   - Mac/Linux: `ifconfig` ou `ip addr`
2. Inicie o servidor: `npm start`
3. No Kindle, abra o navegador e acesse: `http://SEU_IP:3000`

### Opção 2: Deploy Online (acesso de qualquer lugar)

#### Render (Recomendado - Gratuito)
1. Crie conta em https://render.com
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório GitHub
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Clique em "Create Web Service"
6. Acesse via URL fornecida (ex: `seu-app.onrender.com`)

#### Railway (Alternativa)
1. Crie conta em https://railway.app
2. Clique em "New Project" → "Deploy from GitHub repo"
3. Selecione o repositório
4. Railway detecta automaticamente Node.js e faz deploy
5. Acesse via URL fornecida

## 📊 Estrutura do Banco de Dados

O projeto usa SQLite com as seguintes tabelas:

- **habits**: hábitos diários com data e status de conclusão
- **tasks**: tarefas com título, descrição, prioridade e data de vencimento
- **prayers**: orações com nome, texto e categoria
- **daily_updates**: atualizações diárias de processos

## 🎨 Características

- **Minimalista**: Design preto e branco otimizado para e-ink
- **Leve**: Sem frameworks pesados, apenas HTML, CSS e JavaScript vanilla
- **Responsivo**: Funciona em Kindle e outros dispositivos
- **Offline-first**: Banco de dados local SQLite

## 📁 Estrutura do Projeto

```
kindle-hub/
├── server.js              # Backend Express
├── package.json          
├── database.db           # SQLite (criado automaticamente)
└── public/
    ├── index.html        # Página inicial com relógio
    ├── style.css         # CSS minimalista
    ├── tasks.html        # Gerenciador de tarefas
    ├── habits.html       # Rastreador de hábitos
    ├── prayers.html      # Biblioteca de orações
    ├── updates.html      # Atualizações diárias
    └── agenda.html       # Agenda (em desenvolvimento)
```

## 🔧 Próximas Implementações

- [ ] Integração com Google Calendar na página de Agenda
- [ ] Sistema de alarmes
- [ ] Exportação de dados em CSV
- [ ] Backup automático do banco de dados
- [ ] Modo escuro (branco no preto)

## 📝 Notas de Desenvolvimento

- O banco de dados é criado automaticamente na primeira execução
- Todas as APIs são RESTful e retornam JSON
- Frontend usa Fetch API nativa (sem jQuery)
- CSS otimizado para e-ink (sem animações ou sombras)

## 🐛 Troubleshooting

**Erro ao iniciar o servidor:**
- Verifique se a porta 3000 está livre
- Tente: `PORT=8000 npm start`

**Kindle não acessa:**
- Verifique se está na mesma rede Wi-Fi
- Teste o IP no seu computador primeiro
- Alguns Kindles antigos têm limitações no navegador

**Dados não salvam:**
- Verifique permissões de escrita na pasta do projeto
- O arquivo `database.db` deve ser criado automaticamente
