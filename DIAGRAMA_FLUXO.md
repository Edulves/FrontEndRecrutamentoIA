# 📊 Diagrama de Fluxo - URL da API por Ambiente

## Comparação dos 3 Ambientes

### Desenvolvimento: npm run dev
```
Arquivo: .env.local (vazio ou comentado)
Variável: VITE_API_URL = undefined
Fallback: /api

Frontend (localhost:5173)
    ↓
fetch(getApiUrl('/candidatos')) = fetch('/api/candidatos')
    ↓
Proxy do Vite (server.proxy) intercepta /api/*
    ↓
Redireciona para http://localhost:5000
    ↓
Backend (http://localhost:5000)

✅ DevTools (F12) mostra: /api/candidatos
ℹ️  URL real escondida pelo proxy
```

### Preview: npm run preview
```
Arquivo: .env.preview
Variável: VITE_API_URL = https://recrutamentoiaapi.foxheart.com.br

Frontend (localhost:4173 - build de produção)
    ↓
fetch(getApiUrl('/candidatos')) = fetch('https://recrutamentoiaapi.foxheart.com.br/candidatos')
    ↓
SEM proxy (preview não tem proxy!)
    ↓
Requisição direta para produção
    ↓
Backend (https://recrutamentoiaapi.foxheart.com.br)

✅ DevTools (F12) mostra: https://recrutamentoiaapi.foxheart.com.br/...
✅ URL real visível para debugging
```

### Build: npm run build
```
Arquivo: .env.production
Variável: VITE_API_URL = https://recrutamentoiaapi.foxheart.com.br

Processo de Build:
1. Lê .env.production
2. Substitui import.meta.env.VITE_API_URL no código
3. Gera arquivo JavaScript com URL injetada
    ↓
Arquivo: dist/assets/index-*.js
Contém: fetch('https://recrutamentoiaapi.foxheart.com.br/...')
    ↓
Deploy em Produção (sem precisar de .env!)
    ↓
Frontend (qualquer domínio)
    ↓
Browser faz requisição direta para https://recrutamentoiaapi.foxheart.com.br
    ↓
Backend (https://recrutamentoiaapi.foxheart.com.br)

✅ DevTools (F12) mostra: https://recrutamentoiaapi.foxheart.com.br/...
✅ URL real visível para debugging
✅ Funciona sem arquivo .env!
```

## Tabela Comparativa

| Aspecto | Desenvolvimento | Preview | Build |
|---------|-----------------|---------|-------|
| Comando | `npm run dev` | `npm run preview` | `npm run build` |
| Arquivo .env | `.env.local` | `.env.preview` | `.env.production` |
| URL Base | `/api` (proxy) | `https://api.foxheart.com.br` | `https://api.foxheart.com.br` |
| Proxy Ativo? | ✅ Sim (server) | ❌ Não | N/A |
| DevTools | `/api/...` | `https://...` | `https://...` |
| Resultado | Proxy → localhost:5000 | URL real de produção | URL injetada no build |

## Fluxo Técnico

```
getApiUrl('/candidatos')
    ↓
API_URL = import.meta.env.VITE_API_URL || '/api'
    ↓
├─ DEV: undefined → '/api/candidatos'
├─ PREVIEW: https://... → 'https://.../candidatos'
└─ BUILD: https://... → 'https://.../candidatos'
```
