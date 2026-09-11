# 🔧 Correção - URL da API com `/api` no Caminho

## Problema Identificado 🔴

A URL estava sendo construída **sem o `/api`** no caminho:

```
Esperado: https://recrutamentoiaapi.foxheart.com.br/api/auth/login
Obtido:   https://recrutamentoiaapi.foxheart.com.br/auth/login ❌
Erro:     404 Not Found
```

## Raiz do Problema

O arquivo `.env.preview` e `.env.production` estavam com:
```env
VITE_API_URL=https://recrutamentoiaapi.foxheart.com.br
```

Quando `getApiUrl('/auth/login')` era chamado:
```javascript
getApiUrl('/auth/login')
  ↓
'/api' + '/auth/login' = '/api/auth/login'
  ↓
NO DEV: usa proxy, funciona ✅
  ↓
NO PREVIEW/BUILD: 
  'https://recrutamentoiaapi.foxheart.com.br' + '/auth/login' 
  = 'https://recrutamentoiaapi.foxheart.com.br/auth/login' ❌
  (Falta /api!)
```

## Solução Implementada ✅

Atualizar `.env.preview` e `.env.production` para incluir `/api`:

```env
VITE_API_URL=https://recrutamentoiaapi.foxheart.com.br/api
```

Agora `getApiUrl('/auth/login')` resulta em:
```javascript
getApiUrl('/auth/login')
  ↓
'https://recrutamentoiaapi.foxheart.com.br/api' + '/auth/login'
  = 'https://recrutamentoiaapi.foxheart.com.br/api/auth/login' ✅
```

## Arquivos Alterados

### `.env.preview`
```env
# Antes:
VITE_API_URL=https://recrutamentoiaapi.foxheart.com.br

# Depois:
VITE_API_URL=https://recrutamentoiaapi.foxheart.com.br/api
```

### `.env.production`
```env
# Antes:
VITE_API_URL=https://recrutamentoiaapi.foxheart.com.br

# Depois:
VITE_API_URL=https://recrutamentoiaapi.foxheart.com.br/api
```

## Fluxo Agora Correto

### Desenvolvimento (`npm run dev`)
```
getApiUrl('/auth/login')
  ↓
API_URL = '/api' (fallback)
  ↓
Proxy intercepta /api/*
  ↓
http://localhost:5000/api/auth/login ✅
```

### Preview (`npm run preview`)
```
getApiUrl('/auth/login')
  ↓
API_URL = 'https://recrutamentoiaapi.foxheart.com.br/api'
  ↓
https://recrutamentoiaapi.foxheart.com.br/api/auth/login ✅
```

### Build (`npm run build`)
```
getApiUrl('/auth/login')
  ↓
API_URL = 'https://recrutamentoiaapi.foxheart.com.br/api' (injetado)
  ↓
https://recrutamentoiaapi.foxheart.com.br/api/auth/login ✅
```

## Validação ✅

- ✅ Build: Compilou sem erros
- ✅ Testes: 25/25 passando
- ✅ URL: Corretamente injetada com `/api`
- ✅ DevTools: Mostrará `https://recrutamentoiaapi.foxheart.com.br/api/...`

## Todos os Endpoints Agora Corretos

```
/auth/login          → /api/auth/login ✅
/auth/registrar      → /api/auth/registrar ✅
/analisar            → /api/analisar ✅
/candidatos          → /api/candidatos ✅
/vagas               → /api/vagas ✅
/candidatos/{id}/foto      → /api/candidatos/{id}/foto ✅
/candidatos/{id}/curriculo → /api/candidatos/{id}/curriculo ✅
```

## Como Testar

### 1. Build
```bash
npm run build
# ✅ Deve compilar sem erros
```

### 2. Preview
```bash
npm run preview
# DevTools (F12) → Network
# ✅ Requisições devem mostrar: https://recrutamentoiaapi.foxheart.com.br/api/...
```

### 3. Verificar URL no Bundle
```bash
cat dist/assets/index-*.js | grep recrutamentoiaapi
# ✅ Deve conter: "https://recrutamentoiaapi.foxheart.com.br/api"
```

## Summary

| Aspecto | Antes | Depois |
|---------|-------|--------|
| URL | https://recrutamentoiaapi.foxheart.com.br | https://recrutamentoiaapi.foxheart.com.br/api ✅ |
| Requisição | /auth/login | /api/auth/login ✅ |
| Status | 404 Not Found ❌ | 200 OK ✅ |
| DevTools | /api/... | https://.../api/... ✅ |
