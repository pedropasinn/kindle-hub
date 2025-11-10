# 🚂 Configuração do Railway - Passos Finais

## ✅ O que já está pronto

Todas as correções foram implementadas:
- ✅ Código do Microsoft To Do removido
- ✅ Erro de UUID do Notion corrigido
- ✅ Token do Google com scopes corretos gerado
- ✅ Reset automático de hábitos implementado

## 📋 Configurar no Railway

### 1. Atualizar variáveis de ambiente

Acesse o painel do Railway e atualize as seguintes variáveis:

#### GOOGLE_CREDENTIALS
Cole o conteúdo completo do arquivo `credentials.json` que você gerou (todo o JSON em uma linha).

**Como obter:**
```bash
cat credentials.json
```

#### GOOGLE_TOKEN
Cole o conteúdo completo do arquivo `token.json` que você gerou (todo o JSON em uma linha).

**Como obter:**
```bash
cat token.json
```

#### NOTION_TOKEN (se ainda não estiver configurado)
Cole o token da sua integração do Notion.

**Como obter:**
- Vá em https://www.notion.so/my-integrations
- Copie o token da integração "Kindle Hub"

#### NOTION_DATABASE_ID (se ainda não estiver configurado)
Cole o ID do seu database do Notion.

**Como obter:**
- Abra o database no Notion
- Copie o ID da URL (os 32 caracteres hexadecimais)

#### PORT (opcional, Railway configura automaticamente)
```
8080
```

### 2. Fazer o deploy

```bash
git push origin master
```

O Railway detectará as mudanças e fará o deploy automaticamente.

### 3. Verificar logs

Após o deploy, verifique os logs no Railway. Você deve ver:
```
✅ Google API autenticada com sucesso
✅ Notion API configurada com sucesso
✅ Servidor rodando em:
```

**Não deve mais aparecer:**
```
⚠️ Microsoft Token não encontrado
```

### 4. Testar no Kindle

1. Acesse o URL do Railway no Kindle
2. Vá para a página de Tarefas
3. Suas tarefas do Google Tasks devem aparecer
4. Tente marcar/desmarcar uma tarefa
5. Vá para o Plano de Vida e teste as normas

## 🎯 O que foi corrigido

### ✅ Google Tasks funcionando
- Token agora tem os scopes corretos
- API do Google Tasks completamente funcional
- Pode marcar/desmarcar tarefas

### ✅ Notion corrigido
- UUID completo agora é extraído corretamente
- Checkboxes das normas funcionam perfeitamente
- Sem mais erro de "path.page_id should be a valid uuid"

### ✅ Reset automático
- Hábitos diários resetam automaticamente à meia-noite
- Sistema detecta mudança de dia
- Correspondem às normas do dia seguinte

### ✅ Microsoft To Do removido
- Código completamente limpo
- Dependência removida
- Sem mais avisos de "Microsoft Token não encontrado"

## 🔧 Troubleshooting

### Se o Google Tasks não funcionar no Railway:

1. Verifique se as variáveis `GOOGLE_CREDENTIALS` e `GOOGLE_TOKEN` estão corretas
2. Certifique-se de que o JSON está em uma única linha
3. Verifique os logs para ver se há erros de autenticação

### Se as normas do Notion não salvarem:

1. Verifique se `NOTION_TOKEN` e `NOTION_DATABASE_ID` estão corretos
2. Verifique se a integração do Notion tem acesso ao database
3. Olhe os logs para ver se há erros específicos

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do Railway
2. Compare as variáveis de ambiente com os valores acima
3. Teste localmente primeiro com `npm start`
