# Configuração da URL da API

## Visão Geral

O projeto agora possui uma configuração centralizada para apontar para diferentes APIs dependendo do ambiente. **A URL da API aparecerá corretamente no DevTools (F12)** para cada ambiente.

## Arquivos de Configuração

### `src/config.ts`
Arquivo centralizado que exporta:
- **`API_URL`**: A URL base da API (vem de `VITE_API_URL` ou usa `/api` como fallback)
- **`getApiUrl(path)`**: Função helper que constrói URLs completas da API

### `vite.config.ts`
- **Desenvolvimento** (`npm run dev`): Proxy `server.proxy` redireciona `/api` para `http://localhost:5000`
  - DevTools mostra: `/api/...` (interceptado pelo proxy)
- **Preview** (`npm run preview`): **SEM proxy** — usa URL completa de `.env.preview`
  - DevTools mostra: `https://recrutamentoiaapi.foxheart.com.br/...` ✅

### Variáveis de Ambiente

#### `.env.local` (Desenvolvimento)
```env
# Desenvolvimento local com proxy (padrão)
# Deixe em branco ou comente — usa /api, que o Vite proxeia para localhost:5000
```

#### `.env.preview` (Preview de Produção)
```env
# npm run preview usa esta configuração
VITE_API_URL=https://recrutamentoiaapi.foxheart.com.br
```

#### `.env.production` (Build de Produção)
```env
# npm run build usa esta configuração
VITE_API_URL=https://recrutamentoiaapi.foxheart.com.br
```

## Fluxo de Requisições

### Desenvolvimento (`npm run dev`)
```
Navegador (localhost:5173)
    ↓
Código: fetch('/api/candidatos')
    ↓
Proxy do Vite (server.proxy)
    ↓
Backend (http://localhost:5000)

DevTools mostra: /api/candidatos (/api interceptado pelo proxy)
```

### Build de Produção (`npm run build`)
Durante o build, o Vite substitui `import.meta.env.VITE_API_URL` pelo valor em `.env.production`:

```javascript
// Código-fonte:
fetch(getApiUrl('/candidatos'))

// Após build com .env.production:
fetch('https://recrutamentoiaapi.foxheart.com.br/candidatos')

// DevTools mostra: https://recrutamentoiaapi.foxheart.com.br/candidatos ✅
```

### Preview (`npm run preview`)
```
Navegador (localhost:4173)
    ↓
Código: fetch(getApiUrl('/candidatos'))
    ↓
Resolvido para: https://recrutamentoiaapi.foxheart.com.br/candidatos (de .env.preview)
    ↓
Backend (https://recrutamentoiaapi.foxheart.com.br)

DevTools mostra: https://recrutamentoiaapi.foxheart.com.br/candidatos ✅
```

## Como Usar

### Para Desenvolvimento
```bash
# Usa localhost:5000 via proxy
npm run dev
```

### Para Build de Produção
```bash
# Compila com VITE_API_URL de .env.production
npm run build

# Serve o build local (usa proxy.preview para testar)
npm run preview
```

### Para Trocar a API de Desenvolvimento
Se quiser desenvolver contra a API de produção:

1. Crie um arquivo `.env.development` (Git a ignora):
```env
VITE_API_URL=https://recrutamentoiaapi.foxheart.com.br
```

2. Altere `.env.local` ou deixe em branco

## Todos os Endpoints Atualizados

Todos os arquivos que fazem requisições foram atualizados para usar `getApiUrl()`:

- `src/auth.ts` - Login e registro
- `src/App.tsx` - Análise de currículos
- `src/curriculo.ts` - Download de currículos
- `src/components/CandidatosPage.tsx` - CRUD de candidatos
- `src/components/VagasPage.tsx` - CRUD de vagas
- `src/components/DashboardPage.tsx` - Dashboard
