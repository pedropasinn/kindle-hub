# Guia de Deploy no Vercel - Kindle Hub

⚠️ **ATENÇÃO**: Esta aplicação foi migrada de SQLite para Vercel KV para ser compatível com o Vercel!

---

# Guia de Deploy no Vercel - Kindle Hub

## Pré-requisitos
- Conta no Vercel (https://vercel.com)
- Git instalado
- Projeto versionado no GitHub (recomendado)

## Passo a Passo

### 1. Preparar o repositório
```bash
# Adicionar arquivos ao git
git add .
git commit -m "Preparar para deploy no Vercel"
git push origin master
```

### 2. Deploy via Vercel CLI (Opção 1 - Mais Rápida)

#### Instalar Vercel CLI:
```bash
npm install -g vercel
```

#### Fazer login:
```bash
vercel login
```

#### Deploy:
```bash
vercel
```

Siga as instruções:
- Confirme o diretório do projeto
- Confirme as configurações
- Aguarde o deploy

### 3. Deploy via Dashboard Vercel (Opção 2 - Mais Visual)

1. Acesse https://vercel.com/dashboard
2. Clique em "Add New" > "Project"
3. Importe seu repositório do GitHub
4. Configure as variáveis de ambiente (veja abaixo)
5. Clique em "Deploy"

## ⚠️ IMPORTANTE: Configurar Variáveis de Ambiente

No painel do Vercel, vá em **Settings > Environment Variables** e adicione:

### Variáveis Obrigatórias:

```
NOTION_TOKEN=seu_token_notion_aqui
GOOGLE_CREDENTIALS=conteúdo_do_credentials.json
GOOGLE_TOKEN=conteúdo_do_token.json
PORT=3000
```

### Como obter os valores:

#### NOTION_TOKEN:
```bash
cat notion-token.txt
```

#### GOOGLE_CREDENTIALS:
```bash
cat credentials.json
```
Copie todo o conteúdo JSON (em uma linha só)

#### GOOGLE_TOKEN:
```bash
cat token.json
```
Copie todo o conteúdo JSON (em uma linha só)

## ⚠️ Limitação Importante - SQLite no Vercel

O Vercel usa funções serverless que são **stateless** (sem estado). Isso significa que:

- O banco SQLite (database.db) **NÃO persiste** entre as requisições
- Cada invocação da função pode ter uma nova instância do banco

### Solução Recomendada:

Você tem 3 opções:

#### Opção 1: Usar Vercel Postgres (Recomendado)
- Banco de dados gerenciado pela Vercel
- Persistente e escalável
- Requer migração de SQLite para PostgreSQL

#### Opção 2: Usar Vercel KV (Redis)
- Para dados simples chave-valor
- Rápido e fácil de usar

#### Opção 3: Usar Supabase (PostgreSQL gratuito)
- Banco PostgreSQL gratuito
- 500MB de armazenamento no plano free
- Fácil integração

## Migração do SQLite (se necessário)

Se optar por manter SQLite para testes, saiba que os dados serão resetados. Para produção, considere migrar para PostgreSQL:

1. Instale o driver PostgreSQL:
```bash
npm install pg
```

2. Atualize o código do server.js para usar PostgreSQL ao invés de SQLite

## Comandos Úteis

### Ver logs do deploy:
```bash
vercel logs
```

### Ver domínio da aplicação:
```bash
vercel ls
```

### Redeploy:
```bash
vercel --prod
```

## Domínio Personalizado

Após o deploy, você receberá um domínio como:
```
https://kindle-hub-xxx.vercel.app
```

Para adicionar domínio personalizado:
1. Vá em Settings > Domains
2. Adicione seu domínio
3. Configure os DNS conforme instruções

## Testar o Deploy

Após o deploy, teste os endpoints:
- `https://seu-app.vercel.app/` - Página inicial
- `https://seu-app.vercel.app/api/tasks` - API de tarefas
- `https://seu-app.vercel.app/api/habits` - API de hábitos

## Troubleshooting

### Erro de módulos:
- Certifique-se que todas dependências estão no package.json
- Execute `npm install` antes do deploy

### Erro de credenciais:
- Verifique se todas variáveis de ambiente foram configuradas
- Certifique-se que os JSONs estão em uma linha só

### Erro 404:
- Verifique o arquivo vercel.json
- Confirme que as rotas estão corretas

## Monitoramento

Acompanhe o status da aplicação em:
- https://vercel.com/dashboard
- Seção "Deployments" para ver histórico
- Seção "Analytics" para métricas

## Custos

O plano gratuito do Vercel inclui:
- 100GB de bandwidth
- Invocações ilimitadas de funções
- Certificado SSL automático
- Deploy contínuo com Git

Perfeito para projetos pessoais como este!
