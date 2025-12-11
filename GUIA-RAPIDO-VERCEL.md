# 🚀 Guia Rápido: Deploy no Vercel

## ✅ O que já foi feito:

1. ✅ Código migrado de SQLite para Vercel KV
2. ✅ Dependências atualizadas
3. ✅ Arquivos de configuração criados
4. ✅ Commit local realizado

## 📋 Próximos Passos (Você precisa fazer):

### 1. Push para o GitHub
```bash
git push origin master
```

Se der erro de autenticação, configure suas credenciais do GitHub.

---

### 2. Deploy no Vercel

#### Opção A: Via CLI (Mais Rápido)
```bash
vercel
```

Responda:
- **Set up and deploy?** → Yes
- **Which scope?** → Seu usuário
- **Link to existing project?** → No
- **Project name?** → kindle-hub
- **In which directory?** → ./
- **Override settings?** → No

#### Opção B: Via Dashboard (Mais Visual)
1. Acesse https://vercel.com/new
2. Clique em "Import Git Repository"
3. Escolha seu repositório `DrVarella/kindle-hub`
4. Clique em "Import"
5. Clique em "Deploy"

---

### 3. Configurar Vercel KV (IMPORTANTE!)

Após o primeiro deploy:

#### Criar o banco KV:
1. Acesse https://vercel.com/dashboard
2. Vá em **Storage** → **Create Database**
3. Escolha **KV (Redis)**
4. Nome: `kindle-hub-kv`
5. Clique em **Create**

#### Conectar ao projeto:
1. Na página do KV, clique em **Connect to Project**
2. Escolha `kindle-hub`
3. As variáveis serão adicionadas automaticamente

---

### 4. Configurar Outras Variáveis de Ambiente

No dashboard do Vercel:
1. Vá em **Settings** → **Environment Variables**
2. Adicione:

```
NOTION_TOKEN=seu_token_aqui
GOOGLE_CREDENTIALS={"installed":{"client_id":"...","client_secret":"...",...}}
GOOGLE_TOKEN={"access_token":"...","refresh_token":"...",...}
```

**Para obter os valores:**
```bash
# Notion Token
cat notion-token.txt

# Google Credentials (copie TODO em UMA LINHA)
cat credentials.json

# Google Token (copie TODO em UMA LINHA)
cat token.json
```

---

### 5. Redeploy com as Variáveis

Após configurar KV e variáveis:
```bash
vercel --prod
```

Ou no dashboard: **Deployments** → **Redeploy**

---

## 🎉 Pronto!

Sua aplicação estará rodando em:
```
https://kindle-hub-xxx.vercel.app
```

## 🧪 Testar

Acesse:
- `https://seu-app.vercel.app/` - Página inicial
- `https://seu-app.vercel.app/api/tasks` - API de tarefas

---

## ❓ Troubleshooting

### Erro: "Module not found: @vercel/kv"
**Solução**: Aguarde, o Vercel está instalando. Se persistir, redeploy.

### Erro: "KV_REST_API_URL is not defined"
**Solução**: Você esqueceu de criar o Vercel KV. Volte no Passo 3.

### Aplicação carrega mas dados não salvam
**Solução**: Verifique se o Vercel KV foi conectado ao projeto.

### Erro de Google/Notion
**Solução**: Configure as variáveis de ambiente no Passo 4.

---

## 📚 Documentação Completa

Para mais detalhes, consulte:
- [DEPLOY.md](DEPLOY.md) - Guia completo de deploy
- [MIGRACAO-KV.md](MIGRACAO-KV.md) - Detalhes da migração

---

## 🆘 Precisa de Ajuda?

Se algo der errado:
1. Veja os logs no Vercel Dashboard → **Deployments** → clique no deploy → **Logs**
2. Consulte [MIGRACAO-KV.md](MIGRACAO-KV.md) seção "Troubleshooting"
